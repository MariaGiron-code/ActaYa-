-- RF-02 / S-11.
--
-- BUG encontrado probando la app: `establecerClaveInicial()` SÍ cambia la
-- clave en Supabase Auth (auth.updateUser), pero el UPDATE a
-- `usuarios.debe_cambiar_clave` quedaba bloqueado en silencio: RLS estaba
-- activo en esa tabla desde 0001_usuarios.sql pero nunca se definió una
-- policy de UPDATE, así que Postgres rechazaba la fila sin que
-- supabase-js lo reportara como error (un UPDATE sin .select() no avisa
-- "0 filas afectadas"). Resultado: `debe_cambiar_clave` se quedaba en
-- `true` para siempre y la app mandaba al usuario de vuelta a esta
-- pantalla en cada intento, pareciendo que "no pasaba nada".
--
-- El rol `authenticated` ya tenía UPDATE de tabla completa por defecto
-- (patrón de Supabase: los GRANTs son amplios, RLS es la única barrera).
-- Para no abrir la puerta a que un usuario edite su propio `rol`, `cedula`,
-- `activo`, etc. desde el cliente, se restringe el UPDATE a nivel de
-- COLUMNA: solo puede tocar `debe_cambiar_clave`, y solo en su propia fila.

revoke update on public.usuarios from authenticated;
grant update (debe_cambiar_clave) on public.usuarios to authenticated;

create policy "usuarios_update_propia_clave_temporal"
  on public.usuarios for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
