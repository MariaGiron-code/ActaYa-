import { Result } from '@core/utils/result';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import { SeguimientoRepository } from '../../domain/repositories/SeguimientoRepository';
import { ProgresoCandidato, ResumenRecinto } from '../../domain/entities/Seguimiento';
import { SupabaseSeguimientoDatasource } from '../datasources/SupabaseSeguimientoDatasource';

export class SeguimientoRepositoryImpl implements SeguimientoRepository {
  constructor(private readonly datasource: SupabaseSeguimientoDatasource) {}

  obtenerResumenPorRecinto(): Promise<Result<ResumenRecinto[]>> {
    return this.datasource.obtenerResumenPorRecinto();
  }

  obtenerProgresoPorDignidad(dignidad: Dignidad): Promise<Result<ProgresoCandidato[]>> {
    return this.datasource.obtenerProgresoPorDignidad(dignidad);
  }

  suscribirseAActualizaciones(onCambio: () => void): () => void {
    return this.datasource.suscribirseAActualizaciones(onCambio);
  }
}
