import { generarId } from '@core/utils/uuid';
import { fail, ok, Result } from '@core/utils/result';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import { ActasRepository } from '../repositories/ActasRepository';
import { Acta, Ubicacion } from '../entities/Acta';
import { validarActa } from './ValidarActaUseCase';

export type RegistrarActaInput = {
  mesaId: string;
  dignidad: Dignidad;
  votosPorOrganizacion: Record<string, number>;
  votosNulos: number;
  votosBlancos: number;
  totalSufragantes: number;
  fotoUri: string | null;
  ubicacion: Ubicacion | null;
  registradoPorId: string;
};

/**
 * RF-09 a RF-11, RF-13, RF-14: guarda SIEMPRE primero en local (offline-first,
 * RNF-05) — el envío al servidor es responsabilidad de otro caso de uso
 * (`SincronizarActasPendientesUseCase`), disparado por la capa de
 * presentación cuando hay red (ver `useActas.ts`).
 */
export class RegistrarActaUseCase {
  constructor(private readonly repository: ActasRepository) {}

  async ejecutar(datos: RegistrarActaInput): Promise<Result<Acta>> {
    const validacion = validarActa(datos);
    if (!validacion.ok) return fail(validacion.error);

    if (!datos.fotoUri) {
      return fail({ code: 'FOTO_REQUERIDA', message: 'El acta necesita una foto antes de poder guardarse.' });
    }
    // RF-11: "un acta sin foto no se envía" — la ubicación NO bloquea el
    // registro. Sin GPS (apagado o sin permiso) el acta se guarda con
    // `ubicacion: null` y queda marcada como no verificada (ADR-04/S-10).

    const acta: Acta = {
      id: generarId(),
      mesaId: datos.mesaId,
      dignidad: datos.dignidad,
      votosPorOrganizacion: datos.votosPorOrganizacion,
      votosNulos: datos.votosNulos,
      votosBlancos: datos.votosBlancos,
      totalSufragantes: datos.totalSufragantes,
      fotoUri: datos.fotoUri,
      ubicacion: datos.ubicacion,
      version: 1,
      registradoPorId: datos.registradoPorId,
      estado: 'en_proceso',
      creadaEn: new Date().toISOString(),
    };

    const guardado = await this.repository.guardarLocal(acta);
    if (!guardado.ok) return fail(guardado.error);

    return ok(acta);
  }
}
