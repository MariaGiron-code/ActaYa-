import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView, { AnimationObject } from 'lottie-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, typography } from '@core/theme';

type EncabezadoIlustradoProps = {
  animacion: AnimationObject;
  titulo: string;
  descripcion?: string;
  /** Lado de la ilustración en dp. */
  tamano?: number;
};

/**
 * Cabecera de pantallas de un solo propósito (clave, crear persona, éxito):
 * ilustración Lottie que se reproduce una vez al entrar, título y una frase
 * que explica qué va a pasar.
 */
export function EncabezadoIlustrado({ animacion, titulo, descripcion, tamano = 120 }: EncabezadoIlustradoProps) {
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.contenedor}>
      <View accessible={false} importantForAccessibility="no-hide-descendants">
        <LottieView source={animacion} autoPlay loop={false} style={{ width: tamano, height: tamano }} />
      </View>
      <Text style={styles.titulo} accessibilityRole="header">
        {titulo}
      </Text>
      {descripcion ? <Text style={styles.descripcion}>{descripcion}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  titulo: { ...typography.h2, color: colors.primary, textAlign: 'center', marginTop: spacing.xs },
  descripcion: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
