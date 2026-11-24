import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useCompletarRecuperacionClave } from './useAuth';

function extraerCodigo(url: string): string | null {
  try {
    return new URL(url).searchParams.get('code');
  } catch {
    return null;
  }
}

/**
 * RF-05/S-08: Supabase manda por correo un enlace `actaya://recuperar-clave?code=...`
 * (ver `redirectTo` en `SupabaseAuthDatasource.solicitarRecuperacionClave`).
 * Este hook lo intercepta tanto si la app ya estaba abierta como si se abrió
 * recién desde el enlace (`getInitialURL`), y lo cambia por una sesión real
 * vía `useCompletarRecuperacionClave` — después de eso, `RootNavigator`
 * lleva al titular a poner su clave nueva.
 *
 * Móntalo una sola vez por el tiempo de vida de la app (ver `App.tsx`).
 */
export function useManejarEnlaceRecuperacion() {
  const completarRecuperacion = useCompletarRecuperacionClave();

  useEffect(() => {
    function manejarUrl(url: string | null) {
      if (!url) return;
      const codigo = extraerCodigo(url);
      if (codigo) completarRecuperacion.mutate(codigo);
    }

    Linking.getInitialURL().then(manejarUrl);
    const suscripcion = Linking.addEventListener('url', (evento) => manejarUrl(evento.url));
    return () => suscripcion.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se suscribe una sola vez, por el tiempo de vida de la app.
  }, []);
}
