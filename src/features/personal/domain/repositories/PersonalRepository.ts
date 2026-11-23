import { Result } from '@core/utils/result';
import { AsignacionVeedor } from '../entities/AsignacionVeedor';

/** Puerto pendiente de implementar (ver README.md de este feature). */
export interface PersonalRepository {
  asignarVeedor(mesaId: string, veedorId: string): Promise<Result<AsignacionVeedor>>;
  /** RF-08: reemplazo el mismo día, incluso por una persona externa habilitada por el coordinador (S-03). */
  reemplazarVeedor(asignacionActualId: string, nuevoVeedorId: string): Promise<Result<AsignacionVeedor>>;
  listarAsignacionesDeRecinto(recintoId: string): Promise<Result<AsignacionVeedor[]>>;
}
