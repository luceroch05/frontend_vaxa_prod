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
  fecha?: string;        // fecha de emisión
  fechaInicio?: string;
  fechaFin?: string;
}

/** Variables visibles para el usuario (chips que se insertan con clic). */
export const VARIABLES_CERTIFICADO: { token: string; desc: string }[] = [
  { token: '{participante}', desc: 'Nombre del participante' },
  { token: '{programa}',     desc: 'Nombre del programa' },
  { token: '{horas}',        desc: 'Horas académicas' },
  { token: '{fechaInicio}',  desc: 'Fecha de inicio' },
  { token: '{fechaFin}',     desc: 'Fecha de fin' },
  { token: '{fecha}',        desc: 'Fecha de emisión' },
];

/** Reemplaza los tokens por sus valores. Espejo de la lógica del backend. */
export function expandirVariablesCertificado(texto: string, v: CertVarValues): string {
  return texto
    .replace(/\{nombre\}/gi,       v.participante)
    .replace(/\{participante\}/gi, v.participante)
    .replace(/\{programa\}/gi,     v.programa)
    .replace(/\{curso\}/gi,        v.programa)
    .replace(/\{horas\}/gi,        String(v.horas ?? ''))
    .replace(/\{fecha\}/gi,        v.fecha ?? '')
    .replace(/\{fechaInicio\}/gi,  v.fechaInicio ?? '')
    .replace(/\{fechaFin\}/gi,     v.fechaFin ?? '');
}
