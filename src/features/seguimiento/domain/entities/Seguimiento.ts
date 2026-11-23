/** RF-16: lo que ve el coordinador provincial durante la jornada. */
export interface ResumenRecinto {
  recintoId: string;
  nombreRecinto: string;
  mesasReportadas: number;
  mesasTotales: number;
}

export interface ProgresoCandidato {
  candidatoId: string;
  nombres: string;
  organizacionSiglas: string;
  votosTotales: number;
}
