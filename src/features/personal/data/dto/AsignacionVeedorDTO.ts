import { AsignacionVeedor } from '../../domain/entities/AsignacionVeedor';

/** Forma exacta de la fila en la tabla `asignaciones_veedor` de Supabase. */
export type AsignacionVeedorRow = {
  id: string;
  mesa_id: string;
  veedor_id: string;
  activa: boolean;
  reemplaza_asignacion_id: string | null;
  asignado_en: string;
};

export function asignacionFromRow(row: AsignacionVeedorRow): AsignacionVeedor {
  return {
    id: row.id,
    mesaId: row.mesa_id,
    veedorId: row.veedor_id,
    activa: row.activa,
    reemplazaAsignacionId: row.reemplaza_asignacion_id,
    asignadoEn: row.asignado_en,
  };
}
