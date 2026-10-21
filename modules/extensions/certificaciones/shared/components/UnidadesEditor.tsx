import { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, Save, Trash2, CheckCircle } from '@/components/ui/icon';
import { useConfirm }  from '../hooks/useConfirm';
import { useEsAdmin }  from '../hooks/useEsAdmin';
import { unidadesApi } from '../api/unidades.api';
import type { CreateProgramaDto, CreateGrupoDto, Programa, Grupo, Unidad } from '../types';

/* ── Editor de evaluación ────────────────────────────────────────
 * DOS interruptores independientes + DOS listas separadas:
 *   · Lleva notas   → lista de EVALUACIONES (nombre; la nota se pone por alumno).
 *   · Otorga créditos → lista de CURSOS/MÓDULOS (nombre + créditos).
 * Pueden ir juntos → el acta sale en 2 secciones.
 * Sirve para el PROGRAMA (plantilla) y para un AULA (prop `grupo`).
 * ─────────────────────────────────────────────────────────────── */
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick}
      className="relative flex-shrink-0 rounded-full transition-colors mt-0.5"
      style={{ width: 42, height: 24, background: on ? '#7C3AED' : '#D1D5DB' }}>
      <span className="absolute top-0.5 rounded-full bg-white transition-all" style={{ width: 20, height: 20, left: on ? 20 : 2 }} />
    </button>
  );
}

export default function UnidadesEditor({
  empresa, programa, grupo, onSaveProg, onSaveGrupo,
}: {
  empresa: string;
  programa: Programa;
  grupo?: Grupo;
  onSaveProg: (id: number, data: Partial<CreateProgramaDto>) => Promise<unknown>;
  onSaveGrupo?: (id: number, data: Partial<CreateGrupoDto>) => Promise<unknown>;
}) {
  const confirm = useConfirm();
  const esAdmin = useEsAdmin();
  const esAula  = !!grupo;

  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [requiereNotas, setRequiereNotas] = useState<boolean>(
    (esAula ? (grupo!.requiere_notas ?? programa.requiere_notas) : programa.requiere_notas) !== 0);
  const [llevaCreditos, setLlevaCreditos] = useState<boolean>(
    Number(esAula ? (grupo!.es_creditos ?? programa.lleva_creditos ?? 0) : (programa.lleva_creditos ?? 0)) === 1);
  const [notaMin, setNotaMin] = useState<number>(
    Number((esAula ? (grupo!.nota_minima ?? programa.nota_minima) : programa.nota_minima) ?? 11));

  const [nuevaEval, setNuevaEval] = useState('');            // nombre del ítem de nota
  const [nuevoCurso, setNuevoCurso] = useState('');          // nombre del ítem de crédito
  const [nuevoCursoCred, setNuevoCursoCred] = useState('');  // créditos del ítem de crédito
  const [savingProg, setSavingProg] = useState(false);
  const [addingN, setAddingN] = useState(false);
  const [addingC, setAddingC] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credEdits, setCredEdits] = useState<Record<number, string>>({});
  const [savedCred, setSavedCred] = useState<number | null>(null);
  const [savedProg, setSavedProg] = useState(false);

  const notaItems = unidades.filter(u => (u.tipo ?? 'nota') !== 'credito');
  const credItems = unidades.filter(u => (u.tipo ?? 'nota') === 'credito');
  const totalCreditos = credItems.reduce((s, u) => s + Number(u.creditos ?? 0), 0);

  useEffect(() => {
    setLoading(true);
    const p = esAula ? unidadesApi.listByGrupo(empresa, grupo!.id) : unidadesApi.list(empresa, programa.id);
    p.then(us => {
        setUnidades(us);
        setCredEdits(Object.fromEntries(us.map(u => [u.id, String(Number(u.creditos ?? 0))])));
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [empresa, programa.id, esAula, grupo]);

  const guardarConfig = async (progPatch: Partial<CreateProgramaDto>, grupoPatch: Partial<CreateGrupoDto>) => {
    setSavingProg(true); setError(null);
    try {
      if (esAula && onSaveGrupo) await onSaveGrupo(grupo!.id, grupoPatch);
      else await onSaveProg(programa.id, progPatch);
      setSavedProg(true);
      setTimeout(() => setSavedProg(false), 1500);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setSavingProg(false); }
  };

  const toggleNotas = (v: boolean) => { setRequiereNotas(v); void guardarConfig({ requiere_notas: v ? 1 : 0 }, { requiere_notas: v ? 1 : 0 }); };
  const toggleCreditos = (v: boolean) => { setLlevaCreditos(v); void guardarConfig({ lleva_creditos: v ? 1 : 0 }, { es_creditos: v ? 1 : 0 }); };
  const guardarNotaMin = () => {
    const base = Number((esAula ? (grupo!.nota_minima ?? programa.nota_minima) : programa.nota_minima) ?? 11);
    if (notaMin === base) return;
    void guardarConfig({ nota_minima: notaMin }, { nota_minima: notaMin });
  };

  const agregarItem = async (tipo: 'nota' | 'credito', nombre: string, creditos: number) => {
    const u = await unidadesApi.create(empresa, {
      programa_id: programa.id, grupo_id: esAula ? grupo!.id : null, tipo, nombre,
      orden: unidades.length + 1, creditos: tipo === 'credito' ? creditos : 0,
    });
    setUnidades(prev => [...prev, u]);
    setCredEdits(prev => ({ ...prev, [u.id]: String(Number(u.creditos ?? 0)) }));
  };
  const agregarEval = async () => {
    const nombre = nuevaEval.trim(); if (!nombre) return;
    setAddingN(true); setError(null);
    try { await agregarItem('nota', nombre, 0); setNuevaEval(''); }
    catch (e: unknown) { setError((e as Error).message); } finally { setAddingN(false); }
  };
  const agregarCurso = async () => {
    const nombre = nuevoCurso.trim(); if (!nombre) return;
    setAddingC(true); setError(null);
    try { await agregarItem('credito', nombre, Number(nuevoCursoCred) || 0); setNuevoCurso(''); setNuevoCursoCred(''); }
    catch (e: unknown) { setError((e as Error).message); } finally { setAddingC(false); }
  };

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
    if (!(await confirm({ title: `Eliminar "${u.nombre}"`, message: '¿Eliminar este ítem? Se borra también lo registrado.', confirmText: 'Eliminar', variant: 'danger' }))) return;
    try { await unidadesApi.remove(empresa, u.id); setUnidades(prev => prev.filter(x => x.id !== u.id)); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  /* Fila de ítem reutilizable. `conCred` muestra el input de créditos. */
  const Fila = (u: Unidad, i: number, conCred: boolean) => (
    <div key={u.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
      <span className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: '#F3F0FF', color: '#7C3AED' }}>{i + 1}</span>
      <p className="flex-1 text-[13px] truncate" style={{ color: '#0D0E12' }}>{u.nombre}</p>
      {conCred && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input type="number" min={0} step="any" value={credEdits[u.id] ?? ''}
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
  );

  return (
    <div className="rounded-2xl p-4 mt-1 space-y-4" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
      {error && (
        <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {esAula && (
        <div className="text-[12px] px-3 py-2 rounded-xl" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
          Evaluación de <strong>esta aula</strong>. Si no agregas ítems, hereda los del programa.
        </div>
      )}

      {/* Interruptores */}
      <section className="bg-white rounded-xl p-3.5 space-y-3" style={{ border: '1px solid #EEECE6' }}>
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>¿Cómo se evalúa?</p>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: savedProg ? '#15803D' : '#B0A898' }}>
            {savingProg ? <><Loader2 size={12} className="animate-spin" /> Guardando…</>
              : savedProg ? <><CheckCircle size={12} /> Guardado</>
              : <><Save size={12} /> Se guarda solo</>}
          </span>
        </div>

        <div className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: '#0D0E12' }}>Lleva notas</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>Evaluaciones calificadas (examen, trabajo…). El acta muestra notas + promedio.</p>
          </div>
          <Toggle on={requiereNotas} onClick={() => toggleNotas(!requiereNotas)} />
        </div>
        {requiereNotas && (
          <div className="pl-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>Nota mínima para aprobar (0–20)</label>
            <input type="number" min={0} max={20} step="any" value={notaMin}
              onChange={e => setNotaMin(Number(e.target.value))} onBlur={guardarNotaMin}
              className="vx-input" style={{ padding: '0.45rem 0.7rem', width: 120 }} />
          </div>
        )}

        <div className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: '#0D0E12' }}>Otorga créditos</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#9CA3AF' }}>Cursos/módulos con créditos (Soporte Técnico 1.5…). El acta muestra créditos + total. Convive con las notas.</p>
          </div>
          <Toggle on={llevaCreditos} onClick={() => toggleCreditos(!llevaCreditos)} />
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-4" style={{ color: '#D1D5DB' }}><Loader2 size={16} className="animate-spin" /></div>
      ) : (
        <>
          {/* Lista de EVALUACIONES (notas) */}
          {requiereNotas && (
            <section className="bg-white rounded-xl p-3.5" style={{ border: '1px solid #EEECE6' }}>
              <p className="text-[13px] font-bold mb-2" style={{ color: '#0D0E12' }}>Evaluaciones (notas)</p>
              <div className="space-y-1.5">
                {notaItems.length === 0 && <p className="text-[12px] italic" style={{ color: '#B0A898' }}>Agrega las evaluaciones (ej. Examen parcial, Trabajo final). La nota se pone por alumno en Inscripciones.</p>}
                {notaItems.map((u, i) => Fila(u, i, false))}
              </div>
              <div className="flex gap-2 mt-3">
                <input value={nuevaEval} onChange={e => setNuevaEval(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') agregarEval(); }}
                  placeholder="Nombre de la evaluación (ej: Examen parcial)" className="vx-input flex-1" style={{ padding: '0.45rem 0.7rem' }} />
                <button onClick={agregarEval} disabled={addingN || !nuevaEval.trim()}
                  className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-xl flex-shrink-0" style={{ background: '#F3F0FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
                  {addingN ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Agregar
                </button>
              </div>
            </section>
          )}

          {/* Lista de CURSOS con créditos */}
          {llevaCreditos && (
            <section className="bg-white rounded-xl p-3.5" style={{ border: '1px solid #EEECE6' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[13px] font-bold" style={{ color: '#0D0E12' }}>Cursos / módulos (créditos)</p>
                {credItems.length > 0 && <p className="text-[12px] font-bold" style={{ color: '#7C3AED' }}>Total: {totalCreditos} créditos</p>}
              </div>
              <div className="space-y-1.5">
                {credItems.length === 0 && <p className="text-[12px] italic" style={{ color: '#B0A898' }}>Agrega los cursos y sus créditos (ej. Soporte Técnico 1.5, Desarrollo Web 2.0).</p>}
                {credItems.map((u, i) => Fila(u, i, true))}
              </div>
              <div className="flex gap-2 mt-3">
                <input value={nuevoCurso} onChange={e => setNuevoCurso(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') agregarCurso(); }}
                  placeholder="Nombre del curso (ej: Soporte Técnico)" className="vx-input flex-1" style={{ padding: '0.45rem 0.7rem' }} />
                <input type="number" min={0} step="any" value={nuevoCursoCred} onChange={e => setNuevoCursoCred(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') agregarCurso(); }}
                  placeholder="Créditos" className="vx-input text-center flex-shrink-0" style={{ width: 90, padding: '0.45rem 0.5rem' }} />
                <button onClick={agregarCurso} disabled={addingC || !nuevoCurso.trim()}
                  className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-xl flex-shrink-0" style={{ background: '#F3F0FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
                  {addingC ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Agregar
                </button>
              </div>
            </section>
          )}

          {!requiereNotas && !llevaCreditos && (
            <p className="text-[12px] italic px-1" style={{ color: '#B0A898' }}>Prende "Lleva notas" y/o "Otorga créditos" para configurar los ítems.</p>
          )}
        </>
      )}
    </div>
  );
}
