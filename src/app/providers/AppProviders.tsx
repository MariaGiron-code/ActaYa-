import React, { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ToastHost } from '@core/ui';
import { asyncStoragePersister, queryClient } from './queryClient';

/**
 * Composición única de providers transversales. El orden importa:
 * GestureHandler y SafeArea deben envolver todo lo que haga gestos/layout;
 * el QueryClient persistente debe envolver cualquier pantalla que use
 * TanStack Query.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          {children}
          <ToastHost />
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
