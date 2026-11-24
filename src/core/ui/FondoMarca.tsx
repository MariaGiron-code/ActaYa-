import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@core/theme';

/**
 * Fondo decorativo de las pantallas sin header (Login, Inicio, claves): una
 * ola azul muy tenue arriba y dos círculos de acento. Estático a propósito —
 * el movimiento queda para Actín y la retroalimentación, no para el fondo.
 */
export function FondoMarca() {
  return (
    <View pointerEvents="none" style={styles.capa}>
      <Svg width="100%" height={260} viewBox="0 0 400 260" preserveAspectRatio="none">
        <Path d="M0 0H400V170C330 215 260 230 190 205C120 180 60 190 0 225Z" fill={colors.primary} opacity={0.07} />
        <Path d="M0 0H400V120C320 160 250 170 180 150C110 130 55 140 0 165Z" fill={colors.primary} opacity={0.06} />
      </Svg>
      <Svg width={120} height={120} style={styles.circuloAmarillo}>
        <Circle cx={60} cy={60} r={60} fill={colors.accent} opacity={0.12} />
      </Svg>
      <Svg width={70} height={70} style={styles.circuloRojo}>
        <Circle cx={35} cy={35} r={35} fill={colors.secondary} opacity={0.06} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  circuloAmarillo: { position: 'absolute', top: -30, right: -30 },
  circuloRojo: { position: 'absolute', top: 180, left: -25 },
});
