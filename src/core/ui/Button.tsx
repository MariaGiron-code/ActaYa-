import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { colors, radius, spacing, typography, minTouchTarget } from '@core/theme';

type Variant = 'primary' | 'secondary' | 'outline';

type ButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
};

/**
 * Botón único de la app. RNF-03 pide mensajes claros y una interfaz sencilla
 * para personas con poca experiencia en tecnología: un solo componente,
 * consistente en toda la app, con área táctil generosa.
 */
export function Button({ label, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.textOnPrimary} />
      ) : (
        <Text style={[styles.label, variant === 'outline' && { color: colors.primary }]}>
          {label}
        </Text>
      )}
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
  pressed: { opacity: 0.85 },
});

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.secondary },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary },
});
