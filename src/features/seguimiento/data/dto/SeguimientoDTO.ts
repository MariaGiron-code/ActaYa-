import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import { ActaUbicacionNoVerificada, ProgresoCandidato, ResumenRecinto } from '../../domain/entities/Seguimiento';

/**
 * Fila devuelta por la función SQL `resumen_por_recinto()`. Postgres
 * devuelve `bigint` (los `count(*)`) y PostgREST lo serializa como string
 * para no perder precisión — por eso los mappers hacen `Number(...)`.
 */
export type ResumenRecintoRow = {
  recinto_id: string;
  nombre_recinto: string;
  mesas_reportadas: number | string;
  mesas_totales: number | string;
};

export function resumenFromRow(row: ResumenRecintoRow): ResumenRecinto {
  return {
    recintoId: row.recinto_id,
    nombreRecinto: row.nombre_recinto,
    mesasReportadas: Number(row.mesas_reportadas),
    mesasTotales: Number(row.mesas_totales),
  };
}

/** Fila devuelta por la función SQL `progreso_por_dignidad(p_dignidad)`. */
export type ProgresoCandidatoRow = {
  candidato_id: string;
  nombres: string;
  organizacion_siglas: string;
  votos_totales: number | string;
};

export function progresoFromRow(row: ProgresoCandidatoRow): ProgresoCandidato {
  return {
    candidatoId: row.candidato_id,
    nombres: row.nombres,
    organizacionSiglas: row.organizacion_siglas,
    votosTotales: Number(row.votos_totales),
  };
}

/**
 * Fila de `actas` con la mesa y su recinto embebidos (PostgREST sigue las
 * llaves foráneas `actas.mesa_id` y `mesas.recinto_id`). Una relación
 * "muchos a uno" llega como objeto, pero se acepta también un arreglo por
 * si el cliente la interpreta al revés.
 */
type UnoOVarios<T> = T | T[] | null;

export type ActaUbicacionNoVerificadaRow = {
  id: string;
  dignidad: Dignidad;
  mesas: UnoOVarios<{ numero_jrv: string; recintos: UnoOVarios<{ nombre: string }> }>;
};

const primero = <T>(valor: UnoOVarios<T>): T | null => (Array.isArray(valor) ? (valor[0] ?? null) : valor);

export function actaUbicacionNoVerificadaFromRow(row: ActaUbicacionNoVerificadaRow): ActaUbicacionNoVerificada {
  const mesa = primero(row.mesas);
  const recinto = mesa ? primero(mesa.recintos) : null;
  return {
    actaId: row.id,
    dignidad: row.dignidad,
    numeroJrv: mesa?.numero_jrv ?? '?',
    nombreRecinto: recinto?.nombre ?? 'Recinto desconocido',
  };
}
