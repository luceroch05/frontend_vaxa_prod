import {
  createContext, useContext, useState, useEffect, useCallback,
  createElement, type ReactNode,
} from 'react';
import { planesApi, type EstadoPlan } from '../api/planes.api';

interface PlanCtx {
  estado: EstadoPlan | null;
  loading: boolean;
  /** Vuelve a consultar el plan/consumo. Llamar tras emitir/eliminar para refrescar el badge. */
  refetch: () => Promise<void>;
}

const Ctx = createContext<PlanCtx | null>(null);

/**
 * Provee el plan vigente y el consumo del mes de la empresa a todo el panel.
 * Igual que el viejo CreditosProvider, comparte un único estado: el badge del
 * nav y la página de certificados ven el mismo cupo; tras emitir/eliminar basta
 * llamar a `refetch()` y todo se actualiza sin recargar.
 */
export function PlanProvider({ empresa, children }: { empresa: string; children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setEstado(await planesApi.estado(empresa));
    } catch {
      setEstado(null);
    } finally {
      setLoading(false);
    }
  }, [empresa]);

  useEffect(() => { refetch(); }, [refetch]);

  return createElement(Ctx.Provider, { value: { estado, loading, refetch } }, children);
}

/** Plan y consumo compartido del panel del operador. Debe usarse dentro de <PlanProvider>. */
export function usePlan(): PlanCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlan debe usarse dentro de <PlanProvider>');
  return ctx;
}
