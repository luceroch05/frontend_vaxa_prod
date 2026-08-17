import { imgUrl } from '@/lib/api/client';
import { terapAuthApi, type Paciente, type Historia, type Sesion, type Diagnostico } from '../../shared/api/terapeutico.api';

/**
 * Exportar la historia clínica a PDF sin tocar el backend: se arma un documento
 * HTML imprimible en una ventana nueva y se dispara `print()`, donde el usuario
 * elige «Guardar como PDF». Aislado en el módulo terapéutico (ver feedback de
 * aislar features). Incluye el logo y la razón social del centro (tenant).
 */

const TEAL = '#0F766E';

/** Escapa texto para inyectarlo seguro en el HTML. */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Texto multilínea → párrafo con saltos, o guion si está vacío. */
function texto(v: string | null | undefined): string {
  const t = String(v ?? '').trim();
  return t ? esc(t).replace(/\n/g, '<br/>') : '<span style="color:#9CA3AF">—</span>';
}

const fecha = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '');

interface Datos {
  slug: string;
  paciente: Paciente;
  historia: Historia;
  diagnosticos: Diagnostico[];
  sesiones: Sesion[];
}

export async function imprimirHistoria({ slug, paciente, historia, diagnosticos, sesiones }: Datos): Promise<void> {
  // Branding del centro (logo + razón social). Si falla, seguimos sin logo.
  let logo = ''; let centro = '';
  try {
    const b = await terapAuthApi.existeEmpresa(slug);
    logo = b.logo_url ? imgUrl(b.logo_url) : '';
    centro = b.razon_social ?? '';
  } catch { /* sin branding */ }

  const dxHtml = diagnosticos.length
    ? `<ul class="dx">${diagnosticos.map(d =>
        `<li>${d.codigo_cie10 ? `<b>${esc(d.codigo_cie10)}</b> ` : ''}${esc(d.descripcion)}${d.tipo_nombre ? ` <span class="tag">${esc(d.tipo_nombre)}</span>` : ''}</li>`,
      ).join('')}</ul>`
    : '<p class="vacio">Sin diagnósticos registrados.</p>';

  const sesHtml = sesiones.length
    ? sesiones.map(s => `
        <div class="sesion">
          <div class="sesion-h">
            <b>Sesión ${esc(s.numero_sesion ?? '')} · ${fecha(s.fecha)}</b>
            <span>${esc(s.terapeuta_nombre ?? '')}${s.firmada ? ' · ✔ firmada' : ''}</span>
          </div>
          ${s.subjetivo ? `<p><b>S:</b> ${texto(s.subjetivo)}</p>` : ''}
          ${s.objetivo ? `<p><b>O:</b> ${texto(s.objetivo)}</p>` : ''}
          ${s.analisis ? `<p><b>A:</b> ${texto(s.analisis)}</p>` : ''}
          ${s.plan ? `<p><b>P:</b> ${texto(s.plan)}</p>` : ''}
          ${s.evolucion ? `<p>${texto(s.evolucion)}</p>` : ''}
        </div>`).join('')
    : '<p class="vacio">Sin evoluciones registradas.</p>';

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"/>
<title>Historia clínica · ${esc(paciente.apellidos)}, ${esc(paciente.nombres)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1F2937; margin: 32px; font-size: 12.5px; }
  header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid ${TEAL}; padding-bottom: 12px; margin-bottom: 18px; }
  header img { height: 52px; object-fit: contain; }
  header .t h1 { margin: 0; font-size: 18px; color: #0E1A1A; }
  header .t p { margin: 2px 0 0; color: #6B7280; font-size: 12px; }
  h2 { font-size: 13.5px; color: ${TEAL}; margin: 20px 0 8px; border-bottom: 1px solid #E5E9E7; padding-bottom: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; }
  .grid div { padding: 2px 0; }
  .grid label { color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  .grid span { display: block; color: #111827; }
  .campo { margin: 6px 0; }
  .campo label { color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  .dx { margin: 4px 0; padding-left: 18px; }
  .dx li { margin: 3px 0; }
  .tag { background: #E2E8E6; color: #475569; border-radius: 9px; padding: 1px 7px; font-size: 10.5px; }
  .sesion { border: 1px solid #E5E9E7; border-radius: 8px; padding: 10px 12px; margin: 8px 0; page-break-inside: avoid; }
  .sesion-h { display: flex; justify-content: space-between; margin-bottom: 5px; color: #0E1A1A; }
  .sesion-h span { color: #6B7280; font-size: 11px; }
  .sesion p { margin: 3px 0; }
  .vacio { color: #9CA3AF; }
  footer { margin-top: 26px; border-top: 1px solid #E5E9E7; padding-top: 8px; color: #9CA3AF; font-size: 10.5px; text-align: center; }
  @media print { body { margin: 14mm; } }
</style></head>
<body>
  <header>
    ${logo ? `<img src="${esc(logo)}" alt="logo"/>` : ''}
    <div class="t">
      <h1>Historia Clínica</h1>
      <p>${esc(centro || 'Centro terapéutico')}${historia.numero ? ` · ${esc(historia.numero)}` : ''}${historia.estado_nombre ? ` · ${esc(historia.estado_nombre)}` : ''}</p>
    </div>
  </header>

  <h2>Datos del paciente</h2>
  <div class="grid">
    <div><label>Paciente</label><span>${esc(paciente.apellidos)}, ${esc(paciente.nombres)}</span></div>
    <div><label>Documento</label><span>${esc(paciente.num_doc || '—')}</span></div>
    <div><label>Sexo</label><span>${esc(paciente.sexo_nombre || '—')}</span></div>
    <div><label>Fecha de nacimiento</label><span>${esc(paciente.fecha_nacimiento || '—')}</span></div>
    <div><label>Teléfono</label><span>${esc(paciente.telefono || '—')}</span></div>
    <div><label>Email</label><span>${esc(paciente.email || '—')}</span></div>
    <div><label>Dirección</label><span>${esc(paciente.direccion || '—')}</span></div>
    <div><label>Apertura</label><span>${fecha(historia.fecha_apertura)}</span></div>
  </div>

  <h2>Motivo de consulta</h2>
  <div class="campo">${texto(historia.motivo_consulta)}</div>

  <h2>Antecedentes / anamnesis</h2>
  <div class="campo">${texto(historia.antecedentes)}</div>

  <h2>Diagnósticos</h2>
  ${dxHtml}

  <h2>Evoluciones (SOAP)</h2>
  ${sesHtml}

  <footer>Documento generado el ${new Date().toLocaleString()} · Confidencial — uso clínico exclusivo</footer>
</body></html>`;

  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) { alert('Permite las ventanas emergentes para exportar la historia.'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Espera a que el logo cargue antes de imprimir (si hay).
  win.onload = () => { win.focus(); win.print(); };
  // Respaldo por si onload no dispara (documento ya listo).
  setTimeout(() => { try { win.focus(); win.print(); } catch { /* noop */ } }, 600);
}
