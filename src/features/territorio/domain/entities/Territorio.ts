/** Precarga obligatoria (restricción del examen) + S-01, S-17. */

export interface Recinto {
  id: string;
  provincia: string;
  canton: string;
  parroquia: string;
  nombre: string;
}

export interface Mesa {
  id: string;
  recintoId: string;
  numeroJrv: string;
  /** S-02: solo "completa" cuando AMBAS actas (alcaldía y prefectura) están guardadas en el servidor con foto y ubicación. */
  estado: 'pendiente' | 'completa';
}

export type Dignidad = 'ALCALDIA' | 'PREFECTURA';

export interface OrganizacionPolitica {
  id: string;
  nombre: string;
  siglas: string;
}

export interface Candidato {
  id: string;
  organizacionId: string;
  dignidad: Dignidad;
  nombres: string;
}
