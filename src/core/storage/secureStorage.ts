import * as SecureStore from 'expo-secure-store';

/**
 * Envoltorio sobre expo-secure-store (Keychain/Keystore nativo), para datos
 * sensibles en el dispositivo (RNF-04: "las claves se almacenan de forma
 * segura"). La sesión de Supabase ya maneja sus propios tokens; este storage
 * es para cosas como el token de recuperación temporal mientras se usa.
 */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
