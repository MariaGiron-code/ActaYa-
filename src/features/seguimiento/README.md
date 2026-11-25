# Seguimiento

Panel para el coordinador provincial: muestra en tiempo real cuántas mesas han reportado y
cuántos votos lleva cada candidato.

## ADRs que aplica

| ADR    | Cómo se usa aquí                                                    |
| ------ | ------------------------------------------------------------------- |
| ADR-01 | Los totales se calculan con funciones SQL en Supabase.              |
| ADR-03 | Los fallos de la app se revisan directamente en el panel de Sentry. |
| ADR-07 | Los gráficos de barras usan react-native-gifted-charts.             |
| ADR-08 | TanStack Query carga los datos del panel.                           |
| ADR-10 | Supabase Realtime actualiza el panel cuando llega un acta nueva.    |

## Qué se implementa

- **Mesas reportadas por recinto:** cuántas mesas ya enviaron sus dos actas (alcaldía y
  prefectura) frente al total.
- **Votos por candidato:** el conteo acumulado de cada dignidad, con un selector para pasar
  de alcaldía a prefectura.
- **Actualización en vivo:** cada acta nueva actualiza el panel al instante, sin recargar
  ni consultar al servidor cada cierto tiempo.
- **Aviso de ubicaciones:** lista las actas registradas con ubicación no verificada o sin
  ubicación, para revisarlas.

## Archivos principales

| Archivo                                             | Qué hace                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------- |
| `data/datasources/SupabaseSeguimientoDatasource.ts` | Consulta los totales y escucha los cambios en tiempo real.                  |
| `presentation/hooks/useSeguimiento.ts`              | Carga los datos y se suscribe a Realtime mientras la pantalla está abierta. |
| `presentation/screens/PanelSeguimientoScreen.tsx`   | Pantalla del panel con los gráficos.                                        |

## Base de datos

Migración `supabase/migrations/0007_seguimiento.sql`:

- Trigger `actualizar_estado_mesa`: marca la mesa como completa cuando tiene sus dos actas.
- Funciones `resumen_por_recinto()` y `progreso_por_dignidad()`: calculan los totales del
  panel.
- Activa Realtime en la tabla `actas`.
