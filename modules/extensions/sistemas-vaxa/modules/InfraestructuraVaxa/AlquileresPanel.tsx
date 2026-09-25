'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { tenantPath } from '@/lib/paths';
import { Plus, X, Pencil, Trash2, Save, Loader2, AlertTriangle, Search, Clock, Mail, Check, FileText } from '@/components/ui/icon';
import {
  infraAlquileresApi, infraCobrosApi, listInfraEmpresas, estadoVencimiento, estadoEfectivo, diasHasta, fechaCorta,
  type InfraAlquiler, type InfraRecurso, type InfraEmpresaLite, type InfraCobro,
} from '../../shared/api/infra.admin.api';

const GREEN = '#059669';
const CICLOS = [
  { v: 'mensual', l: 'Mensual' },
  { v: 'trimestral', l: 'Trimestral' },
  { v: 'semestral', l: 'Semestral' },
  { v: 'anual', l: 'Anual' },
  { v: 'unico', l: 'Pago único' },
];
const PAGOS: { v: string; l: string; c: string; bg: string }[] = [
  { v: 'pagado', l: 'Pagado', c: GREEN, bg: '#ECFDF5' },
  { v: 'pendiente', l: 'Pendiente', c: '#B45309', bg: '#FEF3C7' },
  { v: 'vencido', l: 'Vencido', c: '#DC2626', bg: '#FEF2F2' },
];
// Filtros por estado efectivo (por fecha), más "todos".
const FILTROS = [
  { v: 'todos', l: 'Todos' },
  { v: 'vencido', l: 'Vencidos' },
  { v: 'por_vencer', l: 'Por vencer' },
  { v: 'al_dia', l: 'Al día' },
  { v: 'pendiente', l: 'Pendientes' },
  { v: 'pagado', l: 'Pagados' },
] as const;

const fmt = (n: number, moneda = 'PEN') =>
  `${moneda === 'USD' ? '$' : 'S/'} ${(Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AlquileresPanel({ alquileres, recursos, tenantId, onChange }: {
  alquileres: InfraAlquiler[]; recursos: InfraRecurso[]; tenantId: string; onChange: () => void;
}) {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<InfraEmpresaLite[]>([]);
  const [modal, setModal] = useState<'nuevo' | number | null>(null);
  const [form, setForm] = useState<Partial<InfraAlquiler>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const editando = typeof modal === 'number';

  // Búsqueda + filtro por estado
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]['v']>('todos');

  // Acciones de la fila (con feedback, ya no silenciosas)
  const [panelError, setPanelError] = useState<string | null>(null);
  const [panelOk, setPanelOk] = useState<string | null>(null);
  const [confirmCobro, setConfirmCobro] = useState<InfraAlquiler | null>(null);
  const [cobrando, setCobrando] = useState(false);
  const [recordandoId, setRecordandoId] = useState<number | null>(null);
  const [histFor, setHistFor] = useState<InfraAlquiler | null>(null);

  useEffect(() => { listInfraEmpresas().then((e) => setEmpresas(Array.isArray(e) ? e : [])).catch(() => {}); }, []);

  const abrirNuevo = () => { setForm({ moneda: 'PEN', ciclo: 'mensual', estado_pago: 'pendiente', activo: 1 }); setModal('nuevo'); setError(null); };
  const abrirEditar = (a: InfraAlquiler) => { setForm({ ...a }); setModal(a.id); setError(null); };
  const cerrar = () => setModal(null);
  const set = (k: keyof InfraAlquiler, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const flash = (ok: string | null, err: string | null) => {
    setPanelOk(ok); setPanelError(err);
    if (ok) setTimeout(() => setPanelOk(null), 4000);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id && !form.cliente?.trim()) { setError('Indica el cliente (empresa o nombre)'); return; }
    setSaving(true); setError(null);
    try {
      const payload: Partial<InfraAlquiler> = {
        cliente: form.empresa_id ? null : (form.cliente?.trim() || null),
        email: form.email?.trim() || null,
        empresa_id: form.empresa_id || null,
        recurso_id: form.recurso_id || null,
        descripcion: form.descripcion?.trim() || null,
        precio: Number(form.precio) || 0, moneda: form.moneda || 'PEN', ciclo: form.ciclo || 'mensual',
        fecha_inicio: form.fecha_inicio || null, proximo_cobro: form.proximo_cobro || null,
        estado_pago: form.estado_pago || 'pendiente', notas: form.notas || null,
        activo: form.activo ? 1 : 0,
      };
      if (editando) await infraAlquileresApi.update(modal as number, payload);
      else await infraAlquileresApi.create(payload);
      cerrar(); onChange();
    } catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    if (delId == null) return;
    try { await infraAlquileresApi.remove(delId); setDelId(null); onChange(); }
    catch (e) { setError((e as Error).message); }
  };

  // Registrar cobro: SIEMPRE con confirmación (evita el doble clic que adelanta 2 ciclos).
  const registrarCobro = async () => {
    if (!confirmCobro) return;
    setCobrando(true); setPanelError(null);
    try {
      await infraAlquileresApi.cobrar(confirmCobro.id);
      const nombre = confirmCobro.empresa_nombre || confirmCobro.cliente || 'Cliente';
      setConfirmCobro(null);
      onChange();
      flash(`Cobro registrado a ${nombre}. El próximo cobro se corrió al siguiente ciclo.`, null);
    } catch (e) { flash(null, `No se pudo registrar el cobro: ${(e as Error).message}`); }
    finally { setCobrando(false); }
  };

  const recordar = async (a: InfraAlquiler) => {
    setRecordandoId(a.id); setPanelError(null);
    try {
      const r = await infraAlquileresApi.recordar(a.id);
      if (r.enviado) flash(`Recordatorio enviado a ${a.email}.`, null);
      else flash(null, `No se envió el recordatorio: ${r.motivo}.`);
    } catch (e) { flash(null, `No se pudo enviar el recordatorio: ${(e as Error).message}`); }
    finally { setRecordandoId(null); }
  };

  // Puente a Facturación: lleva al modal de factura YA lleno con TODO lo que paga ese
  // cliente (todos sus alquileres activos). El admin revisa y recién ahí emite.
  const facturar = (a: InfraAlquiler) => {
    const mismoCliente = (x: InfraAlquiler) =>
      a.empresa_id ? x.empresa_id === a.empresa_id : (!x.empresa_id && x.cliente === a.cliente);
    const grupo = alquileres.filter((x) => x.activo !== 0 && mismoCliente(x));
    const prefillFactura = {
      empresa_id: a.empresa_id ?? null,
      cliente: a.empresa_nombre || a.cliente || 'Cliente',
      lineas: grupo.map((x) => ({
        descripcion: x.descripcion || x.recurso_nombre || 'Servicio de infraestructura',
        cantidad: 1,
        precioUnitario: Number(x.precio) || 0,
      })),
    };
    navigate(tenantPath(tenantId, '/certificaciones/facturacion'), { state: { prefillFactura } });
  };

  // ── Lista filtrada ──────────────────────────────────────
  const visibles = useMemo(() => {
    const term = q.trim().toLowerCase();
    return alquileres.filter((a) => {
      const nombre = (a.empresa_nombre || a.cliente || '').toLowerCase();
      const desc = (a.descripcion || a.recurso_nombre || '').toLowerCase();
      if (term && !nombre.includes(term) && !desc.includes(term)) return false;
      if (filtro !== 'todos' && estadoEfectivo(a).key !== filtro) return false;
      return true;
    });
  }, [alquileres, q, filtro]);

  return (
    <div className="sv-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Alquileres (lo que cobras)</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Servicios que le cobras a cada cliente, con su próximo cobro.</p>
        </div>
        <button onClick={abrirNuevo} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-semibold text-white text-[13px]" style={{ background: GREEN }}>
          <Plus size={15} /> Agregar
        </button>
      </div>

      {/* Búsqueda + filtro */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input className="vx-input w-full pl-9" placeholder="Buscar cliente o servicio…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="vx-input sm:w-44" value={filtro} onChange={(e) => setFiltro(e.target.value as any)}>
          {FILTROS.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
        </select>
      </div>

      {/* Feedback de acciones (cobro / recordatorio) */}
      {panelOk && <p className="text-[12.5px] mt-3 px-3 py-2 rounded-lg" style={{ background: '#F0FDF4', color: '#047857', border: '1px solid #A7F3D0' }}>{panelOk}</p>}
      {panelError && <p className="text-[12.5px] mt-3 px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>{panelError}</p>}

      <div className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
        {visibles.length === 0 ? (
          <div className="text-center py-12 text-[13.5px]" style={{ color: '#9CA3AF' }}>
            {alquileres.length === 0 ? 'Aún no hay alquileres. Agrega el primero.' : 'Ningún alquiler coincide con la búsqueda.'}
          </div>
        ) : visibles.map((a, idx) => {
          const cliente = a.empresa_nombre || a.cliente || 'Cliente';
          const est = estadoVencimiento(a.proximo_cobro);
          const d = diasHasta(a.proximo_cobro);
          const col = est === 'vencido' ? '#DC2626' : est === 'por_vencer' ? '#D97706' : '#6B7280';
          const efe = estadoEfectivo(a);
          return (
            <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-3" style={{ borderBottom: idx < visibles.length - 1 ? '1px solid #F1F4F3' : undefined, background: '#fff' }}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold truncate" style={{ color: '#0D0E12' }}>{cliente}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: efe.bg, color: efe.c }}>{efe.label}</span>
                </div>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
                  {a.descripcion || a.recurso_nombre || 'Servicio'} · {fmt(a.precio, a.moneda)} / {a.ciclo}
                </p>
                {a.ultimo_cobro && (
                  <p className="text-[11px] mt-0.5" style={{ color: GREEN }}>✓ Último cobro: {fechaCorta(a.ultimo_cobro)}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {a.proximo_cobro && (
                  <div className="text-right hidden sm:block mr-1">
                    <p className="text-[12px] font-semibold flex items-center gap-1 justify-end" style={{ color: col }}>
                      {est !== 'vigente' && <AlertTriangle size={12} />}
                      {d! < 0 ? `Venció hace ${Math.abs(d!)} d` : d === 0 ? 'Cobra hoy' : `Cobra en ${d} d`}
                    </p>
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{fechaCorta(a.proximo_cobro)}</p>
                  </div>
                )}
                <button onClick={() => setConfirmCobro(a)} title="Registrar cobro y correr al siguiente ciclo" className="text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: '#ECFDF5', color: GREEN, border: '1px solid #A7F3D0' }}>Registrar cobro</button>
                <button onClick={() => facturar(a)} title="Facturar: abre el comprobante ya lleno para revisar y emitir" className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}><FileText size={13} /> Facturar</button>
                <button onClick={() => recordar(a)} disabled={recordandoId === a.id} title={a.email ? `Recordar a ${a.email}` : 'Agrega el correo del cliente para recordarle'} className="p-1.5 rounded-lg disabled:opacity-50" style={{ color: a.email ? '#0EA5E9' : '#CBD5E1' }}>
                  {recordandoId === a.id ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                </button>
                <button onClick={() => setHistFor(a)} title="Historial de cobros" className="p-1.5 rounded-lg" style={{ color: '#64748B' }}><Clock size={16} /></button>
                <button onClick={() => abrirEditar(a)} title="Editar" className="p-1.5 rounded-lg" style={{ color: '#64748B' }}><Pencil size={16} /></button>
                <button onClick={() => setDelId(a.id)} title="Eliminar" className="p-1.5 rounded-lg" style={{ color: '#94A3B8' }}><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal alta/edición */}
      {modal !== null && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }} onMouseDown={cerrar}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>{editando ? 'Editar alquiler' : 'Nuevo alquiler'}</h3>
              <button onClick={cerrar} style={{ color: '#94A3B8' }}><X size={18} /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3.5">
              <Campo label="Cliente (empresa del sistema)">
                <EmpresaCombobox empresas={empresas} value={form.empresa_id ?? null} onChange={(id) => set('empresa_id', id)} />
                <p className="text-[11.5px] mt-1" style={{ color: '#9CA3AF' }}>Elige una empresa, o déjalo vacío y escribe el nombre abajo.</p>
              </Campo>
              {!form.empresa_id && (
                <Campo label="Cliente (nombre manual)">
                  <input className="vx-input w-full" value={form.cliente ?? ''} placeholder="Cliente externo" onChange={(e) => set('cliente', e.target.value)} />
                </Campo>
              )}
              <Campo label="Correo del cliente (para recordatorios)">
                <input type="email" className="vx-input w-full" value={form.email ?? ''} placeholder="cliente@correo.com" onChange={(e) => set('email', e.target.value)} />
              </Campo>
              <Campo label="Recurso enlazado (para el margen, opcional)">
                <select className="vx-input w-full" value={form.recurso_id ?? ''} onChange={(e) => set('recurso_id', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— Ninguno —</option>
                  {recursos.map((r) => <option key={r.id} value={r.id}>{r.tipo} · {r.nombre}</option>)}
                </select>
              </Campo>
              <Campo label="Descripción (si no enlazas recurso)">
                <input className="vx-input w-full" value={form.descripcion ?? ''} placeholder="Hosting + dominio" onChange={(e) => set('descripcion', e.target.value)} />
              </Campo>
              <div className="grid grid-cols-3 gap-3">
                <Campo label="Precio">
                  <input type="number" step="0.01" className="vx-input w-full" value={form.precio ?? ''} onChange={(e) => set('precio', e.target.value)} />
                </Campo>
                <Campo label="Moneda">
                  <select className="vx-input w-full" value={form.moneda ?? 'PEN'} onChange={(e) => set('moneda', e.target.value)}>
                    <option value="PEN">S/ PEN</option><option value="USD">$ USD</option>
                  </select>
                </Campo>
                <Campo label="Ciclo">
                  <select className="vx-input w-full" value={form.ciclo ?? 'mensual'} onChange={(e) => set('ciclo', e.target.value)}>
                    {CICLOS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
                  </select>
                </Campo>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Inicio">
                  <input type="date" className="vx-input w-full" value={fechaCorta(form.fecha_inicio)} onChange={(e) => set('fecha_inicio', e.target.value)} />
                </Campo>
                <Campo label="Próximo cobro (cuándo cobras)">
                  <input type="date" className="vx-input w-full" value={fechaCorta(form.proximo_cobro)} onChange={(e) => set('proximo_cobro', e.target.value)} />
                </Campo>
              </div>
              <Campo label="Estado de pago">
                <select className="vx-input w-full" value={form.estado_pago ?? 'pendiente'} onChange={(e) => set('estado_pago', e.target.value)}>
                  {PAGOS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </Campo>
              <Campo label="Notas (opcional)">
                <textarea className="vx-input w-full" rows={2} value={form.notas ?? ''} onChange={(e) => set('notas', e.target.value)} />
              </Campo>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={form.activo !== 0} onChange={(e) => set('activo', e.target.checked ? 1 : 0)} className="w-4 h-4" style={{ accentColor: GREEN }} />
                <span className="text-[13px]" style={{ color: '#374151' }}>Activo</span>
              </label>
              {error && <p className="text-[13px]" style={{ color: '#DC2626' }}>{error}</p>}
              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={cerrar} className="flex-1 py-2.5 rounded-xl font-semibold text-[14px]" style={{ background: '#F1F4F3', color: '#374151' }}>Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-[14px] disabled:opacity-50" style={{ background: GREEN }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body,
      )}

      {/* Confirmación de cobro */}
      {confirmCobro && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.5)', backdropFilter: 'blur(4px)' }} onMouseDown={() => !cobrando && setConfirmCobro(null)}>
          <div className="bg-white rounded-2xl max-w-[420px] w-full p-6" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>¿Registrar cobro?</h3>
            <p className="text-[13px] mt-1.5" style={{ color: '#6B7280' }}>
              Vas a registrar el cobro de <strong style={{ color: '#0D0E12' }}>{confirmCobro.empresa_nombre || confirmCobro.cliente}</strong> por <strong style={{ color: '#0D0E12' }}>{fmt(confirmCobro.precio, confirmCobro.moneda)}</strong>.
              {confirmCobro.ciclo !== 'unico'
                ? ' El próximo cobro se correrá al siguiente ciclo.'
                : ' Al ser pago único, quedará como pagado.'}
            </p>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => setConfirmCobro(null)} disabled={cobrando} className="flex-1 py-2.5 rounded-xl font-semibold text-[14px] disabled:opacity-50" style={{ background: '#F1F4F3', color: '#374151' }}>Cancelar</button>
              <button onClick={registrarCobro} disabled={cobrando} className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-white text-[14px] disabled:opacity-50" style={{ background: GREEN }}>
                {cobrando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Confirmar
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Historial de cobros */}
      {histFor && createPortal(
        <HistorialModal alquiler={histFor} onClose={() => setHistFor(null)} />,
        document.body,
      )}

      {/* Eliminar */}
      {delId != null && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.5)', backdropFilter: 'blur(4px)' }} onMouseDown={() => setDelId(null)}>
          <div className="bg-white rounded-2xl max-w-[380px] w-full p-6" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>¿Eliminar alquiler?</h3>
            <p className="text-[13px] mt-1.5 mb-5" style={{ color: '#6B7280' }}>Esta acción no se puede deshacer. El historial de cobros se conserva.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setDelId(null)} className="flex-1 py-2.5 rounded-xl font-semibold text-[14px]" style={{ background: '#F1F4F3', color: '#374151' }}>Cancelar</button>
              <button onClick={eliminar} className="flex-1 py-2.5 rounded-xl font-semibold text-white text-[14px]" style={{ background: '#DC2626' }}>Eliminar</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>{label}</label>
      {children}
    </div>
  );
}

/** Modal con el historial de cobros de un alquiler. */
function HistorialModal({ alquiler, onClose }: { alquiler: InfraAlquiler; onClose: () => void }) {
  const [cobros, setCobros] = useState<InfraCobro[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    infraCobrosApi.list(alquiler.id)
      .then((c) => setCobros(Array.isArray(c) ? c : []))
      .catch((e) => setError((e as Error).message));
  }, [alquiler.id]);

  const cliente = alquiler.empresa_nombre || alquiler.cliente || 'Cliente';
  const total = (cobros ?? []).reduce((s, c) => s + (Number(c.monto) || 0), 0);
  const monedaRef = cobros?.[0]?.moneda ?? alquiler.moneda ?? 'PEN';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }} onMouseDown={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>Historial de cobros</h3>
          <button onClick={onClose} style={{ color: '#94A3B8' }}><X size={18} /></button>
        </div>
        <p className="text-[12.5px] mb-4" style={{ color: '#9CA3AF' }}>{cliente} · {alquiler.descripcion || alquiler.recurso_nombre || 'Servicio'}</p>

        {error ? (
          <p className="text-[13px] py-6 text-center" style={{ color: '#DC2626' }}>{error}</p>
        ) : cobros === null ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" style={{ color: GREEN }} /></div>
        ) : cobros.length === 0 ? (
          <p className="text-[13px] py-8 text-center" style={{ color: '#9CA3AF' }}>Todavía no se registró ningún cobro.</p>
        ) : (
          <>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
              {cobros.map((c, i) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: i < cobros.length - 1 ? '1px solid #F1F4F3' : undefined }}>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: '#0D0E12' }}>{fmt(c.monto, c.moneda)}</p>
                    <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>Cobrado el {fechaCorta(c.fecha_cobro)}{c.cubierto_hasta ? ` · cubre hasta ${fechaCorta(c.cubierto_hasta)}` : ''}</p>
                  </div>
                  {c.ciclo && <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: '#F1F4F3', color: '#64748B' }}>{c.ciclo}</span>}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 px-1">
              <span className="text-[12.5px] font-medium" style={{ color: '#6B7280' }}>Total cobrado ({cobros.length})</span>
              <span className="text-[15px] font-bold" style={{ color: GREEN }}>{fmt(total, monedaRef)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Combobox con búsqueda para elegir la empresa cliente. */
function EmpresaCombobox({ empresas, value, onChange }: {
  empresas: InfraEmpresaLite[]; value: number | null; onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = empresas.find((e) => e.id === value) ?? null;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtradas = empresas.filter((e) => e.razon_social.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <input className="vx-input w-full" value={open ? q : (selected?.razon_social ?? '')} placeholder="Buscar empresa…"
        onFocus={() => { setQ(''); setOpen(true); }} onChange={(e) => { setQ(e.target.value); setOpen(true); }} />
      {open && (
        <div className="absolute z-10 left-0 right-0 mt-1 rounded-lg overflow-y-auto bg-white" style={{ border: '1px solid #E5E7EB', maxHeight: 220, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.25)' }}>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(null); setQ(''); setOpen(false); }}
            className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50" style={{ color: '#9CA3AF' }}>— Sin empresa (nombre manual) —</button>
          {filtradas.map((e) => (
            <button key={e.id} type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => { onChange(e.id); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[13.5px] hover:bg-gray-50" style={{ color: '#0D0E12', background: e.id === value ? '#ECFDF5' : undefined }}>
              {e.razon_social}
            </button>
          ))}
          {filtradas.length === 0 && <div className="px-3 py-3 text-[12.5px] text-center" style={{ color: '#9CA3AF' }}>Sin resultados</div>}
        </div>
      )}
    </div>
  );
}
