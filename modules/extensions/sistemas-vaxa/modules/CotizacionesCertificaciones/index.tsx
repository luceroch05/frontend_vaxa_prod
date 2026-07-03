'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import {
  FileText, Plus, Loader2, CheckCircle, AlertCircle, Download, X, ClipboardList, ArrowRight,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import BotonVolver from '../../shared/components/BotonVolver';
import Pager from '../../shared/components/Pager';
import { DOC_RULES, sanitizeDoc, docLabel } from '../../shared/docs';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { creditosAdminApi, type EmpresaCreditos, type PlanCatalogo } from '../../shared/api/creditos.admin.api';
import { cotizacionesApi, type Cotizacion, type EstadoCotizacion, COT_ESTADO } from '../../shared/api/cotizaciones.admin.api';
import { tarifarioApi, type TarifaPaquete } from '../../shared/api/tarifario.admin.api';
import { PAQUETES_CREDITOS, USUARIO_EXTRA } from '../../shared/data/tarifario';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const sol = (n: number) => `S/ ${n.toFixed(2)}`;
const fmt = (s: string | null) => (s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const ESTADO_STYLE: Record<EstadoCotizacion, { bg: string; fg: string }> = {
  BORRADOR:  { bg: '#F1F5F9', fg: '#475569' },
  ENVIADA:   { bg: '#EFF6FF', fg: '#1D4ED8' },
  ACEPTADA:  { bg: '#ECFDF5', fg: '#047857' },
  RECHAZADA: { bg: '#FEF2F2', fg: '#B91C1C' },
  VENCIDA:   { bg: '#FFFBEB', fg: '#B45309' },
};

const ESTADOS: EstadoCotizacion[] = ['BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA'];

export default function CotizacionesCertificaciones({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [filas, setFilas] = useState<Cotizacion[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaCreditos[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [convertir, setConvertir] = useState<Cotizacion | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [c, e] = await Promise.all([cotizacionesApi.list(), creditosAdminApi.listEmpresas()]);
      setFilas(c); setEmpresas(e);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        authStorage.clearAllSessions(); navigate(`/${tenantId}/login`);
      }
    } finally { setLoading(false); }
  }, [tenantId, navigate]);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(`/${tenantId}/login`); return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
    cargar();
  }, [tenantId, navigate, cargar]);

  const descargarPdf = async (c: Cotizacion) => {
    try {
      const { pdf_base64 } = await cotizacionesApi.pdf(c.id);
      const bytes = Uint8Array.from(atob(pdf_base64), ch => ch.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `${c.numero}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* noop */ }
  };

  const cambiarEstado = async (c: Cotizacion, estado: EstadoCotizacion) => {
    try {
      await cotizacionesApi.cambiarEstado(c.id, COT_ESTADO[estado]);
      cargar();
    } catch { /* noop */ }
  };

  if (!usuario) return null;

  const aceptadas = filas.filter(f => f.estado === 'ACEPTADA').length;

  // Paginación de cotizaciones.
  const POR_PAGINA = 12;
  const pages = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
  const pageSafe = Math.min(page, pages);
  const filasPagina = filas.slice((pageSafe - 1) * POR_PAGINA, pageSafe * POR_PAGINA);

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa tenantId={tenantId} usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }} />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <BotonVolver to={`/${tenantId}/certificaciones`} />

        <div className="mb-6 flex items-end justify-between gap-4 page-enter">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Ventas</p>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Cotizaciones</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>
              {aceptadas} aceptada{aceptadas === 1 ? '' : 's'} · {filas.length} en total
            </p>
          </div>
          <button onClick={() => setModal(true)} className="vx-btn px-4 py-2.5 flex-shrink-0 text-white"
            style={{ background: '#059669', boxShadow: '0 4px 12px rgba(5,150,105,0.18)' }}>
            <Plus className="w-4 h-4" /> Nueva cotización
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="rounded-2xl overflow-hidden page-enter" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
            {filas.length === 0 ? (
              <div className="py-16 text-center">
                <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
                <p className="text-[13px]" style={{ color: '#9CA3AF' }}>Aún no has creado cotizaciones.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>
                      <th className="text-left px-5 py-3">Número</th>
                      <th className="text-left py-3">Cliente</th>
                      <th className="text-left py-3">Válida hasta</th>
                      <th className="text-right py-3">Total</th>
                      <th className="text-left py-3 pl-4">Estado</th>
                      <th className="text-right px-5 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasPagina.map((c) => {
                      const st = ESTADO_STYLE[c.estado];
                      const convertida = !!c.comprobante_id;
                      return (
                        <tr key={c.id} style={{ borderTop: '1px solid #F2F0EA' }}>
                          <td className="px-5 py-3">
                            <p className="font-semibold tabular-nums" style={{ color: '#0D0E12' }}>{c.numero}</p>
                            {convertida && <p className="text-[11px]" style={{ color: '#059669' }}>→ {c.comprobante_numero}</p>}
                          </td>
                          <td className="py-3">
                            <p className="truncate max-w-[200px]" style={{ color: '#374151' }}>{c.cliente_razon_social}</p>
                            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                              {c.empresa_id ? 'Empresa' : 'Prospecto'} · {c.cliente_num_doc}
                            </p>
                          </td>
                          <td className="py-3 tabular-nums" style={{ color: '#64748B' }}>{fmt(c.valida_hasta)}</td>
                          <td className="py-3 text-right tabular-nums font-semibold" style={{ color: '#0D0E12' }}>{sol(c.total)}</td>
                          <td className="py-3 pl-4">
                            {convertida ? (
                              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.fg }}>
                                {c.estado_nombre}
                              </span>
                            ) : (
                              <select value={c.estado} onChange={(e) => cambiarEstado(c, e.target.value as EstadoCotizacion)}
                                className="text-[11.5px] font-semibold rounded-lg px-2 py-1 cursor-pointer"
                                style={{ background: st.bg, color: st.fg, border: 'none' }}>
                                {ESTADOS.map(e => <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>)}
                              </select>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-2.5 flex-wrap">
                              <button onClick={() => descargarPdf(c)} title="Descargar PDF"
                                className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#B45309' }}>
                                <Download className="w-3.5 h-3.5" /> PDF
                              </button>
                              {!convertida && (
                                <button onClick={() => setConvertir(c)} title="Convertir en venta"
                                  className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#059669' }}>
                                  <ArrowRight className="w-3.5 h-3.5" /> Convertir en venta
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
        <NuevaCotizacionModal empresas={empresas} onClose={() => setModal(false)} onDone={() => { setModal(false); cargar(); }} />
      )}
      {convertir && (
        <ConvertirModal cotizacion={convertir} onClose={() => setConvertir(null)} onDone={() => { setConvertir(null); cargar(); }} />
      )}
    </div>
  );
}

/** Modal: elige el tipo de comprobante y convierte la cotización en venta real. */
function ConvertirModal({ cotizacion, onClose, onDone }: {
  cotizacion: Cotizacion; onClose: () => void; onDone: () => void;
}) {
  const esEmpresa = !!cotizacion.empresa_id;
  const tieneRuc = cotizacion.cliente_tipo_doc === '6' && !!cotizacion.cliente_num_doc && cotizacion.cliente_num_doc !== '0';
  // FACTURA = solo empresa registrada con RUC. BOLETA/NV = con DNI o cualquier cliente.
  const permiteFactura = esEmpresa && tieneRuc;
  const [tipo, setTipo] = useState<'01' | '03' | 'NV'>('NV');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  const opciones = permiteFactura
    ? ([['01', 'Factura'], ['03', 'Boleta'], ['NV', 'Nota de venta']] as const)
    : ([['03', 'Boleta'], ['NV', 'Nota de venta']] as const);

  const confirmar = async () => {
    if (enviando) return;
    setEnviando(true); setResultado(null);
    try {
      const r = await cotizacionesApi.convertir(cotizacion.id, tipo);
      const c = r.comprobante;
      const ok = c.estado === 'ACEPTADO' || c.estado === 'OBSERVADO' || c.estado === 'EMITIDA';
      setResultado({ ok, msg: ok ? `${c.numero} — ${c.estado_nombre}` : `${c.numero}: ${c.sunat_resp_desc ?? c.estado_nombre}` });
      if (ok) setTimeout(onDone, 1600);
    } catch (e) {
      setResultado({ ok: false, msg: (e as Error).message });
    } finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>Convertir {cotizacion.numero}</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#9CA3AF' }} /></button>
        </div>
        <p className="text-[12.5px] mb-4" style={{ color: '#9CA3AF' }}>
          Se emitirá la venta a <b>{cotizacion.cliente_razon_social}</b> por <b>{sol(cotizacion.total)}</b> y la cotización quedará como aceptada.
        </p>

        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Tipo de comprobante</label>
        <div className="flex rounded-xl overflow-hidden mb-2" style={{ border: '1px solid #EEECE6' }}>
          {opciones.map(([v, label]) => (
            <button key={v} type="button" onClick={() => setTipo(v)} className="flex-1 py-2 text-[13px] font-semibold transition-colors"
              style={tipo === v ? { background: '#059669', color: '#fff' } : { background: '#fff', color: '#64748B' }}>
              {label}
            </button>
          ))}
        </div>
        {!permiteFactura && (
          <p className="text-[11px]" style={{ color: '#B45309' }}>
            La factura solo se emite a <b>empresas registradas con RUC</b>.{' '}
            {esEmpresa ? 'Esta empresa no tiene RUC cargado.' : 'Este cliente es un prospecto (no registrado) → boleta o nota de venta.'}
          </p>
        )}
        {tipo === '01' && <p className="text-[11px] mt-1" style={{ color: '#9CA3AF' }}>Factura (RUC) — se enviará a SUNAT.</p>}
        {tipo === '03' && <p className="text-[11px] mt-1" style={{ color: '#9CA3AF' }}>Boleta (DNI/consumidor final) — se enviará a SUNAT.</p>}

        {resultado && (
          <div className="mt-4 p-3 rounded-xl flex items-center gap-2 text-[12.5px]"
            style={resultado.ok ? { background: '#ECFDF5', color: '#047857' } : { background: '#FEF2F2', color: '#B91C1C' }}>
            {resultado.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {resultado.msg}
          </div>
        )}

        <button onClick={confirmar} disabled={enviando} className="sv-btn sv-btn-primary w-full py-2.5 mt-4">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {enviando ? (tipo === 'NV' ? 'Registrando...' : 'Enviando a SUNAT...') : `Emitir venta · ${sol(cotizacion.total)}`}
        </button>
      </div>
    </div>
  );
}

interface LineaCot { descripcion: string; cantidad: number; precioUnitario: number; creditos?: number; renueva?: boolean; }

/** Combobox con búsqueda para elegir la empresa (filtra por nombre o RUC). */
function ClienteCombo({ empresas, value, onChange }: {
  empresas: EmpresaCreditos[]; value: number; onChange: (id: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = empresas.find(e => e.id === value);
  const q = query.trim().toLowerCase();
  const filtered = empresas.filter(e =>
    !q || e.razon_social.toLowerCase().includes(q) || (e.ruc ?? '').toLowerCase().includes(q),
  ).slice(0, 60);

  return (
    <div className="relative">
      <input
        value={open ? query : (selected ? `${selected.razon_social}${selected.ruc ? ` — ${docLabel(selected.tipo_doc)} ${selected.ruc}` : ''}` : '')}
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
              style={{ background: e.id === value ? '#ECFDF5' : 'transparent' }}>
              <span className="font-medium" style={{ color: '#0D0E12' }}>{e.razon_social}</span>
              {e.ruc && <span style={{ color: '#9CA3AF' }}> — {docLabel(e.tipo_doc)} {e.ruc}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Modal "Nueva cotización" = constructor de líneas (empresa o prospecto). */
function NuevaCotizacionModal({ empresas, onClose, onDone }: {
  empresas: EmpresaCreditos[]; onClose: () => void; onDone: () => void;
}) {
  const [clienteModo, setClienteModo] = useState<'empresa' | 'prospecto'>('empresa');
  const [empresaId, setEmpresaId] = useState<number>(empresas[0]?.id ?? 0);
  const [planInfo, setPlanInfo] = useState('');
  const [planesCat, setPlanesCat] = useState<PlanCatalogo[]>([]);       // TODOS los planes (para cotizar migraciones)
  const [planActualSlug, setPlanActualSlug] = useState<string | null>(null);

  // Prospecto
  const [docTipo, setDocTipo] = useState('6');   // cat.06: 6 RUC · 1 DNI · 4 CE · 0 sin doc
  const [numDoc, setNumDoc] = useState('');
  const [nombreCli, setNombreCli] = useState('');
  const [emailCli, setEmailCli] = useState('');

  const [lineas, setLineas] = useState<LineaCot[]>([]);
  const [sel, setSel] = useState('');
  const [desc, setDesc] = useState('');
  const [cant, setCant] = useState('1');
  const [precio, setPrecio] = useState('');
  const [meta, setMeta] = useState<{ creditos?: number; renueva?: boolean }>({});

  const [descTipo, setDescTipo] = useState<'monto' | 'pct'>('pct');
  const [descVal, setDescVal] = useState('');
  const [validaHasta, setValidaHasta] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [notas, setNotas] = useState('');
  const [paquetes, setPaquetes] = useState<TarifaPaquete[]>(
    PAQUETES_CREDITOS.map((p, i) => ({ id: i, slug: p.id, planSlug: p.planSlug, nombre: p.nombre, creditos: p.creditos, precio: p.precio })),
  );
  const [usuarioExtra, setUsuarioExtra] = useState({ activacion: USUARIO_EXTRA.activacion, mensual: USUARIO_EXTRA.mensual });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  // Catálogo de TODOS los planes (para poder cotizar migraciones a cualquier plan).
  useEffect(() => {
    creditosAdminApi.listPlanes().then(setPlanesCat).catch(() => setPlanesCat([]));
  }, []);

  // Tarifario (paquetes + usuario extra) desde la BD; si falla, quedan los por defecto.
  useEffect(() => {
    tarifarioApi.get().then((t) => {
      if (t.paquetes?.length) setPaquetes(t.paquetes);
      setUsuarioExtra({
        activacion: t.parametros?.usuario_extra_activacion ?? USUARIO_EXTRA.activacion,
        mensual: t.parametros?.usuario_extra_mensual ?? USUARIO_EXTRA.mensual,
      });
    }).catch(() => { /* fallback */ });
  }, []);

  // Plan vigente de la empresa: solo informativo (se marca "actual" en el catálogo).
  useEffect(() => {
    if (clienteModo !== 'empresa' || !empresaId) { setPlanInfo(''); setPlanActualSlug(null); return; }
    creditosAdminApi.getPlanEmpresa(empresaId).then((est) => {
      if (est.plan) {
        setPlanActualSlug(est.plan.slug);
        setPlanInfo(`Plan actual: ${est.plan.nombre} · Mant. ${sol(est.plan.mantenimiento_mensual)}/mes`);
      } else { setPlanActualSlug(null); setPlanInfo('Sin plan asignado.'); }
    }).catch(() => { setPlanInfo(''); setPlanActualSlug(null); });
  }, [empresaId, clienteModo]);

  // Catálogo sugerido: mantenimiento + implementación de CADA plan, paquetes de
  // créditos y usuario adicional. Igual para empresa registrada y prospecto.
  const catalogo: Array<{ id: string; label: string; precio: number; creditos?: number; renueva?: boolean; grupo: string }> = [
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

  const elegirCatalogo = (id: string) => {
    setSel(id);
    const item = catalogo.find(x => x.id === id);
    if (item) { setDesc(item.label); setPrecio(String(item.precio)); setMeta({ creditos: item.creditos, renueva: item.renueva }); }
    else setMeta({});
  };

  const agregar = () => {
    const p = Number(precio); const q = Math.max(1, Math.floor(Number(cant) || 1));
    if (!desc.trim() || !Number.isFinite(p) || p <= 0) return;
    setLineas(ls => [...ls, { descripcion: desc.trim(), cantidad: q, precioUnitario: Math.round(p * 100) / 100, creditos: meta.creditos ? meta.creditos * q : undefined, renueva: meta.renueva }]);
    setSel(''); setDesc(''); setCant('1'); setPrecio(''); setMeta({});
  };
  const quitar = (i: number) => setLineas(ls => ls.filter((_, idx) => idx !== i));

  const subtotal = Math.round(lineas.reduce((a, l) => a + l.cantidad * l.precioUnitario, 0) * 100) / 100;
  const descValor = Number(descVal) || 0;
  const descuento = descValor > 0 ? (descTipo === 'pct' ? Math.round(subtotal * Math.min(descValor, 100) / 100 * 100) / 100 : Math.min(descValor, subtotal)) : 0;
  const total = Math.round((subtotal - descuento) * 100) / 100;

  const guardar = async () => {
    if (lineas.length === 0 || enviando) return;
    if (clienteModo === 'empresa' && !empresaId) { setResultado({ ok: false, msg: 'Elige una empresa.' }); return; }
    if (clienteModo === 'prospecto') {
      if (!nombreCli.trim()) { setResultado({ ok: false, msg: 'Ingresa el nombre del cliente.' }); return; }
      if (docTipo !== '0' && !numDoc.trim()) { setResultado({ ok: false, msg: 'Ingresa el documento del cliente.' }); return; }
    }
    setEnviando(true); setResultado(null);
    try {
      const items = lineas.map(l => ({ descripcion: l.descripcion, cantidad: l.cantidad, precioUnitario: l.precioUnitario, creditos: l.creditos, renueva: l.renueva }));
      const desc_ = descuento > 0 ? { tipo: descTipo, valor: descValor } : undefined;
      const cot = await cotizacionesApi.crear(clienteModo === 'empresa'
        ? { empresa_id: empresaId, items, descuento: desc_, notas: notas.trim() || undefined, valida_hasta: validaHasta }
        : {
            cliente: { tipoDoc: docTipo, numDoc: docTipo === '0' ? '0' : numDoc.trim(), razonSocial: nombreCli.trim(), email: emailCli.trim() || undefined },
            items, descuento: desc_, notas: notas.trim() || undefined, valida_hasta: validaHasta,
          });
      setResultado({ ok: true, msg: `${cot.numero} creada · ${sol(cot.total)}` });
      setTimeout(onDone, 1400);
    } catch (e) {
      setResultado({ ok: false, msg: (e as Error).message });
    } finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)' }}>
      <div className="w-full max-w-2xl rounded-2xl p-6 max-h-[94vh] overflow-y-auto" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>Nueva cotización</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#9CA3AF' }} /></button>
        </div>

        {/* Cliente: empresa registrada o prospecto */}
        <div className="mb-3">
          <div className="flex rounded-lg overflow-hidden mb-2 w-fit" style={{ border: '1px solid #EEECE6' }}>
            {([['empresa', 'Empresa registrada'], ['prospecto', 'Prospecto nuevo']] as const).map(([v, label]) => (
              <button key={v} type="button" onClick={() => setClienteModo(v)} className="px-3 py-1.5 text-[12px] font-semibold transition-colors"
                style={clienteModo === v ? { background: '#0D0E12', color: '#fff' } : { background: '#fff', color: '#64748B' }}>
                {label}
              </button>
            ))}
          </div>
          {clienteModo === 'empresa' ? (
            <>
              <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Cliente (empresa)</label>
              <ClienteCombo empresas={empresas} value={empresaId} onChange={setEmpresaId} />
              {planInfo && <p className="text-[11px] mt-1.5" style={{ color: '#059669' }}>{planInfo}</p>}
            </>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: '130px 1fr' }}>
              <select value={docTipo} onChange={e => { const t = e.target.value; setDocTipo(t); setNumDoc(sanitizeDoc(numDoc, t)); }} className="sv-input text-[13px]" title="Tipo de documento">
                <option value="6">RUC</option>
                <option value="1">DNI</option>
                <option value="4">Carné ext.</option>
                <option value="0">Sin documento</option>
              </select>
              <input value={numDoc} onChange={e => setNumDoc(sanitizeDoc(e.target.value, docTipo))} disabled={docTipo === '0'}
                inputMode={DOC_RULES[docTipo]?.numeric ? 'numeric' : 'text'} maxLength={DOC_RULES[docTipo]?.max || 15}
                placeholder={docTipo === '0' ? '—' : docTipo === '6' ? '20123456789' : docTipo === '1' ? '12345678' : 'N° de documento'} className="sv-input text-[13px]" />
              <input value={nombreCli} onChange={e => setNombreCli(e.target.value)} placeholder="Nombre / razón social del cliente"
                className="sv-input text-[13px]" style={{ gridColumn: '1 / -1' }} />
              <input value={emailCli} onChange={e => setEmailCli(e.target.value)} placeholder="Correo (opcional)" type="email"
                className="sv-input text-[13px]" style={{ gridColumn: '1 / -1' }} />
            </div>
          )}
        </div>

        {/* Fila de agregar producto */}
        <div className="rounded-xl p-3 mb-3" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
          <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 70px 110px 40px' }}>
            <div>
              <select value={sel} onChange={e => elegirCatalogo(e.target.value)} className="sv-input w-full mb-1 text-[12px]">
                <option value="">+ Agregar producto…</option>
                {['Planes', 'Créditos', 'Usuarios'].map((g) => {
                  const items = catalogo.filter(x => x.grupo === g);
                  return items.length ? (
                    <optgroup key={g} label={g}>
                      {items.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
                    </optgroup>
                  ) : null;
                })}
              </select>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción" className="sv-input w-full text-[13px]" />
            </div>
            <input type="number" min={1} value={cant} onChange={e => setCant(e.target.value)} placeholder="Cant." className="sv-input text-right self-end text-[13px]" />
            <input type="number" min={0} step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} placeholder="Precio" className="sv-input text-right self-end text-[13px]" />
            <button type="button" onClick={agregar} className="self-end flex items-center justify-center rounded-lg text-white" style={{ background: '#059669', height: 38 }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10.5px] mt-1.5" style={{ color: '#9CA3AF' }}>Producto sugerido o libre. Los precios incluyen IGV.</p>
        </div>

        {/* Tabla */}
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #EEECE6' }}>
          <div className="grid px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: '1fr 50px 90px 90px 28px', background: '#0D0E12', color: '#fff' }}>
            <span>Producto</span><span className="text-right">Cant.</span><span className="text-right">P. Unit.</span><span className="text-right">Total</span><span />
          </div>
          {lineas.length === 0 ? (
            <p className="text-[12.5px] py-6 text-center" style={{ color: '#B0A898' }}>Agrega productos ↑</p>
          ) : lineas.map((l, i) => (
            <div key={i} className="grid items-center px-3 py-2.5 text-[12.5px]" style={{ gridTemplateColumns: '1fr 50px 90px 90px 28px', borderTop: '1px solid #F2F0EA' }}>
              <div>
                <p style={{ color: '#0D0E12' }}>{l.descripcion}</p>
                {(l.creditos || l.renueva) && <p className="text-[10px]" style={{ color: '#059669' }}>{l.creditos ? `+${l.creditos} créditos` : 'renueva suscripción'}</p>}
              </div>
              <span className="text-right tabular-nums" style={{ color: '#64748B' }}>{l.cantidad}</span>
              <span className="text-right tabular-nums" style={{ color: '#64748B' }}>{sol(l.precioUnitario)}</span>
              <span className="text-right tabular-nums font-semibold" style={{ color: '#0D0E12' }}>{sol(l.cantidad * l.precioUnitario)}</span>
              <button onClick={() => quitar(i)} className="justify-self-end"><X className="w-3.5 h-3.5" style={{ color: '#C8C3BB' }} /></button>
            </div>
          ))}
        </div>

        {/* Validez + notas */}
        <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: '160px 1fr' }}>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Válida hasta</label>
            <input type="date" value={validaHasta} onChange={e => setValidaHasta(e.target.value)} className="sv-input w-full text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#374151' }}>Notas (opcional)</label>
            <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Condiciones, forma de pago…" className="sv-input w-full text-[13px]" />
          </div>
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
          <div className="flex items-center justify-between w-full max-w-[280px] text-[16px] font-bold pt-1.5 mt-1" style={{ color: '#0D0E12', borderTop: '1px solid #EEECE6' }}><span>Total</span><span className="tabular-nums">{sol(total)}</span></div>
        </div>

        {resultado && (
          <div className="mt-3 p-3 rounded-xl flex items-center gap-2 text-[12.5px]"
            style={resultado.ok ? { background: '#ECFDF5', color: '#047857' } : { background: '#FEF2F2', color: '#B91C1C' }}>
            {resultado.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {resultado.msg}
          </div>
        )}

        <button onClick={guardar} disabled={lineas.length === 0 || enviando} className="sv-btn sv-btn-primary w-full py-2.5 mt-4">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {enviando ? 'Guardando...' : `Crear cotización · ${sol(total)}`}
        </button>
      </div>
    </div>
  );
}
