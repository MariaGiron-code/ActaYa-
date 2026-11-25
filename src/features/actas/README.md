# Actas

Permite al veedor registrar las actas de escrutinio de sus mesas y, al veedor o al
coordinador de recinto, corregirlas después.

## ADRs que aplica

| ADR    | Cómo se usa aquí                                                                               |
| ------ | ---------------------------------------------------------------------------------------------- |
| ADR-01 | Las actas se guardan en la tabla `actas` y las fotos en el bucket `actas-fotos` de Supabase.   |
| ADR-02 | Las actas pendientes se guardan en AsyncStorage y la foto en el teléfono con expo-file-system. |
| ADR-03 | Los errores al enviar o corregir un acta se reportan a Sentry.                                 |
| ADR-04 | La foto se toma con expo-image-picker y la ubicación con expo-location.                        |
| ADR-05 | Con NetInfo se detecta cuándo vuelve la señal para enviar las actas pendientes.                |
| ADR-06 | Se mide la nitidez de la foto con expo-image-manipulator y jpeg-js.                            |
| ADR-08 | TanStack Query maneja el guardado, el envío y la lista de actas.                               |

## Qué se implementa

**Registrar un acta**

1. El veedor elige la mesa y la dignidad (alcaldía o prefectura).
2. Ingresa los votos de cada organización, los nulos, los blancos y el total de sufragantes.
   La app comprueba que las cuentas cuadren.
3. Toma la foto del acta. Si sale borrosa, se rechaza y debe repetirla.
4. Junto con la foto se guarda la ubicación.
5. El acta se guarda **primero en el teléfono** y luego se envía al servidor.

**Sin internet**

- Tomar la foto y guardar el acta funcionan sin conexión.
- El acta queda como "Esperando señal" y se envía sola cuando vuelve la conexión.
- Cada acta tiene un identificador creado en el teléfono, así que reenviarla nunca crea un
  duplicado.

**Ubicación del acta**

| Estado                   | Cuándo pasa                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| Verificada (verde)       | El GPS dio una posición actual.                                     |
| No verificada (amarillo) | El GPS no respondió y se usó la última ubicación conocida.          |
| Sin ubicación (rojo)     | El GPS estaba apagado o no se dio permiso. El acta se guarda igual. |

Las actas no verificadas o sin ubicación se marcan para que el coordinador las revise.

**Corregir un acta**

- El veedor ve sus actas y el coordinador de recinto ve todas las de su recinto.
- Se pueden cambiar los votos y volver a tomar la foto con su ubicación.
- Si otra persona corrigió la misma acta antes, la app avisa y muestra la versión más
  reciente en lugar de sobrescribirla.
- Corregir necesita conexión a internet.

**Aviso de demora**

Después del cierre de la votación (17:00), si al veedor le faltan actas por registrar
aparece un aviso amarillo a los 10 minutos y rojo a los 90.

## Archivos principales

| Archivo                                                 | Qué hace                                                |
| ------------------------------------------------------- | ------------------------------------------------------- |
| `domain/use-cases/RegistrarActaUseCase.ts`              | Valida y guarda el acta en el teléfono.                 |
| `domain/use-cases/SincronizarActasPendientesUseCase.ts` | Envía las actas pendientes al servidor.                 |
| `domain/use-cases/CapturarFotoActaUseCase.ts`           | Toma la foto, revisa su nitidez y obtiene la ubicación. |
| `domain/use-cases/CorregirActaUseCase.ts`               | Corrige un acta y detecta si alguien la cambió antes.   |
| `domain/use-cases/ValidarActaUseCase.ts`                | Comprueba que los votos cuadren.                        |
| `domain/use-cases/EvaluarNitidezFoto.ts`                | Define el nivel mínimo de nitidez (150).                |
| `domain/use-cases/CalcularAlertaDemoraRegistro.ts`      | Calcula el aviso de demora.                             |
| `presentation/screens/RegistrarActaScreen.tsx`          | Pantalla para registrar actas.                          |
| `presentation/screens/CorregirActasScreen.tsx`          | Pantalla para corregir actas.                           |

## Base de datos

Migración `supabase/migrations/0005_actas.sql`:

- Tabla `actas`: una sola acta por mesa y dignidad.
- Bucket privado `actas-fotos`: cada usuario sube las fotos en su propia carpeta.
- Reglas de acceso (RLS): el veedor solo registra en las mesas que tiene asignadas y cada
  usuario solo ve y corrige las actas de su alcance.
