import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Loader2, PrinterIcon, DollarSign, User, CreditCard, CheckCircle } from '@/components/ui/icon';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { useTerapCtx } from '../../shared/TerapShell';
import { terapPath } from '@/lib/paths';
import {
  terapApi, type Producto, type Servicio, type Paciente, type Venta, type VentaItemDto,
} from '../../shared/api/terapeutico.api';
import { imprimirTicket, imprimirA4 } from './comprobante';
import Combobox, { type ComboOption } from '../../shared/components/Combobox';

const TEAL = '#0F766E';
const soles = (n: number) => `S/ ${(Number(n) || 0).toFixed(2)}`;

/**
 * Input numérico que SÍ deja quedar vacío mientras escribes (no salta a 0 al borrar).
 * Mantiene un buffer de texto mientras editas; al salir (blur) muestra el número real.
 */
function NumInput({ value, onChange, className, style, min, step, disabled }: {
  value: number; onChange: (n: number) => void; className?: string; style?: CSSProperties;
  min?: number; step?: string; disabled?: boolean;
}) {
  const [buf, setBuf] = useState<string | null>(null);
  const shown = buf ?? (value === 0 ? '' : String(value));   // '' no es null → se respeta vacío
  return (
    <input type="number" inputMode="decimal" min={min} step={step} disabled={disabled}
      className={className} style={style} value={shown}
      onChange={(e) => { setBuf(e.target.value); onChange(e.target.value === '' ? 0 : Number(e.target.value)); }}
      onBlur={() => setBuf(null)} />
  );
}

/** Fila de la venta en edición (guarda el descuento como monto o %, se resuelve al calcular). */
interface Fila {
  key: string;
  tipo: 'servicio' | 'producto';
  refId: number;         // servicio_id o producto_id
  nombre: string;
  precio_unit: number;
  cantidad: number;
  stock?: number;        // solo productos
  descTipo: 'monto' | 'pct';
  descVal: number;
}

const DOC = { '1': 'DNI', '4': 'C.E.', '7': 'Pas.', '6': 'RUC' } as Record<string, string>;

/** Descuento en S/ resuelto desde monto o % sobre una base, acotado a [0, base]. */
const descMonto = (base: number, tipo: 'monto' | 'pct', val: number) => {
  const bruto = tipo === 'pct' ? base * (Number(val) || 0) / 100 : (Number(val) || 0);
  return Math.min(Math.max(bruto, 0), base);
};

export default function NuevaVenta() {
  const slug = useEmpresaSlug()!;
  const navigate = useNavigate();
  const { centro } = useTerapCtx();

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  const [filas, setFilas] = useState<Fila[]>([]);
  const [pacienteId, setPacienteId] = useState('');
  const [pagos, setPagos] = useState<{ metodo: string; monto: number }[]>([{ metodo: 'efectivo', monto: 0 }]);
  const [nota, setNota] = useState('');
  const [descTipo, setDescTipo] = useState<'monto' | 'pct'>('monto');
  const [descVal, setDescVal] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardada, setGuardada] = useState<Venta | null>(null);

  useEffect(() => {
    terapApi.listServicios(slug).then((s) => setServicios(s.filter((x) => x.activo))).catch(() => {});
    terapApi.listProductos(slug).then((p) => setProductos(p.filter((x) => x.activo))).catch(() => {});
    terapApi.listPacientes(slug).then(setPacientes).catch(() => {});
  }, [slug]);

  const addServicio = (id: number) => {
    const s = servicios.find((x) => x.id === id); if (!s) return;
    setFilas((prev) => [...prev, { key: `s${id}-${Date.now()}`, tipo: 'servicio', refId: s.id, nombre: s.nombre, precio_unit: Number(s.precio) || 0, cantidad: 1, descTipo: 'monto', descVal: 0 }]);
  };
  const addProducto = (id: number) => {
    const p = productos.find((x) => x.id === id); if (!p) return;
    setFilas((prev) => [...prev, { key: `p${id}-${Date.now()}`, tipo: 'producto', refId: p.id, nombre: p.nombre, precio_unit: Number(p.precio_venta) || 0, cantidad: 1, stock: p.stock, descTipo: 'monto', descVal: 0 }]);
  };
  const setFila = (i: number, patch: Partial<Fila>) => setFilas((prev) => prev.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const delFila = (i: number) => setFilas((prev) => prev.filter((_, j) => j !== i));

  // Cálculos en vivo.
  const conCalculo = useMemo(() => filas.map((f) => {
    const bruto = (Number(f.precio_unit) || 0) * (Number(f.cantidad) || 0);
    const desc = descMonto(bruto, f.descTipo, f.descVal);
    return { ...f, bruto, desc, neto: +(bruto - desc).toFixed(2) };
  }), [filas]);

  const subtotal = useMemo(() => +conCalculo.reduce((s, f) => s + f.neto, 0).toFixed(2), [conCalculo]);
  const descGlobal = useMemo(() => descMonto(subtotal, descTipo, descVal), [subtotal, descTipo, descVal]);
  const total = +(subtotal - descGlobal).toFixed(2);

  // ── Pago dividido ──────────────────────────────────────────────────────────────
  const pagado = +pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0).toFixed(2);
  const faltante = +(total - pagado).toFixed(2);   // >0 falta · <0 vuelto
  // Con un solo pago, su monto sigue al total automáticamente (no hay que tipearlo).
  useEffect(() => {
    if (pagos.length === 1 && pagos[0].monto !== total) setPagos([{ ...pagos[0], monto: total }]);
  }, [total, pagos]);
  const addPago = () => setPagos((prev) => [...prev, { metodo: 'efectivo', monto: Math.max(faltante, 0) }]);
  const setPago = (i: number, patch: Partial<{ metodo: string; monto: number }>) => setPagos((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const delPago = (i: number) => setPagos((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));

  const paciente = pacientes.find((p) => String(p.id) === pacienteId) ?? null;

  // Opciones buscables (combobox) — pensadas para listas largas.
  const opcPacientes = useMemo<ComboOption[]>(() => pacientes.map((p) => ({
    id: p.id, label: `${p.apellidos}, ${p.nombres}`,
    sub: p.num_doc ? `${DOC[p.tipo_doc] ?? 'Doc'} ${p.num_doc}` : undefined,
  })), [pacientes]);
  const opcServicios = useMemo<ComboOption[]>(() => servicios.map((s) => ({
    id: s.id, label: s.nombre, sub: soles(Number(s.precio)),
  })), [servicios]);
  const opcProductos = useMemo<ComboOption[]>(() => productos.filter((p) => p.stock > 0).map((p) => ({
    id: p.id, label: p.nombre, sub: `${soles(Number(p.precio_venta))} · stock ${p.stock}`,
  })), [productos]);

  const guardar = async () => {
    if (!filas.length) { setError('Agrega al menos un ítem a la venta.'); return; }
    if (pagos.length > 1 && Math.abs(faltante) > 0.01) {
      setError(faltante > 0 ? `Falta cubrir S/ ${faltante.toFixed(2)} en los pagos.` : `Los pagos superan el total en S/ ${(-faltante).toFixed(2)}.`);
      return;
    }
    setSaving(true); setError(null);
    try {
      const items: VentaItemDto[] = conCalculo.map((f) => ({
        tipo: f.tipo,
        servicio_id: f.tipo === 'servicio' ? f.refId : null,
        producto_id: f.tipo === 'producto' ? f.refId : null,
        cantidad: Math.max(1, f.cantidad),
        precio_unit: f.precio_unit,
        descuento: +f.desc.toFixed(2),
      }));
      const v = await terapApi.createVenta(slug, {
        paciente_id: pacienteId ? Number(pacienteId) : null,
        pagos: pagos.map((p) => ({ metodo: p.metodo, monto: +(Number(p.monto) || 0).toFixed(2) })),
        nota: nota || null,
        descuento: +descGlobal.toFixed(2), items,
      });
      // Reconstruimos la venta para el comprobante (createVenta devuelve la cabecera).
      const completa = await terapApi.getVenta(slug, v.id).catch(() => null);
      setGuardada(completa ?? v);
    } catch (e) { setError((e as Error)?.message ?? 'No se pudo registrar la venta'); }
    finally { setSaving(false); }
  };

  const volver = () => navigate(terapPath(slug, '/panel/ventas'));

  // ── Pantalla de éxito (con impresión) ──────────────────────────────────────────
  if (guardada) {
    return (
      <div className="max-w-lg mx-auto text-center py-10">
        <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: '#DCFCE7' }}>
          <CheckCircle size={30} style={{ color: '#15803D' }} />
        </div>
        <h1 className="text-[20px] font-bold" style={{ color: '#0E1A1A' }}>Venta #{guardada.id} registrada</h1>
        <p className="text-[13.5px] mt-1" style={{ color: '#6B7280' }}>Total {soles(guardada.total)} · {guardada.metodo_pago === 'mixto' ? 'pago mixto' : guardada.metodo_pago}</p>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <button onClick={() => imprimirTicket(guardada, centro ?? null)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>
            <PrinterIcon size={15} /> Imprimir ticket
          </button>
          <button onClick={() => imprimirA4(guardada, centro ?? null)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{ background: TEAL }}>
            <PrinterIcon size={15} /> Imprimir A4
          </button>
        </div>
        <div className="flex justify-center gap-3 mt-4 text-[13px] font-semibold">
          <button onClick={() => { setGuardada(null); setFilas([]); setDescVal(0); setNota(''); setPacienteId(''); setPagos([{ metodo: 'efectivo', monto: 0 }]); }} style={{ color: TEAL }}>+ Nueva venta</button>
          <button onClick={volver} style={{ color: '#6B7280' }}>Volver a la lista</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={volver} className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#F1F5F4', color: '#374151' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <DollarSign size={20} style={{ color: TEAL }} />
          <h1 className="text-[19px] font-bold" style={{ color: '#0E1A1A' }}>Nueva venta</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* ── Izquierda: ítems ── */}
        <div className="space-y-4">
          {/* Selectores buscables para agregar (comboboxes, pensados para listas largas) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-semibold mb-1" style={{ color: '#64748B' }}>＋ Agregar servicio</label>
              <Combobox options={opcServicios} value={0} onChange={(id) => id && addServicio(id)}
                placeholder="Buscar servicio…" emptyText="Sin servicios" />
            </div>
            <div>
              <label className="block text-[11.5px] font-semibold mb-1" style={{ color: '#64748B' }}>＋ Agregar producto</label>
              <Combobox options={opcProductos} value={0} onChange={(id) => id && addProducto(id)}
                placeholder="Buscar producto…" emptyText="Sin productos con stock" />
            </div>
          </div>

          {/* Tabla de ítems */}
          <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
            <div className="grid grid-cols-[1fr_92px_96px_110px_92px_32px] gap-2 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider" style={{ background: '#F6FAF9', color: '#64748B' }}>
              <span>Producto / Servicio</span>
              <span className="text-center">Cantidad</span>
              <span className="text-right">Precio U.</span>
              <span className="text-right">Descuento</span>
              <span className="text-right">Subtotal</span>
              <span></span>
            </div>

            {conCalculo.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px]" style={{ color: '#94A3B8' }}>Agrega servicios o productos con los selectores de arriba.</p>
            ) : conCalculo.map((f, i) => (
              <div key={f.key} className="grid grid-cols-[1fr_92px_96px_110px_92px_32px] gap-2 px-4 py-2.5 items-center" style={{ borderTop: '1px solid #F1F5F4' }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: f.tipo === 'servicio' ? '#CCFBF1' : '#FEF3C7', color: f.tipo === 'servicio' ? TEAL : '#B45309' }}>{f.tipo === 'servicio' ? 'SERV' : 'PROD'}</span>
                    <span className="text-[13px] truncate" style={{ color: '#0E1A1A' }}>{f.nombre}</span>
                  </div>
                  {f.desc > 0 && <span className="text-[10.5px]" style={{ color: '#B45309' }}>−{soles(f.desc)} desc.</span>}
                </div>

                {/* Stepper cantidad */}
                <div className="flex items-center justify-center gap-1">
                  <button type="button" onClick={() => setFila(i, { cantidad: Math.max(1, f.cantidad - 1) })} className="h-6 w-6 rounded-md text-[15px] leading-none" style={{ background: '#F1F5F4', color: '#374151' }}>−</button>
                  <NumInput min={1} className="w-10 text-center text-[13px] rounded-md py-1" style={{ border: '1px solid #E5E9E7' }}
                    value={f.cantidad} onChange={(n) => setFila(i, { cantidad: n })} />
                  <button type="button" onClick={() => setFila(i, { cantidad: f.cantidad + 1 })} className="h-6 w-6 rounded-md text-[15px] leading-none" style={{ background: '#F1F5F4', color: '#374151' }}>+</button>
                </div>

                <NumInput min={0} step="0.01" className="text-right text-[13px] rounded-md py-1 px-1.5" style={{ border: '1px solid #E5E9E7' }}
                  value={f.precio_unit} onChange={(n) => setFila(i, { precio_unit: n })} />

                {/* Descuento por ítem con toggle S/ ↔ % */}
                <div className="flex items-center gap-1 justify-end">
                  <button type="button" onClick={() => setFila(i, { descTipo: f.descTipo === 'monto' ? 'pct' : 'monto' })} className="h-6 w-7 rounded-md text-[11px] font-bold" style={{ background: '#F1F5F4', color: TEAL }}>{f.descTipo === 'monto' ? 'S/' : '%'}</button>
                  <NumInput min={0} step="0.01" className="w-14 text-right text-[13px] rounded-md py-1 px-1.5" style={{ border: '1px solid #E5E9E7' }}
                    value={f.descVal} onChange={(n) => setFila(i, { descVal: n })} />
                </div>

                <span className="text-right text-[13px] font-semibold" style={{ color: '#0E1A1A' }}>{soles(f.neto)}</span>
                <button type="button" onClick={() => delFila(i)} className="flex justify-center" style={{ color: '#DC2626' }}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>

          {/* Nota / observación */}
          <div>
            <label className="block text-[11.5px] font-semibold mb-1" style={{ color: '#64748B' }}>Nota / observación (opcional)</label>
            <textarea className="vx-input" rows={2} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Observación interna de la venta…" />
          </div>
        </div>

        {/* ── Derecha: panel comprobante ── */}
        <div className="rounded-2xl bg-white p-4 space-y-3 lg:sticky lg:top-20" style={{ border: '1px solid #E5E9E7' }}>
          <div>
            <p className="text-[10px] font-bold tracking-widest" style={{ color: TEAL }}>RECIBO INTERNO</p>
            <p className="text-[12px]" style={{ color: '#94A3B8' }}>Se numera al guardar</p>
          </div>

          <div>
            <label className="block text-[11.5px] font-semibold mb-1" style={{ color: '#64748B' }}><User size={12} className="inline -mt-0.5" /> Cliente / Paciente</label>
            <Combobox options={opcPacientes} value={Number(pacienteId) || 0}
              onChange={(id) => setPacienteId(id ? String(id) : '')}
              placeholder="Mostrador — buscar paciente…" emptyText="Sin pacientes" />
            {paciente ? (
              <p className="text-[11.5px] mt-1 flex items-center justify-between gap-2" style={{ color: '#94A3B8' }}>
                <span>{(DOC[paciente.tipo_doc] ?? 'Doc')} {paciente.num_doc ?? '—'}{paciente.direccion ? ` · ${paciente.direccion}` : ''}</span>
                <button type="button" onClick={() => setPacienteId('')} className="font-semibold" style={{ color: TEAL }}>Mostrador</button>
              </p>
            ) : <p className="text-[11.5px] mt-1" style={{ color: '#94A3B8' }}>Venta a mostrador (sin paciente)</p>}
          </div>

          <div className="pt-2 space-y-1.5" style={{ borderTop: '1px solid #F1F5F4' }}>
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: '#64748B' }}>Subtotal</span>
              <span className="font-semibold" style={{ color: '#0E1A1A' }}>{soles(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: '#64748B' }}>Descuento</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setDescTipo(descTipo === 'monto' ? 'pct' : 'monto')} className="h-6 w-7 rounded-md text-[11px] font-bold" style={{ background: '#F1F5F4', color: TEAL }}>{descTipo === 'monto' ? 'S/' : '%'}</button>
                <NumInput min={0} step="0.01" className="w-16 text-right text-[13px] rounded-md py-1 px-1.5" style={{ border: '1px solid #E5E9E7' }}
                  value={descVal} onChange={(n) => setDescVal(n)} />
              </div>
            </div>
            {descGlobal > 0 && <div className="flex items-center justify-between text-[11.5px]"><span style={{ color: '#94A3B8' }}>Descuento aplicado</span><span style={{ color: '#B45309' }}>−{soles(descGlobal)}</span></div>}
          </div>

          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #E5E9E7' }}>
            <span className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>Total</span>
            <span className="text-[22px] font-bold" style={{ color: TEAL }}>{soles(total)}</span>
          </div>

          {/* Forma de pago (puede dividirse en varios métodos) */}
          <div className="pt-2 space-y-2" style={{ borderTop: '1px solid #F1F5F4' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}><CreditCard size={12} className="inline -mt-0.5" /> Forma de pago</span>
              <button type="button" onClick={addPago} className="text-[12px] font-semibold" style={{ color: TEAL }}>＋ Agregar pago</button>
            </div>
            {pagos.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <select className="vx-input flex-1" value={p.metodo} onChange={(e) => setPago(i, { metodo: e.target.value })}>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="yape">Yape / Plin</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                <NumInput min={0} step="0.01" disabled={pagos.length === 1}
                  className="w-24 text-right text-[13px] rounded-md py-1.5 px-2 disabled:opacity-60" style={{ border: '1px solid #E5E9E7' }}
                  value={p.monto} onChange={(n) => setPago(i, { monto: n })} />
                {pagos.length > 1 && <button type="button" onClick={() => delPago(i)} style={{ color: '#DC2626' }}><Trash2 size={14} /></button>}
              </div>
            ))}
            {pagos.length > 1 && (
              <div className="flex items-center justify-between text-[12px]">
                <span style={{ color: '#64748B' }}>Pagado {soles(pagado)}</span>
                <span className="font-semibold" style={{ color: Math.abs(faltante) <= 0.01 ? '#15803D' : '#B91C1C' }}>
                  {Math.abs(faltante) <= 0.01 ? '✓ cuadra' : faltante > 0 ? `Falta ${soles(faltante)}` : `Sobra ${soles(-faltante)}`}
                </span>
              </div>
            )}
          </div>

          {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>}

          <button onClick={guardar} disabled={saving || !filas.length} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-bold text-white disabled:opacity-60" style={{ background: TEAL }}>
            {saving && <Loader2 size={15} className="animate-spin" />} Guardar venta
          </button>
        </div>
      </div>
    </div>
  );
}
