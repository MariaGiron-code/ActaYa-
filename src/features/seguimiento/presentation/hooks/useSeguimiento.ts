import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import { seguimientoContainer } from '../../di/seguimientoContainer';

const CLAVE_RESUMEN = ['seguimiento', 'resumen-recinto'];
const CLAVE_UBICACIONES = ['seguimiento', 'ubicaciones-no-verificadas'];
const claveProgreso = (dignidad: Dignidad) => ['seguimiento', 'progreso', dignidad];

export function useResumenPorRecinto() {
  return useQuery({
    queryKey: CLAVE_RESUMEN,
    queryFn: () => seguimientoContainer.seguimientoRepository.obtenerResumenPorRecinto(),
  });
}

/** ADR-04 / S-10: actas con la ubicación no verificada, para avisar al coordinador. */
export function useActasUbicacionNoVerificada() {
  return useQuery({
    queryKey: CLAVE_UBICACIONES,
    queryFn: () => seguimientoContainer.seguimientoRepository.listarActasUbicacionNoVerificada(),
  });
}

export function useProgresoPorDignidad(dignidad: Dignidad) {
  return useQuery({
    queryKey: claveProgreso(dignidad),
    queryFn: () => seguimientoContainer.seguimientoRepository.obtenerProgresoPorDignidad(dignidad),
  });
}

/**
 * ADR-10 / RNF-07: se suscribe UNA vez por pantalla montada y se
 * desuscribe al desmontar — si no, cada remonte deja un canal de Realtime
 * abierto para siempre (fuga documentada en el ADR).
 */
export function useSuscripcionSeguimiento(dignidadActual: Dignidad) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const cancelar = seguimientoContainer.seguimientoRepository.suscribirseAActualizaciones(() => {
      queryClient.invalidateQueries({ queryKey: CLAVE_RESUMEN });
      queryClient.invalidateQueries({ queryKey: CLAVE_UBICACIONES });
      queryClient.invalidateQueries({ queryKey: claveProgreso(dignidadActual) });
    });
    return cancelar;
  }, [queryClient, dignidadActual]);
}
