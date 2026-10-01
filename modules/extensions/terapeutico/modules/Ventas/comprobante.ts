/**
 * Comprobante imprimible de una venta (RECIBO INTERNO, no SUNAT).
 * Dos formatos: ticket térmico de 72 mm y hoja A4 (210×297 mm).
 * Se imprime abriendo el HTML en un iframe oculto y llamando a window.print()
 * (mismo patrón que el comprobante de crecemos). Sin dependencias nuevas.
 */
import { imgUrl } from '@/lib/api/client';
import type { Venta, CentroFiscal } from '../../shared/api/terapeutico.api';

const fm = (n: number | string) => Number(n || 0).toFixed(2);

const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo', tarjeta: 'Tarjeta', yape: 'Yape / Plin', transferencia: 'Transferencia',
};

/** Código legible del recibo interno derivado del id (sin columnas nuevas en BD). */
export const codigoComprobante = (v: Venta) => `RC-${String(v.id).padStart(6, '0')}`;

const fmtFechaHora = (s: string) => {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ── Número a letras (soles) ─────────────────────────────────────────────────────
const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DIEZ_A_DIECINUEVE = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function seccion(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  let out = '';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (c) out += CENTENAS[c] + ' ';
  if (resto < 10) out += UNIDADES[resto];
  else if (resto < 20) out += DIEZ_A_DIECINUEVE[resto - 10];
  else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    if (resto < 30) out += 'VEINTI' + (u ? UNIDADES[u].toLowerCase() : 'e');   // veintiuno..
    else out += DECENAS[d] + (u ? ' Y ' + UNIDADES[u] : '');
  }
  return out.trim().toUpperCase();
}

/** Entero (0..999999) a palabras. Suficiente para tickets de un centro. */
function enteroALetras(n: number): string {
  if (n === 0) return 'CERO';
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  let out = '';
  if (miles) out += (miles === 1 ? 'MIL' : `${seccion(miles)} MIL`) + ' ';
  if (resto) out += seccion(resto);
  return out.trim();
}

export function numeroALetras(monto: number): string {
  const entero = Math.floor(Math.abs(monto));
  const centimos = Math.round((Math.abs(monto) - entero) * 100);
  return `${enteroALetras(entero)} CON ${String(centimos).padStart(2, '0')}/100 SOLES`;
}

// ── Construcción del HTML ─────────────────────────────────────────────────────
function filasItems(v: Venta): string {
  return (v.items ?? []).map((it) => `
    <tr>
      <td class="c">${Number(it.cantidad)}</td>
      <td class="d">${escapar(it.descripcion)}</td>
      <td class="r">${fm(it.precio_unit)}</td>
      <td class="r">${fm(it.subtotal)}</td>
    </tr>`).join('');
}

const escapar = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function cabeceraCentro(centro: CentroFiscal | null, escala: 'ticket' | 'a4'): string {
  const logo = centro?.logo_url ? imgUrl(centro.logo_url) : '';
  const razon = escapar(centro?.razon_social ?? 'Centro terapéutico');
  // Tope de ancho Y alto para que un logo alto no se dispare (antes solo limitaba el ancho).
  const maxW = escala === 'ticket' ? '90px' : '110px';
  const maxH = escala === 'ticket' ? '48px' : '64px';
  return `
    ${logo ? `<div class="center"><img src="${logo}" style="max-width:${maxW};max-height:${maxH};width:auto;height:auto;object-fit:contain;display:block;margin:0 auto"></div>` : ''}
    <div class="center bold" style="margin-top:4px">${razon}</div>
    ${centro?.ruc ? `<div class="center">R.U.C. ${escapar(centro.ruc)}</div>` : ''}`;
}

/** Cuerpo común (datos + tabla + total + letras) reutilizado por ticket y A4. */
function cuerpo(v: Venta, centro: CentroFiscal | null, escala: 'ticket' | 'a4'): string {
  const metodo = METODO_LABEL[v.metodo_pago] ?? v.metodo_pago;
  // Subtotal = suma de líneas (ya netas de su descuento de ítem). El descuento global
  // se resta aparte. Solo mostramos el desglose si hubo algún descuento.
  const subtotal = (v.items ?? []).reduce((s, it) => s + (Number(it.subtotal) || 0), 0);
  const descGlobal = Number(v.descuento) || 0;
  // Los descuentos por ítem ya están reflejados en el total de cada línea; solo el
  // descuento GLOBAL amerita un desglose (Subtotal − Descuento = Total).
  const desglose = descGlobal > 0
    ? `<div class="row"><span>Subtotal</span><span>S/ ${fm(subtotal)}</span></div>
       <div class="row"><span>Descuento</span><span>− S/ ${fm(descGlobal)}</span></div>`
    : '';
  // Forma de pago: si la venta se dividió en varios métodos, se listan; si no, uno solo.
  const pagos = v.pagos ?? [];
  const pagoLinea = pagos.length > 1
    ? `<div class="campo"><b>Pago:</b> mixto</div>` +
      pagos.map((p) => `<div class="row"><span>${escapar(METODO_LABEL[p.metodo_pago] ?? p.metodo_pago)}</span><span>S/ ${fm(p.monto)}</span></div>`).join('')
    : `<div class="campo"><b>Pago:</b> ${escapar(pagos.length === 1 ? (METODO_LABEL[pagos[0].metodo_pago] ?? pagos[0].metodo_pago) : metodo)}</div>`;
  return `
  ${cabeceraCentro(centro, escala)}
  <div class="center tipo">RECIBO INTERNO</div>
  <div class="center codigo">${codigoComprobante(v)}</div>
  <hr>
  <div class="campo"><b>Fecha:</b> ${fmtFechaHora(v.fecha)}</div>
  <div class="campo"><b>Cliente:</b> ${escapar(v.paciente_nombre ?? 'Mostrador')}</div>
  ${pagoLinea}
  <hr>
  <table>
    <thead><tr><th class="c">Cant.</th><th class="d">Descripción</th><th class="r">P.Unit</th><th class="r">Total</th></tr></thead>
    <tbody>${filasItems(v)}</tbody>
  </table>
  <hr>
  ${desglose}
  <div class="total"><span>TOTAL</span><span>S/ ${fm(v.total)}</span></div>
  <div class="letras"><b>SON:</b> ${numeroALetras(Number(v.total))}</div>
  ${v.nota ? `<hr><div class="campo"><b>Nota:</b> ${escapar(v.nota)}</div>` : ''}
  <div class="center gracias">¡Gracias por su preferencia!</div>`;
}

function estilosTicket(): string {
  return `
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:11px;line-height:1.35;color:#111;width:72mm;padding:8px 6px;margin:0;font-weight:500}
  @media print{@page{size:72mm auto;margin:0}body{width:72mm}}
  .center{text-align:center}.bold,b{font-weight:700}
  .tipo{font-size:11px;font-weight:700;margin-top:3px}
  .codigo{font-size:13px;font-weight:700;letter-spacing:1px;margin:2px 0}
  hr{border:none;border-top:1px dashed #999;margin:5px 0}
  .campo{font-size:10px;margin-bottom:1px}
  table{width:100%;border-collapse:collapse;font-size:10px}
  th{border-bottom:1px dashed #999;padding-bottom:2px;text-align:left}
  td{padding:1px 0;vertical-align:top}
  .c{width:26px}.r{text-align:right;width:44px}.d{padding:0 3px}
  .row{display:flex;justify-content:space-between;font-size:10px;margin-bottom:1px}
  .total{display:flex;justify-content:space-between;font-weight:700;font-size:13px;margin:3px 0}
  .letras{font-size:9px;margin-bottom:4px}
  .gracias{font-weight:700;margin-top:5px;font-size:10px}`;
}

function estilosA4(): string {
  return `
  *{box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.5;color:#111;margin:0}
  @media print{@page{size:A4;margin:14mm}}
  .hoja{max-width:180mm;margin:16mm auto;padding:0 8mm}
  .center{text-align:center}.bold,b{font-weight:700}
  .tipo{font-size:14px;font-weight:700;margin-top:6px;color:#0F766E}
  .codigo{font-size:18px;font-weight:700;letter-spacing:1px;margin:2px 0;color:#0F766E}
  hr{border:none;border-top:1px solid #ddd;margin:10px 0}
  .campo{font-size:12.5px;margin-bottom:2px}
  table{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:6px}
  th{background:#F6FAF9;color:#555;text-transform:uppercase;font-size:11px;padding:6px 8px;text-align:left;border-bottom:1px solid #E5E9E7}
  td{padding:6px 8px;border-bottom:1px solid #F1F5F4;vertical-align:top}
  .c{width:60px;text-align:center}.r{text-align:right;width:90px}
  .row{display:flex;justify-content:flex-end;gap:24px;font-size:12.5px;margin-bottom:2px;color:#444}
  .total{display:flex;justify-content:flex-end;gap:24px;font-weight:700;font-size:16px;margin:10px 0;color:#0F766E}
  .letras{font-size:11.5px;margin-bottom:8px}
  .gracias{font-weight:700;margin-top:14px;color:#0F766E;text-align:center}`;
}

/** Abre el HTML en un iframe oculto y dispara la impresión; lo limpia al terminar. */
function imprimirHTML(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open(); doc.write(html); doc.close();
  const limpiar = () => setTimeout(() => { try { document.body.removeChild(iframe); } catch { /* ya removido */ } }, 1000);
  iframe.onload = () => {
    try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); } catch { /* ignore */ }
    limpiar();
  };
}

export function imprimirTicket(venta: Venta, centro: CentroFiscal | null): void {
  imprimirHTML(`<!doctype html><html><head><meta charset="utf-8"><title>${codigoComprobante(venta)}</title><style>${estilosTicket()}</style></head><body>${cuerpo(venta, centro, 'ticket')}</body></html>`);
}

export function imprimirA4(venta: Venta, centro: CentroFiscal | null): void {
  imprimirHTML(`<!doctype html><html><head><meta charset="utf-8"><title>${codigoComprobante(venta)}</title><style>${estilosA4()}</style></head><body><div class="hoja">${cuerpo(venta, centro, 'a4')}</div></body></html>`);
}
