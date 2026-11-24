import type { AnimationObject } from 'lottie-react-native';

/**
 * Animaciones Lottie de marca (acta + check + colores oficiales). Se usan
 * vía `FeedbackState`; si las reemplazas por otras, mantén estos nombres.
 */
export const animaciones = {
  cargando: require('../../../assets/lottie/cargando.json') as AnimationObject,
  exito: require('../../../assets/lottie/exito.json') as AnimationObject,
  error: require('../../../assets/lottie/error.json') as AnimationObject,
  /** Recuperar acceso: la llave entra y abre el candado. */
  llave: require('../../../assets/lottie/llave.json') as AnimationObject,
  /** Crear clave: el candado se cierra y aparece el check. */
  candado: require('../../../assets/lottie/candado.json') as AnimationObject,
  /** Registrar persona: avatar con "+". */
  persona: require('../../../assets/lottie/persona.json') as AnimationObject,
  /** Enlace enviado: sobre con check. */
  correo: require('../../../assets/lottie/correo.json') as AnimationObject,
};
