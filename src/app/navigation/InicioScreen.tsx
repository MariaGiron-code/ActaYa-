import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActinMascot, Button, Screen } from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { RolUsuario } from '@features/auth/domain/entities/Usuario';
import { useSessionStore } from '@features/auth/presentation/store/useSessionStore';
import { useCerrarSesion } from '@features/auth/presentation/hooks/useAuth';
import type { RootStackParamList } from './types';

const PENDIENTES_POR_ROL: Record<RolUsuario, string[]> = {
  [RolUsuario.COORDINADOR_PROVINCIAL]: [],
  [RolUsuario.COORDINADOR_RECINTO]: ['Corregir actas de su recinto (RF-12) — feature "actas"'],
  [RolUsuario.VEEDOR]: [],
};

/**
 * Pantalla temporal: el proyecto base solo trae completo el feature `auth`.
 * Reemplázala por la navegación real de cada rol a medida que completes
 * `territorio`, `personal`, `actas` y `seguimiento`.
 */
export function InicioScreen() {
  const usuario = useSessionStore((s) => s.usuario);
  const cerrarSesion = useCerrarSesion();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (!usuario) return null;

  return (
    <Screen scrollable>
      <View style={styles.mascota}>
        <ActinMascot size={120} />
      </View>
      <Text style={styles.saludo}>Hola, {usuario.nombres}</Text>
      <Text style={styles.rol}>{usuario.rol.replace('_', ' ')}</Text>

      {usuario.rol === RolUsuario.COORDINADOR_PROVINCIAL ? (
        <>
          <Button label="Ver seguimiento" onPress={() => navigation.navigate('Seguimiento')} />
          <Button label="Ver recintos" variant="outline" onPress={() => navigation.navigate('Recintos')} />
          <Button
            label="Crear coordinador de recinto"
            variant="outline"
            onPress={() =>
              navigation.navigate('CrearUsuario', {
                rolDeQuienCrea: RolUsuario.COORDINADOR_PROVINCIAL,
                rolACrear: RolUsuario.COORDINADOR_RECINTO,
              })
            }
          />
        </>
      ) : null}

      {usuario.rol === RolUsuario.COORDINADOR_RECINTO ? (
        <>
          <Button label="Mis veedores" onPress={() => navigation.navigate('Asignaciones')} />
          <Button
            label="Crear veedor"
            variant="outline"
            onPress={() =>
              navigation.navigate('CrearUsuario', {
                rolDeQuienCrea: RolUsuario.COORDINADOR_RECINTO,
                rolACrear: RolUsuario.VEEDOR,
              })
            }
          />
        </>
      ) : null}

      {usuario.rol === RolUsuario.VEEDOR ? (
        <Button label="Registrar actas" onPress={() => navigation.navigate('RegistrarActa')} />
      ) : null}

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
  mascota: { alignItems: 'center', marginTop: spacing.sm },
  saludo: { ...typography.h1, marginTop: spacing.lg },
  rol: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  subtitulo: { ...typography.h3, marginBottom: spacing.sm },
  lista: { flex: 1, gap: spacing.xs },
  item: { ...typography.body, color: colors.textPrimary },
});
