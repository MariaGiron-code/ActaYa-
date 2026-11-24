import React, { useState } from 'react';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { animaciones, DireccionTransicion, FeedbackState, Screen } from '@core/ui';
import { colors, typography } from '@core/theme';
import { useSessionStore } from '@features/auth/presentation/store/useSessionStore';
import { useSesionActual } from '@features/auth/presentation/hooks/useAuth';
import { useManejarEnlaceRecuperacion } from '@features/auth/presentation/hooks/useManejarEnlaceRecuperacion';
import { LoginScreen } from '@features/auth/presentation/screens/LoginScreen';
import { RecuperarClaveScreen } from '@features/auth/presentation/screens/RecuperarClaveScreen';
import { EstablecerClaveInicialScreen } from '@features/auth/presentation/screens/EstablecerClaveInicialScreen';
import { CrearUsuarioScreen } from '@features/auth/presentation/screens/CrearUsuarioScreen';
import { RecintosScreen } from '@features/territorio/presentation/screens/RecintosScreen';
import { AsignacionesScreen } from '@features/personal/presentation/screens/AsignacionesScreen';
import { RegistrarActaScreen } from '@features/actas/presentation/screens/RegistrarActaScreen';
import { CorregirActasScreen } from '@features/actas/presentation/screens/CorregirActasScreen';
import { PanelSeguimientoScreen } from '@features/seguimiento/presentation/screens/PanelSeguimientoScreen';
import { RootStackParamList } from './types';
import { InicioScreen } from './InicioScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Header de marca: barra azul, título y flecha de volver en blanco. */
const opcionesDePantalla: NativeStackNavigationOptions = {
  headerShown: false,
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.textOnPrimary,
  headerTitleStyle: { fontSize: typography.h3.fontSize, fontWeight: typography.h3.fontWeight },
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
  // Misma transición en Android e iOS (Android por defecto hace un fade corto).
  animation: 'slide_from_right',
  fullScreenGestureEnabled: true,
};

/** Cambios de sesión (entrar, salir, poner clave): fundido, no "avanzar". */
const OPCIONES_CAMBIO_DE_SESION: NativeStackNavigationOptions = { animation: 'fade' };

/** Adapta `CrearUsuarioScreen` (recibe props directas) a la ruta (recibe params). */
function CrearUsuarioRoute({ route }: { route: RouteProp<RootStackParamList, 'CrearUsuario'> }) {
  return <CrearUsuarioScreen rolDeQuienCrea={route.params.rolDeQuienCrea} rolACrear={route.params.rolACrear} />;
}

function AuthFlow() {
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  // undefined en el primer montaje: la entrada inicial ya la anima el stack.
  const [transicion, setTransicion] = useState<DireccionTransicion>();

  return mostrarRecuperar ? (
    <RecuperarClaveScreen
      transicion={transicion}
      onVolver={() => {
        setTransicion('atras');
        setMostrarRecuperar(false);
      }}
    />
  ) : (
    <LoginScreen
      transicion={transicion}
      onIrARecuperar={() => {
        setTransicion('adelante');
        setMostrarRecuperar(true);
      }}
    />
  );
}

/**
 * Enrutamiento por estado de sesión: sin sesión -> AuthFlow; con clave
 * temporal pendiente (S-11) o completando una recuperación por correo
 * (RF-05/S-08, `enRecuperacion` — ver `useManejarEnlaceRecuperacion`) ->
 * EstablecerClaveInicialScreen; si no, InicioScreen.
 */
export function RootNavigator() {
  useManejarEnlaceRecuperacion();
  const { isLoading } = useSesionActual();
  const usuario = useSessionStore((s) => s.usuario);
  const cargando = useSessionStore((s) => s.cargando);
  const enRecuperacion = useSessionStore((s) => s.enRecuperacion);

  if (isLoading || cargando) {
    return (
      <Screen>
        <FeedbackState
          source={animaciones.cargando}
          message="Cargando ActaYa…"
          loop
        />
      </Screen>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={opcionesDePantalla}
        // Íconos de la barra de estado en blanco sobre el header azul, y
        // oscuros en las pantallas sin header (fondo blanco).
        screenLayout={({ options, children }) => (
          <>
            <StatusBar style={options.headerShown ? 'light' : 'dark'} />
            {children}
          </>
        )}
      >
        {!usuario ? (
          <Stack.Screen name="Auth" component={AuthFlow} options={OPCIONES_CAMBIO_DE_SESION} />
        ) : usuario.debeCambiarClave || enRecuperacion ? (
          <Stack.Screen
            name="EstablecerClaveInicial"
            component={EstablecerClaveInicialScreen}
            options={OPCIONES_CAMBIO_DE_SESION}
          />
        ) : (
          <>
            <Stack.Screen name="Inicio" component={InicioScreen} options={OPCIONES_CAMBIO_DE_SESION} />
            <Stack.Screen
              name="Recintos"
              component={RecintosScreen}
              options={{ headerShown: true, title: 'Recintos' }}
            />
            <Stack.Screen
              name="Asignaciones"
              component={AsignacionesScreen}
              options={{ headerShown: true, title: 'Mis veedores' }}
            />
            <Stack.Screen
              name="CrearUsuario"
              component={CrearUsuarioRoute}
              options={{ headerShown: true, title: 'Registrar persona' }}
            />
            <Stack.Screen
              name="RegistrarActa"
              component={RegistrarActaScreen}
              options={{ headerShown: true, title: 'Registrar acta' }}
            />
            <Stack.Screen
              name="Seguimiento"
              component={PanelSeguimientoScreen}
              options={{ headerShown: true, title: 'Seguimiento' }}
            />
            <Stack.Screen
              name="CorregirActas"
              component={CorregirActasScreen}
              options={{ headerShown: true, title: 'Corregir actas' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
