// Utilidades compartidas para empresa-techpro

/**
 * Convierte una fecha "solo día" (YYYY-MM-DD, o un ISO con la hora en 00:00 UTC
 * que viene de una columna DATE) a un Date anclado al MEDIODÍA local. Así la zona
 * horaria (Perú, UTC-5) no la corre un día hacia atrás al mostrarla.
 */
function fechaLocalSegura(dateString: string): Date {
  const s = String(dateString ?? '');
  const soloDia = s.substring(0, 10);
  // Si viene solo la fecha (o un ISO a medianoche), la anclamos al mediodía local.
  if (/^\d{4}-\d{2}-\d{2}$/.test(soloDia)) {
    return new Date(soloDia + 'T12:00:00');
  }
  return new Date(s);
}

export function formatDate(dateString: string): string {
  return fechaLocalSegura(dateString).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/** Fecha compacta (ej. "23 jun 26") — timezone-safe. Útil para listados. */
export function formatDateShort(dateString: string): string {
  return fechaLocalSegura(dateString).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
