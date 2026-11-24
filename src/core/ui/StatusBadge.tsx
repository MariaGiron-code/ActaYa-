import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@core/theme';
import { CheckIcon, CloseIcon } from './icon';

export type EstadoEnvio = 'en_proceso' | 'guardado' | 'fallido';

// Texto oscuro sobre el amarillo: blanco sobre amarillo no se lee.
const CONFIG: Record<EstadoEnvio, { color: string; colorTexto: string; texto: string }> = {
  en_proceso: { color: colors.estadoEnProceso, colorTexto: colors.textPrimary, texto: 'Enviando…' },
  guardado: { color: colors.estadoGuardado, colorTexto: colors.textOnPrimary, texto: 'Guardado' },
  fallido: { color: colors.estadoFallido, colorTexto: colors.textOnPrimary, texto: 'No se pudo enviar' },
};

/**
 * RF-13: el usuario debe saber EN TODO MOMENTO si su acta está en proceso,
 * guardada o falló — nunca una pantalla que simplemente "se queda quieta".
 * Mientras envía, el punto late; al cambiar de estado el color se funde, el
 * ancho se ajusta suave y aparece un check (o una X con sacudida si falló).
 */
export function StatusBadge({ estado }: { estado: EstadoEnvio }) {
  const { color, colorTexto, texto } = CONFIG[estado];
  const latido = useSharedValue(1);
  const sacudida = useSharedValue(0);

  useEffect(() => {
    if (estado === 'en_proceso') {
      latido.set(withRepeat(withSequence(withTiming(0.35, { duration: 600 }), withTiming(1, { duration: 600 })), -1));
    } else {
      cancelAnimation(latido);
      latido.set(1);
    }

    if (estado === 'fallido') {
      sacudida.set(
        withSequence(
          withTiming(-4, { duration: 50 }),
          withTiming(4, { duration: 50 }),
          withTiming(-3, { duration: 50 }),
          withSpring(0, { damping: 8, stiffness: 300 })
        )
      );
    }
  }, [estado, latido, sacudida]);

  const estiloFondo = useAnimatedStyle(() => ({
    backgroundColor: withTiming(color, { duration: 300 }),
    transform: [{ translateX: sacudida.value }],
  }));

  const estiloPunto = useAnimatedStyle(() => ({ opacity: latido.value }));

  return (
    <Animated.View
      layout={LinearTransition.duration(220)}
      style={[styles.badge, estiloFondo]}
      accessibilityRole="text"
      accessibilityLabel={`Estado: ${texto}`}
    >
      {estado === 'en_proceso' ? (
        <Animated.View key="punto" style={[styles.dot, { backgroundColor: colorTexto }, estiloPunto]} />
      ) : (
        <Animated.View key={estado} entering={ZoomIn.springify().damping(12)}>
          {estado === 'guardado' ? <CheckIcon size={12} color={colorTexto} /> : <CloseIcon size={12} color={colorTexto} />}
        </Animated.View>
      )}
      <Animated.Text key={texto} entering={FadeIn.duration(200)} style={[styles.text, { color: colorTexto }]}>
        {texto}
      </Animated.Text>
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
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { ...typography.caption, fontWeight: '700' },
});
