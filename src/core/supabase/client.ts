import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env } from '@core/config/env';

/**
 * Cliente único de Supabase (ADR-01: BaaS). La sesión se persiste con
 * AsyncStorage siguiendo ADR-02, y se refresca sola en segundo plano.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
