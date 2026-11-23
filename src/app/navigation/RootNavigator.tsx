import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FeedbackState, Screen } from '@core/ui';
import { useSessionStore } from '@features/auth/presentation/store/useSessionStore';
import { useSesionActual } from '@features/auth/presentation/hooks/useAuth';
import { LoginScreen } from '@features/auth/presentation/screens/LoginScreen';
import { RecuperarClaveScreen } from '@features/auth/presentation/screens/RecuperarClaveScreen';
import { EstablecerClaveInicialScreen } from '@features/auth/presentation/screens/EstablecerClaveInicialScreen';
import { InicioScreen } from './InicioScreen';

const Stack = createNativeStackNavigator();

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
          <Stack.Screen name="Inicio" component={InicioScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
