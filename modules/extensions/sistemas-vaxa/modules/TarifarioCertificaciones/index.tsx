'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import {
  DollarSign, CreditCard, Users, FileText, Check, Loader2, PrinterIcon, Sparkles, Plus, Trash2, Save,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import BotonVolver from '../../shared/components/BotonVolver';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { creditosAdminApi, type PlanCatalogo } from '../../shared/api/creditos.admin.api';
import { tarifarioApi, type TarifaPaquete, type TarifaTramo, type ServicioCatalogo } from '../../shared/api/tarifario.admin.api';
import { PAQUETES_CREDITOS, CREDITOS_INDIVIDUALES, USUARIO_EXTRA, costoPorCertificado, CERTIFICADO_INDIVIDUAL, precioCertIndividual } from '../../shared/data/tarifario';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const sol = (n: number) => `S/ ${n.toFixed(2)}`;
const sol0 = (n: number) => `S/ ${n.toFixed(0)}`;

/** Etiqueta de "ilimitado" (0 = sin tope, convención del backend). */
const ilim = (n: number, unidad: string) => (n === 0 ? 'Ilimitado' : `${n} ${unidad}`);

/** Paquetes por defecto (respaldo si aún no se corre la migración del tarifario). */
const PAQUETES_FALLBACK: TarifaPaquete[] = PAQUETES_CREDITOS.map((p, i) => ({
  id: i, slug: p.id, planSlug: p.planSlug, nombre: p.nombre, creditos: p.creditos, precio: p.precio,
}));

const FEATURES: Array<{ key: keyof PlanCatalogo; label: string }> = [
  { key: 'permite_diseno',       label: 'Diseño personalizado' },
  { key: 'permite_subdominio',   label: 'Subdominio propio' },
  { key: 'permite_api',          label: 'Acceso a la API' },
  { key: 'permite_carga_masiva', label: 'Carga masiva por Excel' },
  { key: 'permite_metricas',     label: 'Reportes y métricas' },
  { key: 'permite_auditoria',    label: 'Auditoría' },
];

export default function TarifarioCertificaciones({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [planes, setPlanes] = useState<PlanCatalogo[]>([]);
  const [paquetes, setPaquetes] = useState<TarifaPaquete[]>([]);
  const [tramos, setTramos] = useState<TarifaTramo[]>([]);
  const [usuarioExtra, setUsuarioExtra] = useState({ activacion: USUARIO_EXTRA.activacion, mensual: USUARIO_EXTRA.mensual });
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setPlanes(await creditosAdminApi.listPlanes());
      // El tarifario (paquetes/tramos/parámetros) sale de la BD. Si aún no se
      // corre la migración, se usan los valores por defecto como respaldo.
      try {
        const t = await tarifarioApi.get();
        setPaquetes(t.paquetes?.length ? t.paquetes : PAQUETES_FALLBACK);
        setTramos(t.tramos?.length ? t.tramos : CREDITOS_INDIVIDUALES);
        setUsuarioExtra({
          activacion: t.parametros?.usuario_extra_activacion ?? USUARIO_EXTRA.activacion,
          mensual: t.parametros?.usuario_extra_mensual ?? USUARIO_EXTRA.mensual,
        });
      } catch {
        setPaquetes(PAQUETES_FALLBACK); setTramos(CREDITOS_INDIVIDUALES);
      }
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
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

  if (!usuario) return null;

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa tenantId={tenantId} usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }} />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <div className="no-print"><BotonVolver to={tenantPath(tenantId, '/certificaciones')} /></div>

        <div className="mb-6 flex items-end justify-between gap-4 page-enter">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Referencia comercial</p>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Tarifario · Certificados Digital</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Planes, paquetes de créditos y precios oficiales 2026. Todos los precios incluyen IGV.</p>
          </div>
          <button onClick={() => window.print()} className="vx-btn px-4 py-2.5 flex-shrink-0 no-print"
            style={{ background: '#0D0E12', color: '#fff' }}>
            <PrinterIcon className="w-4 h-4" /> Imprimir
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            {/* ── Planes ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 page-enter stagger-1">
              {planes.map((p) => {
                const ilimitado = p.creditos_incluidos === 0;
                return (
                  <div key={p.id} className="rounded-2xl p-5 flex flex-col"
                    style={{ background: '#FFFFFF', border: '1px solid #EEECE6', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                        <Sparkles className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
                      </div>
                      <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>{p.nombre}</h3>
                    </div>

                    <div className="mb-3">
                      <p className="text-[26px] font-bold leading-none" style={{ color: '#0D0E12' }}>
                        {sol0(p.mantenimiento_mensual)}<span className="text-[12px] font-medium" style={{ color: '#9CA3AF' }}> /mes</span>
                      </p>
                      <p className="text-[12px] mt-1" style={{ color: '#9CA3AF' }}>
                        + {sol0(p.implementacion)} implementación (pago único)
                      </p>
                    </div>

                    <div className="space-y-1.5 mb-3 pb-3" style={{ borderBottom: '1px solid #F2F0EA' }}>
                      <div className="flex items-center gap-2 text-[12.5px]" style={{ color: '#374151' }}>
                        <CreditCard className="w-4 h-4" style={{ color: '#D97706' }} />
                        {ilimitado ? 'Créditos ilimitados' : `${p.creditos_incluidos} créditos incluidos`}
                      </div>
                      <div className="flex items-center gap-2 text-[12.5px]" style={{ color: '#374151' }}>
                        <Users className="w-4 h-4" style={{ color: '#0EA5E9' }} />
                        {ilim(p.usuarios_incluidos, p.usuarios_incluidos === 1 ? 'usuario' : 'usuarios')}
                      </div>
                    </div>

                    <ul className="space-y-1.5 flex-1">
                      {FEATURES.filter((f) => p[f.key]).map((f) => (
                        <li key={f.label} className="flex items-center gap-2 text-[12px]" style={{ color: '#64748B' }}>
                          <Check className="w-3.5 h-3.5" style={{ color: '#059669' }} /> {f.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* ── Paquetes de créditos ── */}
            <div className="mb-8 page-enter stagger-2">
              <h2 className="text-[15px] font-bold mb-1" style={{ color: '#0D0E12' }}>Paquetes de créditos</h2>
              <p className="text-[12.5px] mb-4" style={{ color: '#9CA3AF' }}>Recargas de certificados con descuento por volumen. Cada certificado emitido consume 1 crédito.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {paquetes.map((pq, idx) => (
                  <div key={pq.slug ?? idx} className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EEECE6' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13.5px] font-semibold" style={{ color: '#0D0E12' }}>{pq.nombre}</p>
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FFFBEB', color: '#B45309' }}>
                        {pq.creditos} créditos
                      </span>
                    </div>
                    <p className="text-[24px] font-bold leading-none" style={{ color: '#0D0E12' }}>{sol0(pq.precio)}</p>
                    <p className="text-[12px] mt-1.5" style={{ color: '#059669' }}>{sol(costoPorCertificado(pq))} por certificado</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Certificado individual + descuento por volumen (desde 10) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 page-enter stagger-3">
              {/* Precio individual (tarjeta oscura, como el afiche) */}
              <div className="rounded-2xl p-5 flex flex-col" style={{ background: '#0D0E12', color: '#fff' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <FileText className="w-[18px] h-[18px]" style={{ color: '#34D399' }} />
                  </div>
                  <h2 className="text-[14.5px] font-bold">Certificado individual</h2>
                </div>
                <p className="text-[34px] font-bold leading-none">
                  {sol0(CERTIFICADO_INDIVIDUAL.precio)}
                  <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}> por certificado</span>
                </p>
                <span className="inline-block w-max mt-2.5 text-[10.5px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(52,211,153,0.15)', color: '#6EE7B7' }}>
                  PAGO ÚNICO · SIN MENSUALIDAD
                </span>
                <ul className="space-y-1.5 mt-4 flex-1">
                  {CERTIFICADO_INDIVIDUAL.beneficios.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#34D399' }} /> {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Descuento por volumen + tabla de referencia */}
              <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EEECE6' }}>
                <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                  <h2 className="text-[14.5px] font-bold" style={{ color: '#0D0E12' }}>
                    A partir de {CERTIFICADO_INDIVIDUAL.descuentoDesde} certificados
                  </h2>
                  <span className="text-[13px] font-bold" style={{ color: '#059669' }}>
                    {CERTIFICADO_INDIVIDUAL.pctDescuento}% de descuento
                  </span>
                </div>
                <p className="text-[12px] mb-3" style={{ color: '#9CA3AF' }}>
                  Precio con descuento: <b style={{ color: '#059669' }}>{sol(CERTIFICADO_INDIVIDUAL.precioConDescuento)}</b> por certificado.
                </p>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
                  <div className="grid px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider"
                    style={{ gridTemplateColumns: '1fr 1fr 1fr', background: '#0D0E12', color: '#fff' }}>
                    <span>Cantidad</span><span className="text-right">Precio unitario</span><span className="text-right">Total</span>
                  </div>
                  {CERTIFICADO_INDIVIDUAL.ejemplosCantidad.map((cant) => {
                    const unit = precioCertIndividual(cant);
                    const conDesc = cant >= CERTIFICADO_INDIVIDUAL.descuentoDesde;
                    return (
                      <div key={cant} className="grid items-center px-3 py-2 text-[12.5px]"
                        style={{ gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid #F2F0EA', background: conDesc ? '#F0FDF4' : '#fff' }}>
                        <span className="tabular-nums" style={{ color: '#374151' }}>{cant}</span>
                        <span className="text-right tabular-nums font-medium" style={{ color: conDesc ? '#059669' : '#0D0E12' }}>{sol(unit)}</span>
                        <span className="text-right tabular-nums font-bold" style={{ color: '#0D0E12' }}>{sol(unit * cant)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Créditos individuales + usuario extra ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 page-enter stagger-3">
              <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EEECE6' }}>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
                  <h2 className="text-[14.5px] font-bold" style={{ color: '#0D0E12' }}>Créditos individuales</h2>
                </div>
                <div className="space-y-2">
                  {tramos.map((t) => (
                    <div key={t.desde} className="flex items-center justify-between text-[13px]">
                      <span style={{ color: '#64748B' }}>{t.desde}–{t.hasta} créditos</span>
                      <span className="font-semibold tabular-nums" style={{ color: '#0D0E12' }}>{sol(t.precio)} c/u</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11.5px] mt-3 pt-3" style={{ color: '#9CA3AF', borderTop: '1px solid #F2F0EA' }}>
                  Desde 100 créditos conviene un paquete.
                </p>
              </div>

              <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EEECE6' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-[18px] h-[18px]" style={{ color: '#0EA5E9' }} />
                  <h2 className="text-[14.5px] font-bold" style={{ color: '#0D0E12' }}>Usuario adicional</h2>
                </div>
                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#64748B' }}>Activación (pago único)</span>
                    <span className="font-semibold tabular-nums" style={{ color: '#0D0E12' }}>{sol0(usuarioExtra.activacion)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#64748B' }}>Mensualidad</span>
                    <span className="font-semibold tabular-nums" style={{ color: '#0D0E12' }}>{sol0(usuarioExtra.mensual)} /mes</span>
                  </div>
                </div>
                <p className="text-[11.5px] mt-3 pt-3" style={{ color: '#9CA3AF', borderTop: '1px solid #F2F0EA' }}>
                  Para agregar usuarios por encima del cupo del plan. Descuentos por pago semestral/anual del mantenimiento.
                </p>
              </div>
            </div>

            {/* ── Editor de servicios (web/dominios/hosting) — persiste en la BD ── */}
            <div className="no-print"><ServiciosEditor /></div>

            <div className="mt-6 flex items-center gap-2 text-[12px] no-print" style={{ color: '#9CA3AF' }}>
              <FileText className="w-4 h-4" />
              ¿Vas a proponerle esto a un cliente? Arma una <button onClick={() => navigate(tenantPath(tenantId, '/certificaciones/cotizaciones'))} className="font-semibold underline" style={{ color: '#059669' }}>cotización</button>.
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const GRUPOS_SERVICIO = ['Desarrollo Web', 'Dominios', 'Hosting','VPS'];

/**
 * Editor de servicios sueltos (web/dominios/hosting). Persisten en la BD
 * (tabla catalogo_servicios) — así se editan precios sin re-deploy. Los usan
 * Cotizaciones y Facturación al armar el catálogo.
 */
function ServiciosEditor() {
  const [rows, setRows] = useState<ServicioCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | 'nuevo' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [nuevo, setNuevo] = useState({ grupo: 'Desarrollo Web', nombre: '', precio: '' });

  const cargar = useCallback(() => {
    setLoading(true);
    tarifarioApi.get()
      .then(t => setRows((t.servicios ?? []).slice().sort((a, b) => a.orden - b.orden)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const editar = (id: number, patch: Partial<ServicioCatalogo>) =>
    setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const guardar = async (r: ServicioCatalogo) => {
    if (savingId) return;
    if (!r.nombre.trim() || !(r.precio > 0)) { setMsg({ ok: false, text: 'Nombre y precio (> 0) son obligatorios.' }); return; }
    setSavingId(r.id); setMsg(null);
    try {
      await tarifarioApi.actualizarServicio(r.id, { grupo: r.grupo, nombre: r.nombre.trim(), precio: r.precio });
      setMsg({ ok: true, text: `"${r.nombre.trim()}" guardado.` });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setSavingId(null); }
  };

  const eliminar = async (r: ServicioCatalogo) => {
    if (savingId) return;
    if (!window.confirm(`¿Quitar "${r.nombre}" del catálogo?`)) return;
    setSavingId(r.id); setMsg(null);
    try { await tarifarioApi.eliminarServicio(r.id); setRows(rs => rs.filter(x => x.id !== r.id)); setMsg({ ok: true, text: 'Servicio eliminado.' }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setSavingId(null); }
  };

  const agregar = async () => {
    if (savingId) return;
    const precio = Number(nuevo.precio);
    if (!nuevo.nombre.trim() || !(precio > 0)) { setMsg({ ok: false, text: 'Nombre y precio (> 0) son obligatorios.' }); return; }
    setSavingId('nuevo'); setMsg(null);
    try {
      const slug = `SVC-${Date.now().toString(36).toUpperCase()}`;
      const orden = rows.reduce((m, r) => Math.max(m, r.orden), 0) + 1;
      const s = await tarifarioApi.crearServicio({ slug, grupo: nuevo.grupo, nombre: nuevo.nombre.trim(), precio, orden });
      setRows(rs => [...rs, s]);
      setNuevo({ grupo: nuevo.grupo, nombre: '', precio: '' });
      setMsg({ ok: true, text: `"${s.nombre}" agregado.` });
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setSavingId(null); }
  };

  const COLS = '150px 1fr 110px 76px 40px';

  // Grupos presentes en la lista, en el orden del catálogo (los desconocidos van al final).
  const gruposOrdenados = Array.from(new Set(rows.map(r => r.grupo))).sort((a, b) => {
    const ia = GRUPOS_SERVICIO.indexOf(a), ib = GRUPOS_SERVICIO.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });

  return (
    <div className="mt-8 rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EEECE6' }}>
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
        <h2 className="text-[14.5px] font-bold" style={{ color: '#0D0E12' }}>Servicios (web / dominios / hosting)</h2>
      </div>
      <p className="text-[12px] mb-4" style={{ color: '#9CA3AF' }}>
        Se editan aquí y se guardan en la base de datos. Aparecen en el catálogo de Cotizaciones y Facturación. Precios con IGV.
      </p>

      {loading ? (
        <div className="flex justify-center py-8" style={{ color: '#D1D5DB' }}><Loader2 className="w-5 h-5 animate-spin" /></div>
      ) : (
        <>
          <div className="grid gap-2 px-1 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wider" style={{ gridTemplateColumns: COLS, color: '#B0A898' }}>
            <span>Grupo</span><span>Nombre</span><span className="text-right">Precio S/</span><span /><span />
          </div>
          {rows.length === 0 && <p className="text-[12.5px] py-4 text-center" style={{ color: '#B0A898' }}>Aún no hay servicios. Agrega uno abajo.</p>}
          {/* Agrupados por semejanza (Desarrollo Web / Dominios / Hosting), respetando el orden dentro de cada grupo. */}
          {gruposOrdenados.map(g => (
            <div key={g}>
              <p className="text-[10.5px] font-bold uppercase tracking-wider pt-3 pb-1 pl-1" style={{ color: '#059669' }}>{g}</p>
              {rows.filter(r => r.grupo === g).map(r => (
                <div key={r.id} className="grid gap-2 items-center py-1.5" style={{ gridTemplateColumns: COLS, borderTop: '1px solid #F2F0EA' }}>
                  <select value={r.grupo} onChange={e => editar(r.id, { grupo: e.target.value })} className="sv-cell text-[12px]">
                    {GRUPOS_SERVICIO.map(gg => <option key={gg} value={gg}>{gg}</option>)}
                  </select>
                  <input value={r.nombre} onChange={e => editar(r.id, { nombre: e.target.value })} className="sv-cell text-[12px]" placeholder="Nombre del servicio" />
                  <input type="number" min={0} step="0.01" value={r.precio} onFocus={e => e.target.select()} onChange={e => editar(r.id, { precio: Math.round((Number(e.target.value) || 0) * 100) / 100 })} className="sv-cell text-right text-[12px]" />
                  <button type="button" onClick={() => guardar(r)} disabled={savingId === r.id} className="flex items-center justify-center gap-1 rounded-lg text-[11px] font-semibold text-white disabled:opacity-50" style={{ background: '#059669', height: 32 }}>
                    {savingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  </button>
                  <button type="button" onClick={() => eliminar(r)} disabled={savingId === r.id} title="Eliminar" className="justify-self-center disabled:opacity-50">
                    <Trash2 className="w-4 h-4" style={{ color: '#C8887E' }} />
                  </button>
                </div>
              ))}
            </div>
          ))}

          {/* Agregar nuevo */}
          <div className="grid gap-2 items-center py-2 mt-1" style={{ gridTemplateColumns: COLS, borderTop: '1px solid #EEECE6' }}>
            <select value={nuevo.grupo} onChange={e => setNuevo(n => ({ ...n, grupo: e.target.value }))} className="sv-cell text-[12px]">
              {GRUPOS_SERVICIO.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input value={nuevo.nombre} onChange={e => setNuevo(n => ({ ...n, nombre: e.target.value }))} placeholder="Nuevo servicio…" className="sv-cell text-[12px]" />
            <input type="number" min={0} step="0.01" value={nuevo.precio} onChange={e => setNuevo(n => ({ ...n, precio: e.target.value }))} placeholder="0.00" className="sv-cell text-right text-[12px]" />
            <button type="button" onClick={agregar} disabled={savingId === 'nuevo'} className="flex items-center justify-center rounded-lg text-white disabled:opacity-50" style={{ background: '#0D0E12', height: 32 }}>
              {savingId === 'nuevo' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
            <span />
          </div>

          {msg && (
            <p className="text-[12px] mt-3" style={{ color: msg.ok ? '#047857' : '#B91C1C' }}>{msg.text}</p>
          )}
        </>
      )}
    </div>
  );
}
