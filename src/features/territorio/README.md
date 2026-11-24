# Feature: territorio

**Estado:** completo (domain + data + presentation + di), con precarga real
aplicada en Supabase.

## Qué resuelve
- RF-06: el coordinador provincial ve los recintos precargados (jurisdicción:
  parroquia Iñaquito, cantón Quito, provincia Pichincha) y puede agregar
  nuevos desde `RecintosScreen`.
- S-01 / S-17: recintos, JRV y las 5 organizaciones políticas con candidatos
  a alcaldía y prefectura están precargados vía
  `supabase/migrations/0002_territorio.sql` (esquema + RLS) y
  `0003_territorio_seed.sql` (datos reales).

## ⚠️ Verifica antes de defender el examen
El seed (`0003_territorio_seed.sql`) trae datos reales investigados en
noviembre de 2026, pero con dos advertencias explícitas en el propio archivo:

1. **Número de JRV por recinto:** el CNE no lo publica en fuentes indexables;
   los 3 JRV por recinto son un placeholder razonable, no un dato de prensa
   verificado. Ajústalos con lo que veas en `lugarvotacion.cne.gob.ec`.
2. **Candidatos:** son de calificaciones del CNE reportadas por prensa a
   fines de septiembre de 2026. La elección es el 29-nov-2026 — verifica la
   lista definitiva/papeleta oficial antes de defenderlo, especialmente los
   números de lista que no se pudieron confirmar.

## Qué se construyó
- `data/dto/TerritorioDTO.ts` — mappers fila ↔ entidad para las 4 tablas.
- `data/datasources/SupabaseTerritorioDatasource.ts` + `data/repositories/TerritorioRepositoryImpl.ts`.
- `domain/use-cases/AgregarRecintoUseCase.ts` — exige `COORDINADOR_PROVINCIAL` (reforzado también por RLS en Supabase, no solo en el cliente).
- `presentation/hooks/useTerritorio.ts` + `presentation/screens/RecintosScreen.tsx` — lista de recintos y formulario para agregar uno, con TanStack Query.
- `di/territorioContainer.ts`.
- Registrado en `src/app/navigation/RootNavigator.tsx` (ruta `Recintos`, accesible desde `InicioScreen` para el coordinador provincial).

## Qué falta (fuera del alcance de este feature)
- `listarMesasPorRecinto` ya existe en el repositorio, pero ninguna pantalla
  la consume todavía — la usará `actas` (elegir JRV para registrar un acta) y
  `personal` (asignar veedor a una JRV).
- `listarOrganizacionesConCandidatos` ya existe en el repositorio, pero
  ninguna pantalla la consume todavía — la usará `actas` (formulario de
  conteo por candidato).
