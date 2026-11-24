import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@core/theme';

export type ActionIconProps = { size?: number; color?: string };

// Íconos de línea (trazo 2, puntas redondeadas) para acciones y tarjetas:
// mismo grosor y estilo que EyeIcon/StatusIcons.
const trazo = (color: string) =>
  ({ stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' }) as const;

export function ActaIcon({ size = 22, color = colors.primary }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 3H14L19 8V20A1 1 0 0 1 18 21H6A1 1 0 0 1 5 20V4A1 1 0 0 1 6 3Z" {...trazo(color)} />
      <Path d="M14 3V8H19M8.5 13H15.5M8.5 17H13" {...trazo(color)} />
    </Svg>
  );
}

export function EditarIcon({ size = 22, color = colors.primary }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 20H8L18.5 9.5A2.1 2.1 0 0 0 15.5 6.5L5 17V20" {...trazo(color)} />
      <Path d="M13.5 8.5L16.5 11.5" {...trazo(color)} />
    </Svg>
  );
}

export function GraficoIcon({ size = 22, color = colors.primary }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 20H20" {...trazo(color)} />
      <Rect x={6} y={12} width={3} height={6} rx={1} {...trazo(color)} />
      <Rect x={11} y={7} width={3} height={11} rx={1} {...trazo(color)} />
      <Rect x={16} y={10} width={3} height={8} rx={1} {...trazo(color)} />
    </Svg>
  );
}

export function RecintoIcon({ size = 22, color = colors.primary }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 10L12 4L21 10" {...trazo(color)} />
      <Path d="M5 10V19H19V10M3 19H21M10 19V14H14V19" {...trazo(color)} />
    </Svg>
  );
}

export function PersonasIcon({ size = 22, color = colors.primary }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={9} cy={8} r={3.5} {...trazo(color)} />
      <Path d="M3 20C3 16.7 5.7 14 9 14C12.3 14 15 16.7 15 20" {...trazo(color)} />
      <Path d="M16 4.5A3.5 3.5 0 0 1 16 11.5M18 14.5C19.8 15.4 21 17.5 21 20" {...trazo(color)} />
    </Svg>
  );
}

export function AgregarPersonaIcon({ size = 22, color = colors.primary }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={10} cy={8} r={3.5} {...trazo(color)} />
      <Path d="M4 20C4 16.7 6.7 14 10 14C11.6 14 13 14.6 14.1 15.6M18 14V20M15 17H21" {...trazo(color)} />
    </Svg>
  );
}

export function UrnaIcon({ size = 22, color = colors.primary }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 12H20V20A1 1 0 0 1 19 21H5A1 1 0 0 1 4 20V12Z" {...trazo(color)} />
      <Path d="M9 12V4H15V12M8 16H16" {...trazo(color)} />
    </Svg>
  );
}

export function SalirIcon({ size = 20, color = colors.textSecondary }: ActionIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M14 4H18A2 2 0 0 1 20 6V18A2 2 0 0 1 18 20H14M10 16L14 12L10 8M14 12H4" {...trazo(color)} />
    </Svg>
  );
}
