import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Plus, Loader2, X, ChevronLeft, ChevronRight } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import {
  terapApi, type Cita, type Paciente, type Terapeuta, type Servicio, type Catalogos, type CitaDto,
} from '../../shared/api/terapeutico.api';

const TEAL = '#0F766E';
const puedeGestionar = (rol?: string) => ['ADMINISTRADOR', 'ADMISION'].includes((rol ?? '').toUpperCase());

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const COLOR_ESTADO: Record<number, string> = { 1: '#F59E0B', 2: '#0F766E', 3: '#9CA3AF', 4: '#DC2626' };

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const horaDe = (dt: string) => new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const toMysql = (local: string) => local ? local.replace('T', ' ') + ':00' : '';
/** MySQL 'YYYY-MM-DD HH:mm:ss' → valor de <input datetime-local> 'YYYY-MM-DDTHH:mm'. */
const toLocalInput = (dt?: string | null) => {
  if (!dt) return '';
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function Agenda() {
  const { empresa } = useParams<{ empresa: string }>();
  const slug = empresa!;
  const rol = authStorage.getUser(slug)?.rol;

  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [modalDia, setModalDia] = useState<string | null>(null); // 'YYYY-MM-DD' o null
  const [citaSel, setCitaSel] = useState<Cita | null>(null);      // cita a ver/reprogramar

  // 42 celdas: desde el lunes previo al día 1 del mes.
  const celdas = useMemo(() => {
    const primero = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (primero.getDay() + 6) % 7;              // Lun=0
    const inicio = new Date(primero); inicio.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d; });
  }, [cursor]);

  const cargar = () => {
    setLoading(true);
    const desde = ymd(celdas[0]) + ' 00:00:00';
    const hasta = ymd(celdas[41]) + ' 23:59:59';
    terapApi.listCitas(slug, { desde, hasta }).then(setCitas).finally(() => setLoading(false));
  };
  useEffect(cargar, [slug, cursor]);
  useEffect(() => { terapApi.catalogos(slug).then(setCatalogos).catch(() => {}); }, [slug]);

  const citasPorDia = useMemo(() => {
    const m = new Map<string, Cita[]>();
    for (const c of citas) { const k = ymd(new Date(c.inicio)); (m.get(k) ?? m.set(k, []).get(k)!).push(c); }
    return m;
  }, [citas]);

  const hoyStr = ymd(new Date());
  const mover = (n: number) => setCursor(c => new Date(c.getFullYear(), c.getMonth() + n, 1));
  const enMes = citas.filter(c => { const d = new Date(c.inicio); return d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear(); }).length;
  const hoyCount = (citasPorDia.get(hoyStr) ?? []).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#CCFBF1' }}>
            <Calendar size={19} style={{ color: TEAL }} />
          </div>
          <div>
            <h1 className="text-[21px] font-bold leading-tight" style={{ color: '#0E1A1A' }}>Agenda</h1>
            <p className="text-[12.5px]" style={{ color: '#6B7280' }}>
              {enMes} {enMes === 1 ? 'cita' : 'citas'} este mes{hoyCount > 0 && <> · <b style={{ color: TEAL }}>{hoyCount} hoy</b></>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
            <button onClick={() => mover(-1)} className="p-2 hover:bg-gray-50" title="Mes anterior"><ChevronLeft size={16} /></button>
            <span className="text-[13.5px] font-semibold w-36 text-center capitalize" style={{ color: '#0E1A1A' }}>{MESES[cursor.getMonth()]} {cursor.getFullYear()}</span>
            <button onClick={() => mover(1)} className="p-2 hover:bg-gray-50" title="Mes siguiente"><ChevronRight size={16} /></button>
          </div>
          <button onClick={() => setCursor(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })}
            className="text-[12.5px] font-semibold px-3 py-2 rounded-lg hover:bg-gray-50" style={{ border: '1px solid #E5E9E7', color: '#374151' }}>Hoy</button>
          {puedeGestionar(rol) && (
            <button onClick={() => setModalDia(hoyStr)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13.5px] font-semibold shadow-sm hover:opacity-95 transition" style={{ background: TEAL }}>
              <Plus size={15} /> Nueva cita
            </button>
          )}
        </div>
      </div>

      {/* Leyenda de estados: los colores del calendario dejan de ser un misterio */}
      {catalogos && (
        <div className="flex items-center gap-3 mb-3 flex-wrap px-1">
          {catalogos.estados_cita.map(e => (
            <span key={e.id} className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: '#64748B' }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_ESTADO[e.id] ?? '#6B7280' }} /> {e.nombre}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
        {/* Cabecera de días */}
        <div className="grid grid-cols-7" style={{ borderBottom: '1px solid #EEF2F1' }}>
          {DIAS.map(d => <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>{d}</div>)}
        </div>
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 size={22} className="animate-spin" style={{ color: TEAL }} /></div>
        ) : (
          <div className="grid grid-cols-7">
            {celdas.map((d, i) => {
              const k = ymd(d);
              const esMes = d.getMonth() === cursor.getMonth();
              const esHoy = k === hoyStr;
              const cs = citasPorDia.get(k) ?? [];
              return (
                <div key={i} className="min-h-[92px] p-1.5 text-left align-top"
                  style={{ borderRight: (i % 7 !== 6) ? '1px solid #F1F5F4' : undefined, borderTop: i >= 7 ? '1px solid #F1F5F4' : undefined, background: esMes ? '#fff' : '#FAFBFB' }}>
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[12px] font-semibold inline-flex items-center justify-center"
                      style={esHoy ? { background: TEAL, color: '#fff', borderRadius: 999, width: 20, height: 20 } : { color: esMes ? '#0E1A1A' : '#CBD5D1' }}>
                      {d.getDate()}
                    </span>
                    {puedeGestionar(rol) && esMes && (
                      <button onClick={() => setModalDia(k)} className="opacity-40 hover:opacity-100" title="Agendar"><Plus size={12} /></button>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {cs.slice(0, 3).map(c => {
                      const col = COLOR_ESTADO[c.estado_id] ?? '#6B7280';
                      return (
                        <button key={c.id} onClick={() => setCitaSel(c)}
                          className="w-full flex items-center gap-1 text-left px-1.5 py-1 rounded-md hover:brightness-95 transition" style={{ background: `${col}14` }}
                          title={`${horaDe(c.inicio)} · ${c.paciente_nombre}${c.servicio_nombre ? ' · ' + c.servicio_nombre : ''} — clic para ver / reprogramar`}>
                          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: col }} />
                          <span className="text-[10.5px] font-bold shrink-0" style={{ color: col }}>{horaDe(c.inicio)}</span>
                          <span className="text-[10.5px] truncate" style={{ color: '#475569' }}>{c.paciente_nombre}</span>
                        </button>
                      );
                    })}
                    {cs.length > 3 && <div className="text-[10px] px-1" style={{ color: '#94A3B8' }}>+{cs.length - 3} más</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalDia && catalogos && (
        <ModalCita slug={slug} dia={modalDia} catalogos={catalogos} puedeGestionar={puedeGestionar(rol)}
          onClose={() => setModalDia(null)}
          onSaved={() => { setModalDia(null); cargar(); }} />
      )}
      {citaSel && catalogos && (
        <ModalCita slug={slug} cita={citaSel} catalogos={catalogos} puedeGestionar={puedeGestionar(rol)}
          onClose={() => setCitaSel(null)}
          onSaved={() => { setCitaSel(null); cargar(); }} />
      )}
    </div>
  );
}

/** Modal para crear una cita (con `dia`) o ver/reprogramar una existente (con `cita`).
 *  En modo edición se puede mover fecha/hora, cambiar terapeuta/servicio y el estado. */
function ModalCita({ slug, dia, cita, catalogos, puedeGestionar, onClose, onSaved }: {
  slug: string; dia?: string; cita?: Cita; catalogos: Catalogos; puedeGestionar: boolean;
  onClose: () => void; onSaved: () => void;
}) {
  const esEdicion = !!cita;
  const soloLectura = !puedeGestionar;
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [f, setF] = useState<CitaDto & { estado_id?: number }>(
    cita
      ? { paciente_id: cita.paciente_id, terapeuta_id: cita.terapeuta_id, servicio_id: cita.servicio_id,
          inicio: toLocalInput(cita.inicio), fin: cita.fin ? toLocalInput(cita.fin) : '', motivo: cita.motivo ?? '', estado_id: cita.estado_id }
      : { paciente_id: 0, terapeuta_id: 0, servicio_id: null, inicio: `${dia}T09:00`, motivo: '' },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: any) => setF(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    terapApi.listPacientes(slug).then(setPacientes).catch(() => {});
    terapApi.listServicios(slug).then(setServicios).catch(() => {});
  }, [slug]);

  // Al elegir servicio, filtrar terapeutas; sin servicio, todos.
  useEffect(() => {
    terapApi.listTerapeutas(slug, f.servicio_id || undefined)
      .then(list => {
        setTerapeutas(list);
        // Si el terapeuta actual ya no brinda el servicio elegido, lo limpiamos.
        setF(prev => (prev.terapeuta_id && !list.some(t => t.id === prev.terapeuta_id) ? { ...prev, terapeuta_id: 0 } : prev));
      })
      .catch(() => setTerapeutas([]));

  }, [slug, f.servicio_id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (soloLectura) { onClose(); return; }
    if (!f.paciente_id || !f.terapeuta_id || !f.inicio) { setError('Paciente, terapeuta y hora son obligatorios'); return; }
    setSaving(true); setError(null);
    try {
      const inicio = toMysql(f.inicio as string);
      const fin = f.fin ? toMysql(f.fin as string) : null;
      if (esEdicion) {
        await terapApi.updateCita(slug, cita!.id, {
          inicio, fin, motivo: f.motivo ?? null, estado_id: f.estado_id,
          terapeuta_id: f.terapeuta_id, servicio_id: f.servicio_id ?? null,
        });
      } else {
        await terapApi.createCita(slug, { ...f, inicio, fin });
      }
      onSaved();
    } catch (err: any) { setError(err?.message ?? 'No se pudo guardar'); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,26,26,0.5)', backdropFilter: 'blur(3px)' }} onMouseDown={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EEF2F1' }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#CCFBF1' }}><Calendar size={16} style={{ color: TEAL }} /></div>
            <h2 className="text-[16px] font-bold" style={{ color: '#0E1A1A' }}>
              {esEdicion ? (soloLectura ? 'Detalle de la cita' : 'Reprogramar cita') : 'Nueva cita'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: '#6B7280' }} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3.5">
          <Campo label="Paciente *">
            <select className="vx-input" value={f.paciente_id || ''} disabled={soloLectura || esEdicion} onChange={e => set('paciente_id', Number(e.target.value))}>
              <option value="">Selecciona…</option>
              {pacientes.map(p => <option key={p.id} value={p.id}>{p.apellidos}, {p.nombres}</option>)}
            </select>
          </Campo>
          <Campo label="Servicio">
            <select className="vx-input" value={f.servicio_id || ''} disabled={soloLectura} onChange={e => set('servicio_id', e.target.value ? Number(e.target.value) : null)}>
              <option value="">(Cualquiera)</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </Campo>
          <Campo label="Terapeuta *">
            <select className="vx-input" value={f.terapeuta_id || ''} disabled={soloLectura} onChange={e => set('terapeuta_id', Number(e.target.value))}>
              <option value="">{f.servicio_id ? 'Terapeutas de ese servicio…' : 'Selecciona…'}</option>
              {terapeutas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Inicio *"><input type="datetime-local" className="vx-input" disabled={soloLectura} value={f.inicio as string} onChange={e => set('inicio', e.target.value)} /></Campo>
            <Campo label="Fin"><input type="datetime-local" className="vx-input" disabled={soloLectura} value={(f.fin as string) ?? ''} onChange={e => set('fin', e.target.value)} /></Campo>
          </div>
          {esEdicion && (
            <Campo label="Estado">
              <select className="vx-input" value={f.estado_id ?? ''} disabled={soloLectura} onChange={e => set('estado_id', Number(e.target.value))}>
                {catalogos.estados_cita.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </Campo>
          )}
          <Campo label="Motivo"><input className="vx-input" disabled={soloLectura} value={f.motivo ?? ''} onChange={e => set('motivo', e.target.value)} placeholder="Opcional" /></Campo>

          {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>
              {soloLectura ? 'Cerrar' : 'Cancelar'}
            </button>
            {!soloLectura && (
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: TEAL }}>
                {saving && <Loader2 size={14} className="animate-spin" />} {esEdicion ? 'Guardar cambios' : 'Agendar'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>{label}</span>
      {children}
    </label>
  );
}
