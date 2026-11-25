# Personal

Permite al coordinador de recinto asignar un veedor a cada mesa y reemplazarlo si no se
presenta el día de la elección.

## ADRs que aplica

| ADR    | Cómo se usa aquí                                                           |
| ------ | -------------------------------------------------------------------------- |
| ADR-01 | Las asignaciones se guardan en la tabla `asignaciones_veedor` de Supabase. |
| ADR-08 | TanStack Query carga y actualiza la lista de asignaciones.                 |
| ADR-09 | El formulario de la persona nueva usa React Hook Form y Zod.               |
| ADR-11 | Al registrar a una persona nueva se verifican su cédula y su correo.       |

## Qué se implementa

- **Asignar veedor:** el coordinador ve las mesas de su recinto y elige un veedor para cada
  una.
- **Reemplazar veedor:** si el veedor no llega, se puede poner en su lugar:
  - un veedor que ya existe, o
  - una persona nueva, que se registra en el momento con las mismas verificaciones que
    cualquier usuario.
- **Confidencialidad:** el coordinador de recinto solo ve las mesas de su recinto. El
  coordinador provincial ve todas.

## Archivos principales

| Archivo                                       | Qué hace                                                        |
| --------------------------------------------- | --------------------------------------------------------------- |
| `domain/use-cases/AsignarVeedorUseCase.ts`    | Asigna un veedor a una mesa.                                    |
| `domain/use-cases/ReemplazarVeedorUseCase.ts` | Reemplaza al veedor con uno existente o con una persona nueva.  |
| `presentation/screens/AsignacionesScreen.tsx` | Pantalla "Mis veedores".                                        |
| `di/personalContainer.ts`                     | Reutiliza la creación de usuarios de `auth` para no duplicarla. |

## Base de datos

Migración `supabase/migrations/0004_personal.sql`:

- Tabla `asignaciones_veedor`: qué veedor cubre cada mesa.
- Columna `usuarios.recinto_id`: el recinto que coordina cada coordinador de recinto.
- Reglas de acceso (RLS): cada coordinador solo ve y modifica las asignaciones de su
  recinto.
