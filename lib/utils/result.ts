export type Result<T, E = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data });
export const err = <E = string>(error: E): Result<never, E> => ({ ok: false, error });
// Alias used by server-action style helpers (more readable at call sites)
export const fail = <E = string>(error: E): Result<never, E> => ({ ok: false, error });
