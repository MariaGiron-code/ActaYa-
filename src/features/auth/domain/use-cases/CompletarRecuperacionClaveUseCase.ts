import { fail, Result } from '@core/utils/result';
import { SesionActiva } from '../entities/Usuario';
import { AuthRepository } from '../repositories/AuthRepository';

/**
 * RF-05, S-08: segunda mitad de la recuperación autónoma — el titular ya
 * recibió el enlace por correo (`RecuperarClaveUseCase`) y lo abrió; esto
 * convierte el código de ese enlace en una sesión real para que
 * `RootNavigator` pueda llevarlo a poner su clave nueva (mismo tratamiento
 * que S-11: nadie más la conocerá).
 */
export class CompletarRecuperacionClaveUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  ejecutar(codigo: string): Promise<Result<SesionActiva>> {
    if (!codigo) {
      return Promise.resolve(
        fail({ code: 'CODIGO_INVALIDO', message: 'El enlace de recuperación no es válido.' })
      );
    }
    return this.authRepository.completarRecuperacionClave(codigo);
  }
}
