import * as Sentry from '@sentry/react-native';
import { env } from '@core/config/env';

/**
 * ADR-03: Sentry captura cierres inesperados y errores no fatales (ej. una
 * foto que no sube), con pantalla, modelo de celular y versión de Android
 * (RF-17). Los reportes generados sin conexión se envían al recuperar señal.
 *
 * Llamar una sola vez, lo antes posible, desde el punto de entrada de la app.
 */
export function initSentry(): void {
  if (!env.sentryDsn) {
    if (__DEV__) {
      console.warn('[Sentry] EXPO_PUBLIC_SENTRY_DSN no está configurado; monitoreo desactivado.');
    }
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Reenvía automáticamente los eventos guardados sin conexión al reabrir la app.
    enableAutoSessionTracking: true,
  });
}

/**
 * Asocia los reportes de errores al usuario autenticado, para que el
 * coordinador provincial sepa "a cuántas personas les ocurre" (RF-17) y en
 * qué cuenta, no solo en qué dispositivo.
 */
export function setSentryUser(usuarioId: string | null, rol?: string): void {
  Sentry.setUser(usuarioId ? { id: usuarioId, role: rol } : null);
}

export { Sentry };
