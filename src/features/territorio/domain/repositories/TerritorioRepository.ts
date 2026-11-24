import { Result } from '@core/utils/result';
import { Candidato, Mesa, OrganizacionPolitica, Recinto } from '../entities/Territorio';

/**
 * RF-06: el coordinador provincial visualiza los recintos precargados y
 * puede agregar nuevos. `listarMesasPorRecinto` expone las JRV precargadas
 * (S-01) — la consumen `personal` (asignar veedor a una JRV) y `actas`
 * (registrar el acta de una JRV concreta).
 */
export interface TerritorioRepository {
  listarRecintos(): Promise<Result<Recinto[]>>;
  agregarRecinto(datos: Omit<Recinto, 'id'>): Promise<Result<Recinto>>;
  listarMesasPorRecinto(recintoId: string): Promise<Result<Mesa[]>>;
  /** El veedor conoce el `mesaId` por su asignación (`personal`), pero necesita el número de JRV para mostrarlo (`actas`). */
  obtenerMesa(mesaId: string): Promise<Result<Mesa>>;
  listarOrganizacionesConCandidatos(): Promise<Result<{ organizacion: OrganizacionPolitica; candidatos: Candidato[] }[]>>;
}
