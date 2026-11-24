import { fail, Result } from '@core/utils/result';
import { RolUsuario } from '@features/auth/domain/entities/Usuario';
import { PersonalRepository } from '../repositories/PersonalRepository';
import { AsignacionVeedor } from '../entities/AsignacionVeedor';

/**
 * RF-07: solo el coordinador de recinto asigna veedores a las mesas de SU
 * recinto. La RLS de `asignaciones_veedor` (ver
 * supabase/migrations/0004_personal.sql) es la barrera real; esto es solo
 * feedback inmediato (RF-13).
 */
export class AsignarVeedorUseCase {
  constructor(private readonly repository: PersonalRepository) {}

  ejecutar(mesaId: string, veedorId: string, rolDeQuienLlama: RolUsuario): Promise<Result<AsignacionVeedor>> {
    if (rolDeQuienLlama !== RolUsuario.COORDINADOR_RECINTO) {
      return Promise.resolve(
        fail({ code: 'ROL_NO_AUTORIZADO', message: 'Solo el coordinador de recinto puede asignar veedores.' })
      );
    }
    return this.repository.asignarVeedor(mesaId, veedorId);
  }
}
