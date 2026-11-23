import { Result } from '@core/utils/result';

export type VerificacionCedula = {
  existe: boolean;
  /** true si nombres/apellidos coinciden con los del Registro Civil. */
  coincideNombre: boolean;
};

export type VerificacionCorreo = {
  /** El servidor SMTP del dominio acepta el correo (deliverability real). */
  entregable: boolean;
};

/**
 * ADR-11: fuente de verdad externa para cédula y correo, más allá de la
 * validación de formato. Ambas llamadas van a Edge Functions (nunca a la
 * API externa directamente desde el cliente) para no exponer llaves
 * privadas y para poder cachear resultados.
 */
export interface VerificationRepository {
  verificarExistenciaCedula(
    cedula: string,
    nombres: string,
    apellidos: string
  ): Promise<Result<VerificacionCedula>>;

  verificarCorreo(correo: string): Promise<Result<VerificacionCorreo>>;
}
