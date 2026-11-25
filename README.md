# ActaYa

Aplicación móvil de control electoral para organizaciones políticas. Permite registrar las
actas de escrutinio de cada Junta Receptora del Voto (JRV) con foto y ubicación, organizar
al personal en territorio y seguir el conteo de votos en tiempo real.

Está pensada para usarse en el recinto electoral, donde la señal suele ser débil: las actas
se guardan primero en el teléfono y se envían solas cuando vuelve la conexión.

## Contenido

- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Decisiones técnicas (ADR)](#decisiones-técnicas-adr)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración del backend](#configuración-del-backend)
- [Ejecutar en desarrollo](#ejecutar-en-desarrollo)
- [Generar el APK](#generar-el-apk)
- [Scripts disponibles](#scripts-disponibles)
- [Convenciones](#convenciones)

## Funcionalidades

La app tiene tres roles. Cada uno ve en Inicio solo las acciones que le corresponden.

| Rol                        | Qué puede hacer                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Coordinador provincial** | Seguir en vivo las mesas reportadas y los votos por candidato, administrar recintos y crear coordinadores de recinto. |
| **Coordinador de recinto** | Asignar o reemplazar al veedor de cada mesa, revisar y corregir las actas de su recinto y crear veedores.             |
| **Veedor**                 | Registrar las actas de sus mesas (votos, foto y ubicación) y corregir las que ya registró.                            |

Además:

- **Cuentas verificadas.** Al crear un usuario se comprueba que la cédula exista y que
  el correo sea real. La primera vez que alguien entra debe cambiar su clave temporal, y
  puede recuperarla por correo.
- **Funciona sin internet.** Tomar la foto, leer el GPS y guardar el acta funcionan sin
  conexión. Las actas pendientes quedan "Esperando señal" y se envían automáticamente al
  recuperarla, sin duplicarse.
- **Evidencia del acta.** Las fotos borrosas se rechazan antes de guardarlas. La ubicación
  puede quedar verificada (GPS reciente), no verificada (última conocida) o sin ubicación
  (GPS apagado); las dos últimas se señalan al coordinador para revisión.
- **Correcciones seguras.** Si dos personas corrigen la misma acta a la vez, la segunda
  recibe un aviso en lugar de sobrescribir los cambios de la primera.
- **Panel en tiempo real.** El seguimiento se actualiza al instante con cada acta nueva,
  sin recargar la pantalla.
- **Monitoreo de errores.** Los fallos se reportan a Sentry con la pantalla, el dispositivo
  y el usuario afectados.

## Tecnologías

| Área                                    | Tecnología                                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Framework                               | [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), React Native 0.86, React 19, TypeScript |
| Navegación                              | React Navigation (native stack)                                                                 |
| Backend                                 | [Supabase](https://supabase.com): PostgreSQL, Auth, Storage, Realtime y Edge Functions          |
| Estado del servidor y modo sin conexión | TanStack Query con persistencia en AsyncStorage                                                 |
| Estado de sesión e interfaz             | Zustand                                                                                         |
| Formularios y validación                | React Hook Form + Zod                                                                           |
| Almacenamiento local                    | AsyncStorage, expo-secure-store, expo-file-system                                               |
| Cámara y ubicación                      | expo-image-picker, expo-image-manipulator, expo-location                                        |
| Conectividad                            | @react-native-community/netinfo                                                                 |
| Gráficos                                | react-native-gifted-charts + react-native-svg                                                   |
| Animaciones                             | react-native-reanimated, lottie-react-native, expo-haptics                                      |
| Monitoreo                               | Sentry (`@sentry/react-native`)                                                                 |
| Calidad de código                       | ESLint (`eslint-config-expo` + `eslint-plugin-boundaries`), Prettier                            |
| Compilación                             | EAS Build                                                                                       |

Servicios externos, llamados solo desde las Edge Functions:

- **[Datacil](https://datacil.com):** verifica que la cédula exista y que el nombre coincida.
  Solo se lee el nombre; el resto de la respuesta se descarta sin guardarse.
- **[QuickEmailVerification](https://quickemailverification.com):** verifica que el correo
  exista.

## Decisiones técnicas (ADR)

| ADR    | Decisión                                | Elegido                                                                         |
| ------ | --------------------------------------- | ------------------------------------------------------------------------------- |
| ADR-01 | Backend                                 | Supabase (base de datos, Auth, Realtime y Storage)                              |
| ADR-02 | Persistencia local                      | AsyncStorage + expo-secure-store + expo-file-system                             |
| ADR-03 | Monitoreo de errores                    | Sentry                                                                          |
| ADR-04 | Foto y ubicación del acta               | expo-image-picker + expo-location                                               |
| ADR-05 | Conectividad                            | @react-native-community/netinfo                                                 |
| ADR-06 | Nitidez de la foto                      | expo-image-manipulator + jpeg-js + buffer                                       |
| ADR-07 | Gráficos                                | react-native-gifted-charts + react-native-svg                                   |
| ADR-08 | Estado del servidor y modo sin conexión | TanStack Query + persist-client                                                 |
| ADR-09 | Formularios                             | React Hook Form + Zod                                                           |
| ADR-10 | Panel en tiempo real                    | Supabase Realtime                                                               |
| ADR-11 | Verificación de cédula y correo         | Edge Functions → Datacil y QuickEmailVerification                               |
| ADR-12 | Arquitectura                            | Clean Architecture + Vertical Slicing, con Zustand para la sesión y la interfaz |

## Arquitectura

El código sigue **Clean Architecture** organizada por funcionalidad (**Vertical Slicing**):
cada carpeta de `features/` contiene todo lo necesario para una parte del negocio.

```
src/
├── app/                 # Punto de entrada: providers, navegación y pantalla de Inicio
├── core/                # Código compartido: tema, UI, cliente de Supabase, almacenamiento,
│                        # red, monitoreo, validaciones y utilidades
└── features/
    ├── auth/            # Inicio de sesión, creación de usuarios y gestión de claves
    ├── territorio/      # Recintos, mesas (JRV) y organizaciones políticas
    ├── personal/        # Asignación de veedores a las mesas
    ├── actas/           # Registro, envío y corrección de actas
    └── seguimiento/     # Panel de resultados en tiempo real
supabase/
├── migrations/          # Esquema SQL, políticas RLS, triggers y datos iniciales
└── functions/           # Edge Functions (Deno)
    ├── crear-usuario/
    ├── verificar-cedula/
    ├── verificar-correo/
    └── _shared/         # CORS y validación de cédula compartidos
```

Cada feature se divide en cuatro capas:

| Capa            | Contenido                                                                                        | Puede depender de      |
| --------------- | ------------------------------------------------------------------------------------------------ | ---------------------- |
| `domain/`       | Entidades, interfaces de repositorio y casos de uso con las reglas de negocio                    | Nada fuera de sí misma |
| `data/`         | Datasources (Supabase, Edge Functions, dispositivo), DTOs e implementaciones de los repositorios | `domain/`              |
| `presentation/` | Pantallas, componentes, hooks de TanStack Query y stores de Zustand                              | `domain/` y `di/`      |
| `di/`           | Contenedor del feature (`xxxContainer.ts`): el único lugar donde se crean las clases concretas   | Todas las anteriores   |

La regla de dependencias se comprueba con ESLint (`eslint-plugin-boundaries`, ver
[`eslint.config.js`](eslint.config.js)): por ejemplo, importar `data/` desde `domain/` hace
fallar el lint.

Los errores esperados no se lanzan como excepciones: los casos de uso devuelven un
`Result<T, AppError>` ([`src/core/utils/result.ts`](src/core/utils/result.ts)).

Alias de importación (definidos en `tsconfig.json` y `babel.config.js`):

```ts
import { Button } from "@core/ui";
import { actasContainer } from "@features/actas/di/actasContainer";
```

Cada feature tiene su propio `README.md` con el detalle de sus reglas de negocio.

## Requisitos previos

- [Node.js](https://nodejs.org) 20.19.4 o superior (o 22.13+ / 24.3+) y npm.
- Una cuenta de [Expo](https://expo.dev) para compilar con EAS.
- Un proyecto de [Supabase](https://supabase.com).
- Un proyecto de [Sentry](https://sentry.io) para React Native.
- Claves de API de [Datacil](https://datacil.com) y
  [QuickEmailVerification](https://quickemailverification.com).
- Un teléfono Android o un emulador. La app usa módulos nativos, así que **no funciona en
  Expo Go**: necesita un development build.

## Instalación

```powershell
git clone https://github.com/MariaGiron-code/ActaYa-.git
cd ActaYa-
npm install
```

Crea el archivo de variables de entorno a partir del ejemplo:

```powershell
Copy-Item .env.example .env
```

| Variable                        | Dónde se obtiene                                 |
| ------------------------------- | ------------------------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API → Project URL  |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → clave `anon` |
| `EXPO_PUBLIC_SENTRY_DSN`        | Sentry → Project Settings → Client Keys (DSN)    |

El archivo `.env` está en `.gitignore` y nunca debe subirse al repositorio. Las claves de
Datacil y QuickEmailVerification **no** van aquí: se guardan como secretos de Supabase (ver
el paso siguiente).

## Configuración del backend

1. **Aplica las migraciones** de [`supabase/migrations/`](supabase/migrations) en orden,
   desde el SQL Editor de Supabase o con la CLI:

   ```powershell
   npx supabase link --project-ref <id-del-proyecto>
   npx supabase db push
   ```

   Las migraciones crean las tablas, las políticas RLS, el bucket privado `actas-fotos`,
   los triggers del estado de las mesas, la publicación de Realtime y los datos iniciales
   de territorio.

2. **Guarda los secretos de las Edge Functions:**

   ```powershell
   npx supabase secrets set DATACIL_API_KEY=<tu-clave>
   ```

   ```powershell
   npx supabase secrets set QUICKEMAILVERIFICATION_API_KEY=<tu-clave>
   ```

3. **Despliega las Edge Functions:**

   ```powershell
   npx supabase functions deploy crear-usuario
   ```

   ```powershell
   npx supabase functions deploy verificar-cedula
   ```

   ```powershell
   npx supabase functions deploy verificar-correo
   ```

4. **Habilita el enlace de recuperación de clave:** en Supabase → Authentication → URL
   Configuration → Redirect URLs, agrega `actaya://recuperar-clave`. Sin esto, el correo de
   recuperación no abre la app.

5. **Crea la primera cuenta.** El coordinador provincial no se crea desde la app: crea el
   usuario en Supabase → Authentication y luego inserta su fila en la tabla `usuarios` con
   `rol = 'COORDINADOR_PROVINCIAL'` y `creado_por_id = null`. A partir de él, el resto de
   cuentas se crean desde la app.

## Ejecutar en desarrollo

Con un teléfono conectado por USB o un emulador abierto (requiere Android Studio):

```powershell
npm run android
```

Sin Android Studio, compila el development build en la nube e instálalo en el teléfono:

```powershell
npx eas-cli@latest build --platform android --profile development
```

Después inicia el servidor de desarrollo y abre la app instalada:

```powershell
npm start
```

La carpeta `android/` se genera automáticamente (Continuous Native Generation) y está en
`.gitignore`. No la edites a mano: la configuración nativa vive en [`app.json`](app.json).

## Generar el APK

Las compilaciones en EAS no leen el `.env` local. Sube las variables una vez (y de nuevo si
cambian):

```powershell
npx eas-cli@latest env:push preview --path .env
```

Luego compila el APK instalable:

```powershell
npm run build:apk
```

Al terminar, EAS muestra un enlace para descargar el `.apk`. Los perfiles de compilación
están en [`eas.json`](eas.json):

| Perfil        | Resultado                                          |
| ------------- | -------------------------------------------------- |
| `development` | APK con el cliente de desarrollo, para depurar     |
| `preview`     | APK instalable para pruebas y distribución interna |
| `production`  | App Bundle (`.aab`) para Google Play               |

## Scripts disponibles

| Comando             | Descripción                                           |
| ------------------- | ----------------------------------------------------- |
| `npm start`         | Inicia el servidor de desarrollo de Expo              |
| `npm run android`   | Compila e instala la app en Android                   |
| `npm run ios`       | Compila e instala la app en iOS (requiere macOS)      |
| `npm run lint`      | ESLint, incluida la regla de capas de la arquitectura |
| `npm run typecheck` | Comprobación de tipos con TypeScript                  |
| `npm run format`    | Formatea el código con Prettier                       |
| `npm run build:apk` | Compila el APK en EAS con el perfil `preview`         |

## Convenciones

- Instala las dependencias con `npx expo install <paquete>` para obtener versiones
  compatibles con el SDK.
- Ejecuta `npm run lint` y `npm run typecheck` antes de cada commit.
- Mensajes de commit con [Conventional Commits](https://www.conventionalcommits.org/es/)
  (`feat:`, `fix:`, `chore:`…) y descripción en español.
- Las claves privadas viven solo en los secretos de Supabase y se usan desde las Edge
  Functions; nunca en el código de la app.
