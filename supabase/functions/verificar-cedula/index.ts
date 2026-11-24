// Edge Function (Deno) — ADR-11.
//
// Verifica la EXISTENCIA real de una cédula ecuatoriana contra el Registro
// Civil, usando Datacil (https://datacil.com, operado por OMENIUS S.A.S.,
// RUC 0195170932001, Cuenca) como proveedor. Corre en el servidor porque
// DATACIL_API_KEY es un secreto que nunca debe llegar al APK.
//
// Secretos requeridos (configúralos con `supabase secrets set ...`):
//   DATACIL_API_KEY
//
// NOTA sobre el proveedor y el manejo de datos (decisión informada, revisar
// antes de defender en el examen):
//
// Datacil NO es un proveedor KYC: según su propia documentación, automatiza
// la misma consulta pública que haría una persona en el portal oficial del
// Registro Civil. Sus Términos de Servicio (cláusulas 4.3/4.4) trasladan al
// integrador la responsabilidad de tener una base legal propia para la
// consulta. Por eso esta función se diseñó para minimizar el riesgo LOPDP:
//
//   1. Solo se solicita el endpoint de cédula básico (no /cedula-full ni
//      /entity-full), que ya de por sí devuelve más campos de los que
//      necesitamos (dirección, teléfono, fecha de nacimiento, etc.).
//   2. De la respuesta del proveedor solo se LEEN los campos `name` y
//      `success`/`status` para construir el resultado; todo lo demás
//      (dirección, teléfono, email, fecha de nacimiento) se descarta y
//      JAMÁS se persiste, se registra en logs ni se devuelve al cliente.
//   3. La respuesta a la app es siempre { existe, coincideNombre } — nunca
//      el payload crudo del proveedor.
//
// Esto reduce la superficie de datos personales que toca la aplicación, pero
// NO elimina el riesgo contractual de las cláusulas 4.3/4.4/5 de Datacil: la
// responsabilidad legal de la consulta sigue siendo del operador de la app,
// no de Datacil. Quedó documentado para que se pueda defender en el examen.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const DATACIL_API_KEY = Deno.env.get('DATACIL_API_KEY');
const DATACIL_ENDPOINT = 'https://api.datacil.com/v1/ecuador/data/cedula';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { cedula, nombres, apellidos } = await req.json();

    if (!cedula || !/^\d{10}$/.test(cedula)) {
      return json({ error: 'Cédula inválida' }, 400);
    }
    if (!DATACIL_API_KEY) {
      return json({ error: 'DATACIL_API_KEY no configurada en el servidor' }, 500);
    }

    const respuesta = await fetch(`${DATACIL_ENDPOINT}/${cedula}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${DATACIL_API_KEY}` },
    });

    if (respuesta.status === 404) {
      // Cédula no encontrada en el Registro Civil: existe = false, no es un error.
      return json({ existe: false, coincideNombre: false });
    }
    if (!respuesta.ok) {
      return json({ error: 'El proveedor de verificación no respondió correctamente.' }, 502);
    }

    const resultado = await respuesta.json();
    // Se lee ÚNICAMENTE el nombre para comparar — el resto del payload
    // (dirección, teléfono, fecha de nacimiento, etc.) se ignora a propósito
    // y no se asigna a ninguna variable, para no poder registrarlo por error.
    // TODO: confirma el nombre exacto del campo (`data.name` vs. campos
    // separados `data.firstName`/`data.lastName`) contra tu propia cuenta de
    // Datacil antes de usarlo en la defensa — esto se basa en investigación
    // de su documentación pública, no en una respuesta real verificada.
    const nombreCompleto = `${resultado?.data?.name ?? ''}`.trim().toUpperCase();
    const existe = resultado?.success === true && nombreCompleto.length > 0;
    const coincideNombre =
      existe && nombreCompleto.includes(normalizar(apellidos)) && nombreCompleto.includes(normalizar(nombres));

    return json({ existe, coincideNombre });
  } catch (error) {
    console.error('[verificar-cedula] error:', error);
    return json({ error: 'Error inesperado verificando la cédula.' }, 500);
  }
});

function normalizar(texto: string | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase();
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
