import { Result } from '@core/utils/result';
import {
  VerificacionCedula,
  VerificacionCorreo,
  VerificationRepository,
} from '../../domain/repositories/VerificationRepository';
import { ExternalVerificationDatasource } from '../datasources/ExternalVerificationDatasource';

export class VerificationRepositoryImpl implements VerificationRepository {
  constructor(private readonly datasource: ExternalVerificationDatasource) {}

  verificarExistenciaCedula(
    cedula: string,
    nombres: string,
    apellidos: string
  ): Promise<Result<VerificacionCedula>> {
    return this.datasource.verificarCedula(cedula, nombres, apellidos);
  }

  verificarCorreo(correo: string): Promise<Result<VerificacionCorreo>> {
    return this.datasource.verificarCorreo(correo);
  }
}
