import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Package, Plus, Search, AlertTriangle, Loader2 } from '@/components/ui/icon';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { terapApi, type Producto } from '../../shared/api/terapeutico.api';
import { TEAL, soles, Overlay, Cabecera, Campo, EncabezadoPagina, Cargando, Vacio } from '../../shared/finanzas';

export default function Inventario() {
  const slug = useEmpresaSlug()!;
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<Producto | 'nuevo' | null>(null);
  const [stockDe, setStockDe] = useState<Producto | null>(null);

  const cargar = () => { setLoading(true); terapApi.listProductos(slug, true).then(setProductos).finally(() => setLoading(false)); };
  useEffect(cargar, [slug]);

  const filtrados = useMemo(() => {
    const t = q.toLowerCase().trim();
    return t ? productos.filter(p => p.nombre.toLowerCase().includes(t) || (p.sku ?? '').toLowerCase().includes(t)) : productos;
  }, [productos, q]);

  return (
    <div>
      <EncabezadoPagina
        icon={<Package size={19} style={{ color: TEAL }} />}
        titulo="Inventario" subtitulo="Productos e insumos del centro con control de stock"
        accion={
          <button onClick={() => setModal('nuevo')} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-semibold" style={{ background: TEAL }}>
            <Plus size={16} /> Nuevo producto
          </button>
        }
      />

      <div className="relative flex-1 min-w-[220px] max-w-md mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto…" className="vx-input vx-input-icon w-full" />
      </div>

      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
        {loading ? <Cargando /> : filtrados.length === 0 ? (
          <Vacio icon={<Package size={26} />} titulo="Sin productos" texto="Agrega productos al inventario con «Nuevo producto»." />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#F6FAF9', color: '#64748B' }} className="text-[11px] uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-semibold">Producto</th>
                <th className="text-right px-4 py-2.5 font-semibold">Precio</th>
                <th className="text-right px-4 py-2.5 font-semibold">Stock</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => {
                const bajo = Number(p.stock) <= Number(p.stock_min);
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #F1F5F4', opacity: p.activo ? 1 : 0.5 }}>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold" style={{ color: '#0E1A1A' }}>{p.nombre}</p>
                      <p className="text-[11.5px]" style={{ color: '#94A3B8' }}>{p.sku ? `${p.sku} · ` : ''}{p.unidad}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right" style={{ color: '#0E1A1A' }}>{soles(p.precio_venta)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 font-semibold" style={{ color: bajo ? '#B45309' : '#15803D' }}>
                        {bajo && <AlertTriangle size={13} />} {Number(p.stock)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => setStockDe(p)} className="text-[11.5px] font-semibold mr-3" style={{ color: TEAL }}>Ajustar stock</button>
                      <button onClick={() => setModal(p)} className="text-[11.5px] font-semibold" style={{ color: '#64748B' }}>Editar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ModalProducto slug={slug} producto={modal === 'nuevo' ? null : modal} onClose={() => setModal(null)} onDone={() => { setModal(null); cargar(); }} />}
      {stockDe && <ModalStock slug={slug} producto={stockDe} onClose={() => setStockDe(null)} onDone={() => { setStockDe(null); cargar(); }} />}
    </div>
  );
}

function ModalProducto({ slug, producto, onClose, onDone }: { slug: string; producto: Producto | null; onClose: () => void; onDone: () => void }) {
  const editar = !!producto;
  const [f, setF] = useState({
    nombre: producto?.nombre ?? '', sku: producto?.sku ?? '', unidad: producto?.unidad ?? 'unidad',
    precio_venta: String(producto?.precio_venta ?? ''), costo: String(producto?.costo ?? ''),
    stock: String(producto?.stock ?? ''), stock_min: String(producto?.stock_min ?? ''),
    activo: producto ? !!producto.activo : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: any) => setF(prev => ({ ...prev, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true); setError(null);
    try {
      const base = {
        nombre: f.nombre, sku: f.sku || null, unidad: f.unidad,
        precio_venta: Number(f.precio_venta) || 0, costo: Number(f.costo) || 0,
        stock_min: Number(f.stock_min) || 0, activo: f.activo,
      };
      if (editar) await terapApi.updateProducto(slug, producto!.id, base);
      else await terapApi.createProducto(slug, { ...base, stock: Number(f.stock) || 0 });
      onDone();
    } catch (err: any) { setError(err?.message ?? 'No se pudo guardar'); setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <Cabecera icon={<Package size={16} style={{ color: TEAL }} />} titulo={editar ? 'Editar producto' : 'Nuevo producto'} onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Nombre *"><input className="vx-input" value={f.nombre} onChange={e => set('nombre', e.target.value)} autoFocus /></Campo>
          <Campo label="SKU / Código"><input className="vx-input" value={f.sku ?? ''} onChange={e => set('sku', e.target.value)} /></Campo>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Campo label="Precio venta (S/)"><input type="number" min={0} step="0.01" className="vx-input" value={f.precio_venta} onChange={e => set('precio_venta', e.target.value)} /></Campo>
          <Campo label="Costo (S/)"><input type="number" min={0} step="0.01" className="vx-input" value={f.costo} onChange={e => set('costo', e.target.value)} /></Campo>
          <Campo label="Unidad"><input className="vx-input" value={f.unidad} onChange={e => set('unidad', e.target.value)} placeholder="unidad" /></Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {!editar && <Campo label="Stock inicial"><input type="number" min={0} step="1" className="vx-input" value={f.stock} onChange={e => set('stock', e.target.value)} /></Campo>}
          <Campo label="Stock mínimo (alerta)"><input type="number" min={0} step="1" className="vx-input" value={f.stock_min} onChange={e => set('stock_min', e.target.value)} /></Campo>
        </div>
        {editar && (
          <label className="flex items-center gap-2 text-[13px]" style={{ color: '#374151' }}>
            <input type="checkbox" checked={f.activo} onChange={e => set('activo', e.target.checked)} /> Producto activo
          </label>
        )}
        {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 disabled:opacity-60" style={{ background: TEAL }}>
            {saving && <Loader2 size={14} className="animate-spin" />} Guardar
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function ModalStock({ slug, producto, onClose, onDone }: { slug: string; producto: Producto; onClose: () => void; onDone: () => void }) {
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const c = Number(cantidad);
    if (!(c > 0)) { setError('Ingresa una cantidad mayor a 0.'); return; }
    setSaving(true); setError(null);
    try { await terapApi.ajustarStock(slug, producto.id, tipo, c, motivo); onDone(); }
    catch (err: any) { setError(err?.message ?? 'No se pudo ajustar el stock'); setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <Cabecera icon={<Package size={16} style={{ color: TEAL }} />} titulo={`Ajustar stock · ${producto.nombre}`} onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-4">
        <p className="text-[12.5px]" style={{ color: '#6B7280' }}>Stock actual: <b>{Number(producto.stock)}</b> {producto.unidad}</p>
        <div className="inline-flex rounded-xl overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
          {(['entrada', 'salida'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTipo(t)} className="px-4 py-2 text-[13px] font-semibold capitalize"
              style={tipo === t ? { background: TEAL, color: '#fff' } : { background: '#fff', color: '#64748B' }}>{t}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Cantidad"><input type="number" min={0} step="1" className="vx-input" value={cantidad} onChange={e => setCantidad(e.target.value)} autoFocus /></Campo>
          <Campo label="Motivo (opcional)"><input className="vx-input" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Compra, merma…" /></Campo>
        </div>
        {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 disabled:opacity-60" style={{ background: TEAL }}>
            {saving && <Loader2 size={14} className="animate-spin" />} Aplicar
          </button>
        </div>
      </form>
    </Overlay>
  );
}
