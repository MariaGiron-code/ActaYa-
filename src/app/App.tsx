import React from 'react';
import { initSentry, Sentry } from '@core/monitoring/sentry';
import { AppProviders } from './providers/AppProviders';
import { RootNavigator } from './navigation/RootNavigator';
import { LimiteDeErrores } from './LimiteDeErrores';

// RF-17: a nivel de módulo, antes del primer render, para que también se
// reporten los fallos que ocurren al abrir la app.
initSentry();

function AppBase() {
  return (
    <AppProviders>
      <LimiteDeErrores>
        <RootNavigator />
      </LimiteDeErrores>
    </AppProviders>
  );
}

/** `Sentry.wrap` mide el arranque y captura errores de render fuera del límite de errores. */
export const App = Sentry.wrap(AppBase);
