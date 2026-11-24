import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RolUsuario } from '@features/auth/domain/entities/Usuario';
import { territorioContainer } from '../../di/territorioContainer';
import { Recinto } from '../../domain/entities/Territorio';

export function useRecintos() {
  return useQuery({
    queryKey: ['territorio', 'recintos'],
    queryFn: () => territorioContainer.territorioRepository.listarRecintos(),
  });
}

export function useMesasDeRecinto(recintoId: string | null) {
  return useQuery({
    queryKey: ['territorio', 'mesas', recintoId],
    queryFn: () => territorioContainer.territorioRepository.listarMesasPorRecinto(recintoId as string),
    enabled: recintoId !== null,
  });
}

export function useOrganizacionesConCandidatos() {
  return useQuery({
    queryKey: ['territorio', 'organizaciones'],
    queryFn: () => territorioContainer.territorioRepository.listarOrganizacionesConCandidatos(),
  });
}

/** RF-06: solo el coordinador provincial llega a usar esto (ver RecintosScreen). */
export function useAgregarRecinto(rolDeQuienLlama: RolUsuario) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: Omit<Recinto, 'id'>) =>
      territorioContainer.agregarRecintoUseCase.ejecutar(datos, rolDeQuienLlama),
    onSuccess: (resultado) => {
      if (resultado.ok) {
        queryClient.invalidateQueries({ queryKey: ['territorio', 'recintos'] });
      }
    },
  });
}
