# Territorio

Contiene los datos de la elección: recintos electorales, mesas (JRV) y organizaciones
políticas con sus candidatos. Los demás módulos los usan para registrar actas y asignar
veedores.

## ADRs que aplica

| ADR    | Cómo se usa aquí                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------- |
| ADR-01 | Los datos se guardan en tablas de Supabase.                                                         |
| ADR-08 | TanStack Query carga los recintos, mesas y candidatos y los guarda en caché para usarlos sin señal. |
| ADR-09 | El formulario para agregar un recinto usa React Hook Form y Zod.                                    |

## Qué se implementa

- **Datos precargados:** recintos de la parroquia Iñaquito (cantón Quito, provincia de
  Pichincha), sus mesas y las organizaciones políticas con sus candidatos a alcaldía y
  prefectura.
- **Ver y agregar recintos:** el coordinador provincial ve la lista y puede agregar
  recintos nuevos. Solo él tiene permiso para hacerlo.

## Archivos principales

| Archivo                                       | Qué hace                                                      |
| --------------------------------------------- | ------------------------------------------------------------- |
| `domain/use-cases/AgregarRecintoUseCase.ts`   | Agrega un recinto; solo lo permite al coordinador provincial. |
| `domain/repositories/TerritorioRepository.ts` | Lista recintos, mesas y organizaciones con candidatos.        |
| `presentation/screens/RecintosScreen.tsx`     | Pantalla de recintos.                                         |

## Base de datos

- `supabase/migrations/0002_territorio.sql`: tablas `recintos`, `mesas`,
  `organizaciones_politicas` y `candidatos`, con sus reglas de acceso (RLS).
- `supabase/migrations/0003_territorio_seed.sql`: los datos precargados, con las fuentes de
  donde se tomaron.
