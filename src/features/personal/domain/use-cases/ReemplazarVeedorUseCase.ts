import { fail, Result } from '@core/utils/result';
import { RolUsuario } from '@features/auth/domain/entities/Usuario';
import { CrearUsuarioInput } from '@features/auth/domain/repositories/AuthRepository';
import { CrearUsuarioUseCase } from '@features/auth/domain/use-cases/CrearUsuarioUseCase';
import { PersonalRepository } from '../repositories/PersonalRepository';
import { AsignacionVeedor } from '../entities/AsignacionVeedor';

export type ReemplazoInput =
  | { tipo: 'existente'; veedorId: string }
  | { tipo: 'nuevo'; datos: Omit<CrearUsuarioInput, 'rol' | 'recintoId' | 'mesasAsignadas'> };

/**
 * RF-08 / S-03: el coordinador de recinto reemplaza a un veedor ausente el
 * mismo día, ya sea con otro veedor que ya tenga cuenta, o con una persona
 * externa que se da de alta en el momento (reutiliza `CrearUsuarioUseCase`
 * de `auth` — el alta exige la misma verificación real de cédula/correo que
 * cualquier otra cuenta, S-09 no se relaja por ser un reemplazo urgente).
 */
export class ReemplazarVeedorUseCase {
  constructor(
    private readonly repository: PersonalRepository,
    private readonly crearUsuarioUseCase: CrearUsuarioUseCase
  ) {}

  async ejecutar(
    asignacionActualId: string,
    reemplazo: ReemplazoInput,
    rolDeQuienLlama: RolUsuario
  ): Promise<Result<AsignacionVeedor>> {
    if (rolDeQuienLlama !== RolUsuario.COORDINADOR_RECINTO) {
      return fail({ code: 'ROL_NO_AUTORIZADO', message: 'Solo el coordinador de recinto puede reemplazar veedores.' });
    }

    if (reemplazo.tipo === 'existente') {
      return this.repository.reemplazarVeedor(asignacionActualId, reemplazo.veedorId);
    }

    const nuevoUsuario = await this.crearUsuarioUseCase.ejecutar(
      { ...reemplazo.datos, rol: RolUsuario.VEEDOR },
      rolDeQuienLlama
    );
    if (!nuevoUsuario.ok) return fail(nuevoUsuario.error);

    return this.repository.reemplazarVeedor(asignacionActualId, nuevoUsuario.value.usuario.id);
  }
}
