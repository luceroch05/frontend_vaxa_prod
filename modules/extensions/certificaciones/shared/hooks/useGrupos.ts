import { useState, useEffect, useCallback } from 'react';
import { gruposApi } from '../api/grupos.api';
import type { Grupo, CreateGrupoDto } from '../types';

export function useGrupos(empresa: string, incluirInactivos = false) {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gruposApi.list(empresa, incluirInactivos);
      setGrupos(data);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [empresa, incluirInactivos]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (data: CreateGrupoDto) => {
    const nuevo = await gruposApi.create(empresa, data);
    setGrupos(prev => [nuevo, ...prev]);
    return nuevo;
  };

  /** Archiva/reactiva un aula (soft-delete) y refresca la lista. */
  const setActivo = async (id: number, activo: boolean) => {
    await gruposApi.setActivo(empresa, id, activo);
    await fetchAll();
  };

  /** Borra el aula por completo y refresca la lista. */
  const eliminar = async (id: number) => {
    await gruposApi.eliminar(empresa, id);
    setGrupos(prev => prev.filter(g => g.id !== id));
  };

  return { grupos, loading, error, create, setActivo, eliminar, refetch: fetchAll };
}
