import {
  createContext, useContext, useState, useEffect, useCallback,
  createElement, type ReactNode,
} from 'react';
import { creditosApi, type EstadoCreditos } from '../api/creditos.api';

interface CreditosCtx {
  estado: EstadoCreditos | null;
  loading: boolean;
  /** Vuelve a consultar el saldo. Llamar tras emitir/eliminar para refrescar el badge. */
  refetch: () => Promise<void>;
}

const Ctx = createContext<CreditosCtx | null>(null);

/**
 * Provee el saldo de créditos de la empresa a todo el panel del operador.
 * Al compartir un único estado, el badge del nav y la página de certificados
 * ven el mismo saldo: cuando se emite/elimina, basta llamar a `refetch()` y el
 * badge se actualiza sin recargar la página.
 */
export function CreditosProvider({ empresa, children }: { empresa: string; children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoCreditos | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setEstado(await creditosApi.estado(empresa));
    } catch {
      setEstado(null);
    } finally {
      setLoading(false);
    }
  }, [empresa]);

  useEffect(() => { refetch(); }, [refetch]);

  return createElement(Ctx.Provider, { value: { estado, loading, refetch } }, children);
}

/** Saldo de créditos compartido del panel del operador. Debe usarse dentro de <CreditosProvider>. */
export function useCreditos(): CreditosCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCreditos debe usarse dentro de <CreditosProvider>');
  return ctx;
}
