import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';
import { seguimientoContainer } from '../../di/seguimientoContainer';

const CLAVE_RESUMEN = ['seguimiento', 'resumen-recinto'];
const claveProgreso = (dignidad: Dignidad) => ['seguimiento', 'progreso', dignidad];

export function useResumenPorRecinto() {
  return useQuery({
    queryKey: CLAVE_RESUMEN,
    queryFn: () => seguimientoContainer.seguimientoRepository.obtenerResumenPorRecinto(),
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
      queryClient.invalidateQueries({ queryKey: claveProgreso(dignidadActual) });
    });
    return cancelar;
  }, [queryClient, dignidadActual]);
}
