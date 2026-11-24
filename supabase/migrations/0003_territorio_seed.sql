-- Precarga obligatoria del examen (S-01, S-17). Jurisdicción elegida:
-- parroquia Iñaquito, cantón Quito, provincia Pichincha.
--
-- FUENTES Y ADVERTENCIAS (léelas antes de defender esto en el examen):
--
-- RECINTOS: "Colegio Municipal Sebastián de Benalcázar" está confirmado con
-- fuente sólida (recinto grande y tradicional de Iñaquito, usado en la
-- consulta popular de nov-2025 — Expreso). "U.E.F. San Francisco de Quito" y
-- "U.E. Santa María Eufrasia" los verificaste tú directamente en
-- lugarvotacion.cne.gob.ec con tu cédula — si ese buscador te mostró una
-- parroquia distinta a Iñaquito para alguno de los dos, CORRIGE la columna
-- `parroquia` de ese recinto antes de entregar.
--
-- NÚMERO DE JRV POR RECINTO: el CNE no publica esta cifra en fuentes
-- indexables (solo vía su buscador oficial). Los 3 números de JRV de abajo
-- son un valor PLACEHOLDER razonable (no inventado como dato "real" de
-- prensa, sino elegido para que la demo tenga varias mesas) — AJÚSTALOS a
-- los números reales que veas en lugarvotacion.cne.gob.ec antes de la
-- defensa, o bórralos y usa "Agregar recinto" desde la app si prefieres
-- cargarlos manualmente con el dato correcto.
--
-- CANDIDATOS: corresponden a calificaciones del CNE reportadas por prensa
-- (Primicias, El Comercio, Vistazo) a fines de septiembre de 2026, para la
-- elección seccional adelantada del 29-nov-2026. La lista definitiva del CNE
-- (posterior a impugnaciones, publicada ~9-nov-2026) no se pudo confirmar en
-- esta investigación — verifica contra la papeleta oficial antes de defender
-- el examen, especialmente los números de lista.

with recintos_nuevos as (
  insert into public.recintos (provincia, canton, parroquia, nombre)
  values
    ('Pichincha', 'Quito', 'Iñaquito', 'Colegio Municipal Sebastián de Benalcázar'),
    ('Pichincha', 'Quito', 'Iñaquito', 'U.E.F. San Francisco de Quito'),
    ('Pichincha', 'Quito', 'Iñaquito', 'U.E. Santa María Eufrasia')
  returning id, nombre
)
-- Placeholder: 3 JRV por recinto (ver advertencia arriba).
insert into public.mesas (recinto_id, numero_jrv)
select id, numero_jrv
from recintos_nuevos
cross join (values ('001'), ('002'), ('003')) as jrv(numero_jrv);

with organizaciones_nuevas as (
  insert into public.organizaciones_politicas (nombre, siglas)
  values
    ('Imparables', 'IMPARABLES'),
    ('Acción Democrática Nacional', 'ADN'),
    ('Partido Sociedad Patriótica', 'PSP'),
    ('Unidad Popular', 'UP'),
    ('Partido Social Cristiano', 'PSC')
  returning id, siglas
)
insert into public.candidatos (organizacion_id, dignidad, nombres)
select id, dignidad, nombres
from organizaciones_nuevas
join (
  values
    ('IMPARABLES', 'ALCALDIA', 'Wilson Merino'),
    ('IMPARABLES', 'PREFECTURA', 'Juan Ernesto Zapata Silva'),
    ('ADN', 'ALCALDIA', 'Harold Burbano'),
    ('ADN', 'PREFECTURA', 'Geovanna Ubidia'),
    ('PSP', 'ALCALDIA', 'Bernardo Jijón'),
    ('PSP', 'PREFECTURA', 'Jorge Washington Pinto Dávila'),
    ('UP', 'ALCALDIA', 'Pabel Muñoz'),
    ('UP', 'PREFECTURA', 'Alexandro Tonello'),
    ('PSC', 'ALCALDIA', 'Linda Romero'),
    ('PSC', 'PREFECTURA', 'Gema Ormaza')
) as candidatos_nuevos(siglas, dignidad, nombres)
  on candidatos_nuevos.siglas = organizaciones_nuevas.siglas;
