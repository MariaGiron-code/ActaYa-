import React from 'react';
import { StyleSheet, Text } from 'react-native';
import LottieView, { AnimationObject } from 'lottie-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, typography } from '@core/theme';

type FeedbackStateProps = {
  /**
   * Animación Lottie (requerida). Ya hay 3 placeholders en `assets/lottie/`
   * (cargando/exito/error); cámbialas por animaciones de
   * https://lottiefiles.com cuando quieras, por ejemplo:
   *   source={require('../../../assets/lottie/exito.json')}
   */
  source: AnimationObject | string | { uri: string };
  message: string;
  loop?: boolean;
};

/**
 * Reemplazo de los modales genéricos de React Native (Alert.alert) que pide
 * evitar la rúbrica. Se usa para éxito, error, carga y vacío en toda la app.
 */
export function FeedbackState({ source, message, loop = false }: FeedbackStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.container}>
      <LottieView source={source} autoPlay loop={loop} style={styles.animation} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  animation: { width: 160, height: 160 },
  message: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
