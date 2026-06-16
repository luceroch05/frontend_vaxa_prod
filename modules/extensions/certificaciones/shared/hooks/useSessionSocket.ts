import { useEffect } from 'react';
import { authStorage } from '@/lib/auth';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

/**
 * Abre un WebSocket autenticado para la sesión única. Si el backend avisa
 * SESSION_REVOKED (porque la cuenta inició sesión en otro dispositivo), limpia la
 * sesión local y dispara el evento global que muestra el modal bloqueante.
 *
 * Reconecta solo si la conexión se cae por motivos de red; ante una revocación
 * no reconecta (la sesión ya no es válida).
 */
export function useSessionSocket(empresa: string): void {
  useEffect(() => {
    const token = authStorage.getToken(empresa);
    if (!token) return;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let revoked = false;
    let cerrado = false;

    const wsBase = API_URL.replace(/^http/, 'ws'); // http→ws, https→wss
    const url = `${wsBase}/ws?token=${encodeURIComponent(token)}`;

    const conectar = () => {
      if (cerrado) return;
      try {
        ws = new WebSocket(url);
      } catch {
        programarReconexion();
        return;
      }

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as { type?: string };
          if (data.type === 'SESSION_REVOKED') {
            revoked = true;
            authStorage.clearAllSessions();
            try { sessionStorage.setItem('vaxa_session_revoked', '1'); } catch { /* ignore */ }
            window.dispatchEvent(new CustomEvent('vaxa:session-revoked'));
          }
        } catch { /* mensaje no JSON: ignorar */ }
      };

      ws.onclose = () => {
        if (revoked || cerrado) return;
        programarReconexion();
      };

      ws.onerror = () => { try { ws?.close(); } catch { /* ignore */ } };
    };

    const programarReconexion = () => {
      if (cerrado || revoked) return;
      reconnectTimer = setTimeout(conectar, 5000);
    };

    conectar();

    return () => {
      cerrado = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { ws?.close(); } catch { /* ignore */ }
    };
  }, [empresa]);
}
