/**
 * Reglas por tipo de documento de identidad (cat.06 SUNAT) para limitar la
 * entrada en los formularios: largo máximo y si es solo numérico.
 *   '6' RUC (11, num) · '1' DNI (8, num) · '4' CE (≤12) · '7' Pasaporte (≤12) · '0' sin doc
 */
export const DOC_RULES: Record<string, { max: number; numeric: boolean; label: string }> = {
  '6': { max: 11, numeric: true,  label: 'RUC' },
  '1': { max: 8,  numeric: true,  label: 'DNI' },
  '4': { max: 12, numeric: false, label: 'Carné ext.' },
  '7': { max: 12, numeric: false, label: 'Pasaporte' },
  '0': { max: 0,  numeric: false, label: 'Sin documento' },
};

/** Limpia y recorta el número de documento según su tipo (numérico + largo máx). */
export function sanitizeDoc(value: string, tipoDoc: string): string {
  const r = DOC_RULES[tipoDoc] ?? DOC_RULES['6'];
  let v = r.numeric ? value.replace(/\D/g, '') : value.replace(/\s/g, '');
  if (r.max > 0) v = v.slice(0, r.max);
  return v;
}

/** ¿El número tiene el largo exacto que exige su tipo? (para habilitar acciones) */
export function docCompleto(value: string, tipoDoc: string): boolean {
  const r = DOC_RULES[tipoDoc] ?? DOC_RULES['6'];
  if (tipoDoc === '0') return true;
  if (tipoDoc === '6' || tipoDoc === '1') return value.length === r.max;   // RUC/DNI: largo exacto
  return value.length >= 6;                                                // CE/pasaporte: razonable
}
