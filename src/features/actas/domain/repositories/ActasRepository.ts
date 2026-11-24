import { AppError, Result } from '@core/utils/result';
import { Acta } from '../entities/Acta';

export type ConflictoVersion = { code: 'CONFLICTO_VERSION'; message: string; versionServidor: Acta };

export interface ActasRepository {
  /** Guarda en AsyncStorage/FileSystem de inmediato, sin esperar red (RNF-05). */
  guardarLocal(acta: Acta): Promise<Result<void>>;
  listarPendientesDeEnvio(): Promise<Result<Acta[]>>;
  /** Sube acta + foto; el servidor rechaza duplicados por `id` y ediciones basadas en una versión vieja (S-05). */
  enviar(acta: Acta): Promise<Result<Acta, ConflictoVersion | AppError>>;
  corregir(
    actaId: string,
    cambios: Partial<Acta>,
    versionConocida: number
  ): Promise<Result<Acta, ConflictoVersion | AppError>>;
  /**
   * RF-12: "el veedor corrige sus mesas y el coordinador de recinto corrige
   * cualquier acta de su recinto" — no recibe ningún filtro porque la RLS
   * de `actas` (`actas_select_alcance`) ya implementa exactamente esa regla
   * según quién pregunta; duplicarla aquí sería confiar dos veces en el
   * mismo criterio y arriesgarse a que se desalineen.
   */
  listarActasCorregibles(): Promise<Result<Acta[]>>;
}
