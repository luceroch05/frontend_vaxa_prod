'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { tenantPath } from '@/lib/paths';
import { listInfraAlertas, fechaCorta, type InfraAlerta, type PrefillCobro } from '../api/infra.admin.api';

const EMERALD = '#059669';

const money = (n: number, m: string) => `${m === 'USD' ? '$' : 'S/'} ${(Number(n) || 0).toFixed(2)}`;
const etiqueta = (d: number) => d < 0 ? `Venció hace ${Math.abs(d)} d` : d === 0 ? 'Vence hoy' : `Vence en ${d} d`;
const color = (d: number) => d < 0 ? '#DC2626' : d <= 2 ? '#D97706' : EMERALD;

/**
 * Campana de notificaciones: muestra los cobros por vencer/vencidos (Infraestructura).
 * Se refresca sola cada 5 min. Al hacer clic en una lleva al módulo de Infraestructura.
 */
export default function NotificacionesBell({ tenantId }: { tenantId: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [alertas, setAlertas] = useState<InfraAlerta[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const cargar = useCallback(() => {
    listInfraAlertas().then((a) => setAlertas(Array.isArray(a) ? a : [])).catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 5 * 60 * 1000); // cada 5 min
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const n = alertas.length;

  /** Arma la cotización con TODO lo que se le va a cobrar a ese cliente y va a Cotizaciones. */
  const cotizar = (a: InfraAlerta) => {
    const mismoCliente = (x: InfraAlerta) =>
      a.empresa_id ? x.empresa_id === a.empresa_id : (!x.empresa_id && x.cliente === a.cliente);
    const grupo = alertas.filter(mismoCliente);
    const prefill: PrefillCobro = {
      empresa_id: a.empresa_id ?? null,
      cliente: a.cliente,
      lineas: grupo.map((x) => ({ descripcion: x.descripcion || 'Servicio', cantidad: 1, precioUnitario: Number(x.precio) || 0 })),
    };
    setOpen(false);
    navigate(tenantPath(tenantId, '/certificaciones/cotizaciones'), { state: { prefillCobro: prefill } });
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notificaciones"
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
        style={{ color: '#64748B' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3EE'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
        <Bell className="w-[18px] h-[18px]" />
        {n > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: '#DC2626' }}>{n > 9 ? '9+' : n}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50"
          style={{ background: '#fff', border: '1px solid #EEECE6', boxShadow: '0 18px 50px rgba(13,14,18,0.14)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F2F0EA' }}>
            <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Cobros por gestionar</p>
            {n > 0 && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF2F2', color: '#DC2626' }}>{n}</span>}
          </div>

          {n === 0 ? (
            <div className="px-4 py-8 text-center text-[13px]" style={{ color: '#9CA3AF' }}>Todo al día 🎉<br />No hay cobros pendientes.</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {alertas.map((a) => (
                <div key={a.id} className="px-4 py-3 flex items-start gap-3" style={{ borderBottom: '1px solid #F7F6F2' }}>
                  <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: color(Number(a.dias)) }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold truncate" style={{ color: '#0D0E12' }}>{a.cliente}</p>
                    <p className="text-[11.5px] truncate" style={{ color: '#9CA3AF' }}>{a.descripcion || 'Servicio'} · {money(a.precio, a.moneda)}</p>
                    <button onClick={() => cotizar(a)} className="mt-1.5 text-[11px] font-semibold px-2 py-1 rounded-lg" style={{ background: '#ECFDF5', color: EMERALD, border: '1px solid #A7F3D0' }}>
                      Crear cotización →
                    </button>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11.5px] font-semibold" style={{ color: color(Number(a.dias)) }}>{etiqueta(Number(a.dias))}</p>
                    <p className="text-[10.5px]" style={{ color: '#B0A898' }}>{fechaCorta(a.proximo_cobro)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => { setOpen(false); navigate(tenantPath(tenantId, '/infraestructura')); }}
            className="w-full px-4 py-2.5 text-[12.5px] font-semibold text-center transition-colors hover:bg-gray-50" style={{ color: EMERALD }}>
            Ver infraestructura
          </button>
        </div>
      )}
    </div>
  );
}
