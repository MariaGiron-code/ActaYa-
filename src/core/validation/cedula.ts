/**
 * Validación LOCAL de cédula ecuatoriana mediante el algoritmo Módulo 10.
 *
 * Esto comprueba la ESTRUCTURA del número (10 dígitos, provincia válida,
 * tercer dígito de persona natural, dígito verificador correcto). NO
 * confirma que la cédula exista en el Registro Civil ni que pertenezca a
 * quien la registra: esa comprobación de existencia la hace la Edge
 * Function `verificar-cedula` contra Datacil (ADR-11).
 *
 * Mantener esta validación local es clave: evita gastar una consulta a la
 * API externa (y su cuota/costo) cuando el error es simplemente una cédula
 * mal digitada, que es justo el problema que describe el enunciado.
 */
export function esFormatoCedulaValido(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = parseInt(cedula.slice(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito > 5) return false; // 6-9 corresponde a RUC de personas jurídicas/públicas, no a cédula natural

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digitoVerificador = parseInt(cedula[9], 10);

  let suma = 0;
  for (let i = 0; i < coeficientes.length; i++) {
    let valor = parseInt(cedula[i], 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const residuo = suma % 10;
  const digitoCalculado = residuo === 0 ? 0 : 10 - residuo;

  return digitoCalculado === digitoVerificador;
}
