import { AppError, Result } from '@core/utils/result';
import { ActasRepository, ConflictoVersion } from '../../domain/repositories/ActasRepository';
import { Acta } from '../../domain/entities/Acta';
import { LocalActasDatasource } from '../datasources/LocalActasDatasource';
import { SupabaseActasDatasource } from '../datasources/SupabaseActasDatasource';

export class ActasRepositoryImpl implements ActasRepository {
  constructor(
    private readonly localDatasource: LocalActasDatasource,
    private readonly remoteDatasource: SupabaseActasDatasource
  ) {}

  guardarLocal(acta: Acta): Promise<Result<void>> {
    return this.localDatasource.guardar(acta);
  }

  listarPendientesDeEnvio(): Promise<Result<Acta[]>> {
    return this.localDatasource.listarPendientes();
  }

  enviar(acta: Acta): Promise<Result<Acta, ConflictoVersion | AppError>> {
    return this.remoteDatasource.enviar(acta);
  }

  corregir(
    actaId: string,
    cambios: Partial<Acta>,
    versionConocida: number
  ): Promise<Result<Acta, ConflictoVersion | AppError>> {
    return this.remoteDatasource.corregir(actaId, cambios, versionConocida);
  }

  listarActasCorregibles(): Promise<Result<Acta[]>> {
    return this.remoteDatasource.listarActasCorregibles();
  }
}
