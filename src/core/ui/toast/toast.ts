import { create } from 'zustand';
import { haptics } from '../haptics';

export type TipoToast = 'exito' | 'error' | 'info';

export type Toast = { id: number; tipo: TipoToast; mensaje: string };

type ToastState = {
  actual: Toast | null;
  mostrar: (tipo: TipoToast, mensaje: string) => void;
  cerrar: (id: number) => void;
};

let siguienteId = 1;

/** Estado de interfaz (ADR-12): solo el aviso visible en este momento. */
export const useToastStore = create<ToastState>((set) => ({
  actual: null,
  mostrar: (tipo, mensaje) => set({ actual: { id: siguienteId++, tipo, mensaje } }),
  // Solo cierra si sigue siendo el mismo aviso: evita que el temporizador de
  // un toast viejo cierre uno nuevo que llegó mientras tanto.
  cerrar: (id) => set((estado) => (estado.actual?.id === id ? { actual: null } : estado)),
}));

/**
 * Confirmación visible + táctil de una acción del usuario. Para errores de
 * formulario que ya se muestran inline, usa solo `haptics.error()` en vez de
 * duplicar el mensaje en un toast.
 */
export const toast = {
  exito(mensaje: string) {
    haptics.exito();
    useToastStore.getState().mostrar('exito', mensaje);
  },
  error(mensaje: string) {
    haptics.error();
    useToastStore.getState().mostrar('error', mensaje);
  },
  info(mensaje: string) {
    haptics.tap();
    useToastStore.getState().mostrar('info', mensaje);
  },
};
