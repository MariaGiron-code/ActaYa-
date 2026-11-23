import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ADR-08: TanStack Query gestiona el estado del servidor (recintos, mesas,
 * actas, totales): caché, reintentos y, con el persister, sobrevive a que
 * el veedor cierre la app en un recinto rural sin señal.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 10_000, // ADR-10: el panel de seguimiento se refresca cada ~10s
      gcTime: 1000 * 60 * 60 * 24, // mantener en caché hasta 24h para el escenario offline
    },
    mutations: {
      retry: 3,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'ACTAYA_QUERY_CACHE',
});
