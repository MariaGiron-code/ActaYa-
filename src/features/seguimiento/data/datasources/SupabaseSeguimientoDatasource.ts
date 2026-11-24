import { SupabaseClient } from '@supabase/supabase-js';
import { fail, ok, Result } from '@core/utils/result';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import { ProgresoCandidato, ResumenRecinto } from '../../domain/entities/Seguimiento';
import {
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
