import { fail, Result } from '@core/utils/result';
import { AuthRepository } from '../repositories/AuthRepository';

/** RF-02, S-11: desde este momento, solo el titular conoce su clave. */
export class EstablecerClaveInicialUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(nuevaClave: string, confirmacion: string): Promise<Result<void>> {
    if (nuevaClave.length < 8) {
      return fail({ code: 'CLAVE_DEBIL', message: 'Usa al menos 8 caracteres.' });
    }
    if (nuevaClave !== confirmacion) {
      return fail({ code: 'CLAVE_NO_COINCIDE', message: 'Las claves no coinciden.' });
    }
    return this.authRepository.establecerClaveInicial(nuevaClave);
  }
}
