# ActaYa

Control electoral para una organización política ecuatoriana: registro de actas de
escrutinio, gestión de territorio/personal y seguimiento en tiempo real del conteo
(Examen I — Desarrollo de Aplicaciones Móviles).

Este repositorio es el **proyecto base**: trae completo el feature `auth` de punta a
punta (incluye las dos APIs externas de verificación) como patrón de referencia, y
el resto de features con su capa de dominio lista + un `README.md` propio explicando
qué falta y cómo seguir el mismo patrón.

## Stack (línea base acordada por el equipo — ver ADRs)

| Decisión | Elegido | ADR |
|---|---|---|
| Backend | Supabase (DB + Auth + Realtime + Storage) | ADR-01 |
| Persistencia local | AsyncStorage + expo-secure-store + Expo FileSystem | ADR-02 |
| Monitoreo de errores | Sentry | ADR-03 |
| Foto + ubicación del acta | expo-image-picker + expo-location | ADR-04 |
| Conectividad | @react-native-community/netinfo | ADR-05 |
| Nitidez de foto | expo-image-manipulator + jpeg-js + buffer | ADR-06 |
| Gráficos | react-native-gifted-charts + react-native-svg | ADR-07 |
| Estado de servidor / offline | TanStack Query + persist-client | ADR-08 |
| Formularios | React Hook Form + Zod | ADR-09 |
| Panel en tiempo real | Supabase Realtime | ADR-10 |
| Verificación de cédula/correo | Edge Functions → Didit + QuickEmailVerification | ADR-11 (ver nota abajo) |
| Arquitectura | Clean Architecture + Vertical Slicing, Zustand para estado de UI/sesión | ADR-12 |

**Nota sobre ADR-11:** el ADR original evaluó `whoecuador.com` para cédulas. Esa
opción se descartó al construir el proyecto base: el dominio no tiene ningún rastro
verificable en internet y expone datos personales completos sin flujo de
consentimiento, lo que no es defendible ni legal bajo la LOPDP ecuatoriana. Se usa
**Didit** en su lugar (proveedor KYC real, valida contra el Registro Civil, 500
verificaciones gratis/mes) — es un detalle de implementación del mismo requisito
acordado ("verificar existencia mediante API"), no un cambio de línea base.

## Arquitectura

```
src/
  app/            # composición: providers, navegación, punto de entrada
  core/            # transversal: theme, supabase client, storage, validación, UI compartida
  features/
    auth/          # COMPLETO — patrón de referencia (domain/data/presentation/di)
    territorio/    # domain listo, falta data/presentation (ver su README.md)
    personal/      # domain listo, falta data/presentation (ver su README.md)
    actas/         # domain listo (incluye ValidarActaUseCase funcionando), falta resto
    seguimiento/    # domain listo, falta data/presentation (ver su README.md)
supabase/
  functions/        # Edge Functions (Deno): crear-usuario, verificar-cedula, verificar-correo
  migrations/        # SQL: tabla usuarios + RLS
```

Cada feature sigue el mismo patrón de 4 capas (ADR-12):

- **domain/** — entidades, interfaces de repositorio, casos de uso. No importa nada de `data/` ni `presentation/`.
- **data/** — datasources (Supabase, Edge Functions) + implementación de los repositorios del dominio.
- **presentation/** — pantallas, hooks de TanStack Query, store de Zustand (solo estado de sesión/UI).
- **di/** — composition root del feature (`xxxContainer.ts`): único lugar donde se instancian datasources/repositorios concretos.

La regla de dependencia hacia el interior está reforzada con ESLint
(`eslint-plugin-boundaries`, ver `eslint.config.js`) — un import de `domain/` hacia
`data/` o `presentation/` falla el lint. Cópiala al crear cada feature nuevo.

**Nota de navegación:** se usa `@react-navigation` de forma explícita en
`src/app/navigation/` en vez de Expo Router (que sugiere el `AGENTS.md` por defecto
de la plantilla de Expo). Se eligió así porque con Vertical Slicing + Clean
Architecture es más fácil defender "qué pantalla depende de qué" con un navegador
explícito que con el enrutado por archivos. Es una decisión de este proyecto base,
no una restricción del examen — se puede migrar a Expo Router si lo prefieres.

## Configuración inicial

1. **Instalar dependencias** (ya hecho si acabas de clonar el proyecto base):
   ```powershell
   npm install
   ```
2. **Crear el proyecto en [supabase.com](https://supabase.com)** y copiar `.env.example` a `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
   Completa `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` y `EXPO_PUBLIC_SENTRY_DSN` (crea un proyecto gratis en [sentry.io](https://sentry.io)).
3. **Aplicar la migración** (`supabase/migrations/0001_usuarios.sql`) desde el SQL Editor de Supabase o con la CLI (`supabase db push`).
4. **Configurar los secretos de las Edge Functions** (nunca van en `.env` del cliente):
   ```powershell
   npx supabase secrets set DIDIT_API_KEY=tu_clave
   npx supabase secrets set QUICKEMAILVERIFICATION_API_KEY=tu_clave
   ```
5. **Desplegar las Edge Functions:**
   ```powershell
   npx supabase functions deploy crear-usuario
   npx supabase functions deploy verificar-cedula
   npx supabase functions deploy verificar-correo
   ```
6. **Crear la primera cuenta** (coordinador provincial): según S-16, nadie lo crea desde la app — insértala directamente en Supabase (SQL Editor: crea el usuario en Auth y su fila en `usuarios` con `rol = 'COORDINADOR_PROVINCIAL'`, `creado_por_id = null`).

## Ejecutar en desarrollo

Este proyecto usa varias librerías con código nativo (Reanimated, Sentry, SVG,
Secure Store…), así que **Expo Go no sirve** — necesitas un development build:

```powershell
npx expo prebuild
npx expo run:android
```

o, sin Android Studio instalado, un build en la nube:

```powershell
npx eas build --platform android --profile development
```

## Generar el APK de entrega (obligatorio, -5 pts si falta)

```powershell
npx eas build --platform android --profile preview
```

Descarga el `.apk` del link que te da EAS al terminar.

## Calidad de código

```powershell
npm run lint        # ESLint + regla de capas de Clean Architecture
npm run typecheck    # TypeScript
npm run format       # Prettier
```

## Qué sigue

Completa `territorio`, `personal`, `actas` y `seguimiento` siguiendo el patrón de
`features/auth`. Cada carpeta tiene su propio `README.md` con los RF/ADR que
resuelve y los pasos sugeridos. Empieza por `actas` (vale más en la rúbrica) y por
precargar el territorio/organizaciones en `supabase/migrations/` (restricción
obligatoria del examen).
