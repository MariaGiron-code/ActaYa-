/**
 * Jerarquía de roles (RF-01). Cada rol solo puede ser creado por el
 * inmediatamente superior; no existe auto-registro.
 */
export enum RolUsuario {
  COORDINADOR_PROVINCIAL = 'COORDINADOR_PROVINCIAL',
  COORDINADOR_RECINTO = 'COORDINADOR_RECINTO',
  VEEDOR = 'VEEDOR',
}

/** Quién puede crear a quién (RF-01, S-16: el provincial no tiene superior). */
export const ROL_SUPERIOR: Record<RolUsuario, RolUsuario | null> = {
  [RolUsuario.COORDINADOR_PROVINCIAL]: null,
  [RolUsuario.COORDINADOR_RECINTO]: RolUsuario.COORDINADOR_PROVINCIAL,
  [RolUsuario.VEEDOR]: RolUsuario.COORDINADOR_RECINTO,
};

export interface Usuario {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  correoVerificado: boolean;
  rol: RolUsuario;
  creadoPorId: string | null;
  /** S-11: la clave temporal caduca en el primer ingreso. */
  debeCambiarClave: boolean;
  activo: boolean;
}

export interface SesionActiva {
  usuario: Usuario;
  accessToken: string;
}
