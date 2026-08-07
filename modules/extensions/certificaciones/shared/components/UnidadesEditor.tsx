import { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, Save, Trash2, CheckCircle } from '@/components/ui/icon';
import { useConfirm }  from '../hooks/useConfirm';
import { useEsAdmin }  from '../hooks/useEsAdmin';
import { unidadesApi } from '../api/unidades.api';
import type { CreateProgramaDto, Programa, Unidad } from '../types';

/* ── Editor de evaluación por unidades ──────────────────────────
 * Configura cómo se evalúa un programa (tipo de evaluación + nota mínima)
 * y administra la lista de unidades/ciclos/módulos. Usado en el detalle del
 * programa (pestaña "Evaluación").
 *
 * El tipo de evaluación se elige de una lista fija. La opción "Crédito" activa
 * el MODO CRÉDITOS: no se ponen notas, cada unidad otorga sus créditos por
 * asistencia y el acta muestra los créditos de cada unidad + el total.
 * ─────────────────────────────────────────────────────────────── */
const OPCIONES_LABEL = ['Unidad', 'Módulo', 'Ciclo', 'Semestre', 'Crédito'];
const LABEL_CREDITOS = 'Crédito';
/** Plural simple en español: vocal final → +s, consonante → +es. */
const plural = (s: string) => /[aeiouáéíóú]$/i.test(s) ? `${s}s` : `${s}es`;

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
  const [nuevoCred, setNuevoCred] = useState('');
  const [savingProg, setSavingProg] = useState(false);
  const [adding,   setAdding]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  /** Créditos en edición por unidad: unidad_id -> texto. */
  const [credEdits, setCredEdits] = useState<Record<number, string>>({});
  /** unidad_id que acaba de guardar su crédito (para el ✓ efímero). */
  const [savedCred, setSavedCred] = useState<number | null>(null);

  const esCreditos = label.trim() === LABEL_CREDITOS;
  // En modo créditos cada fila es un tema del temario (no "una crédito").
  const itemNoun = esCreditos ? 'Tema' : label;

  useEffect(() => {
    setLoading(true);
    unidadesApi.list(empresa, programa.id)
      .then(us => {
        setUnidades(us);
        setCredEdits(Object.fromEntries(us.map(u => [u.id, String(Number(u.creditos ?? 0))])));
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [empresa, programa.id]);

  // La config del programa se guarda SOLA (sin botón): el tipo al elegirlo y la
  // nota mínima al salir del campo. Así el tipo "Crédito" queda persistido antes
  // de agregar cursos y no se pierde al recargar.
  const [savedProg, setSavedProg] = useState(false);
  const guardarConfig = async (data: Partial<CreateProgramaDto>) => {
    setSavingProg(true); setError(null);
    try {
      await onSaveProg(programa.id, data);
      setSavedProg(true);
      setTimeout(() => setSavedProg(false), 1500);
    }
    catch (e: unknown) { setError((e as Error).message); }
    finally { setSavingProg(false); }
  };

  const cambiarTipo = (nuevoLabel: string) => {
    setLabel(nuevoLabel);
    void guardarConfig({ unidad_label: nuevoLabel || 'Unidad' });
  };

  const guardarNotaMin = () => {
    if (notaMin === Number(programa.nota_minima ?? 11)) return;
    void guardarConfig({ nota_minima: notaMin });
  };

  const agregar = async () => {
    const nombre = nuevo.trim();
    if (!nombre) return;
    setAdding(true); setError(null);
    try {
      const u = await unidadesApi.create(empresa, {
        programa_id: programa.id, nombre, orden: unidades.length + 1,
        creditos: esCreditos ? Number(nuevoCred) || 0 : 0,
      });
      setUnidades(prev => [...prev, u]);
      setCredEdits(prev => ({ ...prev, [u.id]: String(Number(u.creditos ?? 0)) }));
      setNuevo(''); setNuevoCred('');
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setAdding(false); }
  };

  // Guarda los créditos de una unidad al salir del input o con Enter (solo si cambió).
  const guardarCredito = async (u: Unidad) => {
    const creditos = Number(credEdits[u.id]) || 0;
    if (creditos === Number(u.creditos ?? 0)) return;
    setUnidades(prev => prev.map(x => x.id === u.id ? { ...x, creditos } : x));
    try {
      await unidadesApi.update(empresa, u.id, { creditos });
      setSavedCred(u.id);
      setTimeout(() => setSavedCred(s => (s === u.id ? null : s)), 1500);
    } catch (e: unknown) { setError((e as Error).message); }
  };

  const eliminar = async (u: Unidad) => {
    if (!(await confirm({
      title: `Eliminar ${itemNoun.toLowerCase()}`,
      message: `¿Eliminar "${u.nombre}"? Se borrarán también ${esCreditos ? 'sus créditos' : 'las notas registradas en esta ' + itemNoun.toLowerCase()}.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    }))) return;
    try { await unidadesApi.remove(empresa, u.id); setUnidades(prev => prev.filter(x => x.id !== u.id)); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  const totalCreditos = unidades.reduce((s, u) => s + Number(u.creditos ?? 0), 0);

  return (
    <div className="rounded-2xl p-4 mt-1" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
      {error && (
        <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-xl mb-3"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {/* Config: tipo de evaluación + nota mínima */}
      <div className="flex items-end gap-3 flex-wrap mb-4">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>
            Tipo de evaluación
          </label>
          <select value={label} onChange={e => cambiarTipo(e.target.value)}
            className="vx-input" style={{ padding: '0.45rem 0.7rem', width: 180 }}>
            {/* Etiqueta legada que no esté en la lista fija */}
            {!OPCIONES_LABEL.includes(label.trim()) && label.trim() && (
              <option value={label.trim()}>{label.trim()}</option>
            )}
            {OPCIONES_LABEL.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        {!esCreditos && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>
              Nota mínima (0–20)
            </label>
            <input type="number" min={0} max={20} step={0.5} value={notaMin}
              onChange={e => setNotaMin(Number(e.target.value))}
              onBlur={guardarNotaMin}
              className="vx-input" style={{ padding: '0.45rem 0.7rem', width: 120 }} />
          </div>
        )}
        {/* Se guarda solo: solo mostramos el estado */}
        <div className="flex items-center gap-1.5 text-[12px] font-semibold pb-2"
          style={{ color: savedProg ? '#15803D' : '#9CA3AF' }}>
          {savingProg ? <><Loader2 size={13} className="animate-spin" /> Guardando…</>
            : savedProg ? <><CheckCircle size={13} /> Guardado</>
            : <><Save size={13} /> Se guarda solo</>}
        </div>
      </div>

      {esCreditos && (
        <p className="text-[12px] px-3 py-2 rounded-xl mb-3"
          style={{ background: '#F3F0FF', border: '1px solid #DDD6FE', color: '#5B21B6' }}>
          Modo créditos: no se registran notas. Cada tema del temario otorga sus créditos por asistencia
          y el acta muestra el total. La aprobación se marca por asistencia en la lista de inscripciones.
        </p>
      )}

      {/* Lista de unidades */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#374151' }}>
          {plural(itemNoun)} del programa
        </p>
        {esCreditos && unidades.length > 0 && (
          <p className="text-[11px] font-semibold" style={{ color: '#7C3AED' }}>
            Total: {totalCreditos} créditos
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4" style={{ color: '#D1D5DB' }}><Loader2 size={16} className="animate-spin" /></div>
      ) : (
        <div className="space-y-1.5">
          {unidades.length === 0 && (
            <p className="text-[12px] italic" style={{ color: '#B0A898' }}>
              Aún no hay {plural(itemNoun.toLowerCase())}. Agrega {esCreditos ? 'el primero' : 'la primera'} abajo.
            </p>
          )}
          {unidades.map((u, i) => (
            <div key={u.id} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2"
              style={{ border: '1px solid #EEECE6' }}>
              <span className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ background: '#F3F0FF', color: '#7C3AED' }}>{i + 1}</span>
              <p className="flex-1 text-[13px] truncate" style={{ color: '#0D0E12' }}>{u.nombre}</p>
              {esCreditos && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input type="number" min={0} step={0.5}
                    value={credEdits[u.id] ?? ''}
                    onChange={e => setCredEdits(prev => ({ ...prev, [u.id]: e.target.value }))}
                    onBlur={() => guardarCredito(u)}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="vx-input text-center" style={{ width: 62, padding: '0.3rem 0.35rem' }} />
                  <span className="text-[11px] w-9 flex items-center" style={{ color: savedCred === u.id ? '#15803D' : '#9CA3AF' }}>
                    {savedCred === u.id ? <CheckCircle size={13} /> : 'créd.'}
                  </span>
                </div>
              )}
              {esAdmin && (
              <button onClick={() => eliminar(u)} className="p-1 rounded-lg transition-colors hover:bg-red-50 flex-shrink-0" style={{ color: '#C8C3BB' }}>
                <Trash2 size={13} />
              </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Agregar unidad/curso — nombre + créditos se guardan en un solo clic */}
      <div className="flex gap-2 mt-3">
        <input value={nuevo} onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') agregar(); }}
          placeholder={esCreditos ? 'Nombre del tema (ej: Terapia Física)' : `Nombre de la ${itemNoun.toLowerCase()} (ej: ${itemNoun} 1)`}
          className="vx-input flex-1" style={{ padding: '0.45rem 0.7rem' }} />
        {esCreditos && (
          <input type="number" min={0} step={0.5} value={nuevoCred}
            onChange={e => setNuevoCred(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') agregar(); }}
            placeholder="Créditos"
            className="vx-input text-center flex-shrink-0" style={{ width: 90, padding: '0.45rem 0.5rem' }} />
        )}
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
