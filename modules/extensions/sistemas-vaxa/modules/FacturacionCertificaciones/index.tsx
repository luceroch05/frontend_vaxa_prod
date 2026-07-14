'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import {
  FileText, Plus, Loader2, CheckCircle, AlertCircle, Download, X, Building2, Ban,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import BotonVolver from '../../shared/components/BotonVolver';
import Pager from '../../shared/components/Pager';
import { DOC_RULES, sanitizeDoc, esEmpresa, docLabel } from '../../shared/docs';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { facturacionApi, type Comprobante, type EstadoComprobante } from '../../shared/api/facturacion.admin.api';
import { creditosAdminApi, type EmpresaCreditos, type PlanCatalogo } from '../../shared/api/creditos.admin.api';
import { tarifarioApi, type TarifaPaquete } from '../../shared/api/tarifario.admin.api';
import { PAQUETES_CREDITOS, USUARIO_EXTRA, WEB_PLANES, DOMINIOS, HOSTING } from '../../shared/data/tarifario';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const sol = (n: number) => `S/ ${n.toFixed(2)}`;
const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const fmt = (s: string | null) => (s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Paquetes de créditos (catálogo fijo). */
const PAQUETES = [
  { id: 'p100', creditos: 100, precio: 270 },
  { id: 'p300', creditos: 300, precio: 750 },
  { id: 'p700', creditos: 700, precio: 1500 },
];

const ESTADO: Record<EstadoComprobante, { bg: string; fg: string }> = {
  ACEPTADO:  { bg: '#ECFDF5', fg: '#047857' },
  OBSERVADO: { bg: '#FFFBEB', fg: '#B45309' },
  PENDIENTE: { bg: '#F1F5F9', fg: '#475569' },
  ENVIADO:   { bg: '#EFF6FF', fg: '#1D4ED8' },
  RECHAZADO: { bg: '#FEF2F2', fg: '#B91C1C' },
  ERROR:     { bg: '#FEF2F2', fg: '#B91C1C' },
  BAJA:      { bg: '#F5F4F0', fg: '#6B7280' },
  EMITIDA:   { bg: '#F0F9FF', fg: '#0369A1' },   // nota de venta (interna, no SUNAT)
};

export default function FacturacionCertificaciones({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [filas, setFilas] = useState<Comprobante[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaCreditos[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [page, setPage] = useState(1);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [c, e] = await Promise.all([facturacionApi.list(), creditosAdminApi.listEmpresas()]);
      setFilas(c); setEmpresas(e);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        authStorage.clearAllSessions(); navigate(tenantPath(tenantId, '/login'));
      }
    } finally { setLoading(false); }
  }, [tenantId, navigate]);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(tenantPath(tenantId, '/login')); return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
    cargar();
  }, [tenantId, navigate, cargar]);

  const [nota, setNota] = useState<Comprobante | null>(null);

  const bajar = (data: BlobPart, name: string, type: string) => {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };

  const descargar = async (c: Comprobante, tipo: 'xml' | 'cdr') => {
    try {
      const { xml } = await facturacionApi.archivo(c.id, tipo);
      bajar(xml, `${tipo === 'cdr' ? 'R-' : ''}${c.numero}.xml`, 'application/xml');
    } catch { /* noop */ }
  };

  const descargarPdf = async (c: Comprobante) => {
    try {
      const { pdf_base64 } = await facturacionApi.pdf(c.id);
      const bytes = Uint8Array.from(atob(pdf_base64), ch => ch.charCodeAt(0));
      bajar(bytes, `${c.numero}.pdf`, 'application/pdf');
    } catch { /* noop */ }
  };

  if (!usuario) return null;

  const aceptados = filas.filter(f => f.estado === 'ACEPTADO').length;

  // Paginación de comprobantes.
  const POR_PAGINA = 12;
  const pages = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
  const pageSafe = Math.min(page, pages);
  const filasPagina = filas.slice((pageSafe - 1) * POR_PAGINA, pageSafe * POR_PAGINA);

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa tenantId={tenantId} usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }} />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <BotonVolver to={tenantPath(tenantId, '/certificaciones')} />

        <div className="mb-6 flex items-end justify-between gap-4 page-enter">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Facturación electrónica</p>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Comprobantes</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>
              {aceptados} aceptado{aceptados === 1 ? '' : 's'} por SUNAT · {filas.length} en total
            </p>
          </div>
          <button onClick={() => setModal(true)} className="vx-btn px-4 py-2.5 flex-shrink-0 text-white"
            style={{ background: '#059669', boxShadow: '0 4px 12px rgba(5,150,105,0.18)' }}>
            <Plus className="w-4 h-4" /> Emitir factura
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="rounded-2xl overflow-hidden page-enter" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
            {filas.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                <p className="text-[13px]" style={{ color: '#9CA3AF' }}>Aún no has emitido comprobantes.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>
                      <th className="text-left px-5 py-3">Número</th>
                      <th className="text-left py-3">Cliente</th>
                      <th className="text-left py-3">Fecha</th>
                      <th className="text-right py-3">Total</th>
                      <th className="text-left py-3 pl-4">Estado SUNAT</th>
                      <th className="text-right px-5 py-3">Archivos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasPagina.map((c) => {
                      const st = ESTADO[c.estado] ?? ESTADO.PENDIENTE;
                      return (
                        <tr key={c.id} style={{ borderTop: '1px solid #F2F0EA' }}>
                          <td className="px-5 py-3">
                            <p className="font-semibold tabular-nums" style={{ color: '#0D0E12' }}>{c.numero}</p>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{c.tipo_nombre}</p>
                          </td>
                          <td className="py-3">
                            <p className="truncate max-w-[200px]" style={{ color: '#374151' }}>{c.cliente_razon_social}</p>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{c.cliente_num_doc}</p>
                          </td>
                          <td className="py-3 tabular-nums" style={{ color: '#64748B' }}>{fmt(c.fecha_emision)}</td>
                          <td className="py-3 text-right tabular-nums font-semibold" style={{ color: '#0D0E12' }}>{sol(c.importe_total)}</td>
                          <td className="py-3 pl-4">
                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.fg }}>
                              {c.estado_nombre}
                            </span>
                            {c.sunat_resp_desc && c.estado !== 'ACEPTADO' && (
                              <p className="text-[10.5px] mt-1 max-w-[220px]" style={{ color: '#B91C1C' }}>{c.sunat_resp_desc}</p>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2.5 flex-wrap">
                              <button onClick={() => descargarPdf(c)} title="Descargar PDF"
                                className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#B45309' }}>
                                <FileText className="w-3.5 h-3.5" /> PDF
                              </button>
                              <button onClick={() => descargar(c, 'xml')} title="Descargar XML firmado"
                                className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#475569' }}>
                                <Download className="w-3.5 h-3.5" /> XML
                              </button>
                              {(c.estado === 'ACEPTADO' || c.estado === 'OBSERVADO') && (
                                <button onClick={() => descargar(c, 'cdr')} title="Descargar CDR de SUNAT"
                                  className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#047857' }}>
                                  <Download className="w-3.5 h-3.5" /> CDR
                                </button>
                              )}
                              {c.estado === 'ACEPTADO' && ['01', '03'].includes(c.tipo_comprobante) && (
                                <button onClick={() => setNota(c)} title="Emitir nota de crédito (anular)"
                                  className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#B91C1C' }}>
                                  <Ban className="w-3.5 h-3.5" /> Anular
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="px-5 pb-1">
                  <Pager page={pageSafe} pages={pages} total={filas.length} onPage={setPage} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {modal && (
        <EmitirModal empresas={empresas} onClose={() => setModal(false)} onDone={() => { setModal(false); cargar(); }} />
      )}
      {nota && (
        <NotaModal comprobante={nota} onClose={() => setNota(null)} onDone={() => { setNota(null); cargar(); }} />
      )}
    </div>
  );
}

/** Motivos de nota de crédito (catálogo 09 SUNAT). */
const MOTIVOS = [
  { codigo: '01', nombre: 'Anulación de la operación' },
  { codigo: '02', nombre: 'Anulación por error en el RUC' },
  { codigo: '03', nombre: 'Corrección por error en la descripción' },
  { codigo: '06', nombre: 'Devolución total' },
  { codigo: '07', nombre: 'Devolución por ítem' },
  { codigo: '10', nombre: 'Descuento global' },
];

/** Modal para emitir una nota de crédito (anular) sobre un comprobante. */
function NotaModal({ comprobante, onClose, onDone }: {
  comprobante: Comprobante; onClose: () => void; onDone: () => void;
}) {
  const [motivo, setMotivo] = useState('01');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  const emitir = async () => {
    if (enviando) return;
    setEnviando(true); setResultado(null);
    try {
      const m = MOTIVOS.find(x => x.codigo === motivo)!;
      const c = await facturacionApi.emitirNota(comprobante.id, {
        tipo_nota: '07', motivo_codigo: motivo, motivo_descripcion: m.nombre,
      });
      const ok = c.estado === 'ACEPTADO' || c.estado === 'OBSERVADO';
      setResultado({ ok, msg: ok ? `${c.numero} — ${c.estado_nombre}` : `${c.numero} — ${c.sunat_resp_desc ?? c.estado_nombre}` });
      if (ok) setTimeout(onDone, 1600);
    } catch (e) {
      setResultado({ ok: false, msg: (e as Error).message });
    } finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>Anular {comprobante.numero}</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#9CA3AF' }} /></button>
        </div>
        <p className="text-[12.5px] mb-4" style={{ color: '#9CA3AF' }}>
          Se emitirá una <b>nota de crédito</b> a SUNAT que anula este comprobante.
        </p>
        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Motivo</label>
        <select value={motivo} onChange={e => setMotivo(e.target.value)} className="sv-input w-full">
          {MOTIVOS.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
        </select>

        {resultado && (
          <div className="mt-4 p-3 rounded-xl flex items-center gap-2 text-[12.5px]"
            style={resultado.ok ? { background: '#ECFDF5', color: '#047857' } : { background: '#FEF2F2', color: '#B91C1C' }}>
            {resultado.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {resultado.msg}
          </div>
        )}

        <button onClick={emitir} disabled={enviando} className="sv-btn w-full py-2.5 mt-4 text-white"
          style={{ background: '#B91C1C' }}>
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
          {enviando ? 'Enviando a SUNAT...' : 'Emitir nota de crédito'}
        </button>
      </div>
    </div>
  );
}

interface LineaVenta {
  descripcion: string; cantidad: number; precioUnitario: number; creditos?: number; renueva?: boolean;
  descuentoTipo?: 'monto' | 'pct'; descuentoValor?: number;   // descuento propio de la línea
}

/** Bruto, descuento y neto de una línea (el descuento por línea es independiente del global). */
const calcLineaVenta = (l: LineaVenta) => {
  const bruto = r2(l.cantidad * l.precioUnitario);
  const descuento = l.descuentoValor
    ? r2((l.descuentoTipo ?? 'pct') === 'pct' ? bruto * Math.min(l.descuentoValor, 100) / 100 : Math.min(l.descuentoValor, bruto))
    : 0;
  return { bruto, descuento, neto: r2(bruto - descuento) };
};

/** Combobox con búsqueda para elegir el cliente (filtra por nombre o RUC). */
function ClienteCombo({ empresas, value, onChange }: {
  empresas: EmpresaCreditos[]; value: number; onChange: (id: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const selected = empresas.find(e => e.id === value);
  const q = query.trim().toLowerCase();
  const filtered = empresas.filter(e =>
    !q || e.razon_social.toLowerCase().includes(q) || (e.ruc ?? '').toLowerCase().includes(q),
  ).slice(0, 60);

  return (
    <div className="relative">
      <input
        value={open ? query : (selected ? `${selected.razon_social} — ${docLabel(selected.tipo_doc)} ${selected.ruc}` : '')}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={e => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Busca por nombre o RUC…"
        className="sv-input w-full"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-xl bg-white"
          style={{ border: '1px solid #EEECE6', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-[12px]" style={{ color: '#9CA3AF' }}>Sin resultados para “{query}”.</p>
          ) : filtered.map(e => (
            <button key={e.id} type="button"
              onMouseDown={() => { onChange(e.id); setQuery(''); setOpen(false); }}
              className="block w-full text-left px-3 py-2 text-[12.5px] transition-colors"
              style={{ background: e.id === value ? '#ECFDF5' : 'transparent' }}
              onMouseEnter={ev => { ev.currentTarget.style.background = '#FAFAF8'; }}
              onMouseLeave={ev => { ev.currentTarget.style.background = e.id === value ? '#ECFDF5' : 'transparent'; }}>
              <span className="font-medium" style={{ color: '#0D0E12' }}>{e.razon_social}</span>
              <span style={{ color: '#9CA3AF' }}> — {docLabel(e.tipo_doc)} {e.ruc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Modal "Emitir factura" = constructor de líneas (igual al del perfil) + selector de cliente. */
function EmitirModal({ empresas, onClose, onDone }: {
  empresas: EmpresaCreditos[]; onClose: () => void; onDone: () => void;
}) {
  // Solo EMPRESAS con RUC real (tipo_doc '6'). Ojo: una persona-DNI tiene su DNI en `ruc`,
  // por eso NO basta con `e.ruc` — hay que exigir que sea empresa (SUNAT: factura solo con RUC).
  const conRuc = empresas.filter(e => esEmpresa(e.tipo_doc) && e.ruc);
  const [empresaId, setEmpresaId] = useState<number>(conRuc[0]?.id ?? 0);
  const [planInfo, setPlanInfo] = useState('');
  const [planesCat, setPlanesCat] = useState<PlanCatalogo[]>([]);       // TODOS los planes (mant/impl de cada uno)
  const [planActualSlug, setPlanActualSlug] = useState<string | null>(null);
  const [paquetes, setPaquetes] = useState<TarifaPaquete[]>(
    PAQUETES_CREDITOS.map((p, i) => ({ id: i, slug: p.id, planSlug: p.planSlug, nombre: p.nombre, creditos: p.creditos, precio: p.precio })),
  );
  const [usuarioExtra, setUsuarioExtra] = useState({ activacion: USUARIO_EXTRA.activacion, mensual: USUARIO_EXTRA.mensual });
  // Servicios sueltos (web/dominios/hosting): de la BD; fallback a las constantes.
  const [servicios, setServicios] = useState<Array<{ id: string; label: string; precio: number; grupo: string }>>(
    [...WEB_PLANES, ...DOMINIOS, ...HOSTING],
  );

  const [lineas, setLineas] = useState<LineaVenta[]>([]);

  // Por defecto Nota de venta (NV), NO factura — pedido del usuario.
  const [tipoComp, setTipoComp] = useState<'01' | '03' | 'NV'>('NV');  // factura | boleta | nota de venta
  // Cliente: empresa registrada o persona con DNI (solo boleta/NV). Factura siempre empresa.
  const [clienteModo, setClienteModo] = useState<'empresa' | 'dni'>('empresa');
  const [docTipo, setDocTipo] = useState('1');   // cat.06: 1 DNI · 4 CE · 0 sin doc
  const [numDoc, setNumDoc]   = useState('');
  const [nombreCli, setNombreCli] = useState('');
  const [descTipo, setDescTipo] = useState<'monto' | 'pct'>('pct');
  const [descVal, setDescVal]   = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  // Catálogo de TODOS los planes (mant/impl de cualquiera) desde la BD.
  useEffect(() => {
    creditosAdminApi.listPlanes().then(setPlanesCat).catch(() => setPlanesCat([]));
  }, []);

  // Tarifario (paquetes + usuario extra + servicios) desde la BD; si falla, quedan los por defecto.
  useEffect(() => {
    tarifarioApi.get().then((t) => {
      if (t.paquetes?.length) setPaquetes(t.paquetes);
      if (t.servicios?.length) setServicios(t.servicios.map(s => ({ id: s.slug, label: s.nombre, precio: s.precio, grupo: s.grupo })));
      setUsuarioExtra({
        activacion: t.parametros?.usuario_extra_activacion ?? USUARIO_EXTRA.activacion,
        mensual: t.parametros?.usuario_extra_mensual ?? USUARIO_EXTRA.mensual,
      });
    }).catch(() => { /* fallback */ });
  }, []);

  // Plan vigente de la empresa: info + marca "actual" en el catálogo.
  useEffect(() => {
    if (!empresaId) { setPlanInfo(''); setPlanActualSlug(null); return; }
    creditosAdminApi.getPlanEmpresa(empresaId).then((est) => {
      if (est.plan) {
        setPlanActualSlug(est.plan.slug);
        setPlanInfo(`${est.plan.nombre} · Mant. ${sol(est.plan.mantenimiento_mensual)}/mes · ${est.creditos.disponibles} créditos`);
      } else { setPlanActualSlug(null); setPlanInfo('Sin plan asignado.'); }
    }).catch(() => { setPlanInfo(''); setPlanActualSlug(null); });
  }, [empresaId]);

  // Mismo catálogo que Cotizaciones: servicios web/dominios/hosting + mant/impl de
  // CADA plan (BD) + paquetes de créditos (BD) + usuario adicional (BD).
  const catalogo: Array<{ id: string; label: string; precio: number; creditos?: number; renueva?: boolean; grupo: string }> = [
    ...servicios,
    ...planesCat.flatMap((p) => {
      const actual = p.slug === planActualSlug ? ' · plan actual' : '';
      return [
        { id: `mant-${p.slug}`, label: `Mantenimiento ${p.nombre}${actual} (mensual)`, precio: p.mantenimiento_mensual, renueva: true, grupo: 'Planes' },
        { id: `impl-${p.slug}`, label: `Implementación ${p.nombre}${actual}`, precio: p.implementacion, grupo: 'Planes' },
      ];
    }),
    ...paquetes.map(pq => ({ id: pq.slug, label: `${pq.nombre} (${pq.creditos} créditos)`, precio: pq.precio, creditos: pq.creditos, grupo: 'Créditos' })),
    { id: 'user-act', label: 'Usuario adicional — activación (único)', precio: usuarioExtra.activacion, grupo: 'Usuarios' },
    { id: 'user-mes', label: 'Usuario adicional — mensualidad', precio: usuarioExtra.mensual, grupo: 'Usuarios' },
  ];

  // Agrega una línea desde el catálogo (pre-llena) o vacía; luego TODO se edita en la tabla.
  const addCatalogo = (id: string) => {
    const item = catalogo.find(x => x.id === id);
    if (!item) return;
    setLineas(ls => [...ls, {
      descripcion: item.label, cantidad: 1, precioUnitario: r2(item.precio),
      creditos: item.creditos, renueva: item.renueva, descuentoTipo: 'pct',
    }]);
  };
  const addVacia = () => setLineas(ls => [...ls, { descripcion: '', cantidad: 1, precioUnitario: 0, descuentoTipo: 'pct' }]);
  const actualizar = (i: number, patch: Partial<LineaVenta>) =>
    setLineas(ls => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const quitar = (i: number) => setLineas(ls => ls.filter((_, idx) => idx !== i));

  const subtotal = r2(lineas.reduce((a, l) => a + calcLineaVenta(l).neto, 0));
  const descValor = Number(descVal) || 0;
  const descuento = descValor > 0 ? (descTipo === 'pct' ? Math.round(subtotal * Math.min(descValor, 100) / 100 * 100) / 100 : Math.min(descValor, subtotal)) : 0;
  const total = Math.round((subtotal - descuento) * 100) / 100;
  const esNV = tipoComp === 'NV';
  const permiteDni = tipoComp !== '01';                 // factura siempre va a empresa con RUC
  const modo = permiteDni ? clienteModo : 'empresa';
  // Cliente registrado elegible según el comprobante (regla SUNAT):
  //  - Factura (01): SOLO empresas con RUC.
  //  - Boleta (03):  SOLO personas (DNI/CE) — la boleta NO lleva RUC.
  //  - Nota de venta (NV): cualquiera (interno, no va a SUNAT).
  const clientesEmpresa =
    tipoComp === '01' ? conRuc
    : tipoComp === '03' ? empresas.filter(e => !esEmpresa(e.tipo_doc))
    : empresas;
  // Si el cliente elegido ya no aplica al nuevo comprobante (p. ej. una empresa RUC al
  // pasar a boleta), lo limpiamos para que el personal reelija uno válido.
  useEffect(() => {
    setEmpresaId((cur) => (cur && clientesEmpresa.some(e => e.id === cur) ? cur : (clientesEmpresa[0]?.id ?? 0)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoComp]);
  // Nota de venta = monto simple (sin IGV); factura/boleta = con IGV.
  const base = esNV ? total : Math.round((total / 1.18) * 100) / 100;
  const igv = esNV ? 0 : Math.round((total - base) * 100) / 100;
  const tipoLabel = tipoComp === '01' ? 'factura' : tipoComp === '03' ? 'boleta' : 'nota de venta';

  const registrar = async () => {
    if (lineas.length === 0 || enviando) return;
    if (modo === 'empresa' && !empresaId) { setResultado({ ok: false, msg: 'Elige un cliente (empresa).' }); return; }
    if (modo === 'dni') {
      if (!nombreCli.trim()) { setResultado({ ok: false, msg: 'Ingresa el nombre del cliente.' }); return; }
      if (docTipo !== '0' && !numDoc.trim()) { setResultado({ ok: false, msg: 'Ingresa el documento del cliente.' }); return; }
    }
    if (lineas.some(l => !l.descripcion.trim() || !(l.precioUnitario > 0))) {
      setResultado({ ok: false, msg: 'Cada línea necesita descripción y un precio mayor a 0.' }); return;
    }
    setEnviando(true); setResultado(null);
    try {
      const itemsDto = lineas.map(l => ({
        descripcion: l.descripcion.trim(), cantidad: l.cantidad, precioUnitario: l.precioUnitario,
        creditos: l.creditos ? l.creditos * l.cantidad : undefined, renueva: l.renueva,
        descuentoTipo: l.descuentoValor ? l.descuentoTipo : undefined,
        descuentoValor: l.descuentoValor || undefined,
      }));
      const descDto = descuento > 0 ? { tipo: descTipo, valor: descValor } : undefined;
      const r = modo === 'dni'
        ? await facturacionApi.registrarVentaManual({
            cliente: { tipoDoc: docTipo, numDoc: docTipo === '0' ? '0' : numDoc.trim(), razonSocial: nombreCli.trim() },
            items: itemsDto, descuento: descDto, tipo_comprobante: esNV ? 'NV' : '03',
          })
        : await creditosAdminApi.registrarVenta(empresaId, { items: itemsDto, descuento: descDto, tipo_comprobante: tipoComp });
      const c = r.comprobante;
      const ok = c.estado === 'ACEPTADO' || c.estado === 'OBSERVADO' || c.estado === 'EMITIDA';
      setResultado({ ok, msg: ok ? `${c.numero} — ${c.estado_nombre}${r.creditosAgregados ? ` · +${r.creditosAgregados} créditos` : ''}` : `${c.numero}: ${c.sunat_resp_desc ?? c.estado_nombre}` });
      if (ok) setTimeout(onDone, 1800);
    } catch (e) {
      setResultado({ ok: false, msg: (e as Error).message });
    } finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)' }}>
      <div className="w-full max-w-3xl rounded-2xl p-6 max-h-[94vh] overflow-y-auto" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>Emitir {tipoLabel}</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#9CA3AF' }} /></button>
        </div>

        {empresas.length === 0 ? (
          <p className="text-[13px] py-6 text-center" style={{ color: '#9CA3AF' }}>
            No hay empresas registradas.
          </p>
        ) : (
          <>
            {/* Tipo de comprobante */}
            <div className="flex rounded-xl overflow-hidden mb-3" style={{ border: '1px solid #EEECE6' }}>
              {([['01', 'Factura'], ['03', 'Boleta'], ['NV', 'Nota de venta']] as const).map(([v, label]) => (
                <button key={v} type="button" onClick={() => setTipoComp(v)} className="flex-1 py-2 text-[13px] font-semibold transition-colors"
                  style={tipoComp === v ? { background: '#059669', color: '#fff' } : { background: '#fff', color: '#64748B' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Cliente: empresa registrada o (boleta/NV) persona con DNI */}
            <div className="mb-3">
              {permiteDni && (
                <div className="flex rounded-lg overflow-hidden mb-2 w-fit" style={{ border: '1px solid #EEECE6' }}>
                  {([['empresa', tipoComp === '03' ? 'Persona registrada' : 'Empresa'], ['dni', 'Cliente con DNI']] as Array<['empresa' | 'dni', string]>).map(([v, label]) => (
                    <button key={v} type="button" onClick={() => setClienteModo(v)} className="px-3 py-1.5 text-[12px] font-semibold transition-colors"
                      style={modo === v ? { background: '#0D0E12', color: '#fff' } : { background: '#fff', color: '#64748B' }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {modo === 'empresa' ? (
                <>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>
                    {tipoComp === '01' ? 'Cliente (empresa con RUC)' : tipoComp === '03' ? 'Cliente (persona registrada)' : 'Cliente (empresa)'}
                  </label>
                  <ClienteCombo empresas={clientesEmpresa} value={empresaId} onChange={setEmpresaId} />
                  {tipoComp === '01' && clientesEmpresa.length === 0 && (
                    <p className="text-[11px] mt-1.5" style={{ color: '#B45309' }}>No hay empresas con RUC. Usa boleta o nota de venta, o agrega el RUC en Información.</p>
                  )}
                  {tipoComp === '03' && clientesEmpresa.length === 0 && (
                    <p className="text-[11px] mt-1.5" style={{ color: '#B45309' }}>No hay personas registradas. Usa <b>"Cliente con DNI"</b> para ingresar el documento.</p>
                  )}
                  {planInfo && <p className="text-[11px] mt-1.5" style={{ color: '#059669' }}>{planInfo}</p>}
                </>
              ) : (
                <div className="grid gap-2" style={{ gridTemplateColumns: '130px 1fr' }}>
                  <select value={docTipo} onChange={e => { const t = e.target.value; setDocTipo(t); setNumDoc(sanitizeDoc(numDoc, t)); }} className="sv-input text-[13px]" title="Tipo de documento">
                    <option value="1">DNI</option>
                    <option value="4">Carné ext.</option>
                    <option value="0">Sin documento</option>
                  </select>
                  <input value={numDoc} onChange={e => setNumDoc(sanitizeDoc(e.target.value, docTipo))} disabled={docTipo === '0'}
                    inputMode={DOC_RULES[docTipo]?.numeric ? 'numeric' : 'text'} maxLength={DOC_RULES[docTipo]?.max || 15}
                    placeholder={docTipo === '0' ? '—' : docTipo === '1' ? '12345678' : 'N° de documento'} className="sv-input text-[13px]" />
                  <input value={nombreCli} onChange={e => setNombreCli(e.target.value)} placeholder="Nombre del cliente"
                    className="sv-input text-[13px]" style={{ gridColumn: '1 / -1' }} />
                </div>
              )}
            </div>

            {/* Agregar: catálogo (pre-llena una fila) o línea vacía. Luego se edita TODO en la tabla. */}
            <div className="flex gap-2 mb-1.5">
              <select value="" onChange={e => addCatalogo(e.target.value)} className="sv-input flex-1 text-[12.5px]">
                <option value="">+ Agregar producto del catálogo…</option>
                {['Desarrollo Web', 'Dominios', 'Hosting', 'Planes', 'Créditos', 'Usuarios'].map((g) => {
                  const items = catalogo.filter(x => x.grupo === g);
                  return items.length ? (
                    <optgroup key={g} label={g}>
                      {items.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
                    </optgroup>
                  ) : null;
                })}
              </select>
              <button type="button" onClick={addVacia} className="flex items-center gap-1 px-3 rounded-lg text-[12.5px] font-semibold flex-shrink-0"
                style={{ border: '1px solid #EEECE6', color: '#059669', background: '#fff' }}>
                <Plus className="w-3.5 h-3.5" /> Línea
              </button>
            </div>
            <p className="text-[10.5px] mb-3" style={{ color: '#9CA3AF' }}>Edita descripción, cantidad, precio y descuento directamente en cada fila. {esNV ? 'Precio sin IGV (monto simple).' : 'El precio incluye IGV.'}</p>

            {/* Tabla editable */}
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #EEECE6' }}>
              <div className="grid gap-1 px-2 py-2 text-[10.5px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: '1fr 56px 86px 120px 74px 22px', background: '#0D0E12', color: '#fff' }}>
                <span className="pl-1">Producto</span><span className="text-center">Cant.</span><span className="text-right">P. Unit.</span><span className="text-center">Desc.</span><span className="text-right">Total</span><span />
              </div>
              {lineas.length === 0 ? (
                <p className="text-[12.5px] py-6 text-center" style={{ color: '#B0A898' }}>Agrega productos ↑</p>
              ) : lineas.map((l, i) => {
                const { descuento, neto } = calcLineaVenta(l);
                const dt = l.descuentoTipo ?? 'pct';
                return (
                  <div key={i} className="grid gap-1 items-start px-2 py-1.5" style={{ gridTemplateColumns: '1fr 56px 86px 120px 74px 22px', borderTop: '1px solid #F2F0EA' }}>
                    <div>
                      <input value={l.descripcion} onChange={e => actualizar(i, { descripcion: e.target.value })} placeholder="Descripción" className="sv-cell text-[12px]" />
                      {(l.creditos || l.renueva) && <p className="text-[9.5px] mt-0.5 pl-1" style={{ color: '#059669' }}>{l.creditos ? `+${l.creditos * l.cantidad} créditos` : 'renueva suscripción'}</p>}
                    </div>
                    <input type="number" min={1} value={l.cantidad} onFocus={e => e.target.select()} onChange={e => actualizar(i, { cantidad: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} className="sv-cell text-center text-[12px]" />
                    <input type="number" min={0} step="0.01" value={l.precioUnitario} onFocus={e => e.target.select()} onChange={e => actualizar(i, { precioUnitario: r2(Number(e.target.value) || 0) })} className="sv-cell text-right text-[12px]" />
                    <div className="flex gap-1">
                      <div className="flex rounded-md overflow-hidden flex-shrink-0" style={{ border: '1px solid #EEECE6' }}>
                        <button type="button" onClick={() => actualizar(i, { descuentoTipo: 'monto' })} className="px-1.5 text-[10px] font-semibold" style={dt === 'monto' ? { background: '#059669', color: '#fff' } : { color: '#9CA3AF' }}>S/</button>
                        <button type="button" onClick={() => actualizar(i, { descuentoTipo: 'pct' })} className="px-1.5 text-[10px] font-semibold" style={dt === 'pct' ? { background: '#059669', color: '#fff' } : { color: '#9CA3AF' }}>%</button>
                      </div>
                      <input type="number" min={0} value={l.descuentoValor ?? ''} onFocus={e => e.target.select()} onChange={e => actualizar(i, { descuentoValor: e.target.value === '' ? undefined : Number(e.target.value) })} placeholder="0" className="sv-cell text-right text-[12px]" title="Descuento de esta línea" />
                    </div>
                    <div className="text-right self-center">
                      <p className="tabular-nums font-semibold text-[12px]" style={{ color: '#0D0E12' }}>{sol(neto)}</p>
                      {descuento > 0 && <p className="text-[9.5px] tabular-nums" style={{ color: '#B45309' }}>-{sol(descuento)}</p>}
                    </div>
                    <button onClick={() => quitar(i)} className="justify-self-end self-center" title="Quitar"><X className="w-3.5 h-3.5" style={{ color: '#C8C3BB' }} /></button>
                  </div>
                );
              })}
            </div>

            {/* Descuento + Totales */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center justify-between w-full max-w-[280px] text-[12.5px]" style={{ color: '#64748B' }}><span>Subtotal</span><span className="tabular-nums">{sol(subtotal)}</span></div>
              <div className="flex items-center justify-between w-full max-w-[280px] gap-2 text-[12.5px]" style={{ color: '#64748B' }}>
                <span className="flex items-center gap-1.5">Descuento
                  <span className="flex rounded-md overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
                    <button type="button" onClick={() => setDescTipo('monto')} className="px-1.5 text-[11px] font-semibold" style={descTipo === 'monto' ? { background: '#059669', color: '#fff' } : { color: '#9CA3AF' }}>S/</button>
                    <button type="button" onClick={() => setDescTipo('pct')} className="px-1.5 text-[11px] font-semibold" style={descTipo === 'pct' ? { background: '#059669', color: '#fff' } : { color: '#9CA3AF' }}>%</button>
                  </span>
                </span>
                <input type="number" min={0} value={descVal} onChange={e => setDescVal(e.target.value)} placeholder="0" className="sv-input w-24 text-right text-[12px]" />
              </div>
              {!esNV && (
                <>
                  <div className="flex items-center justify-between w-full max-w-[280px] text-[11.5px]" style={{ color: '#9CA3AF' }}><span>Op. gravada</span><span className="tabular-nums">{sol(base)}</span></div>
                  <div className="flex items-center justify-between w-full max-w-[280px] text-[11.5px]" style={{ color: '#9CA3AF' }}><span>IGV (18%)</span><span className="tabular-nums">{sol(igv)}</span></div>
                </>
              )}
              <div className="flex items-center justify-between w-full max-w-[280px] text-[16px] font-bold pt-1.5 mt-1" style={{ color: '#0D0E12', borderTop: '1px solid #EEECE6' }}><span>Total</span><span className="tabular-nums">{sol(total)}</span></div>
            </div>

            {resultado && (
              <div className="mt-3 p-3 rounded-xl flex items-center gap-2 text-[12.5px]"
                style={resultado.ok ? { background: '#ECFDF5', color: '#047857' } : { background: '#FEF2F2', color: '#B91C1C' }}>
                {resultado.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {resultado.msg}
              </div>
            )}

            <button onClick={registrar} disabled={lineas.length === 0 || enviando} className="sv-btn sv-btn-primary w-full py-2.5 mt-4">
              {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {enviando ? (esNV ? 'Registrando...' : 'Enviando a SUNAT...') : `Emitir ${tipoLabel} · ${sol(total)}`}
            </button>
            {esNV && <p className="text-[11px] text-center mt-2" style={{ color: '#9CA3AF' }}>Nota de venta interna — NO se declara a SUNAT.</p>}
          </>
        )}
      </div>
    </div>
  );
}
