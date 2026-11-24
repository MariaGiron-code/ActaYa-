import { fail, Result } from '@core/utils/result';
import { RolUsuario } from '@features/auth/domain/entities/Usuario';
import { TerritorioRepository } from '../repositories/TerritorioRepository';
import { Recinto } from '../entities/Territorio';

/**
 * RF-06: solo el coordinador provincial puede agregar recintos nuevos.
 * La RLS de `recintos` en Supabase debe exigir lo mismo del lado del
 * servidor (ver supabase/migrations/0002_territorio.sql) — esta
 * comprobación en el cliente es solo para dar feedback inmediato (RF-13),
 * no es la barrera de seguridad real.
 */
export class AgregarRecintoUseCase {
  constructor(private readonly repository: TerritorioRepository) {}

  ejecutar(datos: Omit<Recinto, 'id'>, rolDeQuienLlama: RolUsuario): Promise<Result<Recinto>> {
    if (rolDeQuienLlama !== RolUsuario.COORDINADOR_PROVINCIAL) {
      return Promise.resolve(
        fail({ code: 'ROL_NO_AUTORIZADO', message: 'Solo el coordinador provincial puede agregar recintos.' })
      );
    }
    return this.repository.agregarRecinto(datos);
  }
}
