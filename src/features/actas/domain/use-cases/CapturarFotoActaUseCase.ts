import { fail, Result } from '@core/utils/result';
import { CapturaRepository } from '../repositories/CapturaRepository';
import { Ubicacion } from '../entities/Acta';
import { fotoEsLegible, UMBRAL_NITIDEZ_MINIMO } from './EvaluarNitidezFoto';

/** `ubicacion: null` = el GPS está apagado o no hay permiso: la foto se conserva igual. */
export type EvidenciaCapturada = { fotoUri: string; ubicacion: Ubicacion | null; nitidez: number };

/**
 * RF-11 (foto obligatoria) + ADR-06 (rechazar fotos borrosas) + ADR-04/S-10
 * (ubicación: verificada si es reciente, no verificada si es la última
 * conocida y tiene más de 5 minutos, y `null` si no hay ninguna — GPS
 * apagado o permiso negado). Sin ubicación NO se descarta la foto: perder
 * el acta sería peor (RNF-05); queda marcada para que el coordinador la
 * revise y se puede respaldar después retomando la foto. Orquesta el
 * puerto `CapturaRepository`; la decisión de qué es "borroso" vive en
 * `EvaluarNitidezFoto`, no aquí.
 */
export class CapturarFotoActaUseCase {
  constructor(private readonly repository: CapturaRepository) {}

  async ejecutar(): Promise<Result<EvidenciaCapturada>> {
    const foto = await this.repository.tomarFotoActa();
    if (!foto.ok) return fail(foto.error);

    if (!fotoEsLegible(foto.value.nitidez)) {
      // S-12: el número solo sirve para calibrar `UMBRAL_NITIDEZ_MINIMO` con
      // fotos reales (ver su comentario) — a un veedor real no le dice nada,
      // por eso solo se agrega en development, nunca en el build de entrega.
      const sufijoDepuracion = __DEV__
        ? ` (nitidez: ${foto.value.nitidez.toFixed(1)}, umbral: ${UMBRAL_NITIDEZ_MINIMO})`
        : '';
      return fail({
        code: 'FOTO_BORROSA',
        message: `La foto salió borrosa. Acércate más, apoya el teléfono y vuelve a intentar.${sufijoDepuracion}`,
      });
    }

    const ubicacion = await this.repository.obtenerUbicacionActual();

    return {
      ok: true,
      value: {
        fotoUri: foto.value.uri,
        ubicacion: ubicacion.ok ? ubicacion.value : null,
        nitidez: foto.value.nitidez,
      },
    };
  }
}
