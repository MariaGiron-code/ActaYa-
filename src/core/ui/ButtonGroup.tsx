import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@core/theme';

/** Separación entre botones apilados: suficiente para no tocar el equivocado. */
export const ESPACIO_ENTRE_BOTONES = spacing.sm + spacing.xs;

/** Apila botones (acción principal arriba, secundaria abajo) con separación uniforme. */
export function ButtonGroup({ children }: PropsWithChildren) {
  return <View style={styles.grupo}>{children}</View>;
}

const styles = StyleSheet.create({
  grupo: { gap: ESPACIO_ENTRE_BOTONES, marginTop: spacing.sm },
});
