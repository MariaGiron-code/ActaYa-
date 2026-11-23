# Feature: personal

**Estado:** domain listo, falta `data/` y `presentation/`.

## Qué resuelve
- RF-07: el coordinador de recinto asigna un veedor a cada mesa (un mismo veedor puede cubrir varias).
- RF-08 / S-03: reemplazo de un veedor ausente el mismo día, incluso por alguien externo a la organización — en ese caso el coordinador registra sus datos como un alta nueva (reutiliza `features/auth` `CrearUsuarioUseCase`, rol `VEEDOR`) y luego crea la `AsignacionVeedor` con `reemplazaAsignacionId` apuntando a la asignación original.
- Confidencialidad (RF-15): este feature es también donde se aplican los filtros de "solo mis mesas / solo mi recinto" — refuérzalo con políticas RLS en Supabase, no solo en la app.

## Qué falta construir
1. Tabla `asignaciones_veedor` en Supabase + políticas RLS (un veedor solo lee sus propias filas; un coordinador de recinto solo las de su recinto).
2. `data/` y `di/personalContainer.ts` (mismo patrón que `features/auth`).
3. `presentation/` — pantalla para el coordinador de recinto: lista de mesas de su recinto, asignar/reemplazar veedor.
4. Caso de uso `ReemplazarVeedorUseCase` que decida si el reemplazo es con un veedor existente o requiere crear una cuenta nueva primero.
