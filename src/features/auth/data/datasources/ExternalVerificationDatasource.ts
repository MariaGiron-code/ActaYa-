import { SupabaseClient } from '@supabase/supabase-js';
import { fail, ok, Result } from '@core/utils/result';
import { VerificacionCedula, VerificacionCorreo } from '../../domain/repositories/VerificationRepository';

/**
 * ADR-11: nunca se llama a Datacil ni a QuickEmailVerification directamente
 * desde el cliente (expondría las llaves privadas). Ambas pasan por Edge
 * Functions de Supabase, que además cachean resultados para no pagar dos
 * veces por la misma consulta.
 */
export class ExternalVerificationDatasource {
  constructor(private readonly client: SupabaseClient) {}

  async verificarCedula(
    cedula: string,
    nombres: string,
    apellidos: string
  ): Promise<Result<VerificacionCedula>> {
    const { data, error } = await this.client.functions.invoke<VerificacionCedula>('verificar-cedula', {
      body: { cedula, nombres, apellidos },
    });
    if (error || !data) {
      return fail({
        code: 'ERROR_VERIFICAR_CEDULA',
        message: error?.message ?? 'No se pudo verificar la cédula en este momento.',
        cause: error,
      });
    }
    return ok(data);
  }

  async verificarCorreo(correo: string): Promise<Result<VerificacionCorreo>> {
    const { data, error } = await this.client.functions.invoke<VerificacionCorreo>('verificar-correo', {
      body: { correo },
    });
    if (error || !data) {
      return fail({
        code: 'ERROR_VERIFICAR_CORREO',
        message: error?.message ?? 'No se pudo verificar el correo en este momento.',
        cause: error,
      });
    }
    return ok(data);
  }
}
