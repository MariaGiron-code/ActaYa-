import { SupabaseClient } from '@supabase/supabase-js';
import { fail, ok, Result } from '@core/utils/result';
import { usuarioFromRow, UsuarioRow } from '../dto/UsuarioDTO';
import { SesionActiva } from '../../domain/entities/Usuario';

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
    const { error } = await this.client.auth.resetPasswordForEmail(correo);
    if (error) return fail({ code: 'ERROR_RECUPERACION', message: error.message, cause: error });
    return ok(undefined);
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
