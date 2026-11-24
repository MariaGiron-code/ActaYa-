import { Result } from '@core/utils/result';
import { AuthRepository, CrearUsuarioInput } from '../../domain/repositories/AuthRepository';
import { SesionActiva, Usuario } from '../../domain/entities/Usuario';
import { SupabaseAuthDatasource } from '../datasources/SupabaseAuthDatasource';
import { CrearUsuarioRemoteDatasource } from '../datasources/CrearUsuarioRemoteDatasource';

export class AuthRepositoryImpl implements AuthRepository {
  constructor(
    private readonly authDatasource: SupabaseAuthDatasource,
    private readonly crearUsuarioDatasource: CrearUsuarioRemoteDatasource
  ) {}

  iniciarSesion(correo: string, clave: string): Promise<Result<SesionActiva>> {
    return this.authDatasource.iniciarSesion(correo, clave);
  }

  cerrarSesion(): Promise<Result<void>> {
    return this.authDatasource.cerrarSesion();
  }

  obtenerSesionActual(): Promise<SesionActiva | null> {
    return this.authDatasource.obtenerSesionActual();
  }

  crearUsuario(
    datos: CrearUsuarioInput
  ): Promise<Result<{ usuario: Usuario; claveTemporal: string }>> {
    return this.crearUsuarioDatasource.crear(datos);
  }

  establecerClaveInicial(nuevaClave: string): Promise<Result<void>> {
    return this.authDatasource.establecerClaveInicial(nuevaClave);
  }

  solicitarRecuperacionClave(correo: string): Promise<Result<void>> {
    return this.authDatasource.solicitarRecuperacionClave(correo);
  }

  listarSubordinados(): Promise<Result<Usuario[]>> {
    return this.authDatasource.listarSubordinados();
  }
}
