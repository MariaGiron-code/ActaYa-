# Feature: seguimiento

**Estado:** completo (domain + data + di + presentation).

## Qué resuelve
- RF-16: el coordinador provincial ve, por recinto, cuántas mesas han
  reportado (ambas actas, alcaldía y prefectura, con foto y ubicación —
  S-02) frente al total, y el conteo acumulado de votos por candidato para
  cada dignidad — como un exit poll propio, sin esperar al CNE.
- RNF-07: la pantalla se actualiza sola al llegar una acta nueva, vía
  Supabase Realtime (ADR-10) — nunca por polling activo.
- RF-17 / S-15: tal como decidió el equipo, no hay pantalla de estabilidad
  aparte — el coordinador provincial revisa los fallos directamente en el
  dashboard de Sentry.

## Pieza que faltaba y se agregó
`mesas.estado` se diseñó desde `0002_territorio.sql` para marcarse
`'completa'` cuando llegan las dos actas de una mesa (S-02), pero nada lo
actualizaba — al construir `actas` nunca se conectó esa pieza. Se agregó un
**trigger** (`actualizar_estado_mesa`, en `0007_seguimiento.sql`) que lo
recalcula automáticamente después de cada `INSERT` en `actas`, contando
`count(distinct dignidad) = 2` para esa mesa. Así nunca puede
desincronizarse, sin importar por dónde se inserte la fila.

## Qué se construyó
- `supabase/migrations/0007_seguimiento.sql`:
  - El trigger de arriba.
  - `resumen_por_recinto()` y `progreso_por_dignidad(p_dignidad)`: funciones
    SQL agregadas (no vistas, por si luego hace falta paginar o filtrar).
  - `alter publication supabase_realtime add table public.actas` — sin
    esto, un cliente puede suscribirse pero nunca le llega ningún evento.
- `data/datasources/SupabaseSeguimientoDatasource.ts`: llama a las dos
  funciones SQL vía `.rpc()`, y abre/cierra el canal de Realtime.
- `presentation/hooks/useSeguimiento.ts`: `useSuscripcionSeguimiento` se
  desuscribe automáticamente al desmontar la pantalla (consecuencia
  documentada en ADR-10: sin esto hay fuga de conexión).
- `presentation/screens/PanelSeguimientoScreen.tsx`: `react-native-gifted-charts`
  (ADR-07) — barras por recinto (reportadas/total) y por candidato,
  alternando entre alcaldía y prefectura.
- Registrado en `src/app/navigation/RootNavigator.tsx` (ruta `Seguimiento`,
  botón "Ver seguimiento" en `InicioScreen` para el coordinador provincial).

## Qué falta (fuera del alcance de este feature)
- Pantalla de corrección de actas (RF-12) — sigue pendiente, documentada en
  `features/actas/README.md`.
