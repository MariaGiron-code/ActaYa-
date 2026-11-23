import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Envoltorio tipado de AsyncStorage (ADR-02).
 * Úsalo para datos NO sensibles: borradores, colas de actas pendientes,
 * rutas locales de fotos, preferencias de UI, caché de TanStack Query.
 * Para datos sensibles usa `secureStorage.ts`.
 */
export const localStorage = {
  async getItem<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
