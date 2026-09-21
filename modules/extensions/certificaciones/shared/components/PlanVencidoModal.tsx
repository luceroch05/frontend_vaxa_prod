import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle } from '@/components/ui/icon';
import { certPath } from '@/lib/paths';

/**
 * Modal bloqueante de SERVICIO SUSPENDIDO por falta de pago.
 *
 * Escucha el evento global `vaxa:plan-vencido` (lo dispara el cliente HTTP cuando
 * el backend responde 403 `PLAN_VENCIDO`: el plan de mantenimiento venció y ya
 * pasó la prórroga de 1 mes). Tapa toda la pantalla para que el cliente vea el
 * motivo por el que no puede emitir/operar; el único camino es volver al login.
 * La sesión ya se cerró en el cliente antes de disparar el evento.
 */
export default function PlanVencidoModal() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { empresa } = useParams<{ empresa: string }>();

  useEffect(() => {
    const onVencido = () => {
      // Marca que el modal SÍ está montado → el cliente no redirige de golpe.
      try { sessionStorage.setItem('vaxa_plan_vencido_modal', '1'); } catch { /* ignore */ }
      setVisible(true);
    };
    window.addEventListener('vaxa:plan-vencido', onVencido);
    return () => window.removeEventListener('vaxa:plan-vencido', onVencido);
  }, []);

  if (!visible) return null;

  const irAlLogin = () => {
    setVisible(false);
    try { sessionStorage.removeItem('vaxa_plan_vencido_modal'); } catch { /* ignore */ }
    navigate(certPath(empresa!, '/login'));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(13,14,18,0.6)', backdropFilter: 'blur(6px)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[420px] bg-white rounded-2xl p-7 text-center"
        style={{
          border: '1px solid rgba(15,24,41,0.08)',
          boxShadow: '0 24px 70px -12px rgba(13,14,18,0.45)',
          animation: 'vxVencidoIn 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: '#FEF2F2', color: '#DC2626' }}
        >
          <AlertTriangle size={26} />
        </div>
        <h2 className="text-[18px] font-bold" style={{ color: '#0D0E12' }}>
          Servicio suspendido
        </h2>
        <p className="text-[13.5px] mt-2" style={{ color: '#6B7280', lineHeight: 1.55 }}>
          No se puede emitir certificados: el <b style={{ color: '#374151' }}>plan de mantenimiento venció</b> y
          ya pasó la <b style={{ color: '#374151' }}>prórroga de 1 mes</b>. Para reactivar el
          servicio, la institución debe <b style={{ color: '#374151' }}>regularizar el pago con Vaxa</b>.
        </p>
        <button
          onClick={irAlLogin}
          className="vx-btn vx-btn-primary w-full py-3 mt-6 justify-center"
        >
          Entendido, volver al login
        </button>
      </div>

      <style>{`
        @keyframes vxVencidoIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
