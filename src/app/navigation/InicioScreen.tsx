import React, { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActaIcon,
  ActinMascot,
  AgregarPersonaIcon,
  Card,
  ChevronRightIcon,
  EditarIcon,
  entradaEnLista,
  GraficoIcon,
  haptics,
  PersonasIcon,
  RecintoIcon,
  SalirIcon,
  Screen,
  toast,
} from '@core/ui';
import { colors, spacing, typography } from '@core/theme';
import { RolUsuario } from '@features/auth/domain/entities/Usuario';
import { useSessionStore } from '@features/auth/presentation/store/useSessionStore';
import { useCerrarSesion } from '@features/auth/presentation/hooks/useAuth';
import { usePrecargarDatosVeedor } from '@features/actas/presentation/hooks/useActas';
import type { RootStackParamList } from './types';

type Navegacion = NativeStackNavigationProp<RootStackParamList>;

type Accion = {
  titulo: string;
  descripcion: string;
  icono: (color: string) => ReactNode;
  ir: (navigation: Navegacion) => void;
};

const NOMBRE_ROL: Record<RolUsuario, string> = {
  [RolUsuario.COORDINADOR_PROVINCIAL]: 'Coordinador provincial',
  [RolUsuario.COORDINADOR_RECINTO]: 'Coordinador de recinto',
  [RolUsuario.VEEDOR]: 'Veedor',
};

/** La primera acción de cada rol es la principal y se muestra destacada. */
const ACCIONES_POR_ROL: Record<RolUsuario, Accion[]> = {
  [RolUsuario.COORDINADOR_PROVINCIAL]: [
    {
      titulo: 'Seguimiento en vivo',
      descripcion: 'Mesas reportadas y votos por candidato',
      icono: (c) => <GraficoIcon color={c} />,
      ir: (n) => n.navigate('Seguimiento'),
    },
    {
      titulo: 'Recintos',
      descripcion: 'Consulta y agrega recintos electorales',
      icono: (c) => <RecintoIcon color={c} />,
      ir: (n) => n.navigate('Recintos'),
    },
    {
      titulo: 'Crear coordinador de recinto',
      descripcion: 'Registra a quien coordinará un recinto',
      icono: (c) => <AgregarPersonaIcon color={c} />,
      ir: (n) =>
        n.navigate('CrearUsuario', {
          rolDeQuienCrea: RolUsuario.COORDINADOR_PROVINCIAL,
          rolACrear: RolUsuario.COORDINADOR_RECINTO,
        }),
    },
  ],
  [RolUsuario.COORDINADOR_RECINTO]: [
    {
      titulo: 'Mis veedores',
      descripcion: 'Asigna o reemplaza el veedor de cada mesa',
      icono: (c) => <PersonasIcon color={c} />,
      ir: (n) => n.navigate('Asignaciones'),
    },
    {
      titulo: 'Corregir actas',
      descripcion: 'Revisa y corrige las actas de tu recinto',
      icono: (c) => <EditarIcon color={c} />,
      ir: (n) => n.navigate('CorregirActas'),
    },
    {
      titulo: 'Crear veedor',
      descripcion: 'Registra a una persona nueva como veedor',
      icono: (c) => <AgregarPersonaIcon color={c} />,
      ir: (n) =>
        n.navigate('CrearUsuario', {
          rolDeQuienCrea: RolUsuario.COORDINADOR_RECINTO,
          rolACrear: RolUsuario.VEEDOR,
        }),
    },
  ],
  [RolUsuario.VEEDOR]: [
    {
      titulo: 'Registrar actas',
      descripcion: 'Votos, foto y ubicación de tus mesas',
      icono: (c) => <ActaIcon color={c} />,
      ir: (n) => n.navigate('RegistrarActa'),
    },
    {
      titulo: 'Corregir mis actas',
      descripcion: 'Arregla un acta que ya registraste',
      icono: (c) => <EditarIcon color={c} />,
      ir: (n) => n.navigate('CorregirActas'),
    },
  ],
};

/** Centro de la app: saludo con Actín y las acciones del rol como tarjetas. */
export function InicioScreen() {
  const usuario = useSessionStore((s) => s.usuario);
  const cerrarSesion = useCerrarSesion();
  const navigation = useNavigation<Navegacion>();
  usePrecargarDatosVeedor(usuario?.rol === RolUsuario.VEEDOR ? usuario.id : null);

  if (!usuario) return null;

  const acciones = ACCIONES_POR_ROL[usuario.rol];
  const esProvincial = usuario.rol === RolUsuario.COORDINADOR_PROVINCIAL;

  return (
    <Screen scrollable fondoMarca>
      <View style={styles.saludo}>
        {esProvincial ? (
          <DisparadorDeFallo>
            <ActinMascot size={104} />
          </DisparadorDeFallo>
        ) : (
          <ActinMascot size={104} />
        )}
        <View style={styles.textosSaludo}>
          <Text style={styles.hola}>Hola, {usuario.nombres}</Text>
          <View style={styles.chipRol}>
            <Text style={styles.textoRol}>{NOMBRE_ROL[usuario.rol]}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.pregunta}>¿Qué quieres hacer?</Text>

      <View style={styles.acciones}>
        {acciones.map((accion, i) => {
          const destacada = i === 0;
          const colorIcono = destacada ? colors.textOnPrimary : colors.primary;
          return (
            <Card
              key={accion.titulo}
              entering={entradaEnLista(i)}
              destacada={destacada}
              icono={accion.icono(colorIcono)}
              onPress={() => accion.ir(navigation)}
              accessibilityLabel={`${accion.titulo}. ${accion.descripcion}`}
              style={styles.contenidoAccion}
            >
              <View style={styles.textosAccion}>
                <Text style={[styles.tituloAccion, destacada && styles.textoDestacado]}>{accion.titulo}</Text>
                <Text style={[styles.descripcionAccion, destacada && styles.descripcionDestacada]}>
                  {accion.descripcion}
                </Text>
              </View>
              <ChevronRightIcon color={colorIcono} />
            </Card>
          );
        })}
      </View>

      <Pressable
        style={styles.salir}
        accessibilityRole="button"
        disabled={cerrarSesion.isPending}
        onPress={() => {
          haptics.tap();
          cerrarSesion.mutate(undefined, { onSuccess: () => toast.info('Cerraste sesión') });
        }}
      >
        <SalirIcon />
        <Text style={styles.textoSalir}>{cerrarSesion.isPending ? 'Cerrando sesión…' : 'Cerrar sesión'}</Text>
      </Pressable>
    </Screen>
  );
}

/**
 * RF-17 / rúbrica: "provocar un fallo en la aplicación y mostrar el reporte
 * recibido en su herramienta de monitoreo". Oculto a propósito (mantener
 * presionado a Actín 2 s) y solo para el coordinador provincial, que es
 * quien revisa los fallos en Sentry (S-15). Lanza un error real de render:
 * lo atrapa LimiteDeErrores y Sentry lo reporta con pantalla, celular,
 * versión de Android y usuario.
 */
function DisparadorDeFallo({ children }: { children: ReactNode }) {
  const [fallar, setFallar] = useState(false);

  if (fallar) {
    throw new Error('Fallo de prueba provocado desde Inicio (RF-17)');
  }

  return (
    <Pressable
      delayLongPress={2000}
      onLongPress={() => {
        haptics.advertencia();
        setFallar(true);
      }}
      accessibilityRole="image"
      accessibilityLabel="Actín"
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  saludo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  textosSaludo: { flex: 1, gap: spacing.xs },
  hola: { ...typography.h2, color: colors.primary },
  chipRol: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent + '33',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  textoRol: { ...typography.caption, color: colors.textPrimary, fontWeight: '700' },
  pregunta: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
  acciones: { gap: spacing.sm },
  contenidoAccion: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  textosAccion: { flex: 1, gap: 2 },
  tituloAccion: { ...typography.bodyBold, color: colors.textPrimary },
  descripcionAccion: { ...typography.caption, color: colors.textSecondary },
  textoDestacado: { color: colors.textOnPrimary },
  descripcionDestacada: { color: colors.textOnPrimary, opacity: 0.85 },
  salir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    minHeight: 48,
  },
  textoSalir: { ...typography.body, color: colors.textSecondary },
});
