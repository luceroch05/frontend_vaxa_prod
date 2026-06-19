import { useState, useEffect, useCallback } from 'react';
import { inscripcionesApi } from '../api/inscripciones.api';
import { participantesApi } from '../api/participantes.api';
import type { Inscripcion, CreateInscripcionDto } from '../types';

export function useInscripciones(empresa: string, grupoId?: number) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inscripcionesApi.list(empresa, grupoId);
      // Más reciente primero (id autoincremental: id mayor = más nuevo)
      setInscripciones([...data].sort((a, b) => b.id - a.id));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [empresa, grupoId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (data: CreateInscripcionDto) => {
    const nueva = await inscripcionesApi.create(empresa, data);
    setInscripciones(prev => [nueva, ...prev]);
    return nueva;
  };

  const cambiarEstado = async (id: number, estado_id: number) => {
    const actualizada = await inscripcionesApi.cambiarEstado(empresa, id, estado_id);
    setInscripciones(prev => prev.map(i => i.id === id ? actualizada : i));
    return actualizada;
  };

  const inscribirParticipante = async (
    participanteData: { tipo_documento_id: number; numero_documento: string; nombres: string; apellidos: string; email?: string },
    grupo_id: number
  ) => {
    const participante = await participantesApi.create(empresa, participanteData);
    return create({ participante_id: participante.id, grupo_id });
  };

  return { inscripciones, loading, error, create, cambiarEstado, inscribirParticipante, refetch: fetchAll };
}
