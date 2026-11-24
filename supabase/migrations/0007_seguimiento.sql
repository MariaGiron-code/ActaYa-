-- ADR-01 / ADR-07 / ADR-10 / RF-16 / RNF-07 / S-02.

-- Faltaba desde 0002/0005: `mesas.estado` se diseñó para marcarse 'completa'
-- cuando llegan AMBAS actas (S-02), pero nada lo actualizaba todavía. Se
-- hace con un trigger (no en el cliente) para que sea imposible que quede
-- desincronizado si una acta se inserta por cualquier otro camino.
create or replace function public.actualizar_estado_mesa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mesas
  set estado = case
    when (select count(distinct dignidad) from public.actas where mesa_id = new.mesa_id) = 2
      then 'completa'
    else 'pendiente'
  end
  where id = new.mesa_id;
  return new;
end;
$$;

drop trigger if exists actas_actualiza_estado_mesa on public.actas;
create trigger actas_actualiza_estado_mesa
  after insert on public.actas
  for each row
  execute function public.actualizar_estado_mesa();

-- RF-16: mesas reportadas/pendientes por recinto. `security definer` porque
-- la cuenta el trigger de arriba, sin depender de qué políticas RLS vea
-- quien llama (recintos/mesas ya son de lectura abierta para autenticados,
-- esto no expone nada que no se pudiera calcular ya con listarMesasPorRecinto).
create or replace function public.resumen_por_recinto()
returns table (
  recinto_id uuid,
  nombre_recinto text,
  mesas_reportadas bigint,
  mesas_totales bigint
)
language sql
stable
as $$
  select
    r.id as recinto_id,
    r.nombre as nombre_recinto,
    count(*) filter (where m.estado = 'completa') as mesas_reportadas,
    count(*) as mesas_totales
  from public.recintos r
  left join public.mesas m on m.recinto_id = r.id
  group by r.id, r.nombre
  order by r.nombre;
$$;

-- RF-16: votos acumulados por candidato de una dignidad, directo desde las
-- actas (no desde una copia/caché) para que nunca se desincronice.
create or replace function public.progreso_por_dignidad(p_dignidad text)
returns table (
  candidato_id uuid,
  nombres text,
  organizacion_siglas text,
  votos_totales bigint
)
language sql
stable
as $$
  select
    c.id as candidato_id,
    c.nombres,
    o.siglas as organizacion_siglas,
    coalesce(sum((a.votos_por_organizacion ->> c.organizacion_id::text)::int), 0) as votos_totales
  from public.candidatos c
  join public.organizaciones_politicas o on o.id = c.organizacion_id
  left join public.actas a on a.dignidad = p_dignidad
  where c.dignidad = p_dignidad
  group by c.id, c.nombres, o.siglas
  order by votos_totales desc;
$$;

-- ADR-10: sin esto, el cliente puede suscribirse a Realtime pero nunca le
-- va a llegar ningún evento (los cambios no se publican por defecto).
alter publication supabase_realtime add table public.actas;
