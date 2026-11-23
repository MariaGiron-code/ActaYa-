/** RF-07, RF-08, S-03. */
export interface AsignacionVeedor {
  id: string;
  mesaId: string;
  veedorId: string;
  activa: boolean;
  /** Si esta asignación reemplaza a un veedor ausente el día de la elección. */
  reemplazaAsignacionId: string | null;
  asignadoEn: string; // ISO date
}
