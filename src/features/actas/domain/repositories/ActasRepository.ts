import { Result } from '@core/utils/result';
import { Acta } from '../entities/Acta';

export type ConflictoVersion = { code: 'CONFLICTO_VERSION'; message: string; versionServidor: Acta };

/** Puerto pendiente de implementar (ver README.md de este feature). */
export interface ActasRepository {
  /** Guarda en AsyncStorage/FileSystem de inmediato, sin esperar red (RNF-05). */
  guardarLocal(acta: Acta): Promise<Result<void>>;
  listarPendientesDeEnvio(): Promise<Result<Acta[]>>;
  /** Sube acta + foto; el servidor rechaza duplicados por `id` y ediciones basadas en una versión vieja (S-05). */
  enviar(acta: Acta): Promise<Result<Acta, ConflictoVersion>>;
  corregir(actaId: string, cambios: Partial<Acta>, versionConocida: number): Promise<Result<Acta, ConflictoVersion>>;
}
