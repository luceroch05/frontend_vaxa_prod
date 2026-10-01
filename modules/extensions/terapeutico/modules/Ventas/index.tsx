import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Plus, Ban } from '@/components/ui/icon';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';
import { useTerapCtx } from '../../shared/TerapShell';
import { terapApi, type Venta } from '../../shared/api/terapeutico.api';
import { TEAL, soles, fmtFecha, EncabezadoPagina, Cargando, Vacio, ModalDetalleVenta } from '../../shared/finanzas';

export default function Ventas() {
  const slug = useEmpresaSlug()!;
  const navigate = useNavigate();
  const { centro } = useTerapCtx();
  const esAdmin = (authStorage.getUser(slug)?.rol ?? '').toUpperCase() === 'ADMINISTRADOR';
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
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
        icon={<DollarSign size={19} color="#fff" />}
        titulo="Ventas" subtitulo="Ventas de servicios y productos del centro"
        accion={
          <button onClick={() => navigate(terapPath(slug, '/panel/ventas/nueva'))} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-semibold" style={{ background: TEAL }}>
            <Plus size={16} /> Nueva venta
          </button>
        }
      />

      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #EAEFEE', boxShadow: '0 1px 2px rgba(16,48,44,.04), 0 12px 32px -16px rgba(16,48,44,.14)' }}>
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
                    {v.estado === 'emitida' && esAdmin && (
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

      {verId != null && <ModalDetalleVenta slug={slug} ventaId={verId} onClose={() => setVerId(null)} centro={centro} />}
    </div>
  );
}
