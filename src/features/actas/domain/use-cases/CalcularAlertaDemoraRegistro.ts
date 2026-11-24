/**
 * S-06: hora oficial de cierre de votación en Ecuador (CNE). Es un dato de
 * la elección, no de la app — igual que el umbral de nitidez
 * (`EvaluarNitidezFoto.ts`), **verifícalo contra el cronograma oficial antes
 * de la defensa**; 17:00 es el cierre estándar publicado por el CNE.
 */
export const HORA_CIERRE_VOTACION = { horas: 17, minutos: 0 };

/**
 * Umbrales en minutos desde el cierre, solo si todavía faltan actas por
 * registrar. Punto de partida razonable, no una medición real — igual que
 * el umbral de nitidez, puedes ajustarlos si el equipo decide otros tiempos.
 */
export const UMBRAL_ADVERTENCIA_MINUTOS = 30;
export const UMBRAL_CRITICO_MINUTOS = 90;

export type NivelAlertaDemora = 'ninguna' | 'advertencia' | 'critica';

export type AlertaDemora = {
  nivel: NivelAlertaDemora;
  minutosDesdeCierre: number;
  actasFaltantes: number;
};

/**
 * RF-09 (dos actas por mesa asignada, alcaldía y prefectura): comparado
 * contra lo que el veedor ya tiene guardado LOCALMENTE (RNF-05 — no depende
 * de que haya señal ni de que el servidor ya confirmó el envío), para saber
 * si de verdad le falta algo por registrar.
 *
 * Función pura (sin red, sin reloj propio): recibe `ahora` para que sea
 * trivial probarla con casos de ejemplo en la sustentación.
 */
export function calcularAlertaDemora(params: {
  actasEsperadas: number;
  actasRegistradas: number;
  ahora: Date;
}): AlertaDemora {
  const actasFaltantes = Math.max(0, params.actasEsperadas - params.actasRegistradas);

  if (actasFaltantes === 0) {
    return { nivel: 'ninguna', minutosDesdeCierre: 0, actasFaltantes: 0 };
  }

  const cierre = new Date(params.ahora);
  cierre.setHours(HORA_CIERRE_VOTACION.horas, HORA_CIERRE_VOTACION.minutos, 0, 0);

  const minutosDesdeCierre = Math.floor((params.ahora.getTime() - cierre.getTime()) / 60_000);

  if (minutosDesdeCierre < UMBRAL_ADVERTENCIA_MINUTOS) {
    return { nivel: 'ninguna', minutosDesdeCierre: Math.max(0, minutosDesdeCierre), actasFaltantes };
  }

  if (minutosDesdeCierre < UMBRAL_CRITICO_MINUTOS) {
    return { nivel: 'advertencia', minutosDesdeCierre, actasFaltantes };
  }

  return { nivel: 'critica', minutosDesdeCierre, actasFaltantes };
}
