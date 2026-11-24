/**
 * Nombre de una terapeuta con el tratamiento "Lic." antepuesto, usado en TODO el
 * módulo terapéutico (agenda, expediente, portal del apoderado, actas, servicios…).
 * No lo duplica si el nombre ya trae "Lic." y respeta un nombre vacío/nulo.
 */
export const conLic = (nombre?: string | null): string => {
  const n = (nombre ?? '').trim();
  if (!n) return n;
  return /^lic\.?\s/i.test(n) ? n : `Lic. ${n}`;
};
