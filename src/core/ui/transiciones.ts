import { Easing, FadeIn, FadeInDown, LinearTransition, SlideInLeft, SlideInRight } from 'react-native-reanimated';

/**
 * Lenguaje de movimiento único de la app: mismas curvas y duraciones en
 * todas las pantallas, para que las transiciones se sientan de una sola app.
 */
const CURVA = Easing.out(Easing.cubic);

export type DireccionTransicion = 'adelante' | 'atras' | 'aparecer';

/** Cambio de vista dentro de una misma pantalla (lista -> formulario y de vuelta). */
export function entradaDeVista(direccion: DireccionTransicion) {
  if (direccion === 'adelante') return SlideInRight.duration(280).easing(CURVA);
  if (direccion === 'atras') return SlideInLeft.duration(280).easing(CURVA);
  return FadeIn.duration(220);
}

/** Elementos de lista que entran escalonados (tope de 8 para no esperar en listas largas). */
export function entradaEnLista(indice: number) {
  return FadeInDown.delay(Math.min(indice, 8) * 50)
    .duration(320)
    .easing(CURVA);
}

/** Bloques que aparecen o desaparecen dentro de una tarjeta o formulario. */
export const entradaDeBloque = FadeInDown.duration(220).easing(CURVA);

/** Cambio de alto/posición suave cuando el contenido de alrededor cambia. */
export const transicionDeLayout = LinearTransition.duration(240).easing(CURVA);
