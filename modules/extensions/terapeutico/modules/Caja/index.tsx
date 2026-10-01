import { useEffect, useState, FormEvent } from 'react';
import { CreditCard, Plus, Trash2, TrendingUp, Loader2 } from '@/components/ui/icon';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { authStorage } from '@/lib/auth';
import { terapApi, type CajaData, type CajaMov } from '../../shared/api/terapeutico.api';
import { TEAL, hoy, primerDiaMes, ultimoDiaMes, soles, fmtFecha, Overlay, Cabecera, Campo, EncabezadoPagina, Resumen, Cargando, Vacio, ModalDetalleVenta } from '../../shared/finanzas';

/** Nombres bonitos de los métodos de pago (la BD guarda el slug). */
const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo', tarjeta: 'Tarjeta', yape: 'Yape / Plin', transferencia: 'Transferencia', mixto: 'Mixto',
};

export default function Caja() {
  const slug = useEmpresaSlug()!;
  const esAdmin = (authStorage.getUser(slug)?.rol ?? '').toUpperCase() === 'ADMINISTRADOR';
  // Por defecto muestra el MES actual completo (día 1 → último día del mes).
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(ultimoDiaMes());
  const [metodo, setMetodo] = useState('');   // '' = todos los métodos
  const [data, setData] = useState<CajaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [verVenta, setVerVenta] = useState<number | null>(null);

  const cargar = () => { setLoading(true); terapApi.listCaja(slug, { desde, hasta, metodo: metodo || undefined }).then(setData).finally(() => setLoading(false)); };
  useEffect(cargar, [slug, desde, hasta, metodo]);

  const borrar = async (m: CajaMov) => {
    if (m.venta_id) return;
    if (!confirm('¿Eliminar este movimiento de caja?')) return;
    await terapApi.deleteCajaMov(slug, m.id);
    cargar();
  };

  const r = data?.resumen;
  return (
    <div>
      <EncabezadoPagina
        icon={<CreditCard size={19} color="#fff" />}
        titulo="Caja" subtitulo="Ingresos y egresos del centro (las ventas entran solas)"
        accion={
          <button onClick={() => setModal(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-semibold" style={{ background: TEAL }}>
            <Plus size={16} /> Ingreso / Egreso
          </button>
        }
      />

      <div className="flex items-end gap-2 mb-4 flex-wrap">
        <Campo label="Desde"><input type="date" className="vx-input" value={desde} onChange={e => setDesde(e.target.value)} /></Campo>
        <Campo label="Hasta"><input type="date" className="vx-input" value={hasta} onChange={e => setHasta(e.target.value)} /></Campo>
        <Campo label="Método de pago">
          <select className="vx-input" value={metodo} onChange={e => setMetodo(e.target.value)}>
            <option value="">Todos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="yape">Yape / Plin</option>
            <option value="transferencia">Transferencia</option>
            <option value="mixto">Mixto (venta con varios pagos)</option>
          </select>
        </Campo>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Resumen label="Ingresos" value={soles(r?.ingresos ?? 0)} tint="#DCFCE7" fg="#15803D" icon={<TrendingUp size={15} />} />
        <Resumen label="Egresos" value={soles(r?.egresos ?? 0)} tint="#FEE2E2" fg="#B91C1C" icon={<TrendingUp size={15} style={{ transform: 'rotate(180deg)' }} />} />
        <Resumen label="Saldo" value={soles(r?.saldo ?? 0)} tint="#CCFBF1" fg={TEAL} icon={<CreditCard size={15} />} />
      </div>

      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #EAEFEE', boxShadow: '0 1px 2px rgba(16,48,44,.04), 0 12px 32px -16px rgba(16,48,44,.14)' }}>
        {loading ? <Cargando /> : !data || data.movimientos.length === 0 ? (
          <Vacio icon={<CreditCard size={26} />} titulo="Sin movimientos" texto="No hay ingresos ni egresos en el rango elegido." />
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#F6FAF9', color: '#64748B' }} className="text-[11px] uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-semibold">Fecha</th>
                <th className="text-left px-4 py-2.5 font-semibold">Concepto</th>
                <th className="text-left px-4 py-2.5 font-semibold">Método</th>
                <th className="text-left px-4 py-2.5 font-semibold">Categoría</th>
                <th className="text-right px-4 py-2.5 font-semibold">Monto</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {data.movimientos.map(m => (
                <tr key={m.id} style={{ borderTop: '1px solid #F1F5F4' }}>
                  <td className="px-4 py-2.5" style={{ color: '#6B7280' }}>{fmtFecha(m.fecha)}</td>
                  <td className="px-4 py-2.5" style={{ color: '#0E1A1A' }}>{m.concepto}</td>
                  <td className="px-4 py-2.5">
                    {m.metodo_pago
                      ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: '#F1F5F4', color: '#475569' }}>{METODO_LABEL[m.metodo_pago] ?? m.metodo_pago}</span>
                      : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: '#94A3B8' }}>{m.categoria ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold" style={{ color: m.tipo === 'ingreso' ? '#15803D' : '#B91C1C' }}>
                    {m.tipo === 'ingreso' ? '+' : '−'} {soles(m.monto)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {m.venta_id
                      ? <button onClick={() => setVerVenta(m.venta_id!)} className="text-[11.5px] font-semibold" style={{ color: TEAL }}>Ver venta #{m.venta_id}</button>
                      : esAdmin
                        ? <button onClick={() => borrar(m)} style={{ color: '#DC2626' }}><Trash2 size={14} /></button>
                        : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && <ModalCaja slug={slug} onClose={() => setModal(false)} onDone={() => { setModal(false); cargar(); }} />}
      {verVenta != null && <ModalDetalleVenta slug={slug} ventaId={verVenta} onClose={() => setVerVenta(null)} />}
    </div>
  );
}

function ModalCaja({ slug, onClose, onDone }: { slug: string; onClose: () => void; onDone: () => void }) {
  const [tipo, setTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fecha, setFecha] = useState(hoy());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!(Number(monto) > 0)) { setError('El monto debe ser mayor a 0.'); return; }
    if (!concepto.trim()) { setError('El concepto es obligatorio.'); return; }
    setSaving(true); setError(null);
    try {
      await terapApi.createCajaMov(slug, { tipo, monto: Number(monto), concepto, categoria: categoria || null, fecha });
      onDone();
    } catch (err: any) { setError(err?.message ?? 'No se pudo registrar'); setSaving(false); }
  };

  return (
    <Overlay onClose={onClose}>
      <Cabecera icon={<CreditCard size={16} color="#fff" />} titulo="Registrar movimiento" onClose={onClose} />
      <form onSubmit={submit} className="p-5 space-y-4">
        <div className="inline-flex rounded-xl overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
          {(['ingreso', 'egreso'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTipo(t)} className="px-4 py-2 text-[13px] font-semibold capitalize"
              style={tipo === t ? { background: t === 'ingreso' ? '#15803D' : '#B91C1C', color: '#fff' } : { background: '#fff', color: '#64748B' }}>{t}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Monto (S/)"><input type="number" min={0} step="0.01" className="vx-input" value={monto} onChange={e => setMonto(e.target.value)} autoFocus /></Campo>
          <Campo label="Fecha"><input type="date" className="vx-input" value={fecha} onChange={e => setFecha(e.target.value)} /></Campo>
        </div>
        <Campo label="Concepto *"><input className="vx-input" value={concepto} onChange={e => setConcepto(e.target.value)} placeholder="Ej. Pago de servicios, compra de insumos…" /></Campo>
        <Campo label="Categoría (opcional)"><input className="vx-input" value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Alquiler, sueldos, insumos…" /></Campo>
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
