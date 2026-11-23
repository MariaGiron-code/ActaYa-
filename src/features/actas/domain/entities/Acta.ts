import { EstadoEnvio } from '@core/ui/StatusBadge';
import { Dignidad } from '@features/territorio/domain/entities/Territorio';

export type Ubicacion = {
  latitud: number;
  longitud: number;
  capturadaEn: string; // ISO date
  /** S-10: verificada si tiene menos de 5 minutos de antigüedad al momento de guardarse. */
  verificada: boolean;
};

export interface Acta {
  /** Generado en el dispositivo con `generarId()` ANTES de tener conexión (RF-13/RF-14). */
  id: string;
  mesaId: string;
  dignidad: Dignidad;
  /** organizacionId -> votos. RF-09. */
  votosPorOrganizacion: Record<string, number>;
  votosNulos: number;
  votosBlancos: number;
  totalSufragantes: number;
  /** Ruta local (expo-file-system) de la foto; obligatoria antes de poder enviarse (RF-11). */
  fotoUri: string | null;
  ubicacion: Ubicacion | null;
  /** S-05: número de revisión para detectar ediciones concurrentes entre veedor y coordinador. */
  version: number;
  registradoPorId: string;
  estado: EstadoEnvio;
  creadaEn: string; // ISO date
}
