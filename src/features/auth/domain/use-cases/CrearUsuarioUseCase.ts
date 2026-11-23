import { esFormatoCedulaValido } from '@core/validation/cedula';
import { fail, Result } from '@core/utils/result';
import { ROL_SUPERIOR, RolUsuario, Usuario } from '../entities/Usuario';
import { AuthRepository, CrearUsuarioInput } from '../repositories/AuthRepository';
import { VerificationRepository } from '../repositories/VerificationRepository';

/**
 * RF-01, RF-03, RF-04: un superior registra a su subordinado y el sistema
 * debe tener certeza de que la cédula y el correo son reales (ADR-11) antes
 * de habilitar la cuenta — no basta con el formato (S-09).
 *
 * El backend (Edge Function `crear-usuario`) repite estas validaciones: este
 * caso de uso evita llamadas innecesarias y le da al coordinador el error
 * específico de inmediato, pero NUNCA es la única barrera de seguridad.
 */
export class CrearUsuarioUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly verificationRepository: VerificationRepository
  ) {}

  async ejecutar(
    datos: CrearUsuarioInput,
    rolDeQuienCrea: RolUsuario
  ): Promise<Result<{ usuario: Usuario; claveTemporal: string }>> {
    if (ROL_SUPERIOR[datos.rol] !== rolDeQuienCrea) {
      return fail({
        code: 'JERARQUIA_INVALIDA',
        message: 'No tienes permiso para crear usuarios con ese rol.',
      });
    }

    if (!esFormatoCedulaValido(datos.cedula)) {
      return fail({ code: 'CEDULA_FORMATO_INVALIDO', message: 'La cédula ingresada no es válida.' });
    }

    const cedulaVerificada = await this.verificationRepository.verificarExistenciaCedula(
      datos.cedula,
      datos.nombres,
      datos.apellidos
    );
    if (!cedulaVerificada.ok) return fail(cedulaVerificada.error);
    if (!cedulaVerificada.value.existe) {
      return fail({ code: 'CEDULA_NO_EXISTE', message: 'La cédula no pudo verificarse en el Registro Civil.' });
    }
    if (!cedulaVerificada.value.coincideNombre) {
      return fail({
        code: 'CEDULA_NOMBRE_NO_COINCIDE',
        message: 'Los nombres no coinciden con los registrados para esa cédula.',
      });
    }

    const correoVerificado = await this.verificationRepository.verificarCorreo(datos.correo);
    if (!correoVerificado.ok) return fail(correoVerificado.error);
    if (!correoVerificado.value.entregable) {
      return fail({ code: 'CORREO_NO_ENTREGABLE', message: 'Ese correo no parece existir o no recibe mensajes.' });
    }

    return this.authRepository.crearUsuario(datos);
  }
}
