-- ADR-01 / RF-06 / S-01 / S-17.
-- Catálogo territorial: recintos, JRV (mesas) y organizaciones políticas con
-- sus candidatos. Las filas reales (precarga obligatoria del examen) se
-- insertan en 0003_territorio_seed.sql, una vez verificados los datos.

create table if not exists public.recintos (
  id uuid primary key default gen_random_uuid(),
  provincia text not null,
  canton text not null,
  parroquia text not null,
  nombre text not null,
  creado_en timestamptz not null default now()
);

create table if not exists public.mesas (
  id uuid primary key default gen_random_uuid(),
  recinto_id uuid not null references public.recintos(id) on delete cascade,
  numero_jrv text not null,
  -- S-02: solo "completa" cuando AMBAS actas (alcaldía y prefectura) están
  -- guardadas en el servidor con foto y ubicación (lo actualiza `actas`).
  estado text not null default 'pendiente' check (estado in ('pendiente', 'completa')),
  unique (recinto_id, numero_jrv)
);

create table if not exists public.organizaciones_politicas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  siglas text not null unique
);

create table if not exists public.candidatos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones_politicas(id) on delete cascade,
  dignidad text not null check (dignidad in ('ALCALDIA', 'PREFECTURA')),
  nombres text not null,
  -- S-17: cada organización precargada participa en AMBAS dignidades.
  unique (organizacion_id, dignidad)
);

alter table public.recintos enable row level security;
alter table public.mesas enable row level security;
alter table public.organizaciones_politicas enable row level security;
alter table public.candidatos enable row level security;

-- Las 4 tablas son de lectura para cualquier usuario autenticado (veedor,
-- coordinador de recinto o provincial): todos necesitan ver el catálogo para
-- registrar/revisar actas.
create policy "recintos_select_autenticados" on public.recintos for select to authenticated using (true);
create policy "mesas_select_autenticados" on public.mesas for select to authenticated using (true);
create policy "organizaciones_select_autenticados" on public.organizaciones_politicas for select to authenticated using (true);
create policy "candidatos_select_autenticados" on public.candidatos for select to authenticated using (true);

-- RF-06: solo el coordinador provincial puede agregar recintos nuevos. La
-- comprobación de rol en `AgregarRecintoUseCase` (cliente) es solo feedback
-- inmediato (RF-13); esta policy es la barrera de seguridad real.
create policy "recintos_insert_coordinador_provincial"
  on public.recintos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.usuarios
      where usuarios.id = auth.uid()
        and usuarios.rol = 'COORDINADOR_PROVINCIAL'
    )
  );

-- Mesas, organizaciones y candidatos NO tienen policy de insert para
-- `authenticated`: son precarga (S-01/S-17), se cargan por migración/SQL
-- Editor, nunca desde la app.
