import { Result } from '@core/utils/result';
import { Candidato, OrganizacionPolitica, Recinto } from '../entities/Territorio';

/**
 * Puerto pendiente de implementar (ver README.md de este feature).
 * RF-06: el coordinador provincial visualiza los recintos precargados y
 * puede agregar nuevos.
 */
export interface TerritorioRepository {
  listarRecintos(): Promise<Result<Recinto[]>>;
  agregarRecinto(datos: Omit<Recinto, 'id'>): Promise<Result<Recinto>>;
  listarOrganizacionesConCandidatos(): Promise<Result<{ organizacion: OrganizacionPolitica; candidatos: Candidato[] }[]>>;
}
