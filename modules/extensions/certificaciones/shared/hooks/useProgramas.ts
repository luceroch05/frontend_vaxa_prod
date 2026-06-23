import { useState, useEffect, useCallback } from 'react';
import { programasApi } from '../api/programas.api';
import type { Programa, CreateProgramaDto } from '../types';

export function useProgramas(empresa: string, incluirInactivos = false) {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await programasApi.list(empresa, incluirInactivos);
      // Más reciente primero (id autoincremental: id mayor = más nuevo)
      setProgramas([...data].sort((a, b) => b.id - a.id));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [empresa, incluirInactivos]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (data: CreateProgramaDto) => {
    const nuevo = await programasApi.create(empresa, data);
    setProgramas(prev => [nuevo, ...prev]);
    return nuevo;
  };

  const update = async (id: number, data: Partial<CreateProgramaDto>) => {
    const actualizado = await programasApi.update(empresa, id, data);
    setProgramas(prev => prev.map(p => p.id === id ? actualizado : p));
    return actualizado;
  };

  /** Archiva/reactiva un programa (soft-delete) y refresca la lista. */
  const setActivo = async (id: number, activo: boolean) => {
    await programasApi.setActivo(empresa, id, activo);
    await fetchAll();
  };

  /** Borra el programa por completo y refresca la lista. */
  const eliminar = async (id: number) => {
    await programasApi.eliminar(empresa, id);
    setProgramas(prev => prev.filter(p => p.id !== id));
  };

  return { programas, loading, error, create, update, setActivo, eliminar, refetch: fetchAll };
}
