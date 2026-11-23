import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@core/theme';

export type EstadoEnvio = 'en_proceso' | 'guardado' | 'fallido';

const CONFIG: Record<EstadoEnvio, { color: string; texto: string }> = {
  en_proceso: { color: colors.estadoEnProceso, texto: 'Enviando…' },
  guardado: { color: colors.estadoGuardado, texto: 'Guardado' },
  fallido: { color: colors.estadoFallido, texto: 'No se pudo enviar' },
};

/**
 * RF-13: el usuario debe saber EN TODO MOMENTO si su acta está en proceso,
 * guardada o falló — nunca una pantalla que simplemente "se queda quieta".
 */
export function StatusBadge({ estado }: { estado: EstadoEnvio }) {
  const { color, texto } = CONFIG[estado];

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 200 }),
  }));

  return (
    <Animated.View style={[styles.badge, { backgroundColor: color }, animatedStyle]}>
      <View style={styles.dot} />
      <Text style={styles.text}>{texto}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.background },
  text: { ...typography.caption, color: colors.background, fontWeight: '700' },
});
