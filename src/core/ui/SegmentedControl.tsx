import React, { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, minTouchTarget, radius, spacing, typography } from '@core/theme';
import { haptics } from './haptics';

type Opcion<T extends string> = { valor: T; etiqueta: string };

type SegmentedControlProps<T extends string> = {
  opciones: Opcion<T>[];
  valor: T;
  onChange: (valor: T) => void;
};

const RESORTE = { damping: 18, stiffness: 220 };

/** Selector de pestañas con una píldora azul que se desliza a la opción elegida. */
export function SegmentedControl<T extends string>({ opciones, valor, onChange }: SegmentedControlProps<T>) {
  const [anchoTotal, setAnchoTotal] = useState(0);
  const indice = Math.max(
    0,
    opciones.findIndex((o) => o.valor === valor)
  );
  const anchoOpcion = opciones.length > 0 ? (anchoTotal - PADDING * 2) / opciones.length : 0;
  const desplazamiento = useSharedValue(0);

  useEffect(() => {
    desplazamiento.set(withSpring(indice * anchoOpcion, RESORTE));
  }, [indice, anchoOpcion, desplazamiento]);

  const estiloPildora = useAnimatedStyle(() => ({
    width: anchoOpcion,
    transform: [{ translateX: desplazamiento.value }],
  }));

  return (
    <View
      style={styles.contenedor}
      onLayout={(e: LayoutChangeEvent) => setAnchoTotal(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {anchoTotal > 0 ? <Animated.View style={[styles.pildora, estiloPildora]} /> : null}
      {opciones.map((opcion) => {
        const activa = opcion.valor === valor;
        return (
          <Pressable
            key={opcion.valor}
            style={styles.opcion}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            onPress={() => {
              if (activa) return;
              haptics.tap();
              onChange(opcion.valor);
            }}
          >
            <Text style={[styles.texto, activa && styles.textoActivo]}>{opcion.etiqueta}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const PADDING = 4;

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    padding: PADDING,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '12',
    marginBottom: spacing.md,
  },
  pildora: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: radius.md - 2,
    backgroundColor: colors.primary,
  },
  opcion: { flex: 1, minHeight: minTouchTarget - PADDING * 2, alignItems: 'center', justifyContent: 'center' },
  texto: { ...typography.button, color: colors.primary },
  textoActivo: { color: colors.textOnPrimary },
});
