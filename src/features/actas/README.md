# Feature: actas

**Estado:** completo (domain + data + di + presentation de registro). La
pantalla de **corrección** (RF-12) queda pendiente — ver abajo.

## Qué resuelve
- RF-09/RF-13/RF-14: el veedor registra las dos actas de cada mesa asignada
  (alcaldía y prefectura), siempre guardando primero en local (RNF-05,
  `RegistrarActaUseCase`) y sincronizando solo cuando hay conexión
  (`SincronizarActasPendientesUseCase`, disparado por
  `useSincronizarActasAlVolverOnline` — sin polling activo).
- RF-10: `ValidarActaUseCase` (ya existía) revalida en cada registro y
  corrección.
- RF-11/ADR-04/ADR-06: foto + ubicación obligatorias
  (`CapturarFotoActaUseCase`), con rechazo de fotos borrosas — ver
  `EvaluarNitidezFoto.ts` para el umbral calibrado y por qué.
- S-10: la ubicación se marca `verificada: false` si pasaron más de 5
  minutos entre capturarla y guardar el acta.
- S-05: `CorregirActaUseCase`/`SupabaseActasDatasource.corregir` implementan
  concurrencia optimista completa (domain + RLS), devolviendo
  `CONFLICTO_VERSION` con la versión del servidor si alguien más ya corrigió
  el acta — falta la pantalla que consuma esto (ver abajo).
- RF-13: `ListaPendientes` en `RegistrarActaScreen` usa `<StatusBadge>` para
  que el estado de cada acta (en proceso/guardado/fallido) esté siempre
  visible, nunca un Alert genérico.

## Decisión técnica: nitidez de foto (ADR-06)
`expo-image-manipulator` en SDK 57 **no da acceso a píxeles crudos**: solo
transforma y guarda archivos. Por eso `DeviceCapturaDatasource.medirNitidez`
redimensiona la foto a 512px de ancho, la guarda como JPEG en base64, la
decodifica con `jpeg-js` (ya en el ADR) y calcula la varianza del laplaciano
en escala de grises. El umbral (100) está documentado y razonado en
`EvaluarNitidezFoto.ts` — **debes recalibrarlo con fotos reales de tu propio
teléfono antes de la defensa** (el valor actual es un punto de partida
razonable, no una medición tuya).

## Qué falta construir
1. **Pantalla de corrección (RF-12)**: para el coordinador de recinto (y el
   propio veedor). El dominio y los datos ya están listos
   (`CorregirActaUseCase`, `ActasRepository.corregir`) — falta la UI que
   liste las actas de un recinto, permita editar los campos y muestre
   `ConflictoVersion.versionServidor` si hay un conflicto.
2. **Alerta de demora (S-06)**: avisar si el veedor tarda demasiado en
   registrar tras cerrar la votación — no implementado.
3. Conectar `actas` con `seguimiento` (RF-16: el panel del provincial
   necesita leer estas filas agregadas por recinto/candidato).

## Tabla y Storage en Supabase (`0005_actas.sql`)
- `actas`: `id` lo genera el dispositivo (RF-13: duplicados se detectan por
  violación de llave primaria, no se crean de nuevo). `unique(mesa_id, dignidad)`
  impone una sola acta por mesa y dignidad. RLS: el veedor inserta solo en
  mesas con una `asignaciones_veedor` activa a su nombre; lee/corrige según
  alcance (RF-15).
- Bucket privado `actas-fotos`, ruta `{veedorId}/{actaId}.jpg`; políticas de
  Storage replican el mismo alcance que la tabla.
