/**
 * ADR-06 / S-12: umbral de nitidez — varianza del laplaciano sobre la
 * imagen en escala de grises (medida estándar: una imagen borrosa tiene
 * bordes poco marcados, por lo que su laplaciano varía poco), medida sobre
 * la foto redimensionada a 512px de ancho (ver `DeviceCapturaDatasource`).
 *
 * Subido de 100 a 150 (cámaras más buenas producen una varianza más alta
 * incluso en fotos borrosas, así que el 100 original dejaba pasar fotos que
 * a simple vista no se podían leer) — **todavía pendiente de calibrar con
 * los números reales que arroja `nitidez` en pantalla (solo en development,
 * ver `CapturarFotoActaUseCase`) al probar fotos nítidas y borrosas de tu
 * propio teléfono**; ajusta este valor según lo que de verdad midas.
 */
export const UMBRAL_NITIDEZ_MINIMO = 150;

export function fotoEsLegible(nitidez: number): boolean {
  return nitidez >= UMBRAL_NITIDEZ_MINIMO;
}
