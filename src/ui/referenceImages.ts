/**
 * Fotos de referencia elegidas por el cliente. Se guardan solo en memoria (nunca se suben a un servidor
 * ni a localStorage) para poder compartirlas con WhatsApp desde el celular. Si se recarga la página se
 * pierden: el cliente las adjunta a mano en el chat.
 */
const files = new Map<string, File>();

const sameFile = (a: File, b: File) => a === b || (a.name === b.name && a.size === b.size && a.lastModified === b.lastModified && a.type === b.type);

/**
 * Guarda el archivo y devuelve el nombre con el que queda registrado. Si ya hay otra foto con ese nombre
 * (en iPhone suelen llamarse todas "image.jpg") se le agrega un número para no reemplazarla.
 */
export function rememberReferenceImage(name: string, file: File): string {
  const dot = name.lastIndexOf('.');
  const [base, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ''];
  let candidate = name;
  for (let i = 2; ; i++) {
    const existing = files.get(candidate);
    if (!existing || sameFile(existing, file)) break;
    candidate = `${base} (${i})${ext}`;
  }
  files.set(candidate, file);
  return candidate;
}

export function referenceImagesFor(names: string[]): File[] {
  const unique = [...new Set(names.filter(Boolean))];
  return unique.map((n) => files.get(n)).filter((f): f is File => f !== undefined);
}

/** true cuando el navegador puede enviar archivos a otras apps (Android, iPhone y algunos computadores). */
export function canShareFiles(list: File[]): boolean {
  if (list.length === 0 || typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false;
  try {
    return navigator.canShare({ files: list });
  } catch {
    return false;
  }
}

/** true si el navegador tiene la función de compartir, aunque la foto ya no esté en memoria. */
export function shareApiAvailable(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';
}
