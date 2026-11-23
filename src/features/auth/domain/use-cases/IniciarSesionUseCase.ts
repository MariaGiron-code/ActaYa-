import { fail, Result } from '@core/utils/result';
import { SesionActiva } from '../entities/Usuario';
import { AuthRepository } from '../repositories/AuthRepository';

export class IniciarSesionUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async ejecutar(correo: string, clave: string): Promise<Result<SesionActiva>> {
    if (!correo.includes('@')) {
      return fail({ code: 'CORREO_INVALIDO', message: 'Ingresa un correo válido.' });
    }
    if (clave.length < 6) {
      return fail({ code: 'CLAVE_INVALIDA', message: 'La clave debe tener al menos 6 caracteres.' });
    }
    return this.authRepository.iniciarSesion(correo.trim().toLowerCase(), clave);
  }
}
