import { RolUsuario, Usuario } from '../../domain/entities/Usuario';

/** Forma exacta de la fila en la tabla `usuarios` de Supabase. */
export type UsuarioRow = {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  correo_verificado: boolean;
  rol: RolUsuario;
  creado_por_id: string | null;
  recinto_id: string | null;
  debe_cambiar_clave: boolean;
  activo: boolean;
};

export function usuarioFromRow(row: UsuarioRow): Usuario {
  return {
    id: row.id,
    cedula: row.cedula,
    nombres: row.nombres,
    apellidos: row.apellidos,
    telefono: row.telefono,
    correo: row.correo,
    correoVerificado: row.correo_verificado,
    rol: row.rol,
    creadoPorId: row.creado_por_id,
    recintoId: row.recinto_id,
    debeCambiarClave: row.debe_cambiar_clave,
    activo: row.activo,
  };
}
