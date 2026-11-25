import { Dignidad } from '@features/territorio/domain/entities/Territorio';

/** RF-16: lo que ve el coordinador provincial durante la jornada. */
export interface ResumenRecinto {
  recintoId: string;
  nombreRecinto: string;
  mesasReportadas: number;
  mesasTotales: number;
}

/**
 * ADR-04 / S-10: acta cuya ubicación tenía más de 5 minutos al registrarse.
 * El coordinador provincial la ve en el panel para revisarla.
 */
export interface ActaUbicacionNoVerificada {
  actaId: string;
  dignidad: Dignidad;
  numeroJrv: string;
  nombreRecinto: string;
}

export interface ProgresoCandidato {
  candidatoId: string;
  nombres: string;
  organizacionSiglas: string;
  votosTotales: number;
}
