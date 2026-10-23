/** Acceso a localStorage tolerante a fallos (modo privado, cuota llena, almacenamiento bloqueado). */
export function readJSON(key: string): unknown {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    /* El carrito sigue funcionando en memoria aunque no se pueda guardar. */
  }
}

export function remove(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    /* ignorado */
  }
}
