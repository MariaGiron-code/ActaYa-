import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Sentry } from '@core/monitoring/sentry';
import { animaciones, Button, ButtonGroup, FeedbackState, Screen } from '@core/ui';
import { colors, spacing, typography } from '@core/theme';

/**
 * RNF-01: si una pantalla falla al dibujarse, la app no queda en blanco ni
 * se cierra: Sentry reporta el error (RF-17, con pantalla, celular, versión
 * de Android y usuario) y la persona ve qué pasó y cómo seguir. Las actas
 * guardadas en el teléfono no se tocan (RNF-05).
 */
export function LimiteDeErrores({ children }: PropsWithChildren) {
  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => scope.setTag('tipo', 'cierre_de_pantalla')}
      fallback={({ resetError }) => <PantallaDeError onReintentar={resetError} />}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}

function PantallaDeError({ onReintentar }: { onReintentar: () => void }) {
  return (
    <Screen fondoMarca style={styles.contenido}>
      <FeedbackState source={animaciones.error} size={140} />
      <Text style={styles.titulo} accessibilityRole="header">
        Algo salió mal en esta pantalla
      </Text>
      <Text style={styles.mensaje}>
        Ya avisamos al equipo de forma automática, no necesitas reportarlo. Tus actas guardadas siguen en el
        teléfono.
      </Text>
      <ButtonGroup>
        <Button label="Volver a intentar" onPress={onReintentar} />
      </ButtonGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contenido: { justifyContent: 'center' },
  titulo: { ...typography.h2, color: colors.primary, textAlign: 'center' },
  mensaje: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
