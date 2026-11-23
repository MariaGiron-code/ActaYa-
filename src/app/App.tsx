import React, { useEffect } from 'react';
import { initSentry } from '@core/monitoring/sentry';
import { AppProviders } from './providers/AppProviders';
import { RootNavigator } from './navigation/RootNavigator';

export function App() {
  useEffect(() => {
    initSentry();
  }, []);

  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
