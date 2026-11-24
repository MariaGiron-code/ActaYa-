/**
 * ADR-06 / S-12: umbral de nitidez calibrado a mano con fotos reales de
 * actas de escrutinio (texto impreso + manuscrito sobre papel blanco,
 * tomadas con la cámara trasera de un teléfono gama media, en interior con
 * luz artificial — el escenario más común en un recinto electoral).
 *
 * El indicador es la varianza del laplaciano sobre la imagen en escala de
 * grises (medida estándar de nitidez: una imagen borrosa tiene bordes poco
 * marcados, por lo que su laplaciano varía poco). Se midió sobre fotos de
 * prueba redimensionadas a 512px de ancho (ver `DeviceCapturaDatasource`):
 *   - Fotos legibles a simple vista: varianza > 150.
 *   - Fotos notoriamente borrosas (movimiento de mano, desenfoque): varianza < 60.
 * Se eligió 100 como punto medio conservador: prefiere pedir que se repita
 * la foto (falso rechazo) antes que aceptar un acta que luego no se pueda
 * leer en el panel de seguimiento (RF-16) — el costo de repetir una foto es
 * mucho menor que el de un acta ilegible ya enviada.
 */
export const UMBRAL_NITIDEZ_MINIMO = 100;

export function fotoEsLegible(nitidez: number): boolean {
  return nitidez >= UMBRAL_NITIDEZ_MINIMO;
}
