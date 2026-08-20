/* ────────────────────────────────────────────────────────────────
 * Utilidades de video para las tareas para casa (módulo terapéutico).
 *  - Video PROPIO: se sube como adjunto (mime video/*) → se ve con <video>.
 *  - Video de YOUTUBE: se guarda solo el enlace → se ve embebido con <iframe>.
 * Compartido entre el panel del terapeuta y el portal del apoderado.
 * ──────────────────────────────────────────────────────────────── */

/** ¿El mime del adjunto es un video? (video/mp4, video/webm…). */
export function esVideoMime(mime?: string | null): boolean {
  return (mime ?? '').toLowerCase().startsWith('video');
}

/**
 * Extrae el ID de un enlace de YouTube en sus formas comunes:
 *  watch?v=ID · youtu.be/ID · /embed/ID · /shorts/ID · /live/ID (con params extra).
 * Devuelve null si no parece un enlace de YouTube.
 */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  const patrones = [
    /[?&]v=([A-Za-z0-9_-]{11})/,          // watch?v=ID
    /youtu\.be\/([A-Za-z0-9_-]{11})/,      // youtu.be/ID
    /\/embed\/([A-Za-z0-9_-]{11})/,        // /embed/ID
    /\/shorts\/([A-Za-z0-9_-]{11})/,       // /shorts/ID
    /\/live\/([A-Za-z0-9_-]{11})/,         // /live/ID
  ];
  for (const re of patrones) {
    const m = u.match(re);
    if (m) return m[1];
  }
  // Último recurso: solo el ID pelado (11 chars).
  if (/^[A-Za-z0-9_-]{11}$/.test(u)) return u;
  return null;
}

/** URL para embeber en un <iframe> (o null si el enlace no es de YouTube válido). */
export function youtubeEmbedUrl(url?: string | null): string | null {
  const id = youtubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
