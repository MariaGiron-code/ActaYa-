import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertBanner, animaciones, EncabezadoIlustrado } from '@core/ui';
import { colors, radius, spacing, typography } from '@core/theme';

type ClaveTemporalEntregadaProps = PropsWithChildren<{
  titulo: string;
  descripcion: string;
  claveTemporal: string;
  /** Más pequeño cuando va dentro de una tarjeta (p. ej. Mis veedores). */
  compacto?: boolean;
}>;

/**
 * Éxito al crear una cuenta (S-11): check animado, la clave temporal en un
 * recuadro grande y fácil de dictar, y el aviso de que no se vuelve a mostrar.
 * Los botones de siguiente paso van como `children`.
 */
export function ClaveTemporalEntregada({
  titulo,
  descripcion,
  claveTemporal,
  compacto = false,
  children,
}: ClaveTemporalEntregadaProps) {
  return (
    <View>
      <EncabezadoIlustrado
        animacion={animaciones.exito}
        titulo={titulo}
        descripcion={descripcion}
        tamano={compacto ? 88 : 120}
      />
      <View
        style={styles.ticket}
        accessible
        accessibilityLabel={`Clave temporal: ${claveTemporal.split('').join(' ')}`}
      >
        <Text style={styles.etiqueta}>Clave temporal</Text>
        <Text style={[styles.clave, compacto && styles.claveCompacta]} selectable>
          {claveTemporal}
        </Text>
      </View>
      <AlertBanner
        nivel="advertencia"
        vibrar={false}
        mensaje="Solo se mostrará esta vez. Entrégala en persona; al ingresar deberá crear su propia clave."
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primary + '08',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  etiqueta: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  clave: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: 6,
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  claveCompacta: { fontSize: 24, lineHeight: 30, letterSpacing: 4 },
});
