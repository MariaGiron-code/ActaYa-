-- ADR-01 / RF-01 a RF-05 / RNF-04.
-- Tabla de perfiles de aplicación, separada de auth.users (que administra Supabase).

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  cedula text not null unique,
  nombres text not null,
  apellidos text not null,
  telefono text not null,
  correo text not null unique,
  correo_verificado boolean not null default false,
  rol text not null check (rol in ('COORDINADOR_PROVINCIAL', 'COORDINADOR_RECINTO', 'VEEDOR')),
  creado_por_id uuid references public.usuarios(id),
  debe_cambiar_clave boolean not null default true,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Caché de verificación de correo (ADR-11): evita pagar dos veces por el mismo correo.
create table if not exists public.correos_verificados (
  correo text primary key,
  entregable boolean not null,
  verificado_en timestamptz not null default now()
);

alter table public.usuarios enable row level security;
alter table public.correos_verificados enable row level security;

-- Cada usuario puede leer su propio perfil.
create policy "usuarios_select_propio"
  on public.usuarios for select
  using (id = auth.uid());

-- Un coordinador de recinto ve a sus veedores; el provincial ve a todos sus coordinadores de recinto.
create policy "usuarios_select_subordinados"
  on public.usuarios for select
  using (creado_por_id = auth.uid());

-- Las escrituras (creación/baja) pasan SIEMPRE por la Edge Function `crear-usuario`
-- (usa la service_role key), así que no se define aquí una policy de INSERT para
-- el rol `authenticated`: el cliente nunca debe poder insertar directamente.

-- RF-15: confidencialidad — cada rol ve solo lo suyo. Ajusta/agrega policies
-- equivalentes en las tablas de `territorio`, `personal`, `actas` y `seguimiento`
-- a medida que las crees; no dependas únicamente de los filtros del lado del cliente.
