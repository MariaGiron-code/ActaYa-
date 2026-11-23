// Edge Function (Deno) — ADR-11.
//
// Verifica la EXISTENCIA real de una cédula ecuatoriana contra el Registro
// Civil, usando Didit (https://didit.me) como proveedor. Corre en el
// servidor porque DIDIT_API_KEY es un secreto que nunca debe llegar al APK.
//
// Secretos requeridos (configúralos con `supabase secrets set ...`):
//   DIDIT_API_KEY
//
// NOTA: por qué Didit y no "whoecuador.com" (la opción que se evaluó al
// iniciar el proyecto): ese dominio no tiene ningún rastro verificable en
// internet y ofrece datos personales completos (nombre, fecha de
// nacimiento) sin ningún flujo de consentimiento, lo que es incompatible
// con la LOPDP ecuatoriana. Didit es un proveedor KYC conocido, cobra solo
// por resultados concluyentes y da 500 verificaciones gratis al mes.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY');
const DIDIT_ENDPOINT = 'https://verification.didit.me/v3/database-validation/';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { cedula, nombres, apellidos } = await req.json();

    if (!cedula || !/^\d{10}$/.test(cedula)) {
      return json({ error: 'Cédula inválida' }, 400);
    }
    if (!DIDIT_API_KEY) {
      return json({ error: 'DIDIT_API_KEY no configurada en el servidor' }, 500);
    }

    const respuesta = await fetch(DIDIT_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DIDIT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        issuing_state: 'ECU',
        services: ['ecu_cedula'],
        source_data: {
          personal_number: cedula,
          first_name: nombres,
          last_name: apellidos,
        },
      }),
    });

    if (!respuesta.ok) {
      return json({ error: 'El proveedor de verificación no respondió correctamente.' }, 502);
    }

    const resultado = await respuesta.json();
    // TODO: ajusta esta lectura al payload real que devuelva tu cuenta de Didit
    // (confírmalo en su documentación antes de usarlo en producción/defensa).
    const existe = resultado?.match_type !== 'no_match';
    const coincideNombre = resultado?.match_type === 'full_match';

    return json({ existe, coincideNombre });
  } catch (error) {
    console.error('[verificar-cedula] error:', error);
    return json({ error: 'Error inesperado verificando la cédula.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
