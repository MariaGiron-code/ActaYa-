import { localStorage } from '@core/storage/asyncStorage';
import { ok, Result } from '@core/utils/result';
import { Acta } from '../../domain/entities/Acta';

const CLAVE_ACTAS_LOCALES = 'ACTAYA_ACTAS_LOCALES';

/**
 * Cola offline-first (RNF-05): el acta se guarda aquí INMEDIATAMENTE, sin
 * esperar red. `SincronizarActasPendientesUseCase` la recorre para intentar
 * `enviar()`/reintentar cuando hay conexión.
 */
export class LocalActasDatasource {
  async guardar(acta: Acta): Promise<Result<void>> {
    const actas = await this.leerTodas();
    const indice = actas.findIndex((a) => a.id === acta.id);
    if (indice >= 0) {
      actas[indice] = acta;
    } else {
      actas.push(acta);
    }
    await localStorage.setItem(CLAVE_ACTAS_LOCALES, actas);
    return ok(undefined);
  }

  async listarPendientes(): Promise<Result<Acta[]>> {
    const actas = await this.leerTodas();
    return ok(actas.filter((a) => a.estado !== 'guardado'));
  }

  private async leerTodas(): Promise<Acta[]> {
    return (await localStorage.getItem<Acta[]>(CLAVE_ACTAS_LOCALES)) ?? [];
  }
}
