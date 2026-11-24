import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@core/theme';

type EyeIconProps = {
  /** true = la clave está visible en el campo (se ve el ojo abierto). */
  open: boolean;
  size?: number;
  color?: string;
};

/** Ícono de ojo abierto/tachado para mostrar u ocultar campos de clave. */
export function EyeIcon({ open, size = 20, color = colors.textSecondary }: EyeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12C1 12 5 5 12 5C19 5 23 12 23 12C23 12 19 19 12 19C5 19 1 12 1 12Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={1.8} />
      {!open ? <Path d="M3 3L21 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" /> : null}
    </Svg>
  );
}
