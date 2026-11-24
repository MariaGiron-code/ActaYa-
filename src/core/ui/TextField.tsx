import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography, minTouchTarget } from '@core/theme';
import { EyeIcon } from './icon';
import { haptics } from './haptics';

type TextFieldProps = TextInputProps & {
  label: string;
  errorMessage?: string;
};

const DURACION_FOCO = 180;

/**
 * Campo de formulario con mensaje de error inline (nunca un Alert genérico,
 * por la rúbrica de retroalimentación visual). Pensado para usarse con
 * `Controller` de React Hook Form (ADR-09).
 *
 * El borde y la etiqueta pasan al azul de marca mientras el campo está
 * activo, para que en formularios largos siempre se sepa dónde se escribe.
 *
 * Si el campo es `secureTextEntry` (claves, contraseñas), se agrega el
 * ícono de ojo para mostrar/ocultar el contenido — en toda la app, sin que
 * cada pantalla tenga que implementarlo por su cuenta.
 */
export function TextField({
  label,
  errorMessage,
  style,
  secureTextEntry,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const [claveVisible, setClaveVisible] = useState(false);
  const esCampoDeClave = !!secureTextEntry;
  const tieneError = !!errorMessage;
  const foco = useSharedValue(0);

  const estiloBorde = useAnimatedStyle(() => ({
    borderColor: tieneError
      ? colors.error
      : interpolateColor(foco.value, [0, 1], [colors.border, colors.primary]),
  }));

  const estiloEtiqueta = useAnimatedStyle(() => ({
    color: tieneError
      ? colors.error
      : interpolateColor(foco.value, [0, 1], [colors.textPrimary, colors.primary]),
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.Text style={[styles.label, estiloEtiqueta]}>{label}</Animated.Text>
      <Animated.View style={[styles.contenedorInput, estiloBorde]}>
        <TextInput
          style={[styles.input, esCampoDeClave && styles.inputConIcono, style]}
          placeholderTextColor={colors.textSecondary}
          accessibilityLabel={label}
          secureTextEntry={esCampoDeClave && !claveVisible}
          onFocus={(event) => {
            foco.set(withTiming(1, { duration: DURACION_FOCO }));
            onFocus?.(event);
          }}
          onBlur={(event) => {
            foco.set(withTiming(0, { duration: DURACION_FOCO }));
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {esCampoDeClave ? (
          <Pressable
            onPress={() => {
              haptics.tap();
              setClaveVisible((valor) => !valor);
            }}
            style={styles.botonOjo}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={claveVisible ? 'Ocultar clave' : 'Mostrar clave'}
          >
            <EyeIcon open={claveVisible} color={claveVisible ? colors.primary : colors.textSecondary} />
          </Pressable>
        ) : null}
      </Animated.View>
      {errorMessage ? (
        <Animated.Text entering={FadeInDown.duration(180)} exiting={FadeOut.duration(120)} style={styles.error}>
          {errorMessage}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.bodyBold, marginBottom: spacing.xs },
  contenedorInput: {
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  input: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputConIcono: { paddingRight: spacing.xxl },
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
