import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RolUsuario } from '@features/auth/domain/entities/Usuario';
import { personalContainer } from '../../di/personalContainer';
import { ReemplazoInput } from '../../domain/use-cases/ReemplazarVeedorUseCase';

export function useAsignacionesDeRecinto(recintoId: string | null) {
  return useQuery({
    queryKey: ['personal', 'asignaciones', recintoId],
    queryFn: () => personalContainer.personalRepository.listarAsignacionesDeRecinto(recintoId as string),
    enabled: recintoId !== null,
  });
}

/** RF-07: solo el coordinador de recinto llega a usar esto (ver AsignacionesScreen). */
export function useAsignarVeedor(rolDeQuienLlama: RolUsuario, recintoId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ mesaId, veedorId }: { mesaId: string; veedorId: string }) =>
      personalContainer.asignarVeedorUseCase.ejecutar(mesaId, veedorId, rolDeQuienLlama),
    onSuccess: (resultado) => {
      if (resultado.ok) {
        queryClient.invalidateQueries({ queryKey: ['personal', 'asignaciones', recintoId] });
      }
    },
  });
}

/** RF-08 / S-03: solo el coordinador de recinto llega a usar esto. */
export function useReemplazarVeedor(rolDeQuienLlama: RolUsuario, recintoId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { asignacionActualId: string; reemplazo: ReemplazoInput }) =>
      personalContainer.reemplazarVeedorUseCase.ejecutar(args.asignacionActualId, args.reemplazo, rolDeQuienLlama),
    onSuccess: (resultado) => {
      if (resultado.ok) {
        queryClient.invalidateQueries({ queryKey: ['personal', 'asignaciones', recintoId] });
      }
    },
  });
}
