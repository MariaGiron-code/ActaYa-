import { supabase } from '@core/supabase/client';
import { SupabaseAuthDatasource } from '../data/datasources/SupabaseAuthDatasource';
import { CrearUsuarioRemoteDatasource } from '../data/datasources/CrearUsuarioRemoteDatasource';
import { ExternalVerificationDatasource } from '../data/datasources/ExternalVerificationDatasource';
import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { VerificationRepositoryImpl } from '../data/repositories/VerificationRepositoryImpl';
import { IniciarSesionUseCase } from '../domain/use-cases/IniciarSesionUseCase';
import { CrearUsuarioUseCase } from '../domain/use-cases/CrearUsuarioUseCase';
import { EstablecerClaveInicialUseCase } from '../domain/use-cases/EstablecerClaveInicialUseCase';
import { RecuperarClaveUseCase } from '../domain/use-cases/RecuperarClaveUseCase';

/**
 * Composition root del feature `auth`.
 *
 * ÚNICO lugar fuera de `data/` donde está permitido instanciar datasources y
 * repositorios concretos. La capa de presentación (hooks, pantallas) solo
 * debe importar `authContainer` y llamar a sus casos de uso — nunca
 * `SupabaseAuthDatasource` ni `supabase` directamente. Esa es la regla de
 * dependencia hacia el interior que pide ADR-12.
 */
const authDatasource = new SupabaseAuthDatasource(supabase);
const crearUsuarioDatasource = new CrearUsuarioRemoteDatasource(supabase);
const verificationDatasource = new ExternalVerificationDatasource(supabase);

const authRepository = new AuthRepositoryImpl(authDatasource, crearUsuarioDatasource);
const verificationRepository = new VerificationRepositoryImpl(verificationDatasource);

export const authContainer = {
  authRepository,
  verificationRepository,
  iniciarSesionUseCase: new IniciarSesionUseCase(authRepository),
  crearUsuarioUseCase: new CrearUsuarioUseCase(authRepository, verificationRepository),
  establecerClaveInicialUseCase: new EstablecerClaveInicialUseCase(authRepository),
  recuperarClaveUseCase: new RecuperarClaveUseCase(authRepository),
};
