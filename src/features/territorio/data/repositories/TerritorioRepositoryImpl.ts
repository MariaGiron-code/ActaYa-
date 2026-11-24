import { Result } from '@core/utils/result';
import { TerritorioRepository } from '../../domain/repositories/TerritorioRepository';
import { Candidato, Mesa, OrganizacionPolitica, Recinto } from '../../domain/entities/Territorio';
import { SupabaseTerritorioDatasource } from '../datasources/SupabaseTerritorioDatasource';

export class TerritorioRepositoryImpl implements TerritorioRepository {
  constructor(private readonly datasource: SupabaseTerritorioDatasource) {}

  listarRecintos(): Promise<Result<Recinto[]>> {
    return this.datasource.listarRecintos();
  }

  agregarRecinto(datos: Omit<Recinto, 'id'>): Promise<Result<Recinto>> {
    return this.datasource.agregarRecinto(datos);
  }

  listarMesasPorRecinto(recintoId: string): Promise<Result<Mesa[]>> {
    return this.datasource.listarMesasPorRecinto(recintoId);
  }

  listarOrganizacionesConCandidatos(): Promise<
    Result<{ organizacion: OrganizacionPolitica; candidatos: Candidato[] }[]>
  > {
    return this.datasource.listarOrganizacionesConCandidatos();
  }
}
