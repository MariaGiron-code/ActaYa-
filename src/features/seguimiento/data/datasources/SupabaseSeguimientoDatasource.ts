import { SupabaseClient } from '@supabase/supabase-js';
import { fail, ok, Result } from '@core/utils/result';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import { ActaUbicacionNoVerificada, ProgresoCandidato, ResumenRecinto } from '../../domain/entities/Seguimiento';
import {
  actaUbicacionNoVerificadaFromRow,
  ActaUbicacionNoVerificadaRow,
  progresoFromRow,
  ProgresoCandidatoRow,
  resumenFromRow,
  ResumenRecintoRow,
} from '../dto/SeguimientoDTO';

/** Todo lo que toca las funciones SQL agregadas y el canal de Realtime sobre `actas`. */
export class SupabaseSeguimientoDatasource {
  constructor(private readonly client: SupabaseClient) {}

  async obtenerResumenPorRecinto(): Promise<Result<ResumenRecinto[]>> {
    const { data, error } = await this.client.rpc('resumen_por_recinto');
    if (error) return fail({ code: 'ERROR_RESUMEN_RECINTO', message: error.message, cause: error });
    return ok((data as ResumenRecintoRow[]).map(resumenFromRow));
  }

  async obtenerProgresoPorDignidad(dignidad: Dignidad): Promise<Result<ProgresoCandidato[]>> {
    const { data, error } = await this.client.rpc('progreso_por_dignidad', { p_dignidad: dignidad });
    if (error) return fail({ code: 'ERROR_PROGRESO_DIGNIDAD', message: error.message, cause: error });
    return ok((data as ProgresoCandidatoRow[]).map(progresoFromRow));
  }

  /**
   * ADR-04 / S-10: "si supera los 5 minutos se marca como no verificada
   * para que el coordinador la vea en el panel". La RLS de `actas` ya deja
   * al provincial leer todas (`actas_select_alcance`).
   */
  async listarActasUbicacionNoVerificada(): Promise<Result<ActaUbicacionNoVerificada[]>> {
    const { data, error } = await this.client
      .from('actas')
      .select('id, dignidad, ubicacion_lat, mesas(numero_jrv, recintos(nombre))')
      .eq('ubicacion_verificada', false)
      .order('creada_en', { ascending: false });
    if (error) return fail({ code: 'ERROR_UBICACIONES_NO_VERIFICADAS', message: error.message, cause: error });
    return ok((data as unknown as ActaUbicacionNoVerificadaRow[]).map(actaUbicacionNoVerificadaFromRow));
  }

  /**
   * ADR-10: un canal de Supabase Realtime escuchando INSERT y UPDATE en
   * `actas` — UPDATE hace falta porque una corrección (RF-12) cambia los
   * votos de una acta ya existente, no crea una fila nueva; sin esto, una
   * corrección no se reflejaba en el panel hasta recargar a mano.
   * Devuelve la función para cancelar la suscripción — quien la use DEBE
   * llamarla al desmontar (consecuencia documentada en el ADR: fugas de
   * memoria/conexión si no se hace).
   */
  suscribirseAActualizaciones(onCambio: () => void): () => void {
    const canal = this.client
      .channel('seguimiento-actas')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'actas' }, onCambio)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'actas' }, onCambio)
      .subscribe();

    return () => {
      this.client.removeChannel(canal);
    };
  }
}
