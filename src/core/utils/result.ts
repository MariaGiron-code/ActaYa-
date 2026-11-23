/**
 * Resultado explícito de éxito/fallo para los casos de uso.
 *
 * Se usa en lugar de lanzar excepciones entre capas: la capa de presentación
 * necesita mostrar SIEMPRE un estado claro (RF-13: en proceso, guardado o
 * fallido), y un `throw` perdido es justo el tipo de fallo silencioso que la
 * organización reportó en el enunciado ("no sabían si la información se
 * había enviado").
 */
export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export type AppError = {
  code: string;
  message: string;
  cause?: unknown;
};

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function fail<E = AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}
