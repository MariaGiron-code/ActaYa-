// Edge Function (Deno) — ADR-01 + ADR-11 + RF-01/RF-02/RF-03/RF-04.
//
// Crear un usuario de Auth requiere la llave `service_role`, que nunca debe
// vivir en el APK (consecuencia documentada en ADR-01: "crear usuarios
// desde un administrador requiere una clave privilegiada que no puede
// estar en la aplicación"). Esta función:
//   1. Identifica quién llama (su JWT) y su rol.
//   2. Valida la jerarquía RF-01 / S-16 (nadie se auto-registra).
//   3. Valida formato de cédula + llama a verificar-cedula / verificar-correo.
//   4. Crea el usuario en Supabase Auth con una clave temporal aleatoria.
//   5. Inserta la fila en `usuarios` y la devuelve junto con esa clave,
//      que el coordinador debe entregar en persona (S-11: se muestra una
//      sola vez; el cliente no debe guardarla).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';
import { esFormatoCedulaValido } from '../_shared/cedula.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ROL_SUPERIOR: Record<string, string | null> = {
  COORDINADOR_PROVINCIAL: null,
  COORDINADOR_RECINTO: 'COORDINADOR_PROVINCIAL',
  VEEDOR: 'COORDINADOR_RECINTO',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'No autenticado' }, 401);

    // Cliente "como el usuario que llama", para leer su identidad de forma segura.
    const supabaseComoUsuario = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabaseComoUsuario.auth.getUser();
    if (userError || !userData.user) return json({ error: 'Token inválido' }, 401);

    // Cliente admin, SOLO dentro del servidor, para la creación privilegiada.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: quienCrea } = await admin
      .from('usuarios')
      .select('rol')
      .eq('id', userData.user.id)
      .single();
    if (!quienCrea) return json({ error: 'Perfil de quien crea no encontrado' }, 403);

    const { cedula, nombres, apellidos, telefono, correo, rol } = await req.json();

    if (ROL_SUPERIOR[rol] !== quienCrea.rol) {
      return json({ error: 'No tienes permiso para crear usuarios con ese rol.' }, 403);
    }
    if (!esFormatoCedulaValido(cedula)) {
      return json({ error: 'Cédula no válida.' }, 400);
    }

    // Reutiliza las mismas Edge Functions que usa el cliente (ADR-11), para
    // no duplicar la lógica de llamar a Datacil / QuickEmailVerification.
    const [cedulaResp, correoResp] = await Promise.all([
      admin.functions.invoke('verificar-cedula', { body: { cedula, nombres, apellidos } }),
      admin.functions.invoke('verificar-correo', { body: { correo } }),
    ]);

    if (cedulaResp.error || !cedulaResp.data?.existe || !cedulaResp.data?.coincideNombre) {
      return json({ error: 'La cédula no pudo verificarse.' }, 400);
    }
    if (correoResp.error || !correoResp.data?.entregable) {
      return json({ error: 'El correo no parece existir.' }, 400);
    }

    const claveTemporal = generarClaveTemporal();

    const { data: nuevoAuthUser, error: errorAuth } = await admin.auth.admin.createUser({
      email: correo,
      password: claveTemporal,
      email_confirm: true, // ya se verificó entregabilidad arriba
    });
    if (errorAuth || !nuevoAuthUser.user) {
      return json({ error: errorAuth?.message ?? 'No se pudo crear el usuario.' }, 500);
    }

    const { data: filaUsuario, error: errorInsert } = await admin
      .from('usuarios')
      .insert({
        id: nuevoAuthUser.user.id,
        cedula,
        nombres,
        apellidos,
        telefono,
        correo,
        correo_verificado: true,
        rol,
        creado_por_id: userData.user.id,
        debe_cambiar_clave: true,
        activo: true,
      })
      .select('*')
      .single();

    if (errorInsert) {
      return json({ error: errorInsert.message }, 500);
    }

    return json({ usuario: filaUsuario, claveTemporal });
  } catch (error) {
    console.error('[crear-usuario] error:', error);
    return json({ error: 'Error inesperado creando el usuario.' }, 500);
  }
});

function generarClaveTemporal(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let clave = '';
  for (let i = 0; i < 10; i++) {
    clave += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return clave;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
