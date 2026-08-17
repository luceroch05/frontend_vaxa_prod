import { useState, useEffect, useCallback } from 'react';
import { calidadesApi, type Calidad } from '../api/calidades.api';

/** Fallback si la tabla aún no responde (primera carga / error de red). */
const DEFAULT_CALIDADES = ['Participante', 'Organizador', 'Colaborador', 'Ponente'];

/**
 * Calidades de participación de la empresa (catálogo administrable).
 * Reemplaza el array hardcodeado. `nombres` da la lista lista para desplegables;
 * incluye siempre 'Participante' aunque la tabla no esté sembrada.
 */
export function useCalidades(empresa: string, incluirInactivas = false) {
  const [calidades, setCalidades] = useState<Calidad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      setCalidades(await calidadesApi.list(empresa, incluirInactivas));
    } catch {
      setCalidades([]);
    } finally {
      setLoading(false);
    }
  }, [empresa, incluirInactivas]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activas = calidades.filter(c => c.activo);
  const base = activas.length ? activas.map(c => c.nombre) : DEFAULT_CALIDADES;
  // Garantiza 'Participante' presente y primero.
  const nombres = ['Participante', ...base.filter(n => n.toLowerCase() !== 'participante')];

  const crear = async (nombre: string) => {
    const nueva = await calidadesApi.create(empresa, nombre);
    await fetchAll();
    return nueva;
  };
  const actualizar = async (id: number, data: { nombre?: string; activo?: boolean; orden?: number }) => {
    const upd = await calidadesApi.update(empresa, id, data);
    await fetchAll();
    return upd;
  };

  return { calidades, activas, nombres, loading, crear, actualizar, refetch: fetchAll };
}
