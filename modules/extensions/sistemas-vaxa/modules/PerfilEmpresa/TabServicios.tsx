'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Loader2, DollarSign, AlertCircle, X, Package } from '@/components/ui/icon';
import {
  infraAlquileresApi, infraRecursosApi, aMensual, estadoEfectivo, fechaCorta,
  type InfraAlquiler, type InfraRecurso,
} from '../../shared/api/infra.admin.api';
import { tarifarioApi, type ServicioCatalogo } from '../../shared/api/tarifario.admin.api';
import type { EmpresaCreditos } from '../../shared/api/creditos.admin.api';

interface Props { empresa: EmpresaCreditos; }

const SYM = (m?: string | null) => (m === 'USD' ? '$' : 'S/');
const CICLOS = ['mensual', 'trimestral', 'semestral', 'anual', 'unico'] as const;
const TIPOS_RECURSO = ['Dominio', 'Hosting', 'VPS', 'SSL', 'Correo', 'Otro'];
const lblCls = 'block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5';

/** Servicios/cobros a medida (web, dominio, hosting…) que se le cobran a ESTA empresa.
 *  Reusa infra_alquileres + infra_recursos (lo mismo que el registro), pero amarrado a
 *  empresa_id — así NO hay que re-registrar al cliente para sumarle infraestructura. */
export default function TabServicios({ empresa }: Props) {
  const [filas, setFilas] = useState<InfraAlquiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const todos = await infraAlquileresApi.list();
      setFilas(todos.filter((a) => a.empresa_id === empresa.id));
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [empresa.id]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Servicios y cobros</h3>
          <p className="text-[12.5px]" style={{ color: '#9CA3AF' }}>Web, dominios, hosting u otros servicios que le cobras a este cliente (con su recurso y margen).</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="sv-btn sv-btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> Agregar servicio
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : filas.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: '1.5px dashed #D9E3E0', background: '#FAFBFB' }}>
          <DollarSign className="w-10 h-10 mx-auto mb-2" style={{ color: '#CBD5E1' }} />
          <p className="text-[13.5px] font-semibold" style={{ color: '#0D0E12' }}>Sin servicios cobrados</p>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Agrega un cobro (web, dominio, hosting…) para este cliente.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
          {filas.map((a, i) => {
            const est = estadoEfectivo(a);
            return (
              <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ borderBottom: i < filas.length - 1 ? '1px solid #F5F4F0' : undefined }}>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold truncate" style={{ color: '#0D0E12' }}>{a.descripcion || 'Servicio'}</p>
                  <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>
                    {SYM(a.moneda)} {Number(a.precio).toFixed(2)} · {a.ciclo}
                    {a.recurso_nombre ? ` · ${a.recurso_tipo ?? 'recurso'}: ${a.recurso_nombre}` : ''}
                    {a.proximo_cobro ? ` · próx. cobro ${fechaCorta(a.proximo_cobro)}` : ''}
                  </p>
                </div>
                <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: est.bg, color: est.c }}>{est.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <ModalAgregar empresa={empresa} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); cargar(); }} />
      )}
    </div>
  );
}

/** Modal para crear un cobro ligado a la empresa (servicio del Tarifario + recurso asignado/comprado + margen). */
function ModalAgregar({ empresa, onClose, onSaved }: { empresa: EmpresaCreditos; onClose: () => void; onSaved: () => void }) {
  const [serviciosCat, setServiciosCat] = useState<ServicioCatalogo[]>([]);
  const [recursos, setRecursos] = useState<InfraRecurso[]>([]);
  const [catId, setCatId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [moneda, setMoneda] = useState('PEN');
  const [ciclo, setCiclo] = useState('mensual');
  const [proximoCobro, setProximoCobro] = useState('');
  // Recurso (VPS/dominio/hosting): sin recurso, asignar uno tuyo, o comprar uno nuevo.
  const [recursoMode, setRecursoMode] = useState<'ninguno' | 'existente' | 'nuevo'>('ninguno');
  const [recursoId, setRecursoId] = useState('');
  const [nuevo, setNuevo] = useState({ tipo: 'Dominio', nombre: '', proveedor: '', costo: '', moneda: 'PEN', ciclo: 'anual', fecha_renovacion: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tarifarioApi.get().then((t) => setServiciosCat(Array.isArray(t.servicios) ? t.servicios : [])).catch(() => setServiciosCat([]));
    infraRecursosApi.list().then((rs) => setRecursos(Array.isArray(rs) ? rs : [])).catch(() => setRecursos([]));
  }, []);

  const elegir = (id: string) => {
    setCatId(id);
    const s = serviciosCat.find((x) => String(x.id) === id);
    if (s) { setDescripcion(s.nombre); setPrecio(String(s.precio)); }
  };
  const updNuevo = (patch: Partial<typeof nuevo>) => setNuevo((n) => ({ ...n, ...patch }));

  const grupos = serviciosCat.reduce((acc, s) => { (acc[s.grupo] ??= []).push(s); return acc; }, {} as Record<string, ServicioCatalogo[]>);
  const valido = descripcion.trim() !== '' && Number(precio) > 0 && (recursoMode !== 'nuevo' || nuevo.nombre.trim() !== '');

  const cobraMes = aMensual(Number(precio) || 0, ciclo);
  const pagaMes = recursoMode === 'nuevo' ? aMensual(Number(nuevo.costo) || 0, nuevo.ciclo) : 0;
  const margen = cobraMes - pagaMes;

  const guardar = async () => {
    if (!valido || saving) return;
    setSaving(true); setError(null);
    try {
      let rId: number | null = recursoMode === 'existente' && recursoId ? Number(recursoId) : null;
      if (recursoMode === 'nuevo') {
        const r = await infraRecursosApi.create({
          tipo: nuevo.tipo, nombre: nuevo.nombre.trim(), proveedor: nuevo.proveedor.trim() || null,
          costo: Number(nuevo.costo) || 0, moneda: nuevo.moneda, ciclo: nuevo.ciclo,
          fecha_renovacion: nuevo.fecha_renovacion || null, proyectos: empresa.razon_social,
        });
        rId = r.id;
      }
      await infraAlquileresApi.create({
        empresa_id: empresa.id, cliente: empresa.razon_social, recurso_id: rId,
        descripcion: descripcion.trim(), precio: Number(precio) || 0, moneda, ciclo,
        proximo_cobro: proximoCobro || null, estado_pago: 'pendiente', activo: 1,
      });
      onSaved();
    } catch (e) { setError((e as Error).message); setSaving(false); }
  };

  const modos: { v: typeof recursoMode; t: string }[] = [
    { v: 'ninguno', t: 'Sin recurso' }, { v: 'existente', t: 'Asignar existente' }, { v: 'nuevo', t: 'Comprar nuevo' },
  ];

  return createPortal((
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)' }} onClick={() => { if (!saving) onClose(); }}>
      <div className="sv-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>Agregar servicio / cobro</h3>
            <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Para {empresa.razon_social}</p>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1 rounded-lg" style={{ color: '#9CA3AF' }}><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={lblCls}>Servicio <span className="normal-case tracking-normal font-medium text-gray-400">· del Tarifario</span></label>
            <select value={catId} onChange={(e) => elegir(e.target.value)} className="sv-input">
              <option value="">✎ Otro (escribir a mano)</option>
              {Object.entries(grupos).map(([grupo, items]) => (
                <optgroup key={grupo} label={grupo}>
                  {items.map((s) => <option key={s.id} value={s.id}>{s.nombre} · S/ {s.precio}</option>)}
                </optgroup>
              ))}
            </select>
            <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción (ej. Hosting anual + dominio)" className="sv-input mt-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lblCls}>Precio * <span className="normal-case tracking-normal font-medium text-gray-400">· le cobras</span></label>
              <div className="flex gap-2">
                <select value={moneda} onChange={(e) => setMoneda(e.target.value)} className="sv-input" style={{ width: 80 }}>
                  <option value="PEN">S/</option><option value="USD">$</option>
                </select>
                <input type="number" min={0} step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0.00" className="sv-input flex-1" />
              </div>
            </div>
            <div>
              <label className={lblCls}>Ciclo</label>
              <select value={ciclo} onChange={(e) => setCiclo(e.target.value)} className="sv-input">
                {CICLOS.map((c) => <option key={c} value={c}>{c === 'unico' ? 'Pago único' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lblCls}>Próximo cobro</label>
            <input type="date" value={proximoCobro} onChange={(e) => setProximoCobro(e.target.value)} className="sv-input max-w-[220px]" />
          </div>

          {/* Recurso: VPS / dominio / hosting (para el margen) */}
          <div>
            <label className={lblCls}>Recurso <span className="normal-case tracking-normal font-medium text-gray-400">· VPS / dominio / hosting</span></label>
            <div className="inline-flex rounded-lg overflow-hidden mb-2" style={{ border: '1px solid #E5E9E7' }}>
              {modos.map((m) => (
                <button key={m.v} type="button" onClick={() => setRecursoMode(m.v)}
                  className="text-[12px] font-semibold px-3 py-1.5"
                  style={recursoMode === m.v ? { background: '#059669', color: '#fff' } : { background: '#fff', color: '#64748B' }}>{m.t}</button>
              ))}
            </div>
            {recursoMode === 'existente' && (
              <select value={recursoId} onChange={(e) => setRecursoId(e.target.value)} className="sv-input">
                <option value="">— Elige un recurso tuyo —</option>
                {recursos.map((r) => <option key={r.id} value={r.id}>{r.tipo} · {r.nombre}{r.proveedor ? ` (${r.proveedor})` : ''}</option>)}
              </select>
            )}
            {recursoMode === 'nuevo' && (
              <div className="rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ background: '#fff', border: '1px solid #E5E9E7' }}>
                <div>
                  <label className={lblCls}>Tipo</label>
                  <select value={nuevo.tipo} onChange={(e) => updNuevo({ tipo: e.target.value })} className="sv-input">
                    {TIPOS_RECURSO.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lblCls}>Nombre *</label>
                  <input value={nuevo.nombre} onChange={(e) => updNuevo({ nombre: e.target.value })} placeholder="midominio.com / Hosting X" className="sv-input" />
                </div>
                <div>
                  <label className={lblCls}>Proveedor</label>
                  <input value={nuevo.proveedor} onChange={(e) => updNuevo({ proveedor: e.target.value })} placeholder="GoDaddy / Hostinger…" className="sv-input" />
                </div>
                <div>
                  <label className={lblCls}>Costo <span className="normal-case tracking-normal font-medium text-gray-400">· tú pagas</span></label>
                  <div className="flex gap-2">
                    <select value={nuevo.moneda} onChange={(e) => updNuevo({ moneda: e.target.value })} className="sv-input" style={{ width: 80 }}>
                      <option value="PEN">S/</option><option value="USD">$</option>
                    </select>
                    <input type="number" min={0} step="0.01" value={nuevo.costo} onChange={(e) => updNuevo({ costo: e.target.value })} placeholder="0.00" className="sv-input flex-1" />
                  </div>
                </div>
                <div>
                  <label className={lblCls}>Ciclo del recurso</label>
                  <select value={nuevo.ciclo} onChange={(e) => updNuevo({ ciclo: e.target.value })} className="sv-input">
                    <option value="mensual">Mensual</option><option value="anual">Anual</option><option value="unico">Pago único</option>
                  </select>
                </div>
                <div>
                  <label className={lblCls}>Renovación <span className="normal-case tracking-normal font-medium text-gray-400">· cuándo pagas</span></label>
                  <input type="date" value={nuevo.fecha_renovacion} onChange={(e) => updNuevo({ fecha_renovacion: e.target.value })} className="sv-input" />
                </div>
              </div>
            )}
            {Number(precio) > 0 && (
              <p className="text-[11.5px] mt-2 flex items-center gap-1.5" style={{ color: margen >= 0 ? '#047857' : '#B45309' }}>
                <Package className="w-3.5 h-3.5" />
                Cobras <b>{SYM(moneda)} {cobraMes.toFixed(2)}/mes</b>
                {recursoMode === 'nuevo' && Number(nuevo.costo) > 0 && <> · pagas <b>{SYM(nuevo.moneda)} {pagaMes.toFixed(2)}/mes</b> · margen <b>{margen.toFixed(2)}/mes</b></>}
              </p>
            )}
          </div>

          {error && (
            <div className="px-3 py-2.5 rounded-xl flex items-center gap-2 text-[12.5px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 mt-5">
          <button onClick={onClose} disabled={saving} className="sv-btn sv-btn-ghost">Cancelar</button>
          <button onClick={guardar} disabled={!valido || saving} className="sv-btn sv-btn-primary disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Agregar cobro
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}
