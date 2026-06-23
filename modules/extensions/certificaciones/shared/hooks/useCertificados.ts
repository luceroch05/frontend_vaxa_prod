import { useState, useEffect, useCallback } from 'react';
import { certificadosApi } from '../api/certificados.api';
import type { Certificado, CertificadoPublico } from '../types';

export function useCertificados(empresa: string) {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await certificadosApi.list(empresa);
      // Más reciente primero (id autoincremental: id mayor = más nuevo)
      setCertificados([...data].sort((a, b) => b.id - a.id));
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [empresa]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const generar = async (inscripcionId: number) => {
    const cert = await certificadosApi.generar(empresa, inscripcionId);
    setCertificados(prev => [cert, ...prev]);
    return cert;
  };

  const anular = async (id: number) => {
    await certificadosApi.anular(empresa, id);
    // El backend devuelve 204 sin body — actualizamos estado localmente
    setCertificados(prev =>
      prev.map(c => c.id === id ? { ...c, estado_id: 2, estado_nombre: 'Anulado' } : c)
    );
  };

  /** Elimina el certificado por completo (devuelve crédito). */
  const eliminar = async (id: number) => {
    await certificadosApi.eliminar(empresa, id);
    setCertificados(prev => prev.filter(c => c.id !== id));
  };

  return { certificados, loading, error, generar, anular, eliminar, refetch: fetchAll };
}

export function useValidarCertificado() {
  const [resultado, setResultado] = useState<CertificadoPublico | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buscado, setBuscado] = useState(false);

  const validar = async (empresa: string, codigo: string) => {
    if (!codigo.trim() || !empresa) return;
    setLoading(true);
    setError(null);
    setBuscado(true);
    try {
      const data = await certificadosApi.validar(empresa, codigo.trim().toUpperCase());
      setResultado(data);
    } catch {
      setResultado(null);
      setError('Certificado no encontrado o código inválido');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResultado(null); setError(null); setBuscado(false); };

  return { resultado, loading, error, buscado, validar, reset };
}
