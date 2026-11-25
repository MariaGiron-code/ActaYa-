import { Result } from '@core/utils/result';
import { ActaUbicacionNoVerificada, ProgresoCandidato, ResumenRecinto } from '../entities/Seguimiento';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';

/** Puerto pendiente de implementar (ver README.md de este feature). */
export interface SeguimientoRepository {
  obtenerResumenPorRecinto(): Promise<Result<ResumenRecinto[]>>;
  obtenerProgresoPorDignidad(dignidad: Dignidad): Promise<Result<ProgresoCandidato[]>>;
  /** ADR-04 / S-10: actas registradas con la ubicación no verificada. */
  listarActasUbicacionNoVerificada(): Promise<Result<ActaUbicacionNoVerificada[]>>;
  /** ADR-10: se suscribe a Supabase Realtime; devuelve una función para cancelar la suscripción. */
  suscribirseAActualizaciones(onCambio: () => void): () => void;
}
