import { ok, Result } from '@core/utils/result';
import { ActasRepository } from '../repositories/ActasRepository';
import { Acta } from '../entities/Acta';

/**
 * RF-13/RF-14/RNF-05: intenta enviar cada acta guardada localmente que no
 * esté ya confirmada por el servidor. Se dispara cuando `useNetworkStatus()`
 * pasa a online (ver `useActas.ts`), nunca por polling activo.
 *
 * `enviar()` es el único punto de contacto con la red aquí: si falla (sigue
 * sin señal, o el servidor rechaza), el acta se queda tal como estaba para
 * reintentarse en la próxima sincronización — nunca se pierde.
 */
export class SincronizarActasPendientesUseCase {
  constructor(private readonly repository: ActasRepository) {}

  async ejecutar(): Promise<Result<Acta[]>> {
    const pendientes = await this.repository.listarPendientesDeEnvio();
    if (!pendientes.ok) return pendientes;

    const resultados: Acta[] = [];
    for (const acta of pendientes.value) {
      if (acta.estado === 'guardado') continue;

      const envio = await this.repository.enviar(acta);
      if (envio.ok) {
        const actualizada: Acta = { ...envio.value, estado: 'guardado' };
        await this.repository.guardarLocal(actualizada);
        resultados.push(actualizada);
      } else {
        const fallida: Acta = { ...acta, estado: 'fallido' };
        await this.repository.guardarLocal(fallida);
        resultados.push(fallida);
      }
    }

    return ok(resultados);
  }
}
