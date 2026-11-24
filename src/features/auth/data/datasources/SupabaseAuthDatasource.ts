import { SupabaseClient } from '@supabase/supabase-js';
import { fail, ok, Result } from '@core/utils/result';
import { usuarioFromRow, UsuarioRow } from '../dto/UsuarioDTO';
import { SesionActiva, Usuario } from '../../domain/entities/Usuario';

/** Todo lo que toca directamente `supabase.auth` y la tabla `usuarios`. */
export class SupabaseAuthDatasource {
  constructor(private readonly client: SupabaseClient) {}

  async iniciarSesion(correo: string, clave: string): Promise<Result<SesionActiva>> {
    const { data, error } = await this.client.auth.signInWithPassword({ email: correo, password: clave });
    if (error || !data.session) {
      return fail({ code: 'CREDENCIALES_INVALIDAS', message: 'Correo o clave incorrectos.', cause: error });
    }

    const perfil = await this.obtenerPerfil(data.session.user.id);
    if (!perfil.ok) return perfil;

    return ok({ usuario: perfil.value, accessToken: data.session.access_token });
  }

  async cerrarSesion(): Promise<Result<void>> {
    const { error } = await this.client.auth.signOut();
    if (error) return fail({ code: 'ERROR_CIERRE_SESION', message: error.message, cause: error });
    return ok(undefined);
  }

  async obtenerSesionActual(): Promise<SesionActiva | null> {
    const { data } = await this.client.auth.getSession();
    if (!data.session) return null;

    const perfil = await this.obtenerPerfil(data.session.user.id);
    if (!perfil.ok) return null;

    return { usuario: perfil.value, accessToken: data.session.access_token };
  }

  async establecerClaveInicial(nuevaClave: string): Promise<Result<void>> {
    const { error } = await this.client.auth.updateUser({ password: nuevaClave });
    if (error) return fail({ code: 'ERROR_ACTUALIZAR_CLAVE', message: error.message, cause: error });

    const { data: sesion } = await this.client.auth.getSession();
    if (sesion.session) {
      await this.client.from('usuarios').update({ debe_cambiar_clave: false }).eq('id', sesion.session.user.id);
    }
    return ok(undefined);
  }

  async solicitarRecuperacionClave(correo: string): Promise<Result<void>> {
    // El scheme `actaya://` (app.json) abre la app directamente desde el
    // correo; sin esto, Supabase manda al Site URL por defecto (una página
    // web que no existe) y el enlace nunca llega a `completarRecuperacionClave`.
    // Requiere agregar esta URL en Authentication > URL Configuration >
    // Redirect URLs del proyecto de Supabase — si no está en esa lista,
    // Supabase la ignora y cae de nuevo al Site URL por defecto.
    const { error } = await this.client.auth.resetPasswordForEmail(correo, {
      redirectTo: 'actaya://recuperar-clave',
    });
    if (error) return fail({ code: 'ERROR_RECUPERACION', message: error.message, cause: error });
    return ok(undefined);
  }

  /** RF-05/S-08: intercambia el código del enlace de recuperación por una sesión real. */
  async completarRecuperacionClave(codigo: string): Promise<Result<SesionActiva>> {
    const { data, error } = await this.client.auth.exchangeCodeForSession(codigo);
    if (error || !data.session) {
      return fail({
        code: 'ENLACE_RECUPERACION_INVALIDO',
        message: 'Este enlace de recuperación no es válido o ya caducó. Solicita uno nuevo.',
        cause: error,
      });
    }

    const perfil = await this.obtenerPerfil(data.session.user.id);
    if (!perfil.ok) return perfil;

    return ok({ usuario: perfil.value, accessToken: data.session.access_token });
  }

  async listarSubordinados(): Promise<Result<Usuario[]>> {
    const { data: sesion } = await this.client.auth.getSession();
    if (!sesion.session) return fail({ code: 'NO_AUTENTICADO', message: 'No hay sesión activa.' });

    const { data, error } = await this.client
      .from('usuarios')
      .select('*')
      .eq('creado_por_id', sesion.session.user.id)
      .order('nombres');

    if (error) return fail({ code: 'ERROR_LISTAR_SUBORDINADOS', message: error.message, cause: error });
    return ok((data as UsuarioRow[]).map(usuarioFromRow));
  }

  private async obtenerPerfil(userId: string) {
    const { data, error } = await this.client
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single<UsuarioRow>();

    if (error || !data) {
      return fail({ code: 'PERFIL_NO_ENCONTRADO', message: 'No se encontró el perfil del usuario.', cause: error });
    }
    return ok(usuarioFromRow(data));
  }
}
