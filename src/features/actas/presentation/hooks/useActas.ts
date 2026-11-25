import { useEffect, useState } from 'react';
import { onlineManager, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from '@core/network/useNetworkStatus';
import { personalContainer } from '@features/personal/di/personalContainer';
import { territorioContainer } from '@features/territorio/di/territorioContainer';
import { actasContainer } from '../../di/actasContainer';
import { RegistrarActaInput } from '../../domain/use-cases/RegistrarActaUseCase';
import { CorregirActaInput } from '../../domain/use-cases/CorregirActaUseCase';
import { Acta } from '../../domain/entities/Acta';
import { calcularAlertaDemora } from '../../domain/use-cases/CalcularAlertaDemoraRegistro';

const CLAVE_PENDIENTES = ['actas', 'pendientes'];
const CLAVE_CORREGIBLES = ['actas', 'corregibles'];
const CLAVE_LOCALES = ['actas', 'locales'];

/**
 * RNF-05: por defecto TanStack Query PAUSA toda acción mientras no hay red
 * (`networkMode: 'online'`), aunque no la necesite. Tomar la foto, leer el
 * GPS y guardar en el teléfono son locales: sin esto, sin señal los botones
 * se quedaban cargando y el acta no se guardaba hasta recuperar conexión.
 */
const SIN_DEPENDER_DE_LA_RED = { networkMode: 'always' } as const;

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
    ...SIN_DEPENDER_DE_LA_RED,
  });
}

/** ADR-04: vuelve a pedir solo la ubicación, sin repetir la foto. */
export function useActualizarUbicacion() {
  return useMutation({
    mutationFn: () => actasContainer.capturaRepository.obtenerUbicacionActual(),
    ...SIN_DEPENDER_DE_LA_RED,
  });
}

/** RF-09/RF-13: guarda SIEMPRE en local primero (offline-first). */
export function useRegistrarActa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: RegistrarActaInput) => actasContainer.registrarActaUseCase.ejecutar(datos),
    ...SIN_DEPENDER_DE_LA_RED,
    onSuccess: (resultado) => {
      if (!resultado.ok) return;
      queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES });
      queryClient.invalidateQueries({ queryKey: CLAVE_LOCALES });
      // Sin señal no se intenta: el envío fallaría y el acta aparecería como
      // "No se pudo enviar" cuando en realidad solo está esperando conexión.
      // `useSincronizarActasAlVolverOnline` la envía al volver la señal.
      if (!onlineManager.isOnline()) return;
      // No basta con esperar a que `useSincronizarActasAlVolverOnline`
      // detecte un cambio de conectividad: ese efecto solo reacciona a la
      // TRANSICIÓN offline->online, así que si el veedor ya tenía señal
      // (el caso normal) el acta se quedaba en "en_proceso" para siempre.
      // Aquí se intenta enviar de una vez; si de verdad no hay señal,
      // `enviar()` simplemente falla y el efecto de arriba la reintentará.
      actasContainer.sincronizarActasPendientesUseCase.ejecutar().then((sincronizado) => {
        if (sincronizado.ok) {
          queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES });
          queryClient.invalidateQueries({ queryKey: CLAVE_CORREGIBLES });
        }
      });
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
 * RNF-05: `onlineManager` evita que una query SIN caché se quede vacía al
 * perder señal (ver `queryClient.ts`), pero si el veedor NUNCA llegó a
 * abrir "Registrar actas" con señal, tampoco hay nada que mostrarle —
 * esto precarga sus mesas y el catálogo de candidatos apenas entra a
 * Inicio (todavía con señal, normalmente en la sede del recinto), para
 * que ya estén en caché cuando se vaya a votar sin cobertura.
 */
export function usePrecargarDatosVeedor(veedorId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!veedorId) return;
    queryClient.prefetchQuery({
      queryKey: ['personal', 'mis-asignaciones', veedorId],
      queryFn: () => personalContainer.personalRepository.listarAsignacionesDelVeedor(veedorId),
    });
    queryClient.prefetchQuery({
      queryKey: ['territorio', 'organizaciones'],
      queryFn: () => territorioContainer.territorioRepository.listarOrganizacionesConCandidatos(),
    });
  }, [veedorId, queryClient]);
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
      if (resultado.ok) {
        queryClient.invalidateQueries({ queryKey: CLAVE_PENDIENTES });
        queryClient.invalidateQueries({ queryKey: CLAVE_CORREGIBLES });
      }
    });
  }, [isOnline, queryClient]);
}

/**
 * S-06: le avisa al veedor si ya pasó la hora de cierre de votación y
 * todavía le faltan actas por registrar (mesas asignadas x 2 dignidades,
 * contra lo que ya tiene guardado LOCALMENTE — RNF-05, no depende de señal).
 * El `setInterval` de abajo NO es polling de red (RNF-05/RNF-07 lo prohíben
 * para datos del servidor): solo refresca el reloj local cada minuto para
 * que el nivel de la alerta avance aunque el veedor deje la pantalla abierta.
 */
export function useAlertaDemoraRegistro(veedorId: string | null) {
  const asignaciones = useQuery({
    queryKey: ['personal', 'mis-asignaciones', veedorId],
    queryFn: () => personalContainer.personalRepository.listarAsignacionesDelVeedor(veedorId as string),
    enabled: veedorId !== null,
  });
  const localesRegistradas = useQuery({
    queryKey: CLAVE_LOCALES,
    queryFn: () => actasContainer.actasRepository.listarTodasLocales(),
  });
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const actasEsperadas = asignaciones.data?.ok ? asignaciones.data.value.length * 2 : 0;
  const actasRegistradas = localesRegistradas.data?.ok ? localesRegistradas.data.value.length : 0;

  return calcularAlertaDemora({ actasEsperadas, actasRegistradas, ahora });
}
