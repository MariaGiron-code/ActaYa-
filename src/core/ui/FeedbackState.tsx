import React from 'react';
import { StyleSheet, Text } from 'react-native';
import LottieView, { AnimationObject } from 'lottie-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, typography } from '@core/theme';

type FeedbackStateProps = {
  /** Animación Lottie: normalmente `animaciones.cargando | exito | error`. */
  source: AnimationObject | string | { uri: string };
  /** Opcional cuando la pantalla ya pone su propio título debajo. */
  message?: string;
  loop?: boolean;
  size?: number;
};

/**
 * Reemplazo de los modales genéricos de React Native (Alert.alert) que pide
 * evitar la rúbrica. Se usa para éxito, error, carga y vacío en toda la app.
 */
export function FeedbackState({ source, message, loop = false, size = 160 }: FeedbackStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      style={styles.container}
      accessibilityRole={message ? 'text' : undefined}
      accessibilityLabel={message}
    >
      <LottieView source={source} autoPlay loop={loop} style={{ width: size, height: size }} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  message: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
