import { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, Save, Trash2 } from '@/components/ui/icon';
import { useConfirm }  from '../hooks/useConfirm';
import { useEsAdmin }  from '../hooks/useEsAdmin';
import { unidadesApi } from '../api/unidades.api';
import type { CreateProgramaDto, Programa, Unidad } from '../types';

/* ── Editor de evaluación por unidades ──────────────────────────
 * Configura cómo se evalúa un programa (etiqueta de la unidad, nota mínima)
 * y administra la lista de unidades/ciclos/módulos. Usado en el detalle del
 * programa (pestaña "Evaluación").
 * ─────────────────────────────────────────────────────────────── */
export default function UnidadesEditor({
  empresa, programa, onSaveProg,
}: {
  empresa: string;
  programa: Programa;
  onSaveProg: (id: number, data: Partial<CreateProgramaDto>) => Promise<unknown>;
}) {
  const confirm = useConfirm();
  const esAdmin = useEsAdmin();   // ADMISION puede crear/editar unidades, no eliminarlas
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [label,    setLabel]    = useState(programa.unidad_label || 'Unidad');
  const [notaMin,  setNotaMin]  = useState<number>(Number(programa.nota_minima ?? 11));
  const [nuevo,    setNuevo]    = useState('');
  const [savingProg, setSavingProg] = useState(false);
  const [adding,   setAdding]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    unidadesApi.list(empresa, programa.id)
      .then(setUnidades)
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [empresa, programa.id]);

  // ¿Cambió la etiqueta o la nota mínima respecto al programa? (para habilitar "Guardar")
  const configModificada =
    (label.trim() || 'Unidad') !== (programa.unidad_label || 'Unidad') ||
    notaMin !== Number(programa.nota_minima ?? 11);

  const guardarConfig = async () => {
    setSavingProg(true); setError(null);
    try { await onSaveProg(programa.id, { unidad_label: label.trim() || 'Unidad', nota_minima: notaMin }); }
    catch (e: unknown) { setError((e as Error).message); }
    finally { setSavingProg(false); }
  };

  const agregar = async () => {
    const nombre = nuevo.trim();
    if (!nombre) return;
    setAdding(true); setError(null);
    try {
      const u = await unidadesApi.create(empresa, { programa_id: programa.id, nombre, orden: unidades.length + 1 });
      setUnidades(prev => [...prev, u]);
      setNuevo('');
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setAdding(false); }
  };

  const eliminar = async (u: Unidad) => {
    if (!(await confirm({
      title: `Eliminar ${label.toLowerCase()}`,
      message: `¿Eliminar "${u.nombre}"? Se borrarán también las notas registradas en esta ${label.toLowerCase()}.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    }))) return;
    try { await unidadesApi.remove(empresa, u.id); setUnidades(prev => prev.filter(x => x.id !== u.id)); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  return (
    <div className="rounded-2xl p-4 mt-1" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
      {error && (
        <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-xl mb-3"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {/* Config: etiqueta + nota mínima */}
      <div className="flex items-end gap-3 flex-wrap mb-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>
            ¿Cómo se llaman?
          </label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Unidad / Ciclo / Módulo"
            className="vx-input" style={{ padding: '0.45rem 0.7rem', width: 170 }} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>
            Nota mínima (0–20)
          </label>
          <input type="number" min={0} max={20} step={0.5} value={notaMin}
            onChange={e => setNotaMin(Number(e.target.value))}
            className="vx-input" style={{ padding: '0.45rem 0.7rem', width: 120 }} />
        </div>
        <button onClick={guardarConfig} disabled={savingProg || !configModificada}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-xl disabled:opacity-50"
          style={{ background: '#7C3AED', color: '#fff' }}>
          {savingProg ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          Guardar
        </button>
      </div>

      {/* Lista de unidades */}
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#374151' }}>
        {label}es del programa
      </p>

      {loading ? (
        <div className="flex justify-center py-4" style={{ color: '#D1D5DB' }}><Loader2 size={16} className="animate-spin" /></div>
      ) : (
        <div className="space-y-1.5">
          {unidades.length === 0 && (
            <p className="text-[12px] italic" style={{ color: '#B0A898' }}>
              Aún no hay {label.toLowerCase()}es. Agrega la primera abajo.
            </p>
          )}
          {unidades.map((u, i) => (
            <div key={u.id} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2"
              style={{ border: '1px solid #EEECE6' }}>
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ background: '#F3F0FF', color: '#7C3AED' }}>{i + 1}</span>
              <p className="flex-1 text-[13px] truncate" style={{ color: '#0D0E12' }}>{u.nombre}</p>
              {esAdmin && (
              <button onClick={() => eliminar(u)} className="p-1 rounded-lg transition-colors hover:bg-red-50" style={{ color: '#C8C3BB' }}>
                <Trash2 size={13} />
              </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Agregar unidad */}
      <div className="flex gap-2 mt-3">
        <input value={nuevo} onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') agregar(); }}
          placeholder={`Nombre de la ${label.toLowerCase()} (ej: ${label} 1)`}
          className="vx-input flex-1" style={{ padding: '0.45rem 0.7rem' }} />
        <button onClick={agregar} disabled={adding || !nuevo.trim()}
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-xl flex-shrink-0"
          style={{ background: '#F3F0FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
          {adding ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Agregar
        </button>
      </div>
    </div>
  );
}
