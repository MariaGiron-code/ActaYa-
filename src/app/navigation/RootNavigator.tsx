import React, { useState } from 'react';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedbackState, Screen } from '@core/ui';
import { useSessionStore } from '@features/auth/presentation/store/useSessionStore';
import { useSesionActual } from '@features/auth/presentation/hooks/useAuth';
import { LoginScreen } from '@features/auth/presentation/screens/LoginScreen';
import { RecuperarClaveScreen } from '@features/auth/presentation/screens/RecuperarClaveScreen';
import { EstablecerClaveInicialScreen } from '@features/auth/presentation/screens/EstablecerClaveInicialScreen';
import { CrearUsuarioScreen } from '@features/auth/presentation/screens/CrearUsuarioScreen';
import { RecintosScreen } from '@features/territorio/presentation/screens/RecintosScreen';
import { AsignacionesScreen } from '@features/personal/presentation/screens/AsignacionesScreen';
import { RegistrarActaScreen } from '@features/actas/presentation/screens/RegistrarActaScreen';
import { PanelSeguimientoScreen } from '@features/seguimiento/presentation/screens/PanelSeguimientoScreen';
import { RootStackParamList } from './types';
import { InicioScreen } from './InicioScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Adapta `CrearUsuarioScreen` (recibe props directas) a la ruta (recibe params). */
function CrearUsuarioRoute({ route }: { route: RouteProp<RootStackParamList, 'CrearUsuario'> }) {
  return <CrearUsuarioScreen rolDeQuienCrea={route.params.rolDeQuienCrea} rolACrear={route.params.rolACrear} />;
}

function AuthFlow() {
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);
  return mostrarRecuperar ? (
    <RecuperarClaveScreen onVolver={() => setMostrarRecuperar(false)} />
  ) : (
    <LoginScreen onIrARecuperar={() => setMostrarRecuperar(true)} />
  );
}

/**
 * Enrutamiento por estado de sesión: sin sesión -> AuthFlow; con clave
 * temporal pendiente -> EstablecerClaveInicialScreen (S-11); si no,
 * InicioScreen (placeholder hasta completar territorio/personal/actas/seguimiento).
 */
export function RootNavigator() {
  const { isLoading } = useSesionActual();
  const usuario = useSessionStore((s) => s.usuario);
  const cargando = useSessionStore((s) => s.cargando);

  if (isLoading || cargando) {
    return (
      <Screen>
        <FeedbackState
          source={require('../../../assets/lottie/cargando.json')}
          message="Cargando ActaYa…"
          loop
        />
      </Screen>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!usuario ? (
          <Stack.Screen name="Auth" component={AuthFlow} />
        ) : usuario.debeCambiarClave ? (
          <Stack.Screen name="EstablecerClaveInicial" component={EstablecerClaveInicialScreen} />
        ) : (
          <>
            <Stack.Screen name="Inicio" component={InicioScreen} />
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
