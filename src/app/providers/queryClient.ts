import { onlineManager, QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Sin esto, TanStack Query en React Native asume que SIEMPRE hay conexión
 * (no existe `navigator.onLine` como en un navegador). Es el patrón oficial
 * de la librería para RN: sin esta línea, al perder señal cada query
 * intenta la petición igual, falla, y si todavía no se había guardado un
 * dato en caché para esa consulta específica, la pantalla se queda sin
 * nada que mostrar — exactamente el bug reportado: el formulario de acta
 * perdía los candidatos y las mesas asignadas al quedarse sin señal.
 * Con esto, una query SIN caché queda "pausada" en vez de fallar, y una
 * query CON caché muestra lo último que tenía sin intentar (ni fallar) la
 * petición de red.
 */
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected)));
});

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
