import { fail, Result } from '@core/utils/result';
import { AuthRepository } from '../repositories/AuthRepository';

/** RF-05, S-08: recuperación autónoma, sin depender del coordinador. */
export class RecuperarClaveUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(correo: string): Promise<Result<void>> {
    if (!correo.includes('@')) {
      return fail({ code: 'CORREO_INVALIDO', message: 'Ingresa un correo válido.' });
    }
    return this.authRepository.solicitarRecuperacionClave(correo.trim().toLowerCase());
  }
}
