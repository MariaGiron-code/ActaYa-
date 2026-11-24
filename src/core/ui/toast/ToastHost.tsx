import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOutUp, SlideInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '@core/theme';
import { CheckIcon, CloseIcon, InfoIcon } from '../icon';
import { TipoToast, useToastStore } from './toast';

const DURACION_VISIBLE_MS = 3200;

const ESTILO: Record<TipoToast, { fondo: string; Icono: typeof CheckIcon; etiqueta: string }> = {
  exito: { fondo: colors.success, Icono: CheckIcon, etiqueta: 'Listo' },
  error: { fondo: colors.error, Icono: CloseIcon, etiqueta: 'Error' },
  info: { fondo: colors.primary, Icono: InfoIcon, etiqueta: 'Aviso' },
};

/**
 * Se monta una sola vez sobre toda la app. Entra desde arriba con resorte,
 * se cierra solo a los ~3 s o al tocarlo.
 */
export function ToastHost() {
  const actual = useToastStore((s) => s.actual);
  const cerrar = useToastStore((s) => s.cerrar);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!actual) return;
    const temporizador = setTimeout(() => cerrar(actual.id), DURACION_VISIBLE_MS);
    return () => clearTimeout(temporizador);
  }, [actual, cerrar]);

  if (!actual) return null;

  const { fondo, Icono, etiqueta } = ESTILO[actual.tipo];

  return (
    <View pointerEvents="box-none" style={[styles.capa, { top: insets.top + spacing.sm }]}>
      <Animated.View
        key={actual.id}
        entering={SlideInUp.springify().damping(18)}
        exiting={FadeOutUp.duration(200)}
        style={styles.sombra}
      >
        <Pressable
          onPress={() => cerrar(actual.id)}
          style={styles.toast}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${etiqueta}: ${actual.mensaje}`}
        >
          <View style={[styles.icono, { backgroundColor: fondo }]}>
            <Icono size={16} />
          </View>
          <Text style={styles.mensaje}>{actual.mensaje}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 1000, elevation: 1000 },
  sombra: {
    borderRadius: radius.md,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icono: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mensaje: { ...typography.body, color: colors.textPrimary, flex: 1 },
});
