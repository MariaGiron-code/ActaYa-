// Edge Function (Deno) — ADR-11.
//
// Verifica que un correo exista y acepte mensajes (deliverability real, no
// solo formato), usando QuickEmailVerification. Corre en el servidor
// porque QUICKEMAILVERIFICATION_API_KEY es un secreto, y además así se
// puede cachear el resultado en la tabla `correos_verificados` para no
// pagar dos veces por la misma consulta (consecuencia documentada en
// ADR-11; el plan gratuito da ~100 verificaciones/día).
//
// Secretos requeridos: QUICKEMAILVERIFICATION_API_KEY
// Variables de entorno de Supabase disponibles automáticamente en toda
// Edge Function: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const API_KEY = Deno.env.get('QUICKEMAILVERIFICATION_API_KEY');
const QEV_ENDPOINT = 'https://api.quickemailverification.com/v1/verify';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { correo } = await req.json();
    if (!correo || !correo.includes('@')) {
      return json({ error: 'Correo inválido' }, 400);
    }
    if (!API_KEY) {
      return json({ error: 'QUICKEMAILVERIFICATION_API_KEY no configurada en el servidor' }, 500);
    }

    const correoNormalizado = correo.trim().toLowerCase();

    // 1. Caché: evita pagar dos veces por el mismo correo.
    const { data: cacheado } = await supabaseAdmin
      .from('correos_verificados')
      .select('entregable')
      .eq('correo', correoNormalizado)
      .maybeSingle();

    if (cacheado) {
      return json({ entregable: cacheado.entregable });
    }

    // 2. Consulta real a QuickEmailVerification.
    const url = `${QEV_ENDPOINT}?email=${encodeURIComponent(correoNormalizado)}&apikey=${API_KEY}`;
    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      return json({ error: 'El proveedor de verificación no respondió correctamente.' }, 502);
    }

    const resultado = await respuesta.json();
    // result: "valid" | "invalid" | "unknown" (ver docs de QuickEmailVerification)
    const entregable = resultado?.result === 'valid';

    // 3. Guarda en caché para la próxima vez.
    await supabaseAdmin
      .from('correos_verificados')
      .upsert({ correo: correoNormalizado, entregable, verificado_en: new Date().toISOString() });

    return json({ entregable });
  } catch (error) {
    console.error('[verificar-correo] error:', error);
    return json({ error: 'Error inesperado verificando el correo.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
