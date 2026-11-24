# Feature: personal

**Estado:** completo (domain + data + presentation + di).

## Qué resuelve
- RF-07: el coordinador de recinto asigna un veedor a cada mesa de su recinto.
- RF-08 / S-03: reemplazo de un veedor ausente el mismo día, con un veedor
  existente o con una persona externa que se da de alta en el momento
  (`ReemplazarVeedorUseCase` reutiliza `authContainer.crearUsuarioUseCase` —
  la verificación real de cédula/correo no se relaja por ser urgente).
- Confidencialidad (RF-15): un coordinador de recinto solo ve/edita las
  asignaciones de SU recinto; el coordinador provincial las ve todas.
  Reforzado con RLS en `supabase/migrations/0004_personal.sql`, no solo en
  el cliente.

## Pieza que faltaba y se agregó
El esquema original (`0001_usuarios.sql`) no tenía forma de saber qué
recinto coordina un `COORDINADOR_RECINTO` — necesario para la RLS de arriba
y para que la pantalla sepa qué mesas mostrarle. Se agregó:
- Columna `usuarios.recinto_id` (migración `0004_personal.sql`).
- Campo `recintoId` en `CrearUsuarioInput`/`Usuario` (feature `auth`) y un
  selector de recinto en `CrearUsuarioScreen` cuando se crea un
  `COORDINADOR_RECINTO`.
- `AuthRepository.listarSubordinados()` (antes no expuesto, aunque la RLS
  `usuarios_select_subordinados` ya lo permitía desde 0001) — lo usa esta
  pantalla para ofrecer "elegir veedor existente".

## Qué se construyó
- `data/dto/AsignacionVeedorDTO.ts`, `data/datasources/SupabasePersonalDatasource.ts`, `data/repositories/PersonalRepositoryImpl.ts`.
- `domain/use-cases/AsignarVeedorUseCase.ts` (RF-07) y `ReemplazarVeedorUseCase.ts` (RF-08/S-03, con rama "veedor existente" y rama "persona nueva").
- `presentation/hooks/usePersonal.ts` + `presentation/screens/AsignacionesScreen.tsx`.
- `di/personalContainer.ts` — reutiliza `authContainer.crearUsuarioUseCase` en vez de duplicarlo.
- Registrado en `src/app/navigation/RootNavigator.tsx` (rutas `Asignaciones` y `CrearUsuario`), con botones desde `InicioScreen` para `COORDINADOR_PROVINCIAL` (crear coordinador de recinto) y `COORDINADOR_RECINTO` (ver "Mis veedores" / crear veedor).

## Qué falta (fuera del alcance de este feature)
- `AsignacionVeedor` no se consulta todavía desde `actas` (quién registra cada acta) ni desde `seguimiento` (RF-16 necesita saber cuántas mesas tienen veedor asignado).
