import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode as decodeJpeg } from 'jpeg-js';
import { Buffer } from 'buffer';
import { fail, ok, Result } from '@core/utils/result';
import { guardarFotoActa } from '@core/storage/fileStorage';
import { FotoCapturada } from '../../domain/repositories/CapturaRepository';
import { Ubicacion } from '../../domain/entities/Acta';

/** ADR-10/S-10: una ubicación capturada hace más de esto se marca `verificada: false`. */
const VENTANA_UBICACION_VERIFICADA_MS = 5 * 60 * 1000;
/** Cuánto se espera al GPS antes de usar la última ubicación conocida (ADR-04). */
const TIEMPO_LIMITE_GPS_MS = 15 * 1000;

/** Ancho al que se reduce la foto SOLO para medir nitidez (no es el archivo que se sube). */
const ANCHO_ANALISIS_NITIDEZ = 512;

export class DeviceCapturaDatasource {
  async tomarFotoActa(): Promise<Result<FotoCapturada>> {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      return fail({ code: 'PERMISO_CAMARA_DENEGADO', message: 'ActaYa necesita la cámara para fotografiar el acta.' });
    }

    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (resultado.canceled || !resultado.assets?.[0]) {
      return fail({ code: 'CAPTURA_CANCELADA', message: 'No se tomó ninguna foto.' });
    }

    const uriTemporal = resultado.assets[0].uri;
    const nitidez = await this.medirNitidez(uriTemporal);
    const uriFinal = guardarFotoActa(uriTemporal, `${Date.now()}.jpg`);

    return ok({ uri: uriFinal, nitidez });
  }

  async obtenerUbicacionActual(): Promise<Result<Ubicacion>> {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) {
      return fail({
        code: 'PERMISO_UBICACION_DENEGADO',
        message: 'ActaYa necesita tu ubicación para respaldar el acta.',
      });
    }

    // ADR-04: primero se pide una posición nueva al GPS; bajo techo puede
    // tardar mucho o fallar, así que tiene un tiempo límite. Si no llega,
    // se usa la última ubicación conocida del teléfono, que queda marcada
    // como no verificada si tiene más de 5 minutos (S-10).
    const posicion =
      (await this.posicionActualConLimite()) ?? (await Location.getLastKnownPositionAsync().catch(() => null));

    if (!posicion) {
      return fail({
        code: 'ERROR_UBICACION',
        message: 'No se pudo obtener la ubicación. Activa el GPS o acércate a una ventana y vuelve a intentar.',
      });
    }

    const antiguedadMs = Date.now() - posicion.timestamp;
    return ok({
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
      capturadaEn: new Date(posicion.timestamp).toISOString(),
      verificada: antiguedadMs <= VENTANA_UBICACION_VERIFICADA_MS,
      precisionMetros: posicion.coords.accuracy,
    });
  }

  /** `null` si el GPS falla o no responde a tiempo. */
  private async posicionActualConLimite(): Promise<Location.LocationObject | null> {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const limite = new Promise<null>((resolver) => {
      temporizador = setTimeout(() => resolver(null), TIEMPO_LIMITE_GPS_MS);
    });
    try {
      return await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        limite,
      ]);
    } catch {
      return null;
    } finally {
      clearTimeout(temporizador);
    }
  }

  /**
   * ADR-06/S-12: redimensiona a un ancho fijo (para que el umbral de
   * `EvaluarNitidezFoto` sea comparable entre fotos de distinta resolución),
   * decodifica el JPEG resultante con jpeg-js y calcula la varianza del
   * laplaciano en escala de grises — ver el comentario de
   * `UMBRAL_NITIDEZ_MINIMO` para cómo se calibró el umbral.
   */
  private async medirNitidez(uri: string): Promise<number> {
    const contexto = ImageManipulator.manipulate(uri).resize({ width: ANCHO_ANALISIS_NITIDEZ });
    const imagen = await contexto.renderAsync();
    const resultado = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: 0.9, base64: true });

    const bytes = Buffer.from(resultado.base64 as string, 'base64');
    const { width, height, data } = decodeJpeg(bytes, { useTArray: true });

    const gris = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      gris[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    let suma = 0;
    let sumaCuadrados = 0;
    let cuenta = 0;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const laplaciano =
          gris[idx - width] + gris[idx + width] + gris[idx - 1] + gris[idx + 1] - 4 * gris[idx];
        suma += laplaciano;
        sumaCuadrados += laplaciano * laplaciano;
        cuenta++;
      }
    }

    const media = suma / cuenta;
    return sumaCuadrados / cuenta - media * media;
  }
}
