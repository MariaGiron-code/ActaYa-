import { SupabaseClient } from '@supabase/supabase-js';
import { fail, ok, Result } from '@core/utils/result';
import { usuarioFromRow, UsuarioRow } from '../dto/UsuarioDTO';
import { CrearUsuarioInput } from '../../domain/repositories/AuthRepository';
import { Usuario } from '../../domain/entities/Usuario';

/**
 * Crear un usuario requiere la llave `service_role` de Supabase (API admin
 * de Auth), que JAMÁS puede vivir en la app móvil (consecuencia documentada
 * en ADR-01). Por eso esto llama a la Edge Function `crear-usuario`, que
 * corre en el servidor con esa llave y repite ahí las validaciones.
 */
export class CrearUsuarioRemoteDatasource {
  constructor(private readonly client: SupabaseClient) {}

  async crear(
    datos: CrearUsuarioInput
  ): Promise<Result<{ usuario: Usuario; claveTemporal: string }>> {
    const { data, error } = await this.client.functions.invoke<{
      usuario: UsuarioRow;
      claveTemporal: string;
    }>('crear-usuario', { body: datos });

    if (error || !data) {
      return fail({ code: 'ERROR_CREAR_USUARIO', message: error?.message ?? 'No se pudo crear el usuario.', cause: error });
    }

    return ok({ usuario: usuarioFromRow(data.usuario), claveTemporal: data.claveTemporal });
  }
}
