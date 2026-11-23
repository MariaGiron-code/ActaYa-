/**
 * Paleta oficial de la organización política (ActaYa).
 * Extraída del archivo AdobeColor provisto por la usuaria — no inventar valores nuevos aquí.
 */
export const palette = {
  rojo: '#D90B1C',
  azul: '#024873',
  amarillo: '#F2CB05',
  crema: '#F2DF7E',
  gris: '#E3E3E3',
  blanco: '#FFFFFF',
  negro: '#1A1A1A',
} as const;

export const colors = {
  primary: palette.azul,
  primaryDark: '#01304D',
  secondary: palette.rojo,
  accent: palette.amarillo,
  accentSoft: palette.crema,
  background: palette.blanco,
  surface: palette.gris,
  textPrimary: palette.negro,
  textSecondary: '#5B5B5B',
  textOnPrimary: palette.blanco,

  success: '#1E8E3E',
  warning: palette.amarillo,
  error: palette.rojo,
  info: palette.azul,

  border: '#C9C9C9',
  disabled: '#A6A6A6',

  // Estados de envío de actas (RF-13): el usuario debe saber siempre si algo
  // está en proceso, guardado o falló.
  estadoEnProceso: palette.amarillo,
  estadoGuardado: '#1E8E3E',
  estadoFallido: palette.rojo,
} as const;

export type AppColors = typeof colors;
