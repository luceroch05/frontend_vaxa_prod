// Hook personalizado para Pacientes de empresa-techpro
'use client';

import { useState, useEffect } from 'react';
import { pacientesService, type PacienteTechPro } from '../services';

interface UsePacientesOptions {
  tenantId: string;
  token?: string;
  autoRefresh?: boolean;
}

export function usePacientes({
  tenantId,
  token,
  autoRefresh = false,
}: UsePacientesOptions) {
  const [pacientes, setPacientes] = useState<PacienteTechPro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPacientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pacientesService.getAll(tenantId, token);
      setPacientes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar pacientes'));
      console.error('Error fetching pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, [tenantId, token, autoRefresh]);

  return {
    pacientes,
    loading,
    error,
    refetch: fetchPacientes,
  };
}
