/**
 * Normaliza un nombre/apellido a un formato único: cada palabra con la primera
 * letra en mayúscula y el resto en minúscula. Colapsa espacios repetidos.
 * Espejo de la versión del backend (src/shared/text.ts) — el backend lo aplica
 * igual al guardar, esto es solo para feedback inmediato en el formulario.
 *
 * Ej: "jUAN  carlos PÉREZ-gómez" → "Juan Carlos Pérez-Gómez"
 */
export function aTituloNombre(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .replace(/(^|[\s\-'’])([a-zñáéíóúü])/g,
      (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase('es'));
}
