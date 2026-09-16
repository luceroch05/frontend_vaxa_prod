import { useEffect, useState } from 'react';
import { Loader2, X, DollarSign } from '@/components/ui/icon';
import { terapApi, type Venta } from './api/terapeutico.api';

/**
 * UI y helpers compartidos por las páginas de finanzas del centro
 * (Ventas, Inventario, Caja). Aislado para no repetir modal/estado vacío/formato.
 */

export const TEAL = '#0F766E';
export const hoy = () => new Date().toISOString().slice(0, 10);
export const soles = (n: number | string) => `S/ ${Number(n || 0).toFixed(2)}`;
export const fmtFecha = (s: string) => {
  const d = new Date(s);
  return isNaN(+d) ? s : d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,26,26,0.5)', backdropFilter: 'blur(3px)' }} onMouseDown={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-auto shadow-xl" onMouseDown={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function Cabecera({ icon, titulo, onClose }: { icon: React.ReactNode; titulo: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white z-10" style={{ borderBottom: '1px solid #EEF2F1' }}>
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#CCFBF1' }}>{icon}</div>
        <h2 className="text-[16px] font-bold" style={{ color: '#0E1A1A' }}>{titulo}</h2>
      </div>
      <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: '#6B7280' }} /></button>
    </div>
  );
}

export function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>{label}</span>
      {children}
    </label>
  );
}

/** Cabecera de página con ícono + título + subtítulo (patrón del panel terapéutico). */
export function EncabezadoPagina({ icon, titulo, subtitulo, accion }: {
  icon: React.ReactNode; titulo: string; subtitulo: string; accion?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
      <div className="flex items-center gap-2.5">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#CCFBF1' }}>{icon}</div>
        <div>
          <h1 className="text-[21px] font-bold leading-tight" style={{ color: '#0E1A1A' }}>{titulo}</h1>
          <p className="text-[12.5px]" style={{ color: '#6B7280' }}>{subtitulo}</p>
        </div>
      </div>
      {accion}
    </div>
  );
}

export function Resumen({ label, value, tint, fg, icon }: { label: string; value: string; tint: string; fg: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 flex items-center gap-3" style={{ border: '1px solid #E5E9E7' }}>
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: tint, color: fg }}>{icon}</div>
      <div className="leading-tight">
        <p className="text-[17px] font-bold" style={{ color: '#0E1A1A' }}>{value}</p>
        <p className="text-[11px]" style={{ color: '#6B7280' }}>{label}</p>
      </div>
    </div>
  );
}

export function Cargando() {
  return <div className="p-10 flex justify-center"><Loader2 size={22} className="animate-spin" style={{ color: TEAL }} /></div>;
}

export function Vacio({ icon, titulo, texto }: { icon: React.ReactNode; titulo: string; texto: string }) {
  return (
    <div className="p-12 flex flex-col items-center text-center">
      <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#F2F4F3', color: '#94A3B8' }}>{icon}</div>
      <p className="text-[15px] font-bold" style={{ color: '#0E1A1A' }}>{titulo}</p>
      <p className="text-[13px] mt-1 max-w-xs" style={{ color: '#6B7280' }}>{texto}</p>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>{label}</p>
      <p style={{ color: '#0E1A1A' }}>{valor}</p>
    </div>
  );
}

/** Modal de solo lectura con el detalle de una venta (cabecera + ítems + total).
 *  Compartido por Ventas y Caja (los ingresos de caja enlazan a su venta). */
export function ModalDetalleVenta({ slug, ventaId, onClose }: { slug: string; ventaId: number; onClose: () => void }) {
  const [venta, setVenta] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    terapApi.getVenta(slug, ventaId).then(setVenta).catch(() => setVenta(null)).finally(() => setLoading(false));
  }, [slug, ventaId]);

  return (
    <Overlay onClose={onClose}>
      <Cabecera icon={<DollarSign size={16} style={{ color: TEAL }} />} titulo={`Venta #${ventaId}`} onClose={onClose} />
      {loading ? <Cargando /> : !venta ? (
        <p className="p-6 text-[13px]" style={{ color: '#6B7280' }}>No se pudo cargar la venta.</p>
      ) : (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[13px]">
            <Dato label="Fecha" valor={fmtFecha(venta.fecha)} />
            <Dato label="Método de pago" valor={<span className="capitalize">{venta.metodo_pago}</span>} />
            <Dato label="Cliente / Paciente" valor={venta.paciente_nombre ?? 'Mostrador'} />
            <Dato label="Estado" valor={venta.estado === 'anulada'
              ? <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#FEE2E2', color: '#B91C1C' }}>ANULADA</span>
              : <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#15803D' }}>EMITIDA</span>} />
            {venta.vendedor && <Dato label="Vendedor" valor={venta.vendedor} />}
            {venta.nota && <Dato label="Nota" valor={venta.nota} />}
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr style={{ background: '#F6FAF9', color: '#64748B' }} className="text-[10.5px] uppercase tracking-wider">
                  <th className="text-left px-3 py-2 font-semibold">Detalle</th>
                  <th className="text-center px-3 py-2 font-semibold">Cant.</th>
                  <th className="text-right px-3 py-2 font-semibold">P. unit.</th>
                  <th className="text-right px-3 py-2 font-semibold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(venta.items ?? []).map(it => (
                  <tr key={it.id} style={{ borderTop: '1px solid #F1F5F4' }}>
                    <td className="px-3 py-2">
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded mr-1.5" style={{ background: it.tipo === 'servicio' ? '#CCFBF1' : '#FEF3C7', color: it.tipo === 'servicio' ? TEAL : '#B45309' }}>
                        {it.tipo === 'servicio' ? 'SERV' : 'PROD'}
                      </span>
                      <span style={{ color: '#0E1A1A' }}>{it.descripcion}</span>
                    </td>
                    <td className="px-3 py-2 text-center" style={{ color: '#6B7280' }}>{Number(it.cantidad)}</td>
                    <td className="px-3 py-2 text-right" style={{ color: '#6B7280' }}>{soles(it.precio_unit)}</td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: '#0E1A1A' }}>{soles(it.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F6FAF9', borderTop: '1px solid #E5E9E7' }}>
                  <td className="px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }} colSpan={3}>Total</td>
                  <td className="px-3 py-2.5 text-right text-[15px] font-bold" style={{ color: TEAL }}>{soles(venta.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Overlay>
  );
}
