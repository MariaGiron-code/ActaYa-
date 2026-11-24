import { SupabaseClient } from '@supabase/supabase-js';
import { AppError, fail, ok, Result } from '@core/utils/result';
import { Acta } from '../../domain/entities/Acta';
import { ConflictoVersion } from '../../domain/repositories/ActasRepository';
import { actaFromRow, actaToInsertRow, ActaRow } from '../dto/ActaDTO';

const BUCKET = 'actas-fotos';
/** Código de Postgres para violación de llave única/primaria. */
const CODIGO_DUPLICADO = '23505';

/** Todo lo que toca directamente la tabla `actas` y el bucket `actas-fotos`. */
export class SupabaseActasDatasource {
  constructor(private readonly client: SupabaseClient) {}

  async enviar(acta: Acta): Promise<Result<Acta, ConflictoVersion | AppError>> {
    const subida = await this.subirFoto(acta.id, acta.registradoPorId, acta.fotoUri as string);
    if (!subida.ok) return fail(subida.error);

    const { error } = await this.client.from('actas').insert(actaToInsertRow(acta, subida.value));

    if (error) {
      if (error.code === CODIGO_DUPLICADO) {
        // RF-13: este id ya existe en el servidor — el envío anterior sí
        // llegó, el reintento no debe tratarse como un error.
        return ok(acta);
      }
      return fail({ code: 'ERROR_ENVIAR_ACTA', message: error.message, cause: error });
    }

    return ok(acta);
  }

  async corregir(
    actaId: string,
    cambios: Partial<Acta>,
    versionConocida: number
  ): Promise<Result<Acta, ConflictoVersion | AppError>> {
    const filaCambios: Record<string, unknown> = {};
    if (cambios.votosPorOrganizacion !== undefined) filaCambios.votos_por_organizacion = cambios.votosPorOrganizacion;
    if (cambios.votosNulos !== undefined) filaCambios.votos_nulos = cambios.votosNulos;
    if (cambios.votosBlancos !== undefined) filaCambios.votos_blancos = cambios.votosBlancos;
    if (cambios.totalSufragantes !== undefined) filaCambios.total_sufragantes = cambios.totalSufragantes;
    filaCambios.version = versionConocida + 1;
    filaCambios.actualizada_en = new Date().toISOString();

    const { data, error } = await this.client
      .from('actas')
      .update(filaCambios)
      .eq('id', actaId)
      .eq('version', versionConocida)
      .select('*')
      .maybeSingle<ActaRow>();

    if (error) {
      return fail({ code: 'ERROR_CORREGIR_ACTA', message: error.message });
    }

    if (!data) {
      // version no coincidía (o el acta no existe): trae la fila actual para
      // mostrársela al usuario (S-05) en vez de fallar en silencio.
      const actual = await this.client.from('actas').select('*').eq('id', actaId).maybeSingle<ActaRow>();
      if (!actual.data) {
        return fail({ code: 'ERROR_CORREGIR_ACTA', message: 'El acta ya no existe.' });
      }
      const fotoUrl = await this.urlFirmadaFoto(actual.data.foto_path);
      return fail({
        code: 'CONFLICTO_VERSION',
        message: 'Esta acta fue modificada por otra persona. Revisa la versión actual antes de volver a intentar.',
        versionServidor: actaFromRow(actual.data, fotoUrl),
      });
    }

    const fotoUrl = await this.urlFirmadaFoto(data.foto_path);
    return ok(actaFromRow(data, fotoUrl));
  }

  async listarActasCorregibles(): Promise<Result<Acta[]>> {
    const { data, error } = await this.client
      .from('actas')
      .select('*')
      .order('creada_en', { ascending: false });

    if (error) return fail({ code: 'ERROR_LISTAR_ACTAS', message: error.message, cause: error });
    // Sin URL de foto: esta lista es para corregir votos, no para ver la
    // imagen, y pedir una URL firmada por fila sería una llamada de más a
    // Storage por cada acta sin necesidad.
    return ok((data as ActaRow[]).map((fila) => actaFromRow(fila, '')));
  }

  private async subirFoto(actaId: string, veedorId: string, uriLocal: string): Promise<Result<string>> {
    const ruta = `${veedorId}/${actaId}.jpg`;
    const respuesta = await fetch(uriLocal);
    const cuerpo = await respuesta.blob();

    const { error } = await this.client.storage
      .from(BUCKET)
      .upload(ruta, cuerpo, { contentType: 'image/jpeg', upsert: true });

    if (error) return fail({ code: 'ERROR_SUBIR_FOTO', message: error.message, cause: error });
    return ok(ruta);
  }

  private async urlFirmadaFoto(ruta: string): Promise<string> {
    const { data } = await this.client.storage.from(BUCKET).createSignedUrl(ruta, 600);
    return data?.signedUrl ?? '';
  }
}
