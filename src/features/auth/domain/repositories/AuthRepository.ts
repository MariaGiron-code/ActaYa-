import { Result } from '@core/utils/result';
import { RolUsuario, SesionActiva, Usuario } from '../entities/Usuario';

export type CrearUsuarioInput = {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  rol: RolUsuario;
  /** Obligatorio cuando `rol` es COORDINADOR_RECINTO: el recinto que coordinará (RF-07, RF-15). */
  recintoId?: string;
  /** Solo aplica cuando un coordinador de recinto reemplaza a un veedor ausente (RF-08, S-03). */
  mesasAsignadas?: string[];
};

/**
 * Puerto del dominio hacia la autenticación. La capa de datos decide SI eso
 * se implementa con Supabase Auth u otra cosa; el dominio no debe saberlo
 * (regla de dependencia hacia el interior, ADR-12).
 */
export interface AuthRepository {
  iniciarSesion(correo: string, clave: string): Promise<Result<SesionActiva>>;
  cerrarSesion(): Promise<Result<void>>;
  obtenerSesionActual(): Promise<SesionActiva | null>;

  /** Ejecutado por un superior (RF-01). El backend valida la jerarquía de nuevo. */
  crearUsuario(datos: CrearUsuarioInput): Promise<Result<{ usuario: Usuario; claveTemporal: string }>>;

  /** Primer ingreso (RF-02, S-11): solo el titular conocerá la clave desde aquí en adelante. */
  establecerClaveInicial(nuevaClave: string): Promise<Result<void>>;

  /** RF-05, S-08: recuperación autónoma por correo verificado. */
  solicitarRecuperacionClave(correo: string): Promise<Result<void>>;

  /** Los usuarios creados directamente por quien llama (RF-01). Usa la misma RLS de `usuarios_select_subordinados`. */
  listarSubordinados(): Promise<Result<Usuario[]>>;
}
