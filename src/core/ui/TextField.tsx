import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography, minTouchTarget } from '@core/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

/**
 * Campo de formulario con mensaje de error inline (nunca un Alert genérico,
 * por la rúbrica de retroalimentación visual). Pensado para usarse con
 * `Controller` de React Hook Form (ADR-09).
 */
export function TextField({ label, errorMessage, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errorMessage && styles.inputError, style]}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label}
        {...inputProps}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  input: {
    minHeight: minTouchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.error },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
});
