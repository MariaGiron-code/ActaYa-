import React from 'react';
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { palette } from '@core/theme';

type AppIconProps = {
  /** Ancho/alto del ícono en dp (es cuadrado). */
  size?: number;
};

/**
 * Marca del acta verificada (mismo diseño que `assets/icon.png`), sin cara
 * ni extremidades: para usarla como logo pequeño y estático, junto al
 * nombre de la app, en vez de repetir a Actín a ese tamaño.
 */
export function AppIcon({ size = 32 }: AppIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 90 104">
      <Rect x={4} y={4} width={82} height={96} rx={12} fill={palette.blanco} stroke={palette.azul} strokeWidth={4} />
      <Polygon points="86,4 86,26 64,4" fill={palette.amarillo} />
      <Rect x={18} y={34} width={46} height={5} rx={2.5} fill={palette.gris} />
      <Rect x={18} y={46} width={34} height={5} rx={2.5} fill={palette.gris} />
      <Circle cx={64} cy={80} r={20} fill={palette.amarillo} stroke={palette.rojo} strokeWidth={4} />
      <Path
        d="M55 80 L61 86 L74 71"
        stroke={palette.azul}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
