import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authContainer } from '../../di/authContainer';
import { useSessionStore } from '../store/useSessionStore';
import { CrearUsuarioInput } from '../../domain/repositories/AuthRepository';
import { RolUsuario } from '../../domain/entities/Usuario';
import { setSentryUser } from '@core/monitoring/sentry';

/** Restaura la sesión al abrir la app (ver `AppProviders`). */
export function useSesionActual() {
  const setSesion = useSessionStore((s) => s.setSesion);
  const setCargando = useSessionStore((s) => s.setCargando);

  return useQuery({
    queryKey: ['auth', 'sesion-actual'],
    queryFn: async () => {
      const sesion = await authContainer.authRepository.obtenerSesionActual();
      setSesion(sesion);
      setSentryUser(sesion?.usuario ?? null);
      setCargando(false);
      return sesion;
    },
  });
}

export function useIniciarSesion() {
  const setSesion = useSessionStore((s) => s.setSesion);

  return useMutation({
    mutationFn: ({ correo, clave }: { correo: string; clave: string }) =>
      authContainer.iniciarSesionUseCase.ejecutar(correo, clave),
    onSuccess: (resultado) => {
      if (resultado.ok) {
        setSesion(resultado.value);
        setSentryUser(resultado.value.usuario);
      }
    },
  });
}

export function useCerrarSesion() {
  const setSesion = useSessionStore((s) => s.setSesion);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authContainer.authRepository.cerrarSesion(),
    onSuccess: () => {
      setSesion(null);
      setSentryUser(null);
      queryClient.clear();
    },
  });
}

/** Un coordinador crea a su subordinado (RF-01). */
export function useCrearUsuario(rolDeQuienCrea: RolUsuario) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: CrearUsuarioInput) => authContainer.crearUsuarioUseCase.ejecutar(datos, rolDeQuienCrea),
    onSuccess: (resultado) => {
      if (resultado.ok) queryClient.invalidateQueries({ queryKey: ['auth', 'subordinados'] });
    },
  });
}

export function useEstablecerClaveInicial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nuevaClave, confirmacion }: { nuevaClave: string; confirmacion: string }) =>
      authContainer.establecerClaveInicialUseCase.ejecutar(nuevaClave, confirmacion),
    onSuccess: (resultado) => {
      if (resultado.ok) queryClient.invalidateQueries({ queryKey: ['auth', 'sesion-actual'] });
    },
  });
}

export function useRecuperarClave() {
  return useMutation({
    mutationFn: (correo: string) => authContainer.recuperarClaveUseCase.ejecutar(correo),
  });
}

/** RF-05/S-08: segunda mitad de la recuperación — ver `useManejarEnlaceRecuperacion`. */
export function useCompletarRecuperacionClave() {
  const setSesion = useSessionStore((s) => s.setSesion);
  const marcarEnRecuperacion = useSessionStore((s) => s.marcarEnRecuperacion);

  return useMutation({
    mutationFn: (codigo: string) => authContainer.completarRecuperacionClaveUseCase.ejecutar(codigo),
    onSuccess: (resultado) => {
      if (!resultado.ok) return;
      setSesion(resultado.value);
      marcarEnRecuperacion(true);
      setSentryUser(resultado.value.usuario);
    },
  });
}

/** Los veedores/coordinadores creados directamente por quien llama (ver `personal`). */
export function useSubordinados() {
  return useQuery({
    queryKey: ['auth', 'subordinados'],
    queryFn: () => authContainer.authRepository.listarSubordinados(),
  });
}
