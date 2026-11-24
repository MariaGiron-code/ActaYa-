import type { AnimationObject } from 'lottie-react-native';

/**
 * Animaciones Lottie de marca (acta + check + colores oficiales). Se usan
 * vía `FeedbackState`; si las reemplazas por otras, mantén estos nombres.
 */
export const animaciones = {
  cargando: require('../../../assets/lottie/cargando.json') as AnimationObject,
  exito: require('../../../assets/lottie/exito.json') as AnimationObject,
  error: require('../../../assets/lottie/error.json') as AnimationObject,
};
