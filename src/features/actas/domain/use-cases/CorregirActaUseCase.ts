import { AppError, fail, Result } from '@core/utils/result';
import { ActasRepository, ConflictoVersion } from '../repositories/ActasRepository';
import { Acta } from '../entities/Acta';
import { validarActa } from './ValidarActaUseCase';

/**
 * `fotoUri` + `ubicacion`: opcionales, solo si se volvió a tomar la foto
 * (ADR-04) — p. ej. un acta que se registró sin GPS y ahora se respalda.
 */
export type CorregirActaInput = Partial<
  Pick<Acta, 'votosPorOrganizacion' | 'votosNulos' | 'votosBlancos' | 'totalSufragantes' | 'fotoUri' | 'ubicacion'>
>;

/**
 * RF-12: el veedor o el coordinador de su recinto corrigen un acta ya
 * enviada. Revalida las mismas reglas de RF-10 sobre los valores corregidos
 * (no tendría sentido permitir una corrección que deja el acta inválida), y
 * delega la concurrencia optimista (S-05) al repositorio — si `version` ya
 * cambió en el servidor, no se sobreescribe silenciosamente.
 */
export class CorregirActaUseCase {
  constructor(private readonly repository: ActasRepository) {}

  ejecutar(
    actaId: string,
    cambios: CorregirActaInput,
    actaActual: Acta
  ): Promise<Result<Acta, ConflictoVersion | AppError>> {
    const actaRevisada = { ...actaActual, ...cambios };
    const validacion = validarActa(actaRevisada);
    if (!validacion.ok) {
      return Promise.resolve(fail(validacion.error));
    }

    return this.repository.corregir(actaId, cambios, actaActual.version);
  }
}
