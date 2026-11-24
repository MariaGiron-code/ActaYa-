import React, { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, radius, spacing } from '@core/theme';
import { haptics } from './haptics';
import { transicionDeLayout } from './transiciones';

type CardProps = PropsWithChildren<{
  /** Si se pasa, toda la tarjeta es tocable: se hunde y vibra al presionarla. */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Estilo del área de contenido (a la derecha del ícono). */
  style?: StyleProp<ViewStyle>;
  /** Animación de entrada (p. ej. `entradaEnLista(index)`). */
  entering?: React.ComponentProps<typeof Animated.View>['entering'];
  /** Ícono a la izquierda, dentro de un círculo con el tinte de marca. */
  icono?: ReactNode;
  /** Acción principal de la pantalla: fondo azul de marca. */
  destacada?: boolean;
  /** Menos relleno, para opciones dentro de otra tarjeta. */
  compacta?: boolean;
  /** Opción elegida dentro de una lista de selección. */
  seleccionada?: boolean;
}>;

const RESORTE = { damping: 15, stiffness: 400, mass: 0.6 };

/** Tarjeta base de listas. Su alto se anima solo cuando su contenido cambia. */
export function Card({
  onPress,
  accessibilityLabel,
  style,
  entering,
  icono,
  destacada = false,
  compacta = false,
  seleccionada = false,
  children,
}: CardProps) {
  const escala = useSharedValue(1);
  const estiloAnimado = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  const contenido = (
    <Animated.View
      entering={entering}
      layout={transicionDeLayout}
      style={[
        styles.card,
        compacta ? styles.compacta : styles.normal,
        destacada && styles.destacada,
        seleccionada && styles.seleccionada,
        estiloAnimado,
      ]}
    >
      {icono ? (
        <View style={[styles.icono, destacada && styles.iconoDestacado]}>{icono}</View>
      ) : null}
      <View style={[styles.contenido, style]}>{children}</View>
    </Animated.View>
  );

  if (!onPress) return contenido;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: seleccionada }}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      onPressIn={() => escala.set(withSpring(0.98, RESORTE))}
      onPressOut={() => escala.set(withSpring(1, RESORTE))}
    >
      {contenido}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border + '80',
    borderRadius: radius.md,
    backgroundColor: colors.background,
    // Sombra corta y difusa: separa la tarjeta del fondo sin "flotar" de más.
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  normal: { padding: spacing.md },
  compacta: { padding: spacing.sm, elevation: 0, shadowOpacity: 0 },
  destacada: { backgroundColor: colors.primary, borderColor: colors.primary },
  seleccionada: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '0D' },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '14',
  },
  iconoDestacado: { backgroundColor: colors.textOnPrimary + '26' },
  contenido: { flex: 1, gap: spacing.xs },
});
