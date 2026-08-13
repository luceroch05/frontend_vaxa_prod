'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import {
  FileText, Plus, Loader2, CheckCircle, AlertCircle, Download, Eye, X, ClipboardList, ArrowRight, Pencil, Trash2,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import BotonVolver from '../../shared/components/BotonVolver';
import Pager from '../../shared/components/Pager';
import { DOC_RULES, sanitizeDoc, docLabel } from '../../shared/docs';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { creditosAdminApi, type EmpresaCreditos, type PlanCatalogo } from '../../shared/api/creditos.admin.api';
import { cotizacionesApi, type Cotizacion, type CotizacionConDetalle, type EstadoCotizacion, COT_ESTADO } from '../../shared/api/cotizaciones.admin.api';
import { tarifarioApi, type TarifaPaquete } from '../../shared/api/tarifario.admin.api';
import { PAQUETES_CREDITOS, USUARIO_EXTRA, WEB_PLANES, DOMINIOS, HOSTING, CERTIFICADO_INDIVIDUAL } from '../../shared/data/tarifario';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const sol = (n: number) => `S/ ${n.toFixed(2)}`;
const r2 = (n: number) => Math.round(n * 100) / 100;

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
  const [editando, setEditando] = useState<CotizacionConDetalle | null>(null);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [c, e] = await Promise.all([cotizacionesApi.list(), creditosAdminApi.listEmpresas()]);
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

  const [pdfCargando, setPdfCargando] = useState<number | null>(null);

  /** Trae el PDF del backend y devuelve una URL de Blob lista para ver o descargar. */
  const obtenerPdfUrl = async (c: Cotizacion) => {
    const { pdf_base64 } = await cotizacionesApi.pdf(c.id);
    const bytes = Uint8Array.from(atob(pdf_base64), ch => ch.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  };

  /** Abre el PDF en una pestaña nueva (vista previa, sin forzar descarga). */
  const verPdf = async (c: Cotizacion) => {
    if (pdfCargando) return;
    setPdfCargando(c.id);
    try {
      const url = await obtenerPdfUrl(c);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch { /* noop */ } finally { setPdfCargando(null); }
  };

  const descargarPdf = async (c: Cotizacion) => {
    if (pdfCargando) return;
    setPdfCargando(c.id);
    try {
      const url = await obtenerPdfUrl(c);
      const a = document.createElement('a');
      a.href = url; a.download = `${c.numero}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* noop */ } finally { setPdfCargando(null); }
  };

  const cambiarEstado = async (c: Cotizacion, estado: EstadoCotizacion) => {
    try {
      await cotizacionesApi.cambiarEstado(c.id, COT_ESTADO[estado]);
      cargar();
    } catch { /* noop */ }
  };

  /** Abre el modal de edición: trae el detalle completo y lo pre-carga. */
  const abrirEditar = async (c: Cotizacion) => {
    if (eliminando) return;
    try { setEditando(await cotizacionesApi.get(c.id)); }
    catch { /* noop */ }
  };

  const eliminar = async (c: Cotizacion) => {
    if (eliminando) return;
    if (!window.confirm(`¿Eliminar la cotización ${c.numero}? Esta acción no se puede deshacer.`)) return;
    setEliminando(c.id);
    try { await cotizacionesApi.eliminar(c.id); cargar(); }
    catch (e) { window.alert((e as Error).message || 'No se pudo eliminar.'); }
    finally { setEliminando(null); }
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
        <BotonVolver to={tenantPath(tenantId, '/certificaciones')} />

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
                              <button onClick={() => verPdf(c)} disabled={pdfCargando === c.id} title="Ver PDF"
                                className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70 disabled:opacity-50" style={{ color: '#1D4ED8' }}>
                                {pdfCargando === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} Ver
                              </button>
                              <button onClick={() => descargarPdf(c)} disabled={pdfCargando === c.id} title="Descargar PDF"
                                className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70 disabled:opacity-50" style={{ color: '#B45309' }}>
                                <Download className="w-3.5 h-3.5" /> PDF
                              </button>
                              {!convertida && (
                                <>
                                  <button onClick={() => abrirEditar(c)} title="Editar"
                                    className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#475569' }}>
                                    <Pencil className="w-3.5 h-3.5" /> Editar
                                  </button>
                                  <button onClick={() => eliminar(c)} disabled={eliminando === c.id} title="Eliminar"
                                    className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70 disabled:opacity-50" style={{ color: '#B91C1C' }}>
                                    {eliminando === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Eliminar
                                  </button>
                                  <button onClick={() => setConvertir(c)} title="Convertir en venta"
                                    className="text-[11px] font-semibold flex items-center gap-1 hover:opacity-70" style={{ color: '#059669' }}>
                                    <ArrowRight className="w-3.5 h-3.5" /> Convertir en venta
                                  </button>
                                </>
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

      {(modal || editando) && (
        <NuevaCotizacionModal empresas={empresas} editar={editando}
          onClose={() => { setModal(false); setEditando(null); }}
          onDone={() => { setModal(false); setEditando(null); cargar(); }} />
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

interface LineaCot {
  descripcion: string; cantidad: number; precioUnitario: number; creditos?: number; renueva?: boolean;
  descuentoTipo?: 'monto' | 'pct'; descuentoValor?: number;
}

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
            <p className="px-3 py-2.5 text-[12px]" style={{ color: '#9CA3AF' }}>Sin resultados para "{query}".</p>
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

/** Modal "Nueva cotización" (o edición) = constructor de líneas (empresa o prospecto). */
function NuevaCotizacionModal({ empresas, editar, onClose, onDone }: {
  empresas: EmpresaCreditos[]; editar?: CotizacionConDetalle | null; onClose: () => void; onDone: () => void;
}) {
  const esEdicion = !!editar;
  const [clienteModo, setClienteModo] = useState<'empresa' | 'prospecto'>(editar ? (editar.empresa_id ? 'empresa' : 'prospecto') : 'empresa');
  const [empresaId, setEmpresaId] = useState<number>(editar?.empresa_id ?? empresas[0]?.id ?? 0);
  const [planInfo, setPlanInfo] = useState('');
  const [planesCat, setPlanesCat] = useState<PlanCatalogo[]>([]);       // TODOS los planes (para cotizar migraciones)
  const [planActualSlug, setPlanActualSlug] = useState<string | null>(null);
  const [precioCertSel, setPrecioCertSel] = useState<number>(0);   // > 0 si el cliente es "Pago por certificado"

  // Prospecto (si se edita un prospecto, se pre-cargan sus datos)
  const [docTipo, setDocTipo] = useState(editar && !editar.empresa_id ? editar.cliente_tipo_doc : '6');   // cat.06: 6 RUC · 1 DNI · 4 CE · 0 sin doc
  const [numDoc, setNumDoc] = useState(editar && !editar.empresa_id && editar.cliente_num_doc !== '0' ? editar.cliente_num_doc : '');
  const [nombreCli, setNombreCli] = useState(editar && !editar.empresa_id ? editar.cliente_razon_social : '');
  const [emailCli, setEmailCli] = useState(editar?.cliente_email ?? '');

  const [lineas, setLineas] = useState<LineaCot[]>(
    editar ? editar.detalle.map(d => ({
      descripcion: d.descripcion,
      cantidad: d.cantidad,
      precioUnitario: d.precio_unitario,
      // En BD `creditos` es el total de la línea; en el modal se maneja POR UNIDAD.
      creditos: d.creditos != null && d.cantidad > 0 ? Math.round(d.creditos / d.cantidad) : undefined,
      renueva: d.renueva,
      descuentoTipo: d.descuento_tipo ?? 'pct',
      descuentoValor: d.descuento_valor > 0 ? d.descuento_valor : undefined,
    })) : [],
  );

  const [descTipo, setDescTipo] = useState<'monto' | 'pct'>(editar?.descuento_tipo ?? 'pct');
  const [descVal, setDescVal] = useState(editar && editar.descuento_valor > 0 ? String(editar.descuento_valor) : '');
  const [validaHasta, setValidaHasta] = useState(() => {
    if (editar?.valida_hasta) return editar.valida_hasta.slice(0, 10);
    const d = new Date(); d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [notas, setNotas] = useState(editar?.notas ?? '');
  const [paquetes, setPaquetes] = useState<TarifaPaquete[]>(
    PAQUETES_CREDITOS.map((p, i) => ({ id: i, slug: p.id, planSlug: p.planSlug, nombre: p.nombre, creditos: p.creditos, precio: p.precio })),
  );
  const [usuarioExtra, setUsuarioExtra] = useState({ activacion: USUARIO_EXTRA.activacion, mensual: USUARIO_EXTRA.mensual });
  // Servicios sueltos (web/dominios/hosting): de la BD; fallback a las constantes.
  const [servicios, setServicios] = useState<Array<{ id: string; label: string; precio: number; grupo: string }>>(
    [...WEB_PLANES, ...DOMINIOS, ...HOSTING],
  );
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  // Catálogo de TODOS los planes (para poder cotizar migraciones a cualquier plan).
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

  // Plan vigente de la empresa: solo informativo (se marca "actual" en el catálogo).
  useEffect(() => {
    if (clienteModo !== 'empresa' || !empresaId) { setPlanInfo(''); setPlanActualSlug(null); setPrecioCertSel(0); return; }
    creditosAdminApi.getPlanEmpresa(empresaId).then((est) => {
      setPrecioCertSel(Number(est.precio_certificado ?? 0));
      if (est.plan) {
        setPlanActualSlug(est.plan.slug);
        setPlanInfo(`Plan actual: ${est.plan.nombre} · Mant. ${sol(est.plan.mantenimiento_mensual)}/mes`);
      } else { setPlanActualSlug(null); setPlanInfo('Sin plan asignado.'); }
    }).catch(() => { setPlanInfo(''); setPlanActualSlug(null); setPrecioCertSel(0); });
  }, [empresaId, clienteModo]);

  // Catálogo sugerido: mantenimiento + implementación de CADA plan, paquetes de
  // créditos y usuario adicional. Igual para empresa registrada y prospecto.
  // Vender certificados (pago único, sin mantenimiento). SOLO para clientes en el plan
  // "Pago por certificado" o SIN plan asignado (prospecto). Un cliente con plan de
  // mantenimiento NO compra certificados sueltos: compra créditos con los paquetes.
  const puedeCert = !planActualSlug || planActualSlug === 'pago_certificado';

  const catalogo: Array<{ id: string; label: string; precio: number; creditos?: number; renueva?: boolean; grupo: string }> = [
    ...(puedeCert
      ? [{ id: 'cert', label: 'Certificado (pago por certificado)', precio: precioCertSel || CERTIFICADO_INDIVIDUAL.precio, creditos: 1, grupo: 'Créditos' }]
      : []),
    ...servicios,
    // "Pago por certificado" no tiene mantenimiento ni implementación → se omite (no ensuciar el catálogo con S/0).
    ...planesCat.filter(p => p.slug !== 'pago_certificado').flatMap((p) => {
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
  const actualizar = (i: number, patch: Partial<LineaCot>) =>
    setLineas(ls => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const quitar = (i: number) => setLineas(ls => ls.filter((_, idx) => idx !== i));

  /** Bruto, descuento y neto de una línea (el descuento por línea es independiente del global). */
  const calcLinea = (l: LineaCot) => {
    const bruto = r2(l.cantidad * l.precioUnitario);
    const descuento = l.descuentoValor
      ? r2(l.descuentoTipo === 'pct' ? bruto * Math.min(l.descuentoValor, 100) / 100 : Math.min(l.descuentoValor, bruto))
      : 0;
    return { bruto, descuento, neto: r2(bruto - descuento) };
  };

  const subtotal = r2(lineas.reduce((a, l) => a + calcLinea(l).neto, 0));
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
    if (lineas.some(l => !l.descripcion.trim() || !(l.precioUnitario > 0))) {
      setResultado({ ok: false, msg: 'Cada línea necesita descripción y un precio mayor a 0.' }); return;
    }
    setEnviando(true); setResultado(null);
    try {
      const items = lineas.map(l => ({
        descripcion: l.descripcion.trim(), cantidad: l.cantidad, precioUnitario: l.precioUnitario,
        creditos: l.creditos ? l.creditos * l.cantidad : undefined, renueva: l.renueva,
        descuentoTipo: l.descuentoValor ? l.descuentoTipo : undefined,
        descuentoValor: l.descuentoValor || undefined,
      }));
      const desc_ = descuento > 0 ? { tipo: descTipo, valor: descValor } : undefined;
      const dto = clienteModo === 'empresa'
        ? { empresa_id: empresaId, items, descuento: desc_, notas: notas.trim() || undefined, valida_hasta: validaHasta }
        : {
            cliente: { tipoDoc: docTipo, numDoc: docTipo === '0' ? '0' : numDoc.trim(), razonSocial: nombreCli.trim(), email: emailCli.trim() || undefined },
            items, descuento: desc_, notas: notas.trim() || undefined, valida_hasta: validaHasta,
          };
      const cot = editar ? await cotizacionesApi.actualizar(editar.id, dto) : await cotizacionesApi.crear(dto);
      setResultado({ ok: true, msg: `${cot.numero} ${editar ? 'actualizada' : 'creada'} · ${sol(cot.total)}` });
      setTimeout(onDone, 1400);
    } catch (e) {
      setResultado({ ok: false, msg: (e as Error).message });
    } finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)' }}>
      <div className="w-full max-w-3xl rounded-2xl p-6 max-h-[94vh] overflow-y-auto" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>{esEdicion ? `Editar ${editar!.numero}` : 'Nueva cotización'}</h2>
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
        <p className="text-[10.5px] mb-3" style={{ color: '#9CA3AF' }}>Edita descripción, cantidad, precio y descuento directamente en cada fila. Los precios incluyen IGV.</p>

        {/* Tabla editable */}
        <div className="rounded-xl overflow-hidden mb-4" style={{ border: '1px solid #EEECE6' }}>
          <div className="grid gap-1 px-2 py-2 text-[10.5px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: '1fr 56px 86px 120px 74px 22px', background: '#0D0E12', color: '#fff' }}>
            <span className="pl-1">Producto</span><span className="text-center">Cant.</span><span className="text-right">P. Unit.</span><span className="text-center">Desc.</span><span className="text-right">Total</span><span />
          </div>
          {lineas.length === 0 ? (
            <p className="text-[12.5px] py-6 text-center" style={{ color: '#B0A898' }}>Agrega productos ↑</p>
          ) : lineas.map((l, i) => {
            const { descuento, neto } = calcLinea(l);
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
          {enviando ? 'Guardando...' : `${esEdicion ? 'Guardar cambios' : 'Crear cotización'} · ${sol(total)}`}
        </button>
      </div>
    </div>
  );
}