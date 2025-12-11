// Hook personalizado para manejar pacientes (opcional, usando React Query sería mejor)

'use client';

import { useState, useEffect } from 'react';
import { pacientesService, Paciente } from '@/lib/api';

interface UsePacientesOptions {
  tenantId: string;
  token?: string;
  autoFetch?: boolean;
}

export function usePacientes({
  tenantId,
  token,
  autoFetch = true,
}: UsePacientesOptions) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPacientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pacientesService.getAll(tenantId, token);
      setPacientes(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPacientes();
    }
  }, [tenantId, autoFetch]);

  return {
    pacientes,
    loading,
    error,
    refetch: fetchPacientes,
  };
}

