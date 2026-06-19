import { useState, useEffect, useCallback } from 'react';
import { programasApi } from '../api/programas.api';
import type { Programa, CreateProgramaDto } from '../types';

export function useProgramas(empresa: string) {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await programasApi.list(empresa);
      // Más reciente primero (id autoincremental: id mayor = más nuevo)
      setProgramas([...data].sort((a, b) => b.id - a.id));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [empresa]);

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

  return { programas, loading, error, create, update, refetch: fetchAll };
}
