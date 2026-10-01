import { useEffect, useMemo, useState, FormEvent } from 'react';
import { Calendar, Plus, Loader2, X, ChevronLeft, ChevronRight, Trash2 } from '@/components/ui/icon';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { authStorage } from '@/lib/auth';
import {
  terapApi, type Cita, type Paciente, type Terapeuta, type Servicio, type Catalogos, type CitaDto, type SaldoSesiones,
} from '../../shared/api/terapeutico.api';
import Combobox from '../../shared/components/Combobox';
import { useConfirm } from '@/modules/extensions/certificaciones/shared/hooks/useConfirm';
import TimeField from '@/modules/extensions/certificaciones/shared/components/TimeField';
import DateField from '@/modules/extensions/certificaciones/shared/components/DateField';

const TEAL = '#0F766E';
const puedeGestionar = (rol?: string) => ['ADMINISTRADOR', 'ADMISION'].includes((rol ?? '').toUpperCase());

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const COLOR_ESTADO: Record<number, string> = { 1: '#F59E0B', 2: '#0F766E', 3: '#9CA3AF', 4: '#DC2626' };
/** Sombra/borde de tarjeta premium (mismo patrón de Ventas/Caja/Reportes). */
const CARD: React.CSSProperties = { border: '1px solid #EAEFEE', boxShadow: '0 1px 2px rgba(16,48,44,.04), 0 12px 32px -16px rgba(16,48,44,.14)' };

const pad2 = (n: number) => String(n).padStart(2, '0');
/** Suma minutos a una hora "HH:MM" (no cruza medianoche: tope 23:59). */
const sumarMin = (hhmm: string, min: number) => {
  const [h, m] = (hhmm || '').split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '';
  const total = Math.min(h * 60 + m + (min || 0), 23 * 60 + 59);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
};
const HORAS = Array.from({ length: 15 }, (_, i) => 7 + i);   // franjas 7:00 … 21:00 (vista semana)
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/**
 * Parsea la fecha/hora que manda el backend como hora LOCAL DE PARED, sin importar
 * si viene con 'Z' (UTC) o sin zona. Si el servidor está en UTC, `new Date(iso)` la
 * correría −5h (Perú) y la cita de la mañana se caía del calendario. Aquí tomamos los
 * números tal cual (09:00 = 09:00), así se ve siempre a la hora en que se guardó.
 */
const parseLocal = (s?: string | null): Date => {
  const m = String(s ?? '').match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return new Date(s ?? NaN);
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
};
const horaDe = (dt: string) => parseLocal(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const toMysql = (local: string) => local ? local.replace('T', ' ') + ':00' : '';
/** MySQL 'YYYY-MM-DD HH:mm:ss' → valor de <input datetime-local> 'YYYY-MM-DDTHH:mm'. */
const toLocalInput = (dt?: string | null) => {
  if (!dt) return '';
  const d = parseLocal(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function Agenda() {
  const slug = useEmpresaSlug()!;
  const rol = authStorage.getUser(slug)?.rol;

  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [modalDia, setModalDia] = useState<string | null>(null); // 'YYYY-MM-DD' o null
  const [modalHora, setModalHora] = useState<string | null>(null); // 'HH:MM' al agendar desde una franja
  const [citaSel, setCitaSel] = useState<Cita | null>(null);      // cita a ver/reprogramar
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [terapFiltro, setTerapFiltro] = useState(0);              // 0 = todos los terapeutas
  const [vista, setVista] = useState<'mes' | 'semana'>('semana'); // la semana con horas es la vista por defecto

  // 42 celdas: desde el lunes previo al día 1 del mes.
  const celdas = useMemo(() => {
    const primero = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (primero.getDay() + 6) % 7;              // Lun=0
    const inicio = new Date(primero); inicio.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d; });
  }, [cursor]);

  // Vista semanal: los 7 días (Lun–Dom) de la semana del cursor.
  const semana = useMemo(() => {
    const base = new Date(cursor);
    const offset = (base.getDay() + 6) % 7;                 // Lun=0
    const lunes = new Date(base); lunes.setDate(base.getDate() - offset);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d; });
  }, [cursor]);

  const cargar = () => {
    setLoading(true);
    const dias = vista === 'semana' ? semana : celdas;
    const desde = ymd(dias[0]) + ' 00:00:00';
    const hasta = ymd(dias[dias.length - 1]) + ' 23:59:59';
    terapApi.listCitas(slug, { desde, hasta }).then(setCitas).finally(() => setLoading(false));
  };
  useEffect(cargar, [slug, cursor, vista]);
  useEffect(() => {
    terapApi.catalogos(slug).then(setCatalogos).catch(() => {});
    // La agenda es SIEMPRE por terapeuta (no hay vista "todos": mezclaría citas y
    // parecería que se chancan). Al cargar, se selecciona el primero por defecto.
    terapApi.listTerapeutas(slug).then(list => {
      setTerapeutas(list);
      setTerapFiltro(prev => prev || list[0]?.id || 0);
    }).catch(() => {});
  }, [slug]);

  // Solo las citas del terapeuta elegido (si no hay ninguno, no se muestra nada).
  const citasVisibles = useMemo(
    () => citas.filter(c => c.terapeuta_id === terapFiltro),
    [citas, terapFiltro],
  );

  const citasPorDia = useMemo(() => {
    const m = new Map<string, Cita[]>();
    for (const c of citasVisibles) { const k = ymd(parseLocal(c.inicio)); (m.get(k) ?? m.set(k, []).get(k)!).push(c); }
    return m;
  }, [citasVisibles]);

  const hoyStr = ymd(new Date());
  const mover = (n: number) => setCursor(c => vista === 'semana'
    ? (() => { const d = new Date(c); d.setDate(d.getDate() + 7 * n); return d; })()
    : new Date(c.getFullYear(), c.getMonth() + n, 1));
  const enMes = citasVisibles.filter(c => { const d = parseLocal(c.inicio); return d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear(); }).length;
  const hoyCount = (citasPorDia.get(hoyStr) ?? []).length;
  const tituloRango = vista === 'semana'
    ? `${semana[0].getDate()} ${MESES[semana[0].getMonth()].slice(0, 3)} – ${semana[6].getDate()} ${MESES[semana[6].getMonth()].slice(0, 3)}`
    : `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const abrirNueva = (diaStr: string, hora?: string) => { setModalDia(diaStr); setModalHora(hora ?? null); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#14B8A6,#0F766E)', boxShadow: '0 8px 20px -6px rgba(15,118,110,0.5)' }}>
            <Calendar size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-[21px] font-bold leading-tight" style={{ color: '#0E1A1A' }}>Agenda</h1>
            <p className="text-[12.5px]" style={{ color: '#6B7280' }}>
              {enMes} {enMes === 1 ? 'cita' : 'citas'} este mes{hoyCount > 0 && <> · <b style={{ color: TEAL }}>{hoyCount} hoy</b></>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro por terapeuta (buscable). "Todos" = id 0. */}
          <div className="w-56">
            <Combobox
              options={terapeutas.map(t => ({ id: t.id, label: t.nombre }))}
              value={terapFiltro}
              onChange={setTerapFiltro}
              placeholder="Elige un terapeuta…"
              emptyText="Sin terapeutas"
            />
          </div>
          {/* Vista Mes / Semana */}
          <div className="inline-flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
            {(['semana', 'mes'] as const).map(v => (
              <button key={v} onClick={() => setVista(v)}
                className="text-[12.5px] font-semibold px-3 py-2 capitalize"
                style={vista === v ? { background: TEAL, color: '#fff' } : { background: '#fff', color: '#64748B' }}>
                {v === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
            <button onClick={() => mover(-1)} className="p-2 hover:bg-gray-50" title="Anterior"><ChevronLeft size={16} /></button>
            <span className="text-[13px] font-semibold w-40 text-center capitalize" style={{ color: '#0E1A1A' }}>{tituloRango}</span>
            <button onClick={() => mover(1)} className="p-2 hover:bg-gray-50" title="Siguiente"><ChevronRight size={16} /></button>
          </div>
          <button onClick={() => setCursor(new Date())}
            className="text-[12.5px] font-semibold px-3 py-2 rounded-lg hover:bg-gray-50" style={{ border: '1px solid #E5E9E7', color: '#374151' }}>Hoy</button>
          {puedeGestionar(rol) && (
            <button onClick={() => abrirNueva(hoyStr)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13.5px] font-semibold shadow-sm hover:opacity-95 transition" style={{ background: TEAL }}>
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

      {vista === 'semana' && (
        loading
          ? <div className="rounded-2xl bg-white p-10 flex justify-center" style={CARD}><Loader2 size={22} className="animate-spin" style={{ color: TEAL }} /></div>
          : <VistaSemana semana={semana} citasPorDia={citasPorDia} hoyStr={hoyStr} puedeGestion={puedeGestionar(rol)} onCita={setCitaSel} onNueva={abrirNueva} />
      )}

      {vista === 'mes' && (
      <div className="rounded-2xl bg-white overflow-hidden" style={CARD}>
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
                      <button onClick={() => abrirNueva(k)} className="opacity-40 hover:opacity-100" title="Agendar"><Plus size={12} /></button>
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
      )}

      {modalDia && catalogos && (
        <ModalCita slug={slug} dia={modalDia} horaInicial={modalHora ?? undefined} terapeutaInicial={terapFiltro || undefined} catalogos={catalogos} puedeGestionar={puedeGestionar(rol)}
          onClose={() => { setModalDia(null); setModalHora(null); }}
          onSaved={() => { setModalDia(null); setModalHora(null); cargar(); }} />
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
/** Vista SEMANA: rejilla de horas (filas) × días (columnas), con las citas ubicadas
 *  en su franja. Clic en una cita = ver/reprogramar; clic en un hueco = agendar ahí. */
function VistaSemana({ semana, citasPorDia, hoyStr, puedeGestion, onCita, onNueva }: {
  semana: Date[]; citasPorDia: Map<string, Cita[]>; hoyStr: string; puedeGestion: boolean;
  onCita: (c: Cita) => void; onNueva: (dia: string, hora: string) => void;
}) {
  const cols = { gridTemplateColumns: '56px repeat(7, 1fr)' };
  return (
    <div className="rounded-2xl bg-white overflow-hidden" style={CARD}>
      {/* Header + filas en el MISMO contenedor con scroll → columnas siempre alineadas
          (la barra de scroll afecta a ambos por igual) y header fijo al hacer scroll. */}
      <div className="overflow-y-auto" style={{ maxHeight: '64vh' }}>
        {/* Cabecera: hueco + 7 días (sticky) */}
        <div className="grid sticky top-0 z-10 bg-white" style={{ ...cols, borderBottom: '1px solid #DCE4E1' }}>
          <div />
          {semana.map((d, i) => {
            const esHoy = ymd(d) === hoyStr;
            return (
              <div key={i} className="py-2 text-center" style={{ borderLeft: '1px solid #DCE4E1' }}>
                <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>{DIAS[i]}</div>
                <div className="text-[13px] font-bold inline-flex items-center justify-center mt-0.5"
                  style={esHoy ? { background: TEAL, color: '#fff', borderRadius: 999, width: 22, height: 22 } : { color: '#0E1A1A' }}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>
        {HORAS.map(h => (
          <div key={h} className="grid" style={{ ...cols, borderTop: '1px solid #DCE4E1' }}>
            <div className="text-right pr-2 pt-1.5 text-[10.5px] tabular-nums" style={{ color: '#94A3B8' }}>{pad2(h)}:00</div>
            {semana.map((d, di) => {
              const dstr = ymd(d);
              const cs = (citasPorDia.get(dstr) ?? []).filter(c => parseLocal(c.inicio).getHours() === h);
              return (
                <div key={di} className="min-h-[60px] p-1 relative group min-w-0 overflow-hidden" style={{ borderLeft: '1px solid #DCE4E1' }}>
                  {cs.map(c => {
                    const col = COLOR_ESTADO[c.estado_id] ?? '#6B7280';
                    return (
                      <button key={c.id} onClick={() => onCita(c)}
                        className="w-full text-left px-2 py-1.5 rounded-lg mb-1 hover:brightness-95 transition min-w-0"
                        style={{ background: `${col}1f`, borderLeft: `3px solid ${col}` }}
                        title={`${horaDe(c.inicio)} · ${c.paciente_nombre}${c.servicio_nombre ? ' · ' + c.servicio_nombre : ''} — clic para ver / reprogramar`}>
                        <span className="block text-[11.5px] font-bold leading-tight truncate" style={{ color: col }}>{horaDe(c.inicio)}</span>
                        <span className="block text-[11.5px] font-semibold leading-tight line-clamp-2 break-words" style={{ color: '#334155' }}>{c.paciente_nombre}</span>
                        {c.servicio_nombre && <span className="block text-[10.5px] leading-tight truncate" style={{ color: '#64748B' }}>{c.servicio_nombre}</span>}
                      </button>
                    );
                  })}
                  {puedeGestion && cs.length === 0 && (
                    <button onClick={() => onNueva(dstr, `${pad2(h)}:00`)}
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center" title="Agendar aquí">
                      <Plus size={14} style={{ color: '#CBD5D1' }} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalCita({ slug, dia, horaInicial, terapeutaInicial, cita, catalogos, puedeGestionar, onClose, onSaved }: {
  slug: string; dia?: string; horaInicial?: string; terapeutaInicial?: number; cita?: Cita; catalogos: Catalogos; puedeGestionar: boolean;
  onClose: () => void; onSaved: () => void;
}) {
  const esEdicion = !!cita;
  const soloLectura = !puedeGestionar;
  const confirm = useConfirm();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [f, setF] = useState<CitaDto & { estado_id?: number }>(
    cita
      ? { paciente_id: cita.paciente_id, terapeuta_id: cita.terapeuta_id, servicio_id: cita.servicio_id,
          inicio: toLocalInput(cita.inicio), fin: cita.fin ? toLocalInput(cita.fin) : '', motivo: cita.motivo ?? '', estado_id: cita.estado_id }
      : { paciente_id: 0, terapeuta_id: terapeutaInicial ?? 0, servicio_id: null, inicio: `${dia}T09:00`, motivo: '' },
  );
  const [saving, setSaving] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saldo, setSaldo] = useState<SaldoSesiones | null>(null);
  const [ocupadas, setOcupadas] = useState<Cita[]>([]); // citas del día seleccionado (para marcar horarios ocupados)
  const set = (k: keyof typeof f, v: any) => setF(prev => ({ ...prev, [k]: v }));

  // Saldo de sesiones del servicio elegido (vínculo venta↔cita). Solo si hay paciente + servicio.
  useEffect(() => {
    if (!f.paciente_id || !f.servicio_id) { setSaldo(null); return; }
    let vivo = true;
    terapApi.saldoSesiones(slug, f.paciente_id, f.servicio_id)
      .then(s => { if (vivo) setSaldo(s); })
      .catch(() => { if (vivo) setSaldo(null); });
    return () => { vivo = false; };
  }, [slug, f.paciente_id, f.servicio_id]);

  // Duración (min) del servicio elegido; sin servicio, 45 por defecto. Sirve para autocalcular la hora fin.
  const duracionDe = (servicioId?: number | null) => servicios.find(s => s.id === servicioId)?.duracion_min || 45;

  // ¿Se cambió el servicio? (en edición, si es el mismo no se re-exige saldo).
  const servicioCambiado = esEdicion ? Number(f.servicio_id || 0) !== Number(cita?.servicio_id || 0) : true;
  // Bloquea agendar si la regla aplica, hay servicio, cambió, y no queda saldo.
  const sinSaldo = !!saldo?.requiere && !!f.servicio_id && servicioCambiado && saldo.saldo < 1;

  // Fecha + horas por separado (datepicker nativo + TimeField escribible) en vez de
  // un datetime-local. La cita es de un día: fecha + hora inicio (+ hora fin opcional).
  const iniLocal = cita ? toLocalInput(cita.inicio) : `${dia ?? ''}T${horaInicial ?? '09:00'}`;
  const [fecha, setFecha]     = useState(iniLocal.split('T')[0] || (dia ?? ''));
  const [horaIni, setHoraIni] = useState(iniLocal.split('T')[1] || '09:00');
  // Cita nueva: precarga la hora fin con +45 (default); al elegir servicio se recalcula con su duración real.
  const [horaFin, setHoraFin] = useState(cita?.fin ? toLocalInput(cita.fin).split('T')[1] : sumarMin(iniLocal.split('T')[1] || '09:00', 45));

  // Franjas de atención del día generadas EN PASOS DE LA DURACIÓN DE LA SESIÓN: si el
  // servicio dura 45 min, ofrece 07:00, 07:45, 08:30…; si dura 60, cada hora. Cada franja
  // trae su estado ocupado/libre según las citas YA agendadas ese día para el terapeuta,
  // así el select solo ofrece huecos reales (entran completos antes del cierre) y marca
  // los tomados.
  const ABRE = 7 * 60, CIERRA = 21 * 60; // atención 07:00 → 21:00
  const horariosDia = useMemo(() => {
    const mins = (hhmm: string) => { const [h, m] = (hhmm || '').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
    const minDe = (dt: string) => { const d = parseLocal(dt); return d.getHours() * 60 + d.getMinutes(); };
    const hhmm = (t: number) => `${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`;
    const dur = duracionDe(f.servicio_id);
    // Intervalos ocupados del terapeuta ese día (excluye la propia cita en edición y las canceladas = estado 4).
    const ivs = ocupadas
      .filter(c => c.terapeuta_id === f.terapeuta_id && c.id !== cita?.id && c.estado_id !== 4)
      .map(c => ({ i: minDe(c.inicio), f: c.fin ? minDe(c.fin) : minDe(c.inicio) + 45 }));
    // El slot [t, t+dur) choca con alguna cita existente del terapeuta.
    const estaOcupado = (t: number) => !!f.terapeuta_id && ivs.some(iv => t < iv.f && t + dur > iv.i);
    const slots: { hhmm: string; ocupado: boolean }[] = [];
    // El paso = duración de la sesión; la última franja debe terminar antes del cierre.
    for (let t = ABRE; t + dur <= CIERRA; t += dur) slots.push({ hhmm: hhmm(t), ocupado: estaOcupado(t) });
    // Garantiza que la hora actualmente escrita esté presente aunque no calce con la grilla,
    // con su estado real de ocupación (si choca, saldrá como ocupada → no permitida).
    if (horaIni && !slots.some(s => s.hhmm === horaIni)) {
      slots.push({ hhmm: horaIni, ocupado: estaOcupado(mins(horaIni)) });
      slots.sort((a, b) => mins(a.hhmm) - mins(b.hhmm));
    }
    return slots;
  }, [ocupadas, f.terapeuta_id, f.servicio_id, servicios, cita?.id, horaIni]);

  // Opciones realmente disponibles (libres) y validez de la hora escrita: si no está en
  // la lista de disponibles, no se permite agendar.
  const horariosLibres = useMemo(() => horariosDia.filter(s => !s.ocupado), [horariosDia]);
  const horaDisponible = horariosLibres.some(s => s.hhmm === horaIni);

  useEffect(() => {
    terapApi.listPacientes(slug).then(setPacientes).catch(() => {});
    terapApi.listServicios(slug).then(setServicios).catch(() => {});
  }, [slug]);

  // Citas ya agendadas ese día (para saber qué horarios están ocupados).
  useEffect(() => {
    if (!fecha) { setOcupadas([]); return; }
    let vivo = true;
    terapApi.listCitas(slug, { desde: `${fecha} 00:00:00`, hasta: `${fecha} 23:59:59` })
      .then(cs => { if (vivo) setOcupadas(cs); })
      .catch(() => { if (vivo) setOcupadas([]); });
    return () => { vivo = false; };
  }, [slug, fecha]);

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

  const eliminar = async () => {
    if (!cita || eliminando) return;
    const ok = await confirm({
      title: 'Eliminar cita',
      message: `¿Eliminar la cita de ${cita.paciente_nombre} del ${new Date(parseLocal(cita.inicio)).toLocaleDateString()} a las ${horaDe(cita.inicio)}?\n\nEsta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Eliminar',
    });
    if (!ok) return;
    setEliminando(true); setError(null);
    try {
      await terapApi.deleteCita(slug, cita.id);
      onSaved();
    } catch (err: any) { setError(err?.message ?? 'No se pudo eliminar la cita'); setEliminando(false); }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (soloLectura) { onClose(); return; }
    if (!f.paciente_id) { setError('Elige el paciente.'); return; }
    if (!f.terapeuta_id) { setError('Elige el terapeuta.'); return; }
    if (!fecha || !horaIni) { setError('Falta la fecha y la hora de inicio.'); return; }
    if (!horaDisponible) { setError('Ese horario no está disponible. Elige uno de la lista.'); return; }
    if (sinSaldo) {
      setError(saldo!.comprado === 0
        ? 'Este paciente no tiene una venta de ese servicio. Regístrala antes de agendar.'
        : `Sin sesiones disponibles de ese servicio (compradas ${saldo!.comprado}, usadas ${saldo!.consumido}).`);
      return;
    }
    setSaving(true); setError(null);
    try {
      const inicio = toMysql(`${fecha}T${horaIni}`);
      const fin = horaFin ? toMysql(`${fecha}T${horaFin}`) : null;
      if (esEdicion) {
        await terapApi.updateCita(slug, cita!.id, {
          inicio, fin, motivo: f.motivo ?? null, estado_id: f.estado_id,
          terapeuta_id: f.terapeuta_id, servicio_id: f.servicio_id ?? null,
        });
      } else {
        await terapApi.createCita(slug, {
          paciente_id: f.paciente_id, terapeuta_id: f.terapeuta_id, servicio_id: f.servicio_id ?? null,
          inicio, fin, motivo: f.motivo ?? null,
        });
      }
      onSaved();
    } catch (err: any) { setError(err?.message ?? 'No se pudo guardar'); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,26,26,0.5)', backdropFilter: 'blur(3px)' }} onMouseDown={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #EEF2F1' }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#CCFBF1' }}><Calendar size={16} style={{ color: TEAL }} /></div>
            <h2 className="text-[16px] font-bold" style={{ color: '#0E1A1A' }}>
              {esEdicion ? (soloLectura ? 'Detalle de la cita' : 'Reprogramar cita') : 'Nueva cita'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: '#6B7280' }} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3.5 overflow-y-auto">
          <Campo label="Paciente *">
            <Combobox
              options={pacientes.map(p => ({ id: p.id, label: `${p.apellidos}, ${p.nombres}`, sub: p.num_doc ?? undefined }))}
              value={f.paciente_id || 0}
              onChange={id => set('paciente_id', id)}
              disabled={soloLectura || esEdicion}
              placeholder="Busca al paciente por nombre o documento…"
              emptyText="Sin pacientes"
            />
          </Campo>
          <Campo label="Servicio">
            <select className="vx-input" value={f.servicio_id || ''} disabled={soloLectura}
              onChange={e => {
                const id = e.target.value ? Number(e.target.value) : null;
                set('servicio_id', id);
                if (horaIni) setHoraFin(sumarMin(horaIni, duracionDe(id)));   // recalcula el fin según la duración del servicio
              }}>
              <option value="">(Cualquiera)</option>
              {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} · {s.duracion_min ?? 45} min</option>)}
            </select>
            {/* Saldo de sesiones (vínculo venta↔cita) */}
            {saldo?.requiere && f.servicio_id ? (
              sinSaldo ? (
                <p className="text-[11.5px] mt-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                  {saldo.comprado === 0
                    ? 'Sin venta de este servicio. Registra la venta para poder agendar.'
                    : `Sin sesiones disponibles (compradas ${saldo.comprado}, usadas ${saldo.consumido}).`}
                </p>
              ) : (
                <p className="text-[11.5px] mt-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: '#ECFDF5', color: '#15803D' }}>
                  Sesiones disponibles: <b>{saldo.saldo}</b> <span style={{ color: '#6B7280' }}>(compradas {saldo.comprado}, usadas {saldo.consumido})</span>
                </p>
              )
            ) : null}
          </Campo>
          <Campo label="Terapeuta *">
            <select className="vx-input" value={f.terapeuta_id || ''} disabled={soloLectura} onChange={e => set('terapeuta_id', Number(e.target.value))}>
              <option value="">{f.servicio_id ? 'Terapeutas de ese servicio…' : 'Selecciona…'}</option>
              {terapeutas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </Campo>
          <Campo label="Fecha *">
            <DateField value={fecha} onChange={setFecha} disabled={soloLectura} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Hora inicio *">
              {/* Combo editable: se escribe y a la vez despliega la lista de horarios
                  disponibles. Si lo escrito no está disponible, se marca y no deja agendar. */}
              <HoraCombo value={horaIni} disabled={soloLectura}
                opciones={horariosLibres.map(s => s.hhmm)}
                invalido={!soloLectura && !!horaIni && !horaDisponible}
                onChange={v => { setHoraIni(v); setHoraFin(sumarMin(v, duracionDe(f.servicio_id))); }} />
              {!soloLectura && horaIni && !horaDisponible && (
                <p className="text-[11px] mt-1" style={{ color: '#B91C1C' }}>Ese horario no está disponible. Elige uno de la lista.</p>
              )}
            </Campo>
            <Campo label="Hora fin (auto)"><TimeField value={horaFin} onChange={setHoraFin} disabled={soloLectura} /></Campo>
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
          <div className="flex items-center justify-between gap-2 pt-1">
            {/* Eliminar cita: solo en edición y si el rol gestiona la agenda */}
            {esEdicion && !soloLectura ? (
              <button type="button" onClick={eliminar} disabled={eliminando || saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold disabled:opacity-50" style={{ border: '1px solid #FCA5A5', color: '#DC2626' }}>
                {eliminando ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar
              </button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>
                {soloLectura ? 'Cerrar' : 'Cancelar'}
              </button>
              {!soloLectura && (
                <button type="submit" disabled={saving || eliminando || sinSaldo || !horaDisponible}
                  title={sinSaldo ? 'Sin sesiones disponibles de ese servicio' : (!horaDisponible ? 'Ese horario no está disponible' : undefined)}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: TEAL }}>
                  {saving && <Loader2 size={14} className="animate-spin" />} {esEdicion ? 'Guardar cambios' : 'Agendar'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Combo editable de horas: se escribe libremente y a la vez despliega la lista de
 *  horarios disponibles (abre al enfocar/clic, filtra mientras escribes). La validación
 *  de "no permitido" la hace el padre (borde rojo + bloqueo). */
function HoraCombo({ value, onChange, opciones, disabled, invalido }: {
  value: string; onChange: (v: string) => void; opciones: string[]; disabled?: boolean; invalido?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const filtradas = opciones.filter(o => o.startsWith(value.trim()));
  const lista = filtradas.length ? filtradas : opciones;
  return (
    <div className="relative">
      <input className="vx-input" type="text" inputMode="numeric" placeholder="HH:MM"
        value={value} disabled={disabled}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={invalido ? { borderColor: '#DC2626' } : undefined} />
      {open && !disabled && lista.length > 0 && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-xl max-h-52 overflow-y-auto"
          style={{ border: '1px solid #E5E9E7', boxShadow: '0 10px 30px -12px rgba(16,48,44,.25)' }}>
          {lista.map(o => (
            <button key={o} type="button" onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(o); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50"
              style={o === value ? { background: '#F0FDFA', color: TEAL, fontWeight: 600 } : { color: '#374151' }}>
              {o}
            </button>
          ))}
        </div>
      )}
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
