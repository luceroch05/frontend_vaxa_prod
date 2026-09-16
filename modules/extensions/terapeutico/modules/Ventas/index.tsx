import { useEffect, useMemo, useState, FormEvent } from 'react';
import { DollarSign, Plus, X, Trash2, Ban, Loader2 } from '@/components/ui/icon';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import {
  terapApi, type Producto, type Venta, type Servicio, type Paciente, type VentaItemDto,
} from '../../shared/api/terapeutico.api';
import { TEAL, soles, fmtFecha, Overlay, Cabecera, Campo, EncabezadoPagina, Cargando, Vacio, ModalDetalleVenta } from '../../shared/finanzas';

export default function Ventas() {
  const slug = useEmpresaSlug()!;
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [verId, setVerId] = useState<number | null>(null);

  const cargar = () => {
    setLoading(true);
    terapApi.listVentas(slug).then(setVentas).finally(() => setLoading(false));
  };
  useEffect(cargar, [slug]);

  const anular = async (v: Venta) => {
    if (!confirm(`¿Anular la venta #${v.id} por ${soles(v.total)}? Se repondrá el stock y se quitará el ingreso de caja.`)) return;
    const upd = await terapApi.anularVenta(slug, v.id);
    setVentas(prev => prev.map(x => x.id === v.id ? { ...x, estado: upd.estado } : x));
  };

  return (
    <div>
      <EncabezadoPagina
        icon={<DollarSign size={19} style={{ color: TEAL }} />}
        titulo="Ventas" subtitulo="Ventas de servicios y productos del centro"
        accion={
          <button onClick={() => setModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-semibold" style={{ background: TEAL }}>
            <Plus size={16} /> Nueva venta
          </button>
        }
      />

      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
        {loading ? <Cargando /> : ventas.length === 0 ? (
          <Vacio icon={<DollarSign size={26} />} titulo="Sin ventas" texto="Registra tu primera venta con el botón «Nueva venta»." />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#F6FAF9', color: '#64748B' }} className="text-[11px] uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-semibold">#</th>
                <th className="text-left px-4 py-2.5 font-semibold">Fecha</th>
                <th className="text-left px-4 py-2.5 font-semibold">Cliente / Paciente</th>
                <th className="text-left px-4 py-2.5 font-semibold">Pago</th>
                <th className="text-right px-4 py-2.5 font-semibold">Total</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id} onClick={() => setVerId(v.id)} className="cursor-pointer hover:bg-[#F8FBFA] transition"
                  style={{ borderTop: '1px solid #F1F5F4', opacity: v.estado === 'anulada' ? 0.5 : 1 }}>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: '#0E1A1A' }}>{v.id}</td>
                  <td className="px-4 py-2.5" style={{ color: '#6B7280' }}>{fmtFecha(v.fecha)}</td>
                  <td className="px-4 py-2.5" style={{ color: '#0E1A1A' }}>
                    {v.paciente_nombre ?? <span style={{ color: '#94A3B8' }}>Mostrador</span>}
                    {v.estado === 'anulada' && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#B91C1C' }}>ANULADA</span>}
                  </td>
                  <td className="px-4 py-2.5 capitalize" style={{ color: '#6B7280' }}>{v.metodo_pago}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: TEAL }}>{soles(v.total)}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setVerId(v.id)} className="text-[11.5px] font-semibold mr-3" style={{ color: TEAL }}>Ver</button>
                    {v.estado === 'emitida' && (
                      <button onClick={() => anular(v)} className="text-[11.5px] font-semibold inline-flex items-center gap-1" style={{ color: '#B91C1C' }}>
                        <Ban size={13} /> Anular
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ModalNuevaVenta slug={slug} onClose={() => setModal(false)} onDone={() => { setModal(false); cargar(); }} />}
      {verId != null && <ModalDetalleVenta slug={slug} ventaId={verId} onClose={() => setVerId(null)} />}
    </div>
  );
}

function ModalNuevaVenta({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: () => void }) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteId, setPacienteId] = useState<string>('');
  const [metodo, setMetodo] = useState('efectivo');
  const [nota, setNota] = useState('');
  const [items, setItems] = useState<VentaItemDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    terapApi.listServicios(slug).then(s => setServicios(s.filter(x => x.activo))).catch(() => {});
    terapApi.listProductos(slug).then(p => setProductos(p.filter(x => x.activo))).catch(() => {});
    terapApi.listPacientes(slug).then(setPacientes).catch(() => {});
  }, [slug]);

  const addServicio = (id: number) => {
    const s = servicios.find(x => x.id === id); if (!s) return;
    setItems(prev => [...prev, { tipo: 'servicio', servicio_id: s.id, cantidad: 1, precio_unit: Number(s.precio) || 0 }]);
  };
  const addProducto = (id: number) => {
    const p = productos.find(x => x.id === id); if (!p) return;
    setItems(prev => [...prev, { tipo: 'producto', producto_id: p.id, cantidad: 1, precio_unit: Number(p.precio_venta) || 0 }]);
  };
  const setItem = (i: number, k: keyof VentaItemDto, v: any) => setItems(prev => prev.map((it, j) => j === i ? { ...it, [k]: v } : it));
  const delItem = (i: number) => setItems(prev => prev.filter((_, j) => j !== i));

  const nombreItem = (it: VentaItemDto) => it.tipo === 'servicio'
    ? servicios.find(s => s.id === it.servicio_id)?.nombre ?? 'Servicio'
    : productos.find(p => p.id === it.producto_id)?.nombre ?? 'Producto';

  const total = useMemo(() => items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio_unit) || 0), 0), [items]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!items.length) { setError('Agrega al menos un ítem a la venta.'); return; }
    setSaving(true); setError(null);
    try {
      await terapApi.createVenta(slug, {
        paciente_id: pacienteId ? Number(pacienteId) : null,
        metodo_pago: metodo, nota: nota || null, items,
      });
      onDone();
    } catch (err: any) { setError(err?.message ?? 'No se pudo registrar la venta'); setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <Cabecera icon={<DollarSign size={16} style={{ color: TEAL }} />} titulo="Nueva venta" onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Cliente / Paciente (opcional)">
            <select className="vx-input" value={pacienteId} onChange={e => setPacienteId(e.target.value)}>
              <option value="">Mostrador (sin paciente)</option>
              {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
            </select>
          </Campo>
          <Campo label="Método de pago">
            <select className="vx-input" value={metodo} onChange={e => setMetodo(e.target.value)}>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="yape">Yape / Plin</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="+ Agregar servicio">
            <select className="vx-input" value="" onChange={e => e.target.value && addServicio(Number(e.target.value))}>
              <option value="">Elegir servicio…</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} — {soles(s.precio)}</option>)}
            </select>
          </Campo>
          <Campo label="+ Agregar producto">
            <select className="vx-input" value="" onChange={e => e.target.value && addProducto(Number(e.target.value))}>
              <option value="">Elegir producto…</option>
              {productos.map(p => <option key={p.id} value={p.id} disabled={p.stock <= 0}>{p.nombre} — {soles(p.precio_venta)} (stock {p.stock})</option>)}
            </select>
          </Campo>
        </div>

        {items.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2" style={{ borderTop: i === 0 ? 'none' : '1px solid #F1F5F4' }}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: it.tipo === 'servicio' ? '#CCFBF1' : '#FEF3C7', color: it.tipo === 'servicio' ? TEAL : '#B45309' }}>
                  {it.tipo === 'servicio' ? 'SERV' : 'PROD'}
                </span>
                <span className="flex-1 text-[13px] truncate" style={{ color: '#0E1A1A' }}>{nombreItem(it)}</span>
                <input type="number" min={1} step="1" className="vx-input w-16 text-center" value={it.cantidad}
                  onChange={e => setItem(i, 'cantidad', Number(e.target.value))} />
                <span className="text-[11px]" style={{ color: '#94A3B8' }}>×</span>
                <input type="number" min={0} step="0.01" className="vx-input w-24 text-right" value={it.precio_unit ?? 0}
                  onChange={e => setItem(i, 'precio_unit', Number(e.target.value))} />
                <span className="w-24 text-right text-[13px] font-semibold" style={{ color: '#0E1A1A' }}>{soles((Number(it.cantidad) || 0) * (Number(it.precio_unit) || 0))}</span>
                <button type="button" onClick={() => delItem(i)} style={{ color: '#DC2626' }}><Trash2 size={15} /></button>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2.5" style={{ background: '#F6FAF9', borderTop: '1px solid #E5E9E7' }}>
              <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>Total</span>
              <span className="text-[16px] font-bold" style={{ color: TEAL }}>{soles(total)}</span>
            </div>
          </div>
        )}

        <Campo label="Nota (opcional)"><input className="vx-input" value={nota} onChange={e => setNota(e.target.value)} /></Campo>

        {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
          <button type="submit" disabled={saving || !items.length} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 disabled:opacity-60" style={{ background: TEAL }}>
            {saving && <Loader2 size={14} className="animate-spin" />} Registrar venta
          </button>
        </div>
      </form>
    </Overlay>
  );
}
