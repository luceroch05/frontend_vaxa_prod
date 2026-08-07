/* ── Variables del texto del certificado ────────────────────────
 * Tokens que el usuario puede insertar en el "Texto del certificado".
 * Al emitir, el backend (pdf.service) los reemplaza por los datos reales.
 * Esta misma expansión se usa en el front (CertificadoPDF y la vista previa)
 * para que lo que se ve coincida con el PDF real.
 * ─────────────────────────────────────────────────────────────── */

export interface CertVarValues {
  participante: string;
  programa: string;
  horas: string | number;
  creditos?: string | number;
  calidad?: string;      // Participante, Ponente, Organizador…
  fecha?: string;        // fecha de emisión
  fechaInicio?: string;
  fechaFin?: string;
}

/** Variables visibles para el usuario (chips que se insertan con clic). */
export const VARIABLES_CERTIFICADO: { token: string; desc: string }[] = [
  { token: '{participante}', desc: 'Nombre del participante' },
  { token: '{calidad}',      desc: 'Calidad (Participante, Ponente, Organizador…)' },
  { token: '{programa}',     desc: 'Nombre del programa' },
  { token: '{horas}',        desc: 'Horas académicas' },
  { token: '{creditos}',     desc: 'Créditos académicos' },
  { token: '{fechaInicio}',  desc: 'Fecha de inicio' },
  { token: '{fechaFin}',     desc: 'Fecha de fin' },
  { token: '{fecha}',        desc: 'Fecha de emisión' },
];

/* ── Periodo del curso (hasta 3 días puntuales) ──────────────────
 * Espejo EXACTO de periodoCurso() del backend (pdf.service.ts). Debe
 * mantenerse sincronizado con él para que el panel/preview coincidan con el PDF.
 *   1 día  → "el 15 de agosto de 2026"
 *   2-3 días puntuales → "los días 15, 18 y 22 de agosto de 2026"
 *     (mes/año una vez si coinciden; si cruzan mes/año, cada fecha completa)
 *   aula antigua con rango (solo fecha_fin) → "del 15 al 20 de agosto de 2026"
 * ─────────────────────────────────────────────────────────────── */
const MESES_LARGO = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function ymd(d?: string | null): { y: number; m: number; d: number } | null {
  if (!d) return null;
  const s = d.substring(0, 10);
  if (!s || s === '0000-00-00') return null;
  const [y, m, dd] = s.split('-').map(Number);
  if (!y || !m || !dd) return null;
  return { y, m, d: dd };
}
const fechaLarga = (p: { y: number; m: number; d: number }) => `${p.d} de ${MESES_LARGO[p.m - 1]} de ${p.y}`;
const unirDias = (arr: string[]) =>
  arr.length === 2 ? `${arr[0]} y ${arr[1]}` : `${arr.slice(0, -1).join(', ')} y ${arr[arr.length - 1]}`;

/** Frase del periodo (sin "realizado" delante). Ver comentario de arriba. */
export function periodoCurso(inicio?: string | null, fin?: string | null, dia2?: string | null, dia3?: string | null): string {
  const parts = [ymd(inicio), ymd(dia2), ymd(dia3)].filter(Boolean) as { y: number; m: number; d: number }[];
  parts.sort((a, b) => (a.y - b.y) || (a.m - b.m) || (a.d - b.d));

  if (parts.length >= 2) {
    const mismoMesAnio = parts.every(p => p.y === parts[0].y && p.m === parts[0].m);
    if (mismoMesAnio) {
      return `los días ${unirDias(parts.map(p => String(p.d)))} de ${MESES_LARGO[parts[0].m - 1]} de ${parts[0].y}`;
    }
    return `los días ${unirDias(parts.map(fechaLarga))}`;
  }

  const ini = parts[0];
  const f = ymd(fin);   // compatibilidad con aulas antiguas (rango inicio–fin)
  if (ini && f && (f.y !== ini.y || f.m !== ini.m || f.d !== ini.d)) {
    return `del ${fechaLarga(ini)} al ${fechaLarga(f)}`;
  }
  return ini ? `el ${fechaLarga(ini)}` : '';
}

/** Reemplaza los tokens por sus valores. Espejo de la lógica del backend. */
export function expandirVariablesCertificado(texto: string, v: CertVarValues): string {
  return texto
    .replace(/\{nombre\}/gi,       v.participante)
    .replace(/\{participante\}/gi, v.participante)
    .replace(/\{calidad\}/gi,      v.calidad ?? 'Participante')
    .replace(/\{programa\}/gi,     v.programa)
    .replace(/\{curso\}/gi,        v.programa)
    .replace(/\{horas\}/gi,        String(v.horas ?? ''))
    .replace(/\{creditos\}/gi,     v.creditos ? String(v.creditos) : '')
    .replace(/\{fecha\}/gi,        v.fecha ?? '')
    .replace(/\{fechaInicio\}/gi,  v.fechaInicio ?? '')
    .replace(/\{fechaFin\}/gi,     v.fechaFin ?? '');
}
