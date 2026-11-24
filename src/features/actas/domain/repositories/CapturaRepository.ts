import { Result } from '@core/utils/result';
import { Ubicacion } from '../entities/Acta';

export type FotoCapturada = {
  /** Ruta local (expo-file-system), ya copiada a un archivo propio de la app. */
  uri: string;
  /** ADR-06: medida de nitidez (varianza del laplaciano en escala de grises); mayor = más nítida. */
  nitidez: number;
};

/**
 * Puerto hacia las capacidades del dispositivo (cámara, GPS). El dominio no
 * sabe que esto se implementa con expo-image-picker/expo-location/
 * expo-image-manipulator (ADR-04, ADR-06) — esa es la capa `data`.
 */
export interface CapturaRepository {
  tomarFotoActa(): Promise<Result<FotoCapturada>>;
  obtenerUbicacionActual(): Promise<Result<Ubicacion>>;
}
