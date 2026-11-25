# Feature: actas

**Estado:** completo (domain + data + di + presentation — registro y
corrección).

## Qué resuelve
- RF-09/RF-13/RF-14: el veedor registra las dos actas de cada mesa asignada
  (alcaldía y prefectura), siempre guardando primero en local (RNF-05,
  `RegistrarActaUseCase`) y sincronizando solo cuando hay conexión
  (`SincronizarActasPendientesUseCase`, disparado por
  `useSincronizarActasAlVolverOnline` — sin polling activo).
- RF-10: `ValidarActaUseCase` (ya existía) revalida en cada registro y
  corrección.
- RF-11/ADR-04/ADR-06: foto obligatoria (`CapturarFotoActaUseCase`), con
  rechazo de fotos borrosas — ver `EvaluarNitidezFoto.ts` para el umbral
  calibrado y por qué.
- ADR-04/S-10, ubicación en tres estados (`TarjetaUbicacion`):
  - **Verificada**: posición nueva del GPS.
  - **No verificada**: el GPS no respondió en 15 s y se usó la última
    ubicación conocida, con más de 5 minutos.
  - **Sin ubicación**: GPS apagado o permiso negado. La foto NO se
    descarta y el acta se guarda igual (perderla sería peor, RNF-05), con
    `ubicacion: null` / `ubicacion_verificada = false`. Se ve en rojo en
    Corregir actas y en el aviso del panel de seguimiento, y se respalda
    después con "Volver a tomar foto y ubicación" al corregir.
- RNF-05: tomar la foto, leer el GPS y guardar el acta usan
  `networkMode: 'always'` (`useActas.ts`). Sin eso, TanStack Query pausaba
  esas acciones locales mientras no había señal.
- RF-12: *"el veedor corrige sus mesas y el coordinador de recinto corrige
  cualquier acta de su recinto"* — `CorregirActasScreen` sirve a ambos roles
  con la MISMA consulta (`listarActasCorregibles`, sin filtro en el
  cliente): la RLS de `actas` (`actas_select_alcance`) ya decide qué le toca
  ver a cada uno. Duplicar ese filtro en el cliente habría sido confiar dos
  veces en la misma regla y arriesgarse a que se desalineen.
- S-05: `CorregirActaUseCase`/`SupabaseActasDatasource.corregir` implementan
  concurrencia optimista completa (domain + RLS): si alguien más ya corrigió
  el acta, `CorregirActasScreen` muestra la versión del servidor
  (`ConflictoVersion.versionServidor`) con un botón para cargarla y decidir
  desde ahí, en vez de sobreescribir en silencio.
- RF-13: `ListaPendientes` en `RegistrarActaScreen` usa `<StatusBadge>` para
  que el estado de cada acta (en proceso/guardado/fallido) esté siempre
  visible, nunca un Alert genérico.
- S-06: `CalcularAlertaDemoraRegistro.ts` compara la hora actual contra la
  hora de cierre de votación (17:00, CNE) y cuántas actas le faltan al
  veedor (mesas asignadas x 2, contra lo guardado LOCALMENTE — funciona sin
  señal). `RegistrarActaScreen` muestra un banner amarillo (advertencia) o
  rojo (crítico) según cuánto tiempo pasó — **verifica/calibra los
  umbrales y la hora de cierre contra el cronograma oficial antes de la
  defensa**, igual que el umbral de nitidez de abajo.

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
1. La lista de `CorregirActasScreen` no pide la URL firmada de la foto (para
   no gastar una llamada a Storage por fila) — si en algún momento se quiere
   mostrar la foto original al corregir, hay que agregarla ahí.

## Tabla y Storage en Supabase (`0005_actas.sql`)
- `actas`: `id` lo genera el dispositivo (RF-13: duplicados se detectan por
  violación de llave primaria, no se crean de nuevo). `unique(mesa_id, dignidad)`
  impone una sola acta por mesa y dignidad. RLS: el veedor inserta solo en
  mesas con una `asignaciones_veedor` activa a su nombre; lee/corrige según
  alcance (RF-15).
- Bucket privado `actas-fotos`, ruta `{veedorId}/{actaId}.jpg`; políticas de
  Storage replican el mismo alcance que la tabla.
