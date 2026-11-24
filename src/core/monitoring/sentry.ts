import { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { onlineManager } from '@tanstack/react-query';
import { env } from '@core/config/env';
import type { AppError } from '@core/utils/result';

/**
 * ADR-03 / RF-17: Sentry captura cierres inesperados y errores no fatales,
 * con pantalla, modelo de celular, versión de Android y usuario afectado.
 * Los reportes generados sin conexión quedan guardados en el teléfono y se
 * envían al recuperar señal (S-15: el coordinador provincial los revisa en
 * el dashboard de Sentry, no en una pantalla de la app).
 */

/** Registra cada cambio de ruta como breadcrumb y nombra la transacción con la pantalla. */
export const integracionNavegacion = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: false,
});

let iniciado = false;

/**
 * Debe llamarse a nivel de módulo, ANTES del primer render: si se inicia
 * dentro de un `useEffect`, un fallo al abrir la app nunca se reporta.
 */
export function initSentry(): void {
  if (iniciado) return;
  iniciado = true;

  if (!env.sentryDsn) {
    if (__DEV__) {
      console.warn('[Sentry] EXPO_PUBLIC_SENTRY_DSN no está configurado; monitoreo desactivado.');
    }
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    debug: __DEV__,
    environment: __DEV__ ? 'desarrollo' : 'produccion',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    // Reenvía automáticamente los eventos guardados sin conexión al reabrir la app.
    enableAutoSessionTracking: true,
    // Cierres nativos (Android) además de los de JavaScript.
    enableNative: true,
    enableNativeCrashHandling: true,
    // La IP y datos del dispositivo que no pide el RF-17 no se envían.
    sendDefaultPii: false,
    integrations: [integracionNavegacion],
  });
}

type UsuarioMonitoreado = {
  id: string;
  nombres: string;
  apellidos: string;
  rol: string;
  recintoId: string | null;
};

/**
 * "A cuántas personas les ocurre" y "qué usuario" (RF-17): cada reporte
 * queda asociado a la cuenta, su rol y su recinto, para que el coordinador
 * provincial pueda filtrar en Sentry por persona, rol o recinto afectado.
 */
export function setSentryUser(usuario: UsuarioMonitoreado | null): void {
  if (!usuario) {
    Sentry.setUser(null);
    Sentry.setTag('rol', undefined);
    Sentry.setTag('recinto', undefined);
    return;
  }
  Sentry.setUser({ id: usuario.id, username: `${usuario.nombres} ${usuario.apellidos}` });
  Sentry.setTag('rol', usuario.rol);
  Sentry.setTag('recinto', usuario.recintoId ?? 'sin_recinto');
}

/**
 * "En qué parte de la aplicación" (RF-17): etiqueta `pantalla` (la ruta)
 * en cada reporte. La pone RootNavigator en cada cambio de ruta.
 */
export function marcarPantalla(nombre: string): void {
  Sentry.setTag('pantalla', nombre);
  Sentry.addBreadcrumb({ category: 'pantalla', message: nombre, level: 'info' });
}

/**
 * Afina `pantalla` cuando una misma ruta tiene varias vistas internas
 * (lista -> formulario, login -> recuperar clave). Se limpia al desmontar
 * para que no quede pegada al pasar a otra ruta.
 */
export function useVistaMonitoreada(vista: string): void {
  useEffect(() => {
    Sentry.setTag('vista', vista);
    Sentry.addBreadcrumb({ category: 'vista', message: vista, level: 'info' });
    return () => {
      Sentry.setTag('vista', undefined);
    };
  }, [vista]);
}

/**
 * Errores que no cierran la app pero impiden completar una tarea (RF-17),
 * p. ej. una foto que no sube. Solo los `ERROR_*`: los demás códigos son
 * validaciones del usuario (FOTO_BORROSA, CREDENCIALES_INVALIDAS…), no
 * fallos de la aplicación. Sin conexión no se reportan: que algo no se
 * envíe sin señal es esperado y se reintenta solo (RF-14).
 */
export function reportarFalloDeTarea(error: AppError, tarea: string): void {
  if (!error.code.startsWith('ERROR_')) return;
  if (!onlineManager.isOnline()) return;

  const excepcion = error.cause instanceof Error ? error.cause : new Error(`${error.code}: ${error.message}`);
  Sentry.captureException(excepcion, {
    level: 'error',
    tags: { tipo: 'fallo_no_fatal', codigo: error.code, tarea },
    extra: { mensaje: error.message },
    // Agrupa por código: "ERROR_SUBIR_FOTO" es un solo problema aunque el
    // mensaje del servidor cambie entre intentos.
    fingerprint: ['fallo-tarea', error.code],
  });
}

/** Para resultados de casos de uso (`Result`) que llegan por TanStack Query. */
export function reportarSiEsFallo(data: unknown, tarea: string): void {
  if (
    typeof data === 'object' &&
    data !== null &&
    'ok' in data &&
    data.ok === false &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'object'
  ) {
    reportarFalloDeTarea((data as { error: AppError }).error, tarea);
  }
}

export { Sentry };
