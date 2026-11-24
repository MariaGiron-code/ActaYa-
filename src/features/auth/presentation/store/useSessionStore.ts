import { create } from 'zustand';
import { SesionActiva, Usuario } from '../../domain/entities/Usuario';

type SessionState = {
  usuario: Usuario | null;
  accessToken: string | null;
  cargando: boolean;
  /** RF-05/S-08: true mientras viene de completar el enlace de "olvidé mi clave" — fuerza poner una clave nueva aunque `debeCambiarClave` ya sea false. */
  enRecuperacion: boolean;
  setSesion: (sesion: SesionActiva | null) => void;
  setCargando: (cargando: boolean) => void;
  marcarEnRecuperacion: (valor: boolean) => void;
};

/**
 * Zustand se limita a estado de SESIÓN/INTERFAZ (ADR-12): quién está
 * autenticado y su rol, usado para la navegación. Los datos del servidor
 * (recintos, actas, usuarios) viven en TanStack Query, no aquí.
 */
export const useSessionStore = create<SessionState>((set) => ({
  usuario: null,
  accessToken: null,
  cargando: true,
  enRecuperacion: false,
  setSesion: (sesion) =>
    // Cualquier sesión "normal" (login, restaurar al abrir la app, cerrar
    // sesión) apaga el modo recuperación — solo `marcarEnRecuperacion(true)`
    // lo prende, justo después de establecer la sesión del enlace.
    set({ usuario: sesion?.usuario ?? null, accessToken: sesion?.accessToken ?? null, enRecuperacion: false }),
  setCargando: (cargando) => set({ cargando }),
  marcarEnRecuperacion: (valor) => set({ enRecuperacion: valor }),
}));

export const selectRol = (state: SessionState) => state.usuario?.rol;
export const selectEstaAutenticado = (state: SessionState) => state.usuario !== null;
