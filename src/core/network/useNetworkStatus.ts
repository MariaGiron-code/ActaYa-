import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * ADR-05: NetInfo para detectar pérdida/recuperación de conectividad y
 * adaptar la interfaz (RF-14, RNF-05). No hace polling activo: escucha
 * eventos del sistema.
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(Boolean(state.isConnected));
      setIsInternetReachable(state.isInternetReachable);
    });
    return unsubscribe;
  }, []);

  return { isConnected, isInternetReachable, isOnline: isConnected && isInternetReachable !== false };
}
