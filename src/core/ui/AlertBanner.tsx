import React, { PropsWithChildren, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@core/theme';
import { AlertIcon } from './icon';
import { haptics } from './haptics';

export type NivelAlerta = 'advertencia' | 'critica';

type AlertBannerProps = PropsWithChildren<{
  nivel: NivelAlerta;
  titulo?: string;
  mensaje?: string;
  /** Latido continuo del ícono y el borde, para urgencias que no pueden pasar desapercibidas. */
  pulso?: boolean;
  /** Vibrar al aparecer. Apágalo si la pantalla ya vibró por la misma acción. */
  vibrar?: boolean;
}>;

const ESTILO: Record<NivelAlerta, { color: string; fondo: string }> = {
  advertencia: { color: colors.warning, fondo: colors.warning + '26' },
  critica: { color: colors.error, fondo: colors.error + '1A' },
};

/**
 * Aviso destacado dentro de la pantalla (no modal). Entra deslizando, vibra
 * al aparecer o al subir de nivel, y opcionalmente late mientras siga visible.
 */
export function AlertBanner({ nivel, titulo, mensaje, pulso = false, vibrar = true, children }: AlertBannerProps) {
  const { color, fondo } = ESTILO[nivel];
  const latido = useSharedValue(0);

  useEffect(() => {
    if (!vibrar) return;
    if (nivel === 'critica') haptics.error();
    else haptics.advertencia();
  }, [nivel, vibrar]);

  useEffect(() => {
    if (!pulso) {
      cancelAnimation(latido);
      latido.set(0);
      return;
    }
    latido.set(withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0, { duration: 700 })), -1));
  }, [pulso, latido]);

  const estiloIcono = useAnimatedStyle(() => ({ transform: [{ scale: 1 + latido.value * 0.15 }] }));
  const estiloBorde = useAnimatedStyle(() => ({ opacity: latido.value }));

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      style={[styles.banner, { backgroundColor: fondo, borderColor: color }]}
      accessibilityRole="alert"
    >
      {pulso ? (
        <Animated.View pointerEvents="none" style={[styles.bordePulso, { borderColor: color }, estiloBorde]} />
      ) : null}
      <Animated.View style={estiloIcono}>
        <AlertIcon color={color} />
      </Animated.View>
      <View style={styles.contenido}>
        {titulo ? <Text style={[styles.titulo, { color: nivel === 'critica' ? color : colors.textPrimary }]}>{titulo}</Text> : null}
        {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
  },
  bordePulso: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: radius.md,
    borderWidth: 2.5,
  },
  contenido: { flex: 1, gap: spacing.xs },
  titulo: { ...typography.bodyBold },
  mensaje: { ...typography.body, color: colors.textPrimary },
});
