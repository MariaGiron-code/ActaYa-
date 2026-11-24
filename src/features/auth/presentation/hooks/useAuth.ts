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
      setSentryUser(sesion?.usuario.id ?? null, sesion?.usuario.rol);
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
        setSentryUser(resultado.value.usuario.id, resultado.value.usuario.rol);
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
  return useMutation({
    mutationFn: (datos: CrearUsuarioInput) => authContainer.crearUsuarioUseCase.ejecutar(datos, rolDeQuienCrea),
  });
}

export function useEstablecerClaveInicial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nuevaClave, confirmacion }: { nuevaClave: string; confirmacion: string }) =>
      authContainer.establecerClaveInicialUseCase.ejecutar(nuevaClave, confirmacion),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'sesion-actual'] }),
  });
}

export function useRecuperarClave() {
  return useMutation({
    mutationFn: (correo: string) => authContainer.recuperarClaveUseCase.ejecutar(correo),
  });
}

/** Los veedores/coordinadores creados directamente por quien llama (ver `personal`). */
export function useSubordinados() {
  return useQuery({
    queryKey: ['auth', 'subordinados'],
    queryFn: () => authContainer.authRepository.listarSubordinados(),
  });
}
