import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography, minTouchTarget } from '@core/theme';
import { EyeIcon } from './icon';

type TextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

/**
 * Campo de formulario con mensaje de error inline (nunca un Alert genérico,
 * por la rúbrica de retroalimentación visual). Pensado para usarse con
 * `Controller` de React Hook Form (ADR-09).
 *
 * Si el campo es `secureTextEntry` (claves, contraseñas), se agrega el
 * ícono de ojo para mostrar/ocultar el contenido — en toda la app, sin que
 * cada pantalla tenga que implementarlo por su cuenta.
 */
export function TextField({ label, errorMessage, style, secureTextEntry, ...inputProps }: TextFieldProps) {
  const [claveVisible, setClaveVisible] = useState(false);
  const esCampoDeClave = !!secureTextEntry;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.contenedorInput}>
        <TextInput
          style={[styles.input, esCampoDeClave && styles.inputConIcono, errorMessage && styles.inputError, style]}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={label}
          secureTextEntry={esCampoDeClave && !claveVisible}
          {...inputProps}
        />
        {esCampoDeClave ? (
          <Pressable
            onPress={() => setClaveVisible((valor) => !valor)}
            style={styles.botonOjo}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={claveVisible ? 'Ocultar clave' : 'Mostrar clave'}
          >
            <EyeIcon open={claveVisible} />
          </Pressable>
        ) : null}
      </View>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: spacing.xs },
  contenedorInput: { justifyContent: 'center' },
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
  inputConIcono: { paddingRight: spacing.xxl },
  inputError: { borderColor: colors.error },
  botonOjo: {
    position: 'absolute',
    right: 0,
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
});
