import * as Crypto from 'expo-crypto';

/**
 * Identificador único generado en el dispositivo, ANTES de tener conexión.
 * Permite que el servidor rechace envíos duplicados (RF-13: evitar registros
 * duplicados cuando el usuario reintenta un envío que en realidad sí llegó).
 */
export function generarId(): string {
  return Crypto.randomUUID();
}
