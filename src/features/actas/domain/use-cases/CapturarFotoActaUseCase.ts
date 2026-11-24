import { fail, Result } from '@core/utils/result';
import { CapturaRepository } from '../repositories/CapturaRepository';
import { Ubicacion } from '../entities/Acta';
import { fotoEsLegible } from './EvaluarNitidezFoto';

export type EvidenciaCapturada = { fotoUri: string; ubicacion: Ubicacion };

/**
 * RF-11 (foto obligatoria) + ADR-06 (rechazar fotos borrosas) + ADR-04/S-10
 * (ubicación obligatoria, marcada no verificada si quedó vieja). Orquesta el
 * puerto `CapturaRepository`; la decisión de qué es "borroso" vive en
 * `EvaluarNitidezFoto`, no aquí.
 */
export class CapturarFotoActaUseCase {
  constructor(private readonly repository: CapturaRepository) {}

  async ejecutar(): Promise<Result<EvidenciaCapturada>> {
    const foto = await this.repository.tomarFotoActa();
    if (!foto.ok) return fail(foto.error);

    if (!fotoEsLegible(foto.value.nitidez)) {
      return fail({
        code: 'FOTO_BORROSA',
        message: 'La foto salió borrosa. Acércate más, apoya el teléfono y vuelve a intentar.',
      });
    }

    const ubicacion = await this.repository.obtenerUbicacionActual();
    if (!ubicacion.ok) return fail(ubicacion.error);

    return { ok: true, value: { fotoUri: foto.value.uri, ubicacion: ubicacion.value } };
  }
}
