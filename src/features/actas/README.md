# Feature: actas

**Estado:** domain listo (incluye `ValidarActaUseCase` funcionando), falta `data/` y `presentation/`. Este feature vale más puntos en la rúbrica (3/20) — dedícale más tiempo.

## Qué resuelve
- RF-09 a RF-14: registrar las dos actas por mesa, con foto y ubicación obligatorias, corrección, estado de envío siempre visible, y funcionamiento sin conexión.
- `ValidarActaUseCase` ya implementa RF-10 completo (revísalo, está comentado y puedes probarlo con `votosPorOrganizacion` de ejemplo).

## Qué falta construir (en orden recomendado)
1. **Captura de foto + ubicación**: usa `expo-image-picker` + `expo-location` (ADR-04) y guarda la foto con `guardarFotoActa()` de `@core/storage/fileStorage`. Si no hay señal GPS, usa la última ubicación conocida y marca `verificada: false` si pasaron más de 5 minutos (S-10, ya definido en `Ubicacion.verificada`).
2. **Detección de foto borrosa** (ADR-06): `expo-image-manipulator` + `jpeg-js` + `buffer`. Calibra tú mismo el umbral con fotos reales (S-12) — documenta qué umbral usaste y por qué, lo vas a defender.
3. **Cola de envío offline** (ADR-08): usa `useMutation` de TanStack Query combinado con `useNetworkStatus()` de `@core/network`. Guarda primero con `guardarLocal()`, cambia el `estado` del acta a `en_proceso`, reintenta automáticamente al recuperar conexión y cambia a `guardado` o `fallido` (usa `<StatusBadge estado={...} />` de `@core/ui`, nunca un Alert genérico).
4. **Conflictos de edición** (S-05): si `enviar`/`corregir` devuelve `CONFLICTO_VERSION`, muestra al usuario la versión del servidor antes de sobreescribir.
5. `data/dto`, `data/datasources/SupabaseActasDatasource.ts`, `data/repositories/ActasRepositoryImpl.ts`, `di/actasContainer.ts` (mismo patrón que `features/auth`).
6. `presentation/screens/RegistrarActaScreen.tsx` — formulario con React Hook Form + Zod (ADR-09), que llama a `validarActa` ANTES de intentar guardar.

## Tabla en Supabase
`actas` necesita: `id uuid primary key` (el que genera el dispositivo, no `gen_random_uuid()` del servidor — así el servidor detecta duplicados), `version integer`, y una política RLS que rechace un `UPDATE` cuyo `version` enviado no coincida con el de la fila actual (implementa S-05 del lado del servidor, no solo en la app).
