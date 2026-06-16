import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle } from '@/components/ui/icon';

/**
 * Modal bloqueante de sesión cerrada.
 *
 * Escucha el evento global `vaxa:session-revoked` (lo disparan tanto el
 * WebSocket de sesión única como el manejo de 401 SESSION_REVOKED del cliente
 * HTTP). Al activarse tapa toda la pantalla para que el operador no pueda seguir
 * trabajando con una sesión ya inválida; el único camino es volver al login.
 */
export default function SessionRevokedModal() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { empresa } = useParams<{ empresa: string }>();

  useEffect(() => {
    const onRevoked = () => setVisible(true);
    window.addEventListener('vaxa:session-revoked', onRevoked);
    return () => window.removeEventListener('vaxa:session-revoked', onRevoked);
  }, []);

  if (!visible) return null;

  const irAlLogin = () => {
    setVisible(false);
    navigate(`/${empresa}/certificados/login`);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(13,14,18,0.6)', backdropFilter: 'blur(6px)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[400px] bg-white rounded-2xl p-7 text-center"
        style={{
          border: '1px solid rgba(15,24,41,0.08)',
          boxShadow: '0 24px 70px -12px rgba(13,14,18,0.45)',
          animation: 'vxRevokedIn 220ms cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: '#FEF2F2', color: '#DC2626' }}
        >
          <AlertTriangle size={26} />
        </div>
        <h2 className="text-[18px] font-bold" style={{ color: '#0D0E12' }}>
          Sesión cerrada
        </h2>
        <p className="text-[13.5px] mt-2" style={{ color: '#6B7280', lineHeight: 1.5 }}>
          Se inició sesión con esta cuenta en otro dispositivo. Por seguridad, esta
          sesión se cerró y no puedes seguir realizando acciones.
        </p>
        <button
          onClick={irAlLogin}
          className="vx-btn vx-btn-primary w-full py-3 mt-6 justify-center"
        >
          Volver a iniciar sesión
        </button>
      </div>

      <style>{`
        @keyframes vxRevokedIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
