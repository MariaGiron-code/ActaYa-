# Feature: seguimiento

**Estado:** domain listo, falta `data/` y `presentation/`.

## Qué resuelve
- RF-16: el coordinador provincial ve mesas reportadas/pendientes por recinto y el avance de votos por candidato (alcaldía y prefectura), en tiempo real y sin esperar al CNE (funciona como un exit poll).
- RNF-07: el panel se actualiza solo, sin que el coordinador recargue la pantalla.

## Qué falta construir
1. `data/datasources/SupabaseSeguimientoDatasource.ts`: consultas agregadas (puedes usar una vista SQL o RPC de Postgres que cuente mesas reportadas y sume votos) + un canal de **Supabase Realtime** (ADR-10) suscrito a la tabla `actas` que invalide las queries de TanStack Query cuando llega un INSERT/UPDATE.
2. `presentation/screens/PanelSeguimientoScreen.tsx` con **react-native-gifted-charts** (ADR-07): barras por recinto para mesas reportadas/pendientes, y un gráfico por candidato para alcaldía y prefectura.
3. Recuerda desuscribirte del canal realtime al desmontar la pantalla (consecuencia documentada en ADR-10: fugas de memoria si no lo haces).
4. Este es también el lugar natural para un resumen de estabilidad (RF-17 / S-15): como el equipo decidió no crear un rol ni pantalla aparte para "equipo técnico", el coordinador provincial revisa los fallos directamente en el dashboard de Sentry (no hace falta construir una pantalla para esto dentro de la app).
