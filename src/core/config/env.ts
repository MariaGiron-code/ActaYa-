/**
 * Variables de entorno públicas (expuestas al bundle del cliente).
 * Deben definirse en `.env` (ver `.env.example`) con prefijo EXPO_PUBLIC_.
 *
 * IMPORTANTE: las claves de Didit y QuickEmailVerification NUNCA van aquí.
 * Esas se configuran como secretos del proyecto de Supabase y solo las usan
 * las Edge Functions en `supabase/functions/*` (ver ADR-11).
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia .env.example a .env y complétala.`
    );
  }
  return value;
}

export const env = {
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: requireEnv(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  ),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
};
