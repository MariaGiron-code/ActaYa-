import { fail, ok, Result } from '@core/utils/result';
import { Acta } from '../entities/Acta';

/**
 * RF-10: detectar en el momento del registro los errores que en elecciones
 * anteriores llegaron en papel — una organización con más votos que el
 * total de sufragantes, o una suma que no cuadra — en vez de descubrirlos
 * días después.
 *
 * Es una función pura: no toca red ni almacenamiento, así que es la pieza
 * más fácil de defender y de probar con casos de ejemplo en la sustentación.
 */
export function validarActa(
  acta: Pick<Acta, 'votosPorOrganizacion' | 'votosNulos' | 'votosBlancos' | 'totalSufragantes'>
): Result<void> {
  const { votosPorOrganizacion, votosNulos, votosBlancos, totalSufragantes } = acta;

  if (totalSufragantes < 0 || votosNulos < 0 || votosBlancos < 0) {
    return fail({ code: 'VOTOS_NEGATIVOS', message: 'Ningún valor puede ser negativo.' });
  }

  for (const [organizacionId, votos] of Object.entries(votosPorOrganizacion)) {
    if (votos < 0) {
      return fail({ code: 'VOTOS_NEGATIVOS', message: 'Ningún valor puede ser negativo.' });
    }
    if (votos > totalSufragantes) {
      return fail({
        code: 'ORGANIZACION_SUPERA_TOTAL',
        message: `La organización ${organizacionId} tiene más votos que el total de sufragantes.`,
      });
    }
  }

  const sumaOrganizaciones = Object.values(votosPorOrganizacion).reduce((acc, v) => acc + v, 0);
  const sumaTotal = sumaOrganizaciones + votosNulos + votosBlancos;

  if (sumaTotal !== totalSufragantes) {
    return fail({
      code: 'SUMA_NO_COINCIDE',
      message: `La suma de votos (${sumaTotal}) no coincide con el total de sufragantes (${totalSufragantes}).`,
    });
  }

  return ok(undefined);
}
