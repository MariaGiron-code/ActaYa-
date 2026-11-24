import React, { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@core/theme';

type SeccionFormularioProps = PropsWithChildren<{
  titulo: string;
  icono: ReactNode;
}>;

/** Agrupa campos relacionados de un formulario largo bajo un título con ícono. */
export function SeccionFormulario({ titulo, icono, children }: SeccionFormularioProps) {
  return (
    <View style={styles.seccion}>
      <View style={styles.encabezado}>
        <View style={styles.icono}>{icono}</View>
        <Text style={styles.titulo} accessibilityRole="header">
          {titulo}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: {
    borderWidth: 1,
    borderColor: colors.border + '80',
    borderRadius: radius.md,
    padding: spacing.md,
    paddingBottom: 0,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  icono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '14',
  },
  titulo: { ...typography.bodyBold, color: colors.primary },
});
