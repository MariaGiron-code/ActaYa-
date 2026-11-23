import { create } from 'zustand';
import { SesionActiva, Usuario } from '../../domain/entities/Usuario';

type SessionState = {
  usuario: Usuario | null;
  accessToken: string | null;
  cargando: boolean;
  setSesion: (sesion: SesionActiva | null) => void;
  setCargando: (cargando: boolean) => void;
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
  setSesion: (sesion) =>
    set({ usuario: sesion?.usuario ?? null, accessToken: sesion?.accessToken ?? null }),
  setCargando: (cargando) => set({ cargando }),
}));

export const selectRol = (state: SessionState) => state.usuario?.rol;
export const selectEstaAutenticado = (state: SessionState) => state.usuario !== null;
