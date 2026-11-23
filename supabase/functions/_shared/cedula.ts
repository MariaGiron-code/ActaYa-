// Copia intencional de `src/core/validation/cedula.ts`: las Edge Functions
// de Supabase se empaquetan de forma aislada (no pueden importar código de
// `src/`), así que la validación de formato se repite aquí para que el
// servidor nunca confíe ciegamente en lo que ya validó el cliente.
export function esFormatoCedulaValido(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = parseInt(cedula.slice(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = parseInt(cedula[2], 10);
  if (tercerDigito > 5) return false;

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
