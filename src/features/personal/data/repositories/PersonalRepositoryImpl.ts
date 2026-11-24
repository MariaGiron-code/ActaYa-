import { Result } from '@core/utils/result';
import { PersonalRepository } from '../../domain/repositories/PersonalRepository';
import { AsignacionVeedor } from '../../domain/entities/AsignacionVeedor';
import { SupabasePersonalDatasource } from '../datasources/SupabasePersonalDatasource';

export class PersonalRepositoryImpl implements PersonalRepository {
  constructor(private readonly datasource: SupabasePersonalDatasource) {}

  asignarVeedor(mesaId: string, veedorId: string): Promise<Result<AsignacionVeedor>> {
    return this.datasource.asignarVeedor(mesaId, veedorId);
  }

  reemplazarVeedor(asignacionActualId: string, nuevoVeedorId: string): Promise<Result<AsignacionVeedor>> {
    return this.datasource.reemplazarVeedor(asignacionActualId, nuevoVeedorId);
  }

  listarAsignacionesDeRecinto(recintoId: string): Promise<Result<AsignacionVeedor[]>> {
    return this.datasource.listarAsignacionesDeRecinto(recintoId);
  }

  listarAsignacionesDelVeedor(veedorId: string): Promise<Result<AsignacionVeedor[]>> {
    return this.datasource.listarAsignacionesDelVeedor(veedorId);
  }
}
