-- ADR-01 / RF-07 / RF-08 / RF-15 / S-03.

-- Falta desde 0001: un COORDINADOR_RECINTO necesita saber qué recinto
-- coordina, tanto para la UI ("mis mesas") como para las políticas RLS de
-- abajo ("solo veo las asignaciones de mi recinto").
alter table public.usuarios
  add column if not exists recinto_id uuid references public.recintos(id);

create table if not exists public.asignaciones_veedor (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas(id) on delete cascade,
  veedor_id uuid not null references public.usuarios(id),
  activa boolean not null default true,
  -- S-03: si esta asignación reemplaza a un veedor ausente el día de la elección.
  reemplaza_asignacion_id uuid references public.asignaciones_veedor(id),
  asignado_en timestamptz not null default now()
);

alter table public.asignaciones_veedor enable row level security;

-- Un veedor ve únicamente sus propias asignaciones.
create policy "asignaciones_select_propia"
  on public.asignaciones_veedor for select
  to authenticated
  using (veedor_id = auth.uid());

-- RF-15: un coordinador de recinto ve solo las de SU recinto; el
-- coordinador provincial las ve todas (necesario para RF-16/seguimiento).
create policy "asignaciones_select_coordinador"
  on public.asignaciones_veedor for select
  to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      join public.mesas m on m.id = asignaciones_veedor.mesa_id
      where u.id = auth.uid()
        and (
          u.rol = 'COORDINADOR_PROVINCIAL'
          or (u.rol = 'COORDINADOR_RECINTO' and u.recinto_id = m.recinto_id)
        )
    )
  );

-- Solo el coordinador de SU recinto puede asignar/reemplazar veedores en sus mesas.
create policy "asignaciones_insert_coordinador_recinto"
  on public.asignaciones_veedor for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.usuarios u
      join public.mesas m on m.id = asignaciones_veedor.mesa_id
      where u.id = auth.uid()
        and u.rol = 'COORDINADOR_RECINTO'
        and u.recinto_id = m.recinto_id
    )
  );

-- Necesario para desactivar (activa = false) la asignación reemplazada (S-03).
create policy "asignaciones_update_coordinador_recinto"
  on public.asignaciones_veedor for update
  to authenticated
  using (
    exists (
      select 1
      from public.usuarios u
      join public.mesas m on m.id = asignaciones_veedor.mesa_id
      where u.id = auth.uid()
        and u.rol = 'COORDINADOR_RECINTO'
        and u.recinto_id = m.recinto_id
    )
  )
  with check (
    exists (
      select 1
      from public.usuarios u
      join public.mesas m on m.id = asignaciones_veedor.mesa_id
      where u.id = auth.uid()
        and u.rol = 'COORDINADOR_RECINTO'
        and u.recinto_id = m.recinto_id
    )
  );
