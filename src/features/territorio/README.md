# Feature: territorio

**Estado:** domain listo, falta `data/` y `presentation/`.

## Qué resuelve
- RF-06: el coordinador provincial ve los recintos de su jurisdicción (precargados) y puede agregar nuevos.
- Restricción del examen: recintos, JRV y las 5 organizaciones políticas con sus candidatos a alcaldía y prefectura deben venir **precargados**.
- S-01: usa la provincia/cantón que elijas, con sus parroquias, recintos y JRV reales (no inventes nombres ni cantidades).
- S-17: las 5 organizaciones deben ser reales, con participación en ambas dignidades, tomando como referencia las candidaturas oficiales de 2026 en la jurisdicción elegida.

## Qué falta construir
1. **Precarga** (migración SQL en `supabase/migrations/`): tablas `recintos`, `mesas`, `organizaciones_politicas`, `candidatos`, con un `seed.sql` que inserte los datos reales de tu provincia/cantón.
2. `data/dto/` — mappers fila ↔ entidad (copia el patrón de `features/auth/data/dto/UsuarioDTO.ts`).
3. `data/datasources/SupabaseTerritorioDatasource.ts` y `data/repositories/TerritorioRepositoryImpl.ts` (implementa `TerritorioRepository`).
4. `domain/use-cases/AgregarRecintoUseCase.ts` — valida que quien lo llama sea `COORDINADOR_PROVINCIAL` (RLS en Supabase debe exigir lo mismo del lado del servidor).
5. `presentation/` — pantalla de lista de recintos + formulario para agregar uno, usando `@core/ui` y TanStack Query (sigue el patrón de `features/auth/presentation/hooks/useAuth.ts`).
6. `di/territorioContainer.ts` — composition root, igual que `features/auth/di/authContainer.ts`.

## Regla de dependencia (ADR-12)
`domain/` no debe importar nada de `data/` ni `presentation/`. La presentación solo habla con `domain/use-cases`, nunca directo con Supabase.
