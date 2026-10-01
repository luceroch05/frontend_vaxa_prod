/* ────────────────────────────────────────────────────────────────
 * Sesión única del panel de Historias Clínicas (una por usuario/dispositivo).
 *  - Abre un WebSocket autenticado a /ws: si la cuenta inicia sesión en otro
 *    dispositivo, el backend avisa SESSION_REVOKED al instante.
 *  - También escucha el evento global `vaxa:session-revoked` que dispara el
 *    cliente HTTP ante un 401 SESSION_REVOKED (respaldo si el WS no llegó).
 *  - Al revocarse, tapa la pantalla con un modal y manda al login del centro.
 * Aislado del módulo de certificados (mismo comportamiento, estilo propio).
 * ──────────────────────────────────────────────────────────────── */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
const TEAL = '#0F766E';

export default function TerapSesionUnica({ slug }: { slug: string }) {
  const [revocada, setRevocada] = useState(false);
  const navigate = useNavigate();

  // WebSocket de sesión única (reconecta ante caídas de red; no ante revocación).
  useEffect(() => {
    const token = authStorage.getToken(slug);
    if (!token) return;

    let ws: WebSocket | null = null;
    let reconnect: ReturnType<typeof setTimeout> | null = null;
    let revoked = false;
    let cerrado = false;
    const url = `${API_URL.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`;

    const conectar = () => {
      if (cerrado) return;
      try { ws = new WebSocket(url); } catch { programar(); return; }
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as { type?: string };
          if (data.type === 'SESSION_REVOKED') {
            revoked = true;
            authStorage.clearAllSessions();
            window.dispatchEvent(new CustomEvent('vaxa:session-revoked'));
          }
        } catch { /* mensaje no JSON */ }
      };
      ws.onclose = () => { if (!revoked && !cerrado) programar(); };
      ws.onerror = () => { try { ws?.close(); } catch { /* ignore */ } };
    };
    const programar = () => { if (!cerrado && !revoked) reconnect = setTimeout(conectar, 5000); };
    conectar();

    return () => { cerrado = true; if (reconnect) clearTimeout(reconnect); try { ws?.close(); } catch { /* ignore */ } };
  }, [slug]);

  // Respaldo por 401 (o el propio WS): muestra el modal bloqueante.
  useEffect(() => {
    const onRevoked = () => setRevocada(true);
    window.addEventListener('vaxa:session-revoked', onRevoked);
    return () => window.removeEventListener('vaxa:session-revoked', onRevoked);
  }, []);

  if (!revocada) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(10,22,24,0.6)', backdropFilter: 'blur(6px)' }}>
      <div role="dialog" aria-modal="true" className="w-full max-w-[400px] bg-white rounded-2xl p-7 text-center"
        style={{ border: '1px solid #EAEFEE', boxShadow: '0 30px 80px -20px rgba(6,20,22,0.55)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF2F2', color: '#DC2626' }}>
          <AlertTriangle size={26} />
        </div>
        <h2 className="text-[18px] font-bold" style={{ color: '#0E1A1A' }}>Sesión cerrada</h2>
        <p className="text-[13.5px] mt-2" style={{ color: '#6B7280', lineHeight: 1.5 }}>
          Se inició sesión con esta cuenta en otro dispositivo. Por seguridad, esta sesión se cerró.
        </p>
        <button onClick={() => { setRevocada(false); navigate(terapPath(slug, '/login')); }}
          className="w-full py-3 mt-6 rounded-xl text-white text-[14px] font-semibold" style={{ background: TEAL }}>
          Volver a iniciar sesión
        </button>
      </div>
    </div>,
    document.body,
  );
}
