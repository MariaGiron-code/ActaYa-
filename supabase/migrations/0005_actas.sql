-- ADR-01 / RF-09 a RF-14 / S-02 / S-05 / S-10.

create table if not exists public.actas (
  -- Generado en el dispositivo (RF-13): el servidor rechaza duplicados por
  -- violación de esta llave primaria en vez de crear una fila nueva cuando
  -- el veedor reintenta un envío que en realidad sí llegó.
  id uuid primary key,
  mesa_id uuid not null references public.mesas(id),
  dignidad text not null check (dignidad in ('ALCALDIA', 'PREFECTURA')),
  votos_por_organizacion jsonb not null,
  votos_nulos integer not null check (votos_nulos >= 0),
  votos_blancos integer not null check (votos_blancos >= 0),
  total_sufragantes integer not null check (total_sufragantes >= 0),
  -- Ruta dentro del bucket `actas-fotos`, no una URI local del dispositivo (RF-11).
  foto_path text not null,
  ubicacion_lat double precision,
  ubicacion_lng double precision,
  ubicacion_capturada_en timestamptz,
  -- S-10: false si pasaron más de 5 minutos entre capturar la ubicación y guardar el acta.
  ubicacion_verificada boolean not null default false,
  -- S-05: concurrencia optimista — una corrección basada en una versión vieja se rechaza.
  version integer not null default 1,
  registrado_por_id uuid not null references public.usuarios(id),
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now(),
  -- Una mesa tiene exactamente un acta por dignidad (RF-09).
  unique (mesa_id, dignidad)
);

alter table public.actas enable row level security;

-- RF-09: el veedor registra actas únicamente de las mesas que tiene asignadas.
create policy "actas_insert_veedor_asignado"
  on public.actas for insert
  to authenticated
  with check (
    registrado_por_id = auth.uid()
    and exists (
      select 1 from public.asignaciones_veedor a
      where a.mesa_id = actas.mesa_id and a.veedor_id = auth.uid() and a.activa = true
    )
  );

-- Lectura: el veedor ve sus propias actas; el coordinador de recinto ve las
-- de su recinto (RF-12, confidencialidad RF-15); el provincial las ve todas
-- (RF-16/seguimiento).
create policy "actas_select_alcance"
  on public.actas for select
  to authenticated
  using (
    registrado_por_id = auth.uid()
    or exists (
      select 1
      from public.usuarios u
      join public.mesas m on m.id = actas.mesa_id
      where u.id = auth.uid()
        and (
          u.rol = 'COORDINADOR_PROVINCIAL'
          or (u.rol = 'COORDINADOR_RECINTO' and u.recinto_id = m.recinto_id)
        )
    )
  );

-- RF-12: el veedor que la registró o el coordinador de su recinto pueden
-- corregirla. La concurrencia optimista (S-05) la aplica la propia consulta
-- UPDATE ... WHERE id = ? AND version = ? desde el cliente (ver
-- SupabaseActasDatasource.corregir), esta policy solo cubre el ALCANCE.
create policy "actas_update_alcance"
  on public.actas for update
  to authenticated
  using (
    registrado_por_id = auth.uid()
    or exists (
      select 1
      from public.usuarios u
      join public.mesas m on m.id = actas.mesa_id
      where u.id = auth.uid() and u.rol = 'COORDINADOR_RECINTO' and u.recinto_id = m.recinto_id
    )
  )
  with check (
    registrado_por_id = auth.uid()
    or exists (
      select 1
      from public.usuarios u
      join public.mesas m on m.id = actas.mesa_id
      where u.id = auth.uid() and u.rol = 'COORDINADOR_RECINTO' and u.recinto_id = m.recinto_id
    )
  );

-- Bucket de Storage para las fotos de actas (ADR-01). Privado: se accede
-- por URL firmada, nunca público.
insert into storage.buckets (id, name, public)
values ('actas-fotos', 'actas-fotos', false)
on conflict (id) do nothing;

-- Convención de ruta: `{veedorId}/{actaId}.jpg` — así el veedor solo puede
-- escribir dentro de su propia carpeta (storage.foldername(name)[1]).
create policy "actas_fotos_insert_propio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'actas-fotos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "actas_fotos_select_alcance"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'actas-fotos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.usuarios u
        where u.id = auth.uid() and u.rol in ('COORDINADOR_RECINTO', 'COORDINADOR_PROVINCIAL')
      )
    )
  );
