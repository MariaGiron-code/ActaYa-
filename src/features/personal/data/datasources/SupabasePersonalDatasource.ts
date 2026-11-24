import { SupabaseClient } from '@supabase/supabase-js';
import { fail, ok, Result } from '@core/utils/result';
import { AsignacionVeedor } from '../../domain/entities/AsignacionVeedor';
import { asignacionFromRow, AsignacionVeedorRow } from '../dto/AsignacionVeedorDTO';

/** Todo lo que toca directamente la tabla `asignaciones_veedor`. */
export class SupabasePersonalDatasource {
  constructor(private readonly client: SupabaseClient) {}

  async asignarVeedor(mesaId: string, veedorId: string): Promise<Result<AsignacionVeedor>> {
    const { data, error } = await this.client
      .from('asignaciones_veedor')
      .insert({ mesa_id: mesaId, veedor_id: veedorId })
      .select('*')
      .single<AsignacionVeedorRow>();

    if (error || !data) {
      return fail({ code: 'ERROR_ASIGNAR_VEEDOR', message: error?.message ?? 'No se pudo asignar el veedor.', cause: error });
    }
    return ok(asignacionFromRow(data));
  }

  async reemplazarVeedor(asignacionActualId: string, nuevoVeedorId: string): Promise<Result<AsignacionVeedor>> {
    const { data: actual, error: errorActual } = await this.client
      .from('asignaciones_veedor')
      .select('*')
      .eq('id', asignacionActualId)
      .single<AsignacionVeedorRow>();

    if (errorActual || !actual) {
      return fail({
        code: 'ASIGNACION_NO_ENCONTRADA',
        message: 'No se encontró la asignación a reemplazar.',
        cause: errorActual,
      });
    }

    const { data: nueva, error: errorNueva } = await this.client
      .from('asignaciones_veedor')
      .insert({ mesa_id: actual.mesa_id, veedor_id: nuevoVeedorId, reemplaza_asignacion_id: asignacionActualId })
      .select('*')
      .single<AsignacionVeedorRow>();

    if (errorNueva || !nueva) {
      return fail({
        code: 'ERROR_REEMPLAZAR_VEEDOR',
        message: errorNueva?.message ?? 'No se pudo crear la nueva asignación.',
        cause: errorNueva,
      });
    }

    // Best-effort: si esto falla, la nueva asignación ya quedó creada (la
    // mesa tiene ahora 2 veedores "activa"); se puede corregir a mano desde
    // Supabase. No se revierte la inserción anterior para no perder el
    // registro de que el reemplazo sí se intentó.
    await this.client.from('asignaciones_veedor').update({ activa: false }).eq('id', asignacionActualId);

    return ok(asignacionFromRow(nueva));
  }

  async listarAsignacionesDeRecinto(recintoId: string): Promise<Result<AsignacionVeedor[]>> {
    const { data, error } = await this.client
      .from('asignaciones_veedor')
      .select('*, mesas!inner(recinto_id)')
      .eq('mesas.recinto_id', recintoId)
      .order('asignado_en', { ascending: false });

    if (error) return fail({ code: 'ERROR_LISTAR_ASIGNACIONES', message: error.message, cause: error });
    return ok((data as AsignacionVeedorRow[]).map(asignacionFromRow));
  }

  async listarAsignacionesDelVeedor(veedorId: string): Promise<Result<AsignacionVeedor[]>> {
    const { data, error } = await this.client
      .from('asignaciones_veedor')
      .select('*')
      .eq('veedor_id', veedorId)
      .eq('activa', true);

    if (error) return fail({ code: 'ERROR_LISTAR_ASIGNACIONES', message: error.message, cause: error });
    return ok((data as AsignacionVeedorRow[]).map(asignacionFromRow));
  }
}
