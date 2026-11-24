import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import { Acta } from '../../domain/entities/Acta';

/** Forma exacta de la fila en la tabla `actas` de Supabase. */
export type ActaRow = {
  id: string;
  mesa_id: string;
  dignidad: Dignidad;
  votos_por_organizacion: Record<string, number>;
  votos_nulos: number;
  votos_blancos: number;
  total_sufragantes: number;
  foto_path: string;
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
  ubicacion_capturada_en: string | null;
  ubicacion_verificada: boolean;
  version: number;
  registrado_por_id: string;
  creada_en: string;
};

export function actaToInsertRow(acta: Acta, fotoPath: string): ActaRow {
  return {
    id: acta.id,
    mesa_id: acta.mesaId,
    dignidad: acta.dignidad,
    votos_por_organizacion: acta.votosPorOrganizacion,
    votos_nulos: acta.votosNulos,
    votos_blancos: acta.votosBlancos,
    total_sufragantes: acta.totalSufragantes,
    foto_path: fotoPath,
    ubicacion_lat: acta.ubicacion?.latitud ?? null,
    ubicacion_lng: acta.ubicacion?.longitud ?? null,
    ubicacion_capturada_en: acta.ubicacion?.capturadaEn ?? null,
    ubicacion_verificada: acta.ubicacion?.verificada ?? false,
    version: acta.version,
    registrado_por_id: acta.registradoPorId,
    creada_en: acta.creadaEn,
  };
}

/**
 * Reconstruye un Acta a partir de una fila remota. Se usa SOLO para mostrar
 * la "versión del servidor" en un conflicto de edición (S-05): en ese caso
 * `fotoUri` no es una ruta local del dispositivo (puede que nunca haya
 * tomado esa foto), sino la URL firmada de Storage para poder visualizarla.
 */
export function actaFromRow(row: ActaRow, fotoUrl: string): Acta {
  return {
    id: row.id,
    mesaId: row.mesa_id,
    dignidad: row.dignidad,
    votosPorOrganizacion: row.votos_por_organizacion,
    votosNulos: row.votos_nulos,
    votosBlancos: row.votos_blancos,
    totalSufragantes: row.total_sufragantes,
    fotoUri: fotoUrl,
    ubicacion:
      row.ubicacion_lat != null && row.ubicacion_lng != null
        ? {
            latitud: row.ubicacion_lat,
            longitud: row.ubicacion_lng,
            capturadaEn: row.ubicacion_capturada_en as string,
            verificada: row.ubicacion_verificada,
          }
        : null,
    version: row.version,
    registradoPorId: row.registrado_por_id,
    estado: 'guardado',
    creadaEn: row.creada_en,
  };
}
