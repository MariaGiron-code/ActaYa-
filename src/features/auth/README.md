# Auth

Maneja las cuentas de usuario: inicio de sesión, creación de usuarios y gestión de claves.

## ADRs que aplica

| ADR    | Cómo se usa aquí                                                                          |
| ------ | ----------------------------------------------------------------------------------------- |
| ADR-01 | Las cuentas usan Supabase Auth y los datos de cada persona la tabla `usuarios`.           |
| ADR-02 | La sesión se guarda en el teléfono para no pedir la clave cada vez.                       |
| ADR-03 | Al iniciar sesión se identifica al usuario en Sentry para saber a quién afecta un fallo.  |
| ADR-09 | Los formularios usan React Hook Form y Zod.                                               |
| ADR-11 | La cédula y el correo se verifican con Edge Functions (Datacil y QuickEmailVerification). |
| ADR-12 | La sesión del usuario se guarda en un store de Zustand.                                   |

## Qué se implementa

- **Iniciar sesión** con correo y clave.
- **Crear usuarios** según la jerarquía:
  - el coordinador provincial crea coordinadores de recinto, y
  - el coordinador de recinto crea veedores.
- **Verificaciones al crear un usuario:** se comprueba que la cédula exista y coincida con
  el nombre, y que el correo sea real.
- **Clave temporal:** el usuario nuevo recibe una clave temporal y debe cambiarla la
  primera vez que entra.
- **Recuperar la clave:** se envía un enlace al correo que abre la app para crear una clave
  nueva.

## Archivos principales

| Archivo                                                 | Qué hace                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `domain/use-cases/IniciarSesionUseCase.ts`              | Inicia sesión.                                               |
| `domain/use-cases/CrearUsuarioUseCase.ts`               | Verifica cédula y correo y crea el usuario.                  |
| `domain/use-cases/EstablecerClaveInicialUseCase.ts`     | Cambia la clave temporal por una propia.                     |
| `domain/use-cases/RecuperarClaveUseCase.ts`             | Envía el correo de recuperación.                             |
| `domain/use-cases/CompletarRecuperacionClaveUseCase.ts` | Guarda la clave nueva desde el enlace del correo.            |
| `presentation/store/useSessionStore.ts`                 | Guarda la sesión del usuario actual.                         |
| `presentation/screens/`                                 | Pantallas de inicio de sesión, creación de usuario y claves. |

## Backend

- `supabase/migrations/0001_usuarios.sql`: tabla `usuarios` y sus reglas de acceso (RLS).
- Edge Functions en `supabase/functions/`:
  - `crear-usuario`: crea la cuenta en el servidor.
  - `verificar-cedula`: consulta Datacil.
  - `verificar-correo`: consulta QuickEmailVerification.
