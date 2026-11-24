import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, typography } from '@core/theme';
import { ActinMascot } from './mascot';

type EmptyStateProps = {
  titulo: string;
  mensaje?: string;
};

/**
 * "Todavía no hay nada aquí" con Actín: una invitación en vez de un texto
 * gris suelto. Actín queda quieto y solo parpadea, para no distraer.
 */
export function EmptyState({ titulo, mensaje }: EmptyStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container} accessibilityRole="text">
      <ActinMascot size={96} swayBody={false} />
      <Text style={styles.titulo}>{titulo}</Text>
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, gap: spacing.xs },
  titulo: { ...typography.h3, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm },
  mensaje: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
