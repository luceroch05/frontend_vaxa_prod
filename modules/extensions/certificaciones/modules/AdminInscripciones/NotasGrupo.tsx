import { useEffect, useState } from 'react';
import { Loader2, Save, CheckCircle, AlertCircle, GraduationCap } from '@/components/ui/icon';
import { notasApi } from '../../shared/api/notas.api';
import type { NotasMatriz } from '../../shared/types';

/** Color/etiqueta del estado según id. */
function estadoStyle(estadoId: number): { bg: string; color: string } {
  if (estadoId === 3) return { bg: '#F0FDF4', color: '#15803D' }; // APROBADO
  if (estadoId === 4) return { bg: '#FEF2F2', color: '#B91C1C' }; // DESAPROBADO
  return { bg: '#F5F4F0', color: '#92400E' };
}

export default function NotasGrupo({ empresa, grupoId, onEstadoCambiado }: {
  empresa: string;
  grupoId: number;
  /** Se llama cuando una nota guardada cambia el estado de aprobación de un alumno,
   *  para que la lista de inscripciones del padre se refresque sin recargar. */
  onEstadoCambiado?: () => void;
}) {
  const [matriz,  setMatriz]  = useState<NotasMatriz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  /** Notas editadas en pantalla: inscripcion_id -> (unidad_id -> texto). */
  const [edits, setEdits] = useState<Record<number, Record<number, string>>>({});
  const [saving,  setSaving]  = useState<number | null>(null);
  const [savedOk, setSavedOk] = useState<number | null>(null);

  const cargar = () => {
    setLoading(true); setError(null);
    notasApi.matrizGrupo(empresa, grupoId)
      .then(m => {
        setMatriz(m);
        const init: Record<number, Record<number, string>> = {};
        m.filas.forEach(f => {
          init[f.inscripcion_id] = {};
          m.unidades.forEach(u => {
            const v = f.notas[u.id];
            init[f.inscripcion_id][u.id] = v === undefined || v === null ? '' : String(v);
          });
        });
        setEdits(init);
      })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, [empresa, grupoId]);

  const setNota = (inscId: number, unidadId: number, valor: string) =>
    setEdits(prev => ({ ...prev, [inscId]: { ...prev[inscId], [unidadId]: valor } }));

  const promedioLocal = (inscId: number): number | null => {
    if (!matriz) return null;
    const vals = matriz.unidades
      .map(u => edits[inscId]?.[u.id])
      .filter(v => v !== '' && v !== undefined)
      .map(Number);
    if (vals.length < matriz.unidades.length || vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  // ¿La fila tiene notas modificadas respecto a lo guardado? (para habilitar "Guardar")
  const filaModificada = (inscId: number): boolean => {
    if (!matriz) return false;
    const fila = matriz.filas.find(f => f.inscripcion_id === inscId);
    if (!fila) return false;
    return matriz.unidades.some(u => {
      const orig = fila.notas[u.id];
      const original = orig === undefined || orig === null ? '' : String(orig);
      return original !== (edits[inscId]?.[u.id] ?? '');
    });
  };

  const guardarFila = async (inscId: number) => {
    if (!matriz) return;
    const notas = matriz.unidades
      .map(u => ({ unidad_id: u.id, raw: edits[inscId]?.[u.id] ?? '' }))
      .filter(n => n.raw !== '')
      .map(n => ({ unidad_id: n.unidad_id, nota: Number(n.raw) }));

    if (notas.some(n => isNaN(n.nota) || n.nota < 0 || n.nota > 20)) {
      setError('Las notas deben estar entre 0 y 20.');
      return;
    }

    setSaving(inscId); setError(null);
    try {
      const r = await notasApi.guardar(empresa, inscId, notas);
      // ¿Cambió el estado de aprobación? → avisar al padre para refrescar inscripciones.
      const estadoAnterior = matriz.filas.find(f => f.inscripcion_id === inscId)?.estado_id;
      if (estadoAnterior !== r.estado_id) onEstadoCambiado?.();
      // Actualizar estado de la fila en la matriz local
      setMatriz(prev => prev && ({
        ...prev,
        filas: prev.filas.map(f => f.inscripcion_id === inscId
          ? { ...f, estado_id: r.estado_id, estado_nombre: r.estado_nombre,
              notas: Object.fromEntries(notas.map(n => [n.unidad_id, n.nota])) }
          : f),
      }));
      setSavedOk(inscId);
      setTimeout(() => setSavedOk(s => (s === inscId ? null : s)), 2000);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setSaving(null); }
  };

  if (loading) {
    return <div className="flex justify-center py-16" style={{ color: '#D1D5DB' }}><Loader2 size={22} className="animate-spin" /></div>;
  }

  if (error && !matriz) {
    return (
      <div className="flex items-center gap-2 text-[13px] px-4 py-3 rounded-xl"
        style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
        <AlertCircle size={14} /> {error}
      </div>
    );
  }

  if (!matriz) return null;

  const label = matriz.unidad_label || 'Unidad';

  // Programa sin unidades configuradas
  if (matriz.unidades.length === 0) {
    return (
      <div className="bg-white rounded-2xl py-14 text-center" style={{ border: '1px solid #EEECE6' }}>
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: '#F3F0FF', color: '#7C3AED' }}>
          <GraduationCap size={22} />
        </div>
        <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Este programa no tiene {label.toLowerCase()}es</p>
        <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>
          Ve a <span className="font-semibold">Programas</span> y agrega las {label.toLowerCase()}es para poder registrar notas.
        </p>
      </div>
    );
  }

  // ── Modo créditos: no se registran notas. Los créditos se otorgan por
  //    asistencia; se muestra el detalle de créditos por unidad (solo lectura). ──
  if (matriz.es_creditos) {
    const totalCred = matriz.unidades.reduce((s, u) => s + Number(u.creditos ?? 0), 0);
    return (
      <>
        <div className="flex items-start gap-2 text-[13px] px-4 py-3 rounded-xl mb-3"
          style={{ background: '#F3F0FF', border: '1px solid #DDD6FE', color: '#5B21B6' }}>
          <GraduationCap size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            <strong>Modo créditos.</strong> Este programa no registra notas: cada tema del temario otorga
            sus créditos por asistencia. Aprueba a los alumnos desde <strong>Inscripciones</strong> (por asistencia)
            y al emitir, el acta mostrará los créditos de cada tema y el total.
          </span>
        </div>
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #EEECE6' }}>
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Tema</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Créditos</th>
              </tr>
            </thead>
            <tbody>
              {matriz.unidades.map((u, idx) => (
                <tr key={u.id} style={{ borderBottom: idx < matriz.unidades.length - 1 ? '1px solid #F5F4F0' : undefined }}>
                  <td className="px-4 py-2.5 text-[13px]" style={{ color: '#0D0E12' }}>{u.nombre}</td>
                  <td className="px-4 py-2.5 text-right text-[13px] font-bold tabular-nums" style={{ color: '#7C3AED' }}>{Number(u.creditos ?? 0)}</td>
                </tr>
              ))}
              <tr style={{ background: '#FAFAF8', borderTop: '1px solid #EEECE6' }}>
                <td className="px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider" style={{ color: '#374151' }}>Total</td>
                <td className="px-4 py-2.5 text-right text-[14px] font-bold tabular-nums" style={{ color: '#0D0E12' }}>{totalCred}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (matriz.filas.length === 0) {
    return (
      <div className="bg-white rounded-2xl py-14 text-center" style={{ border: '1px solid #EEECE6' }}>
        <p className="text-[14px] font-semibold" style={{ color: '#374151' }}>Este grupo no tiene inscritos aún</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="flex items-center gap-2 text-[13px] px-4 py-3 rounded-xl mb-3"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <p className="text-[12px] mb-3" style={{ color: '#9CA3AF' }}>
        Escala 0–20 · aprueba con promedio ≥ <span className="font-semibold" style={{ color: '#374151' }}>{matriz.nota_minima.toFixed(2)}</span>.
        Las notas se guardan por alumno y la aprobación se calcula sola. El acta de notas sale como 2ª hoja del certificado al emitirlo.
      </p>

      <div className="bg-white rounded-2xl overflow-x-auto" style={{ border: '1px solid #EEECE6' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #EEECE6' }}>
              <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Participante</th>
              {matriz.unidades.map((u, i) => (
                <th key={u.id} className="px-2 py-3 text-[11px] font-semibold uppercase tracking-wider text-center" style={{ color: '#9CA3AF', minWidth: 70 }} title={u.nombre}>
                  {label.slice(0, 3)} {i + 1}
                </th>
              ))}
              <th className="px-2 py-3 text-[11px] font-semibold uppercase tracking-wider text-center" style={{ color: '#9CA3AF' }}>Prom.</th>
              <th className="px-2 py-3 text-[11px] font-semibold uppercase tracking-wider text-center" style={{ color: '#9CA3AF' }}>Estado</th>
              <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-right" style={{ color: '#9CA3AF' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {matriz.filas.map((f, idx) => {
              const prom = promedioLocal(f.inscripcion_id);
              const est = estadoStyle(f.estado_id);
              return (
                <tr key={f.inscripcion_id} style={{ borderBottom: idx < matriz.filas.length - 1 ? '1px solid #F5F4F0' : undefined }}>
                  <td className="px-4 py-2.5">
                    <p className="text-[13px] font-semibold truncate" style={{ color: '#0D0E12', maxWidth: 220 }}>{f.participante_nombre}</p>
                    <p className="text-[11px]" style={{ color: '#9CA3AF' }}>DNI {f.numero_documento}</p>
                  </td>
                  {matriz.unidades.map(u => (
                    <td key={u.id} className="px-1.5 py-2.5 text-center">
                      <input
                        type="number" min={0} max={20} step={0.5}
                        value={edits[f.inscripcion_id]?.[u.id] ?? ''}
                        onChange={e => setNota(f.inscripcion_id, u.id, e.target.value)}
                        className="vx-input text-center"
                        style={{ width: 56, padding: '0.35rem 0.25rem' }}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-center">
                    <span className="text-[13px] font-bold tabular-nums" style={{ color: prom === null ? '#D1D5DB' : '#0D0E12' }}>
                      {prom === null ? '—' : prom.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="inline-block px-2 py-1 rounded-full text-[10.5px] font-semibold" style={{ background: est.bg, color: est.color }}>
                      {f.estado_nombre}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => guardarFila(f.inscripcion_id)}
                        disabled={saving === f.inscripcion_id || (!filaModificada(f.inscripcion_id) && savedOk !== f.inscripcion_id)}
                        className="flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50"
                        style={savedOk === f.inscripcion_id
                          ? { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
                          : { background: '#0D0E12', color: '#fff' }}
                      >
                        {saving === f.inscripcion_id ? <Loader2 size={12} className="animate-spin" /> : savedOk === f.inscripcion_id ? <CheckCircle size={12} /> : <Save size={12} />}
                        {savedOk === f.inscripcion_id ? 'Guardado' : 'Guardar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
