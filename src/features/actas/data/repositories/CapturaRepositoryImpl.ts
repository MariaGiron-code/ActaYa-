import { Result } from '@core/utils/result';
import { CapturaRepository, FotoCapturada } from '../../domain/repositories/CapturaRepository';
import { Ubicacion } from '../../domain/entities/Acta';
import { DeviceCapturaDatasource } from '../datasources/DeviceCapturaDatasource';

export class CapturaRepositoryImpl implements CapturaRepository {
  constructor(private readonly datasource: DeviceCapturaDatasource) {}

  tomarFotoActa(): Promise<Result<FotoCapturada>> {
    return this.datasource.tomarFotoActa();
  }

  obtenerUbicacionActual(): Promise<Result<Ubicacion>> {
    return this.datasource.obtenerUbicacionActual();
  }
}
