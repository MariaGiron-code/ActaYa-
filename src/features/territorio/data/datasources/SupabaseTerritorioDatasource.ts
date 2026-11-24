import { SupabaseClient } from '@supabase/supabase-js';
import { fail, ok, Result } from '@core/utils/result';
import { Candidato, Mesa, OrganizacionPolitica, Recinto } from '../../domain/entities/Territorio';
import {
  candidatoFromRow,
  CandidatoRow,
  mesaFromRow,
  MesaRow,
  organizacionFromRow,
  OrganizacionPoliticaRow,
  recintoFromRow,
  recintoToRow,
  RecintoRow,
} from '../dto/TerritorioDTO';

/** Todo lo que toca directamente las tablas `recintos`, `mesas`, `organizaciones_politicas` y `candidatos`. */
export class SupabaseTerritorioDatasource {
  constructor(private readonly client: SupabaseClient) {}

  async listarRecintos(): Promise<Result<Recinto[]>> {
    const { data, error } = await this.client.from('recintos').select('*').order('nombre');
    if (error) return fail({ code: 'ERROR_LISTAR_RECINTOS', message: error.message, cause: error });
    return ok((data as RecintoRow[]).map(recintoFromRow));
  }

  async agregarRecinto(datos: Omit<Recinto, 'id'>): Promise<Result<Recinto>> {
    const { data, error } = await this.client
      .from('recintos')
      .insert(recintoToRow(datos))
      .select('*')
      .single<RecintoRow>();
    if (error || !data) {
      return fail({ code: 'ERROR_AGREGAR_RECINTO', message: error?.message ?? 'No se pudo crear el recinto.', cause: error });
    }
    return ok(recintoFromRow(data));
  }

  async listarMesasPorRecinto(recintoId: string): Promise<Result<Mesa[]>> {
    const { data, error } = await this.client
      .from('mesas')
      .select('*')
      .eq('recinto_id', recintoId)
      .order('numero_jrv');
    if (error) return fail({ code: 'ERROR_LISTAR_MESAS', message: error.message, cause: error });
    return ok((data as MesaRow[]).map(mesaFromRow));
  }

  async obtenerMesa(mesaId: string): Promise<Result<Mesa>> {
    const { data, error } = await this.client.from('mesas').select('*').eq('id', mesaId).single<MesaRow>();
    if (error || !data) {
      return fail({ code: 'ERROR_OBTENER_MESA', message: error?.message ?? 'No se encontró la mesa.', cause: error });
    }
    return ok(mesaFromRow(data));
  }

  async listarOrganizacionesConCandidatos(): Promise<
    Result<{ organizacion: OrganizacionPolitica; candidatos: Candidato[] }[]>
  > {
    const { data: organizaciones, error: errorOrganizaciones } = await this.client
      .from('organizaciones_politicas')
      .select('*')
      .order('nombre');
    if (errorOrganizaciones) {
      return fail({
        code: 'ERROR_LISTAR_ORGANIZACIONES',
        message: errorOrganizaciones.message,
        cause: errorOrganizaciones,
      });
    }

    const { data: candidatos, error: errorCandidatos } = await this.client.from('candidatos').select('*');
    if (errorCandidatos) {
      return fail({ code: 'ERROR_LISTAR_CANDIDATOS', message: errorCandidatos.message, cause: errorCandidatos });
    }

    const candidatosPorOrganizacion = (candidatos as CandidatoRow[]).map(candidatoFromRow);

    return ok(
      (organizaciones as OrganizacionPoliticaRow[]).map(organizacionFromRow).map((organizacion) => ({
        organizacion,
        candidatos: candidatosPorOrganizacion.filter((c) => c.organizacionId === organizacion.id),
      }))
    );
  }
}
