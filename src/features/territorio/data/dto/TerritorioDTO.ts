import { Candidato, Dignidad, Mesa, OrganizacionPolitica, Recinto } from '../../domain/entities/Territorio';

/** Forma exacta de la fila en la tabla `recintos` de Supabase. */
export type RecintoRow = {
  id: string;
  provincia: string;
  canton: string;
  parroquia: string;
  nombre: string;
};

export function recintoFromRow(row: RecintoRow): Recinto {
  return {
    id: row.id,
    provincia: row.provincia,
    canton: row.canton,
    parroquia: row.parroquia,
    nombre: row.nombre,
  };
}

export function recintoToRow(recinto: Omit<Recinto, 'id'>): Omit<RecintoRow, 'id'> {
  return {
    provincia: recinto.provincia,
    canton: recinto.canton,
    parroquia: recinto.parroquia,
    nombre: recinto.nombre,
  };
}

/** Forma exacta de la fila en la tabla `mesas` de Supabase. */
export type MesaRow = {
  id: string;
  recinto_id: string;
  numero_jrv: string;
  estado: Mesa['estado'];
};

export function mesaFromRow(row: MesaRow): Mesa {
  return {
    id: row.id,
    recintoId: row.recinto_id,
    numeroJrv: row.numero_jrv,
    estado: row.estado,
  };
}

/** Forma exacta de la fila en la tabla `organizaciones_politicas` de Supabase. */
export type OrganizacionPoliticaRow = {
  id: string;
  nombre: string;
  siglas: string;
};

export function organizacionFromRow(row: OrganizacionPoliticaRow): OrganizacionPolitica {
  return { id: row.id, nombre: row.nombre, siglas: row.siglas };
}

/** Forma exacta de la fila en la tabla `candidatos` de Supabase. */
export type CandidatoRow = {
  id: string;
  organizacion_id: string;
  dignidad: Dignidad;
  nombres: string;
};

export function candidatoFromRow(row: CandidatoRow): Candidato {
  return {
    id: row.id,
    organizacionId: row.organizacion_id,
    dignidad: row.dignidad,
    nombres: row.nombres,
  };
}
