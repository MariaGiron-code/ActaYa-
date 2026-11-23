import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Screen } from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { RolUsuario } from '@features/auth/domain/entities/Usuario';
import { useSessionStore } from '@features/auth/presentation/store/useSessionStore';
import { useCerrarSesion } from '@features/auth/presentation/hooks/useAuth';

const PENDIENTES_POR_ROL: Record<RolUsuario, string[]> = {
  [RolUsuario.COORDINADOR_PROVINCIAL]: [
    'Gestión de recintos (RF-06) — feature "territorio"',
    'Panel de seguimiento en tiempo real (RF-16) — feature "seguimiento"',
  ],
  [RolUsuario.COORDINADOR_RECINTO]: [
    'Asignar/reemplazar veedores (RF-07, RF-08) — feature "personal"',
    'Corregir actas de su recinto (RF-12) — feature "actas"',
  ],
  [RolUsuario.VEEDOR]: ['Registrar actas de sus mesas (RF-09 a RF-14) — feature "actas"'],
};

/**
 * Pantalla temporal: el proyecto base solo trae completo el feature `auth`.
 * Reemplázala por la navegación real de cada rol a medida que completes
 * `territorio`, `personal`, `actas` y `seguimiento`.
 */
export function InicioScreen() {
  const usuario = useSessionStore((s) => s.usuario);
  const cerrarSesion = useCerrarSesion();

  if (!usuario) return null;

  return (
    <Screen>
      <Text style={styles.saludo}>Hola, {usuario.nombres}</Text>
      <Text style={styles.rol}>{usuario.rol.replace('_', ' ')}</Text>

      <View style={styles.lista}>
        <Text style={styles.subtitulo}>Por construir para tu rol:</Text>
        {PENDIENTES_POR_ROL[usuario.rol].map((item) => (
          <Text key={item} style={styles.item}>
            •{'  '}{item}
          </Text>
        ))}
      </View>

      <Button label="Cerrar sesión" variant="outline" onPress={() => cerrarSesion.mutate()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  saludo: { ...typography.h1, marginTop: spacing.lg },
  rol: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  subtitulo: { ...typography.h3, marginBottom: spacing.sm },
  lista: { flex: 1, gap: spacing.xs },
  item: { ...typography.body, color: colors.textPrimary },
});
