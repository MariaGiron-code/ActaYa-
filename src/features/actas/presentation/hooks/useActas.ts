import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from '@core/network/useNetworkStatus';
import { actasContainer } from '../../di/actasContainer';
import { RegistrarActaInput } from '../../domain/use-cases/RegistrarActaUseCase';
import { CorregirActaInput } from '../../domain/use-cases/CorregirActaUseCase';
import { Acta } from '../../domain/entities/Acta';

const CLAVE_PENDIENTES = ['actas', 'pendientes'];
const CLAVE_CORREGIBLES = ['actas', 'corregibles'];

export function useActasPendientes() {
  return useQuery({
    queryKey: CLAVE_PENDIENTES,
    queryFn: () => actasContainer.actasRepository.listarPendientesDeEnvio(),
  });
}

/** RF-12: la RLS de `actas` ya filtra "sus mesas" (veedor) o "su recinto" (coordinador). */
export function useActasCorregibles() {
  return useQuery({
    queryKey: CLAVE_CORREGIBLES,
    queryFn: () => actasContainer.actasRepository.listarActasCorregibles(),
  });
}

/** RF-11/ADR-06/ADR-04: toma la foto, rechaza las borrosas y captura la ubicación. */
export function useCapturarFotoActa() {
  return useMutation({
    mutationFn: () => actasContainer.capturarFotoActaUseCase.ejecutar(),
  });
}

/** RF-09/RF-13: guarda SIEMPRE en local primero (offline-first). */
export function useRegistrarActa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: RegistrarActaInput) => actasContainer.registrarActaUseCase.ejecutar(datos),
    onSuccess: (resultado) => {
      if (resultado.ok) queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES });
    },
  });
}

export function useCorregirActa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actaId, cambios, actaActual }: { actaId: string; cambios: CorregirActaInput; actaActual: Acta }) =>
      actasContainer.corregirActaUseCase.ejecutar(actaId, cambios, actaActual),
    onSuccess: (resultado) => {
      if (resultado.ok) {
        queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES });
        queryClient.invalidateQueries({ queryKey: CLAVE_CORREGIBLES });
      }
    },
  });
}

/**
 * RF-14/RNF-05: reintenta automáticamente el envío de las actas pendientes
 * en cuanto `useNetworkStatus()` detecta conexión — nunca por polling activo.
 * Móntalo una vez por sesión (ver `InicioScreen`).
 */
export function useSincronizarActasAlVolverOnline() {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOnline) return;
    actasContainer.sincronizarActasPendientesUseCase.ejecutar().then((resultado) => {
      if (resultado.ok) queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES });
    });
  }, [isOnline, queryClient]);
}
