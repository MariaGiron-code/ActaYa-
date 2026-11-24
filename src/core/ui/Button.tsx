import React from 'react';
import { ActivityIndicator, GestureResponderEvent, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius, spacing, typography, minTouchTarget } from '@core/theme';
import { haptics } from './haptics';

type Variant = 'primary' | 'secondary' | 'outline';

type ButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
};

const RESORTE = { damping: 15, stiffness: 400, mass: 0.6 };

/**
 * Botón único de la app. RNF-03 pide mensajes claros y una interfaz sencilla
 * para personas con poca experiencia en tecnología: un solo componente,
 * consistente en toda la app, con área táctil generosa. Al presionar se
 * hunde levemente y vibra, para que se sienta que el toque se registró.
 */
export function Button({ label, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const isDisabled = disabled || loading;
  const escala = useSharedValue(1);

  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={(event) => {
        haptics.tap();
        onPress(event);
      }}
      onPressIn={() => escala.set(withSpring(0.97, RESORTE))}
      onPressOut={() => escala.set(withSpring(1, RESORTE))}
      disabled={isDisabled}
    >
      <Animated.View style={[styles.base, variantStyles[variant], isDisabled && styles.disabled, estiloAnimado]}>
        {loading ? (
          <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.textOnPrimary} />
        ) : (
          <Text style={[styles.label, variant === 'outline' && { color: colors.primary }]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: { ...typography.button, color: colors.textOnPrimary },
  disabled: { opacity: 0.5 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary },
});
