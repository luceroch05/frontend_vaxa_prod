import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { ArrowLeft, Loader2, FileText, Activity, ClipboardList, Plus, Save, User, Users, X,
  FolderOpen, Upload, Download, Trash2, PrinterIcon, TrendingUp, ChevronDown, CheckCircle, Home, Calendar as CalendarIcon } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';
import { imgUrl } from '@/lib/api/client';
import {
  terapApi, terapAuthApi, type Paciente, type Historia, type Sesion, type Diagnostico, type Catalogos,
  type Terapeuta, type Asignacion, type Servicio, type Adjunto, type Cita, type Objetivo, type ObjetivoAvance,
  type AccesoApoderado, type Tarea, type Tratamiento,
} from '../../shared/api/terapeutico.api';
import { imprimirHistoria } from './imprimir';
import { esVideoMime, youtubeEmbedUrl } from '../../shared/video';

const TEAL = '#0F766E';
const escribeClinico = (rol?: string) => ['ADMINISTRADOR', 'TERAPEUTA'].includes((rol ?? '').toUpperCase());
const gestiona = (rol?: string) => ['ADMINISTRADOR', 'ADMISION'].includes((rol ?? '').toUpperCase());

/* ── Presentación (mismo lenguaje que la lista de pacientes) ─────── */
const DOC = { '1': 'DNI', '4': 'C.E.', '7': 'Pas.', '0': 'S/D' } as Record<string, string>;
const iniciales = (n: string, a: string) => `${(n.trim()[0] ?? '')}${(a.trim()[0] ?? '')}`.toUpperCase() || '?';
const AV = [
  { bg: '#CCFBF1', fg: '#0F766E' }, { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#FCE7F3', fg: '#BE185D' }, { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#E9D5FF', fg: '#7C3AED' }, { bg: '#D1FAE5', fg: '#047857' },
];
const avatar = (id: number) => AV[id % AV.length];
function edad(fecha?: string | null): string | null {
  if (!fecha) return null;
  const f = new Date(fecha); if (isNaN(+f)) return null;
  const hoy = new Date();
  let a = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) a--;
  return a > 0 ? `${a} años` : 'menor de 1 año';
}

type TabId = 'datos' | 'historia' | 'tratamientos' | 'objetivos' | 'sesiones' | 'tareas' | 'citas' | 'documentos';
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'datos',        label: 'Datos',        icon: User },
  { id: 'historia',     label: 'Historia',     icon: FileText },
  { id: 'tratamientos', label: 'Tratamientos', icon: ClipboardList },
  { id: 'objetivos',    label: 'Objetivos',    icon: TrendingUp },
  { id: 'sesiones',   label: 'Sesiones',    icon: Activity },
  { id: 'tareas',     label: 'Tareas',      icon: Home },
  { id: 'citas',      label: 'Citas',       icon: CalendarIcon },
  { id: 'documentos', label: 'Documentos',  icon: FolderOpen },
];

export default function PacienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const slug = useEmpresaSlug()!;
  const pacienteId = Number(id);
  const navigate = useNavigate();
  const rol = authStorage.getUser(slug)?.rol;
  const puedeClinico = escribeClinico(rol);

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [historia, setHistoria] = useState<Historia | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('historia');

  const cargarHistoria = async (hId: number) => {
    const [ss, dx] = await Promise.all([
      terapApi.listSesiones(slug, hId),
      terapApi.listDiagnosticos(slug, hId),
    ]);
    setSesiones(ss); setDiagnosticos(dx);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [pac, cat] = await Promise.all([
        terapApi.getPaciente(slug, pacienteId),
        terapApi.catalogos(slug).catch(() => null),
      ]);
      setPaciente(pac); setCatalogos(cat);
      const h = await terapApi.getHistoria(slug, pacienteId).catch(() => null);
      setHistoria(h);
      if (h) await cargarHistoria(h.id);
      setLoading(false);
    })();

  }, [slug, pacienteId]);

  const abrirHistoria = async (motivo: string) => {
    const h = await terapApi.abrirHistoria(slug, pacienteId, { motivo_consulta: motivo });
    setHistoria(h);
    await cargarHistoria(h.id);
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 size={22} className="animate-spin" style={{ color: TEAL }} /></div>;
  if (!paciente) return <p className="text-[13.5px]" style={{ color: '#6B7280' }}>Paciente no encontrado.</p>;

  return (
    <div>
      <button onClick={() => navigate(terapPath(slug, '/panel'))} className="flex items-center gap-1.5 text-[13px] mb-4" style={{ color: TEAL }}>
        <ArrowLeft size={15} /> Volver a pacientes
      </button>

      {/* Ficha del paciente */}
      {(() => {
        const av = avatar(paciente.id);
        const e = edad(paciente.fecha_nacimiento);
        return (
          <div className="rounded-2xl bg-white p-5 mb-5" style={{ border: '1px solid #E5E9E7' }}>
            <div className="flex items-start gap-3.5">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-[18px] font-bold shrink-0" style={{ background: av.bg, color: av.fg }}>
                {iniciales(paciente.nombres, paciente.apellidos)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[20px] font-bold leading-tight" style={{ color: '#0E1A1A' }}>{paciente.apellidos}, {paciente.nombres}</h1>
                  {paciente.activo === 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#F1F5F4', color: '#94A3B8' }}>Inactivo</span>}
                </div>
                <p className="text-[12.5px] mt-1" style={{ color: '#6B7280' }}>
                  {DOC[paciente.tipo_doc] ?? 'Doc'} {paciente.num_doc || '—'}
                  {paciente.sexo_nombre ? ` · ${paciente.sexo_nombre}` : ''}
                  {e ? ` · ${e}` : ''}
                  {paciente.telefono ? ` · ${paciente.telefono}` : ''}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {historia?.numero
                    ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: '#DCFCE7', color: '#15803D' }}>
                        <FileText size={11} /> {historia.numero} · {historia.estado_nombre}
                      </span>
                    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: '#FEF3C7', color: '#B45309' }}>Sin historia clínica</span>}
                  {paciente.apoderado_nombre && (
                    <span className="inline-flex items-center gap-1 text-[11.5px]" style={{ color: '#6B7280' }}>
                      <Users size={12} /> Apod.: {paciente.apoderado_nombre}
                    </span>
                  )}
                </div>
              </div>
              {historia && (
                <button
                  onClick={() => imprimirHistoria({ slug, paciente, historia, diagnosticos, sesiones })}
                  className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-lg shrink-0 hover:bg-[#F0FAF8] transition"
                  style={{ border: `1px solid ${TEAL}`, color: TEAL }}
                  title="Exportar / imprimir la historia clínica en PDF">
                  <PrinterIcon size={14} /> Exportar PDF
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Barra de pestañas: divide el perfil en secciones para no ser un scroll infinito */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-0.5" style={{ borderBottom: '1px solid #E5E9E7' }}>
        {TABS.map(t => {
          const activo = tab === t.id;
          const count = t.id === 'sesiones' ? sesiones.length : t.id === 'historia' ? diagnosticos.length : undefined;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap -mb-px transition"
              style={activo
                ? { color: TEAL, borderBottom: `2px solid ${TEAL}` }
                : { color: '#6B7280', borderBottom: '2px solid transparent' }}>
              <t.icon size={15} /> {t.label}
              {count ? <span className="text-[10.5px] font-bold px-1.5 rounded-full" style={{ background: activo ? '#CCFBF1' : '#EEF2F1', color: activo ? TEAL : '#94A3B8' }}>{count}</span> : null}
            </button>
          );
        })}
      </div>

      {/* Contenido de la pestaña activa */}
      {tab === 'datos' && (
        <>
          <BloqueDatos paciente={paciente} />
          <BloqueTerapeutas slug={slug} pacienteId={pacienteId} puedeGestionar={gestiona(rol)} />
          {gestiona(rol) && <BloqueAcceso slug={slug} pacienteId={pacienteId} />}
        </>
      )}

      {tab === 'historia' && (
        !historia ? <SinHistoria puedeClinico={puedeClinico} onAbrir={abrirHistoria} /> : (
          <>
            <BloqueHistoria slug={slug} historia={historia} catalogos={catalogos} puedeClinico={puedeClinico} onSaved={setHistoria} />
            <BloqueDiagnosticos slug={slug} historia={historia} diagnosticos={diagnosticos} catalogos={catalogos} puedeClinico={puedeClinico}
              onAdd={d => setDiagnosticos(prev => [d, ...prev])} />
          </>
        )
      )}

      {tab === 'objetivos' && (
        !historia ? <AbreHistoriaPrimero /> : (
          <BloqueObjetivos slug={slug} historia={historia} puedeClinico={puedeClinico} />
        )
      )}

      {tab === 'tratamientos' && (
        !historia ? <AbreHistoriaPrimero /> : (
          <BloqueTratamientos slug={slug} historia={historia} puedeClinico={puedeClinico} />
        )
      )}

      {tab === 'sesiones' && (
        !historia ? <AbreHistoriaPrimero /> : (
          <BloqueEvoluciones slug={slug} historia={historia} sesiones={sesiones} puedeClinico={puedeClinico}
            onAdd={s => setSesiones(prev => [s, ...prev])} />
        )
      )}

      {tab === 'tareas' && (
        !historia ? <AbreHistoriaPrimero /> : (
          <BloqueTareas slug={slug} historia={historia} puedeClinico={puedeClinico} />
        )
      )}

      {tab === 'citas' && (
        <BloqueCitas slug={slug} pacienteId={pacienteId} />
      )}

      {tab === 'documentos' && (
        !historia ? <AbreHistoriaPrimero /> : (
          <BloqueAdjuntos slug={slug} historia={historia} puedeClinico={puedeClinico} />
        )
      )}
    </div>
  );
}

// ── Aviso: la sección requiere historia abierta ───────────────────────────────
function AbreHistoriaPrimero() {
  return (
    <div className="rounded-2xl bg-white p-6 text-center" style={{ border: '1px dashed #CBD5D1' }}>
      <FileText size={26} className="mx-auto mb-2" style={{ color: '#94A3B8' }} />
      <p className="text-[13.5px] font-semibold" style={{ color: '#0E1A1A' }}>Primero abre la historia clínica</p>
      <p className="text-[12.5px] mt-1" style={{ color: '#6B7280' }}>Ve a la pestaña «Historia» para abrirla.</p>
    </div>
  );
}

// ── Datos del paciente (filiación, contacto, apoderado) ───────────────────────
function BloqueDatos({ paciente }: { paciente: Paciente }) {
  return (
    <Section icon={User} titulo="Datos del paciente">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        <Dato label="Documento" valor={paciente.num_doc} />
        <Dato label="Sexo" valor={paciente.sexo_nombre} />
        <Dato label="Fecha de nacimiento" valor={paciente.fecha_nacimiento} />
        <Dato label="Teléfono" valor={paciente.telefono} />
        <Dato label="Email" valor={paciente.email} />
        <Dato label="Dirección" valor={paciente.direccion} />
      </div>
      {(paciente.apoderado_nombre || paciente.apoderado_telefono || paciente.apoderado_relacion) && (
        <>
          <div className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: TEAL }}>Apoderado / contacto de emergencia</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <Dato label="Nombre" valor={paciente.apoderado_nombre} />
            <Dato label="Teléfono" valor={paciente.apoderado_telefono} />
            <Dato label="Relación" valor={paciente.apoderado_relacion} />
          </div>
        </>
      )}
      {paciente.observaciones && (
        <div className="mt-4">
          <Dato label="Observaciones" valor={paciente.observaciones} />
        </div>
      )}
    </Section>
  );
}

function Dato({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#64748B' }}>{label}</div>
      <div className="text-[13.5px]" style={{ color: valor ? '#0E1A1A' : '#9CA3AF' }}>{valor || '—'}</div>
    </div>
  );
}

// ── Citas del paciente ────────────────────────────────────────────────────────
const COLOR_ESTADO_CITA: Record<number, string> = { 1: '#F59E0B', 2: '#0F766E', 3: '#9CA3AF', 4: '#DC2626' };
function BloqueCitas({ slug, pacienteId }: { slug: string; pacienteId: number }) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    terapApi.listCitas(slug, { paciente_id: pacienteId }).then(setCitas).catch(() => {}).finally(() => setLoading(false));
  }, [slug, pacienteId]);

  const ahora = Date.now();
  const proximas = citas.filter(c => new Date(c.inicio).getTime() >= ahora).sort((a, b) => +new Date(a.inicio) - +new Date(b.inicio));
  const pasadas = citas.filter(c => new Date(c.inicio).getTime() < ahora).sort((a, b) => +new Date(b.inicio) - +new Date(a.inicio));

  return (
    <Section icon={CalendarIcon} titulo="Citas del paciente">
      {loading ? (
        <div className="py-6 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: TEAL }} /></div>
      ) : citas.length === 0 ? (
        <Vacio icon={<CalendarIcon size={22} />} text="Sin citas registradas. Agéndalas desde la sección «Agenda»." />
      ) : (
        <div className="space-y-4">
          {proximas.length > 0 && <ListaCitas titulo="Próximas" citas={proximas} />}
          {pasadas.length > 0 && <ListaCitas titulo="Anteriores" citas={pasadas} />}
        </div>
      )}
    </Section>
  );
}

function ListaCitas({ titulo, citas }: { titulo: string; citas: Cita[] }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748B' }}>{titulo}</div>
      <ul className="space-y-1.5">
        {citas.map(c => (
          <li key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{ background: '#F6FAF9' }}>
            <div className="min-w-0">
              <span style={{ color: '#0E1A1A' }}>
                {new Date(c.inicio).toLocaleDateString()} · {new Date(c.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-[12px]" style={{ color: '#6B7280' }}>
                {c.servicio_nombre ? ` · ${c.servicio_nombre}` : ''} · {c.terapeuta_nombre}
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full shrink-0" style={{ background: `${COLOR_ESTADO_CITA[c.estado_id] ?? '#6B7280'}1A`, color: COLOR_ESTADO_CITA[c.estado_id] ?? '#374151' }}>
              {c.estado_nombre}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Adjuntos (informes, PDFs, exámenes) ───────────────────────────────────────
const MAX_MB = 10;
function BloqueAdjuntos({ slug, historia, puedeClinico }: { slug: string; historia: Historia; puedeClinico: boolean }) {
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    terapApi.listAdjuntos(slug, historia.id).then(setAdjuntos).catch(() => {});
  }, [slug, historia.id]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';                 // permite volver a elegir el mismo archivo
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) { setError(`El archivo supera los ${MAX_MB} MB.`); return; }
    setSubiendo(true); setError(null);
    try {
      const adj = await terapApi.uploadAdjunto(slug, historia.id, file);
      setAdjuntos(prev => [adj, ...prev]);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo subir el archivo');
    } finally { setSubiendo(false); }
  };

  const borrar = async (a: Adjunto) => {
    if (!confirm(`¿Eliminar «${a.nombre}»?`)) return;
    await terapApi.deleteAdjunto(slug, a.id);
    setAdjuntos(prev => prev.filter(x => x.id !== a.id));
  };

  return (
    <Section icon={FolderOpen} titulo="Documentos y adjuntos" accion={puedeClinico ? (
      <label className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: '#CCFBF1', color: TEAL }}>
        {subiendo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Subir archivo
        <input type="file" className="hidden" disabled={subiendo}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={onFile} />
      </label>
    ) : undefined}>
      {error && <p className="text-[12.5px] mb-2 px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>}
      {adjuntos.length === 0 ? (
        <Vacio icon={<FolderOpen size={22} />} text={`Sin documentos. Sube informes, exámenes o PDFs (máx. ${MAX_MB} MB).`} />
      ) : (
        <ul className="space-y-1.5">
          {adjuntos.map(a => (
            <li key={a.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{ background: '#F6FAF9' }}>
              <a href={imgUrl(a.ruta)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0" style={{ color: '#0E1A1A' }}>
                <Download size={14} style={{ color: TEAL, flexShrink: 0 }} />
                <span className="truncate">{a.nombre}</span>
              </a>
              <div className="flex items-center gap-3 shrink-0 pl-2">
                <span className="text-[11px]" style={{ color: '#94A3B8' }}>
                  {new Date(a.created_at).toLocaleDateString()}{a.subido_por ? ` · ${a.subido_por}` : ''}
                </span>
                {puedeClinico && (
                  <button onClick={() => borrar(a)} title="Eliminar"><Trash2 size={14} style={{ color: '#DC2626' }} /></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// ── Sin historia abierta ─────────────────────────────────────────────────────
function SinHistoria({ puedeClinico, onAbrir }: { puedeClinico: boolean; onAbrir: (m: string) => Promise<void> }) {
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div className="rounded-2xl bg-white p-6 text-center" style={{ border: '1px dashed #CBD5D1' }}>
      <FileText size={28} className="mx-auto mb-2" style={{ color: '#94A3B8' }} />
      <p className="text-[14px] font-semibold" style={{ color: '#0E1A1A' }}>Este paciente aún no tiene historia clínica</p>
      {puedeClinico ? (
        <div className="max-w-md mx-auto mt-4 text-left">
          <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>Motivo de consulta</label>
          <textarea rows={3} className="vx-input" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Motivo por el que acude…" />
          <button disabled={saving} onClick={async () => { setSaving(true); await onAbrir(motivo); }}
            className="mt-3 w-full py-2.5 rounded-xl text-white text-[13.5px] font-semibold flex items-center justify-center gap-2" style={{ background: TEAL }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <FileText size={15} />} Abrir historia clínica
          </button>
        </div>
      ) : (
        <p className="text-[12.5px] mt-2" style={{ color: '#6B7280' }}>Un terapeuta debe abrir la historia.</p>
      )}
    </div>
  );
}

// ── Historia: motivo + antecedentes ──────────────────────────────────────────
function BloqueHistoria({ slug, historia, catalogos, puedeClinico, onSaved }: {
  slug: string; historia: Historia; catalogos: Catalogos | null; puedeClinico: boolean;
  onSaved: (h: Historia) => void;
}) {
  const [motivo, setMotivo] = useState(historia.motivo_consulta ?? '');
  const [antecedentes, setAntecedentes] = useState(historia.antecedentes ?? '');
  const [estadoId, setEstadoId] = useState(historia.estado_id);
  const [saving, setSaving] = useState(false);
  const dirty = motivo !== (historia.motivo_consulta ?? '') || antecedentes !== (historia.antecedentes ?? '') || estadoId !== historia.estado_id;

  const guardar = async () => {
    setSaving(true);
    const h = await terapApi.updateHistoria(slug, historia.id, { motivo_consulta: motivo, antecedentes, estado_id: estadoId });
    onSaved(h); setSaving(false);
  };

  return (
    <Section icon={FileText} titulo="Historia clínica" accion={puedeClinico && dirty ? (
      <button onClick={guardar} disabled={saving} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: TEAL }}>
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Guardar
      </button>
    ) : undefined}>
      <Campo label="Motivo de consulta">
        <textarea rows={2} className="vx-input" readOnly={!puedeClinico} value={motivo} onChange={e => setMotivo(e.target.value)} />
      </Campo>
      <Campo label="Antecedentes / anamnesis">
        <textarea rows={4} className="vx-input" readOnly={!puedeClinico} value={antecedentes} onChange={e => setAntecedentes(e.target.value)} />
      </Campo>
      {catalogos && (
        <Campo label="Estado">
          <select className="vx-input max-w-[220px]" disabled={!puedeClinico} value={estadoId} onChange={e => setEstadoId(Number(e.target.value))}>
            {catalogos.estados_historia.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </Campo>
      )}
    </Section>
  );
}

// ── Diagnósticos ──────────────────────────────────────────────────────────────
function BloqueDiagnosticos({ slug, historia, diagnosticos, catalogos, puedeClinico, onAdd }: {
  slug: string; historia: Historia; diagnosticos: Diagnostico[]; catalogos: Catalogos | null; puedeClinico: boolean;
  onAdd: (d: Diagnostico) => void;
}) {
  const [abrir, setAbrir] = useState(false);
  const [desc, setDesc] = useState('');
  const [cie, setCie] = useState('');
  const [tipoId, setTipoId] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    // Obligatorio: la descripción. El CIE-10 y el tipo son opcionales.
    if (!desc.trim()) { setError('La descripción del diagnóstico es obligatoria.'); return; }
    setError(null);
    setSaving(true);
    const d = await terapApi.addDiagnostico(slug, historia.id, { descripcion: desc, codigo_cie10: cie || null, tipo_id: tipoId });
    onAdd(d); setDesc(''); setCie(''); setAbrir(false); setSaving(false);
  };

  return (
    <Section icon={ClipboardList} titulo="Diagnósticos" accion={puedeClinico ? (
      <button onClick={() => setAbrir(a => !a)} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: '#CCFBF1', color: TEAL }}>
        <Plus size={13} /> Agregar
      </button>
    ) : undefined}>
      {abrir && catalogos && (
        <form onSubmit={guardar} className="rounded-xl p-3 mb-3 space-y-2.5" style={{ background: '#F6FAF9', border: '1px solid #E5E9E7' }}>
          {error && (
            <p className="text-[12px] font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>{error}</p>
          )}
          <div className="grid grid-cols-3 gap-2">
            <input className="vx-input col-span-2" placeholder="Descripción del diagnóstico *" value={desc}
              onChange={e => { setDesc(e.target.value); if (error) setError(null); }}
              style={error && !desc.trim() ? { borderColor: '#DC2626' } : undefined} />
            <input className="vx-input" placeholder="CIE-10 (opcional)" value={cie} onChange={e => setCie(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <select className="vx-input max-w-[180px]" value={tipoId} onChange={e => setTipoId(Number(e.target.value))}>
              {catalogos.tipos_diagnostico.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg text-white text-[12.5px] font-semibold flex items-center gap-1.5" style={{ background: TEAL }}>
              {saving && <Loader2 size={13} className="animate-spin" />} Guardar
            </button>
          </div>
        </form>
      )}
      {diagnosticos.length === 0 ? (
        <Vacio icon={<ClipboardList size={22} />} text="Sin diagnósticos registrados." />
      ) : (
        <ul className="space-y-1.5">
          {diagnosticos.map(d => {
            const def = d.tipo_id === 2;
            return (
              <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-[13px]" style={{ background: '#F6FAF9', border: '1px solid #EEF2F1' }}>
                <span className="min-w-0" style={{ color: '#0E1A1A' }}>
                  {d.codigo_cie10 && <span className="font-mono font-bold mr-1.5 px-1.5 py-0.5 rounded text-[11.5px]" style={{ background: '#E2E8E6', color: '#475569' }}>{d.codigo_cie10}</span>}
                  {d.descripcion}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={def ? { background: '#EFF6FF', color: '#2563EB' } : { background: '#FEF3C7', color: '#B45309' }}>
                  {d.tipo_nombre}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// ── Tratamientos (etapas de atención; varios servicios a la vez) ──────────────
const ESTADOS_TRAT: { id: number; label: string; bg: string; color: string }[] = [
  { id: 1, label: 'En curso', bg: '#CCFBF1', color: '#0F766E' },
  { id: 2, label: 'En pausa', bg: '#FEF3C7', color: '#B45309' },
  { id: 3, label: 'Alta',     bg: '#DCFCE7', color: '#15803D' },
];
const estadoTrat = (id: number) => ESTADOS_TRAT.find(e => e.id === id) ?? ESTADOS_TRAT[0];
const fmtFecha = (d?: string | null) => d ? new Date(d).toLocaleDateString() : '—';

interface ServItem { servicio_id: number; servicio_nombre: string; terapeuta_id: number | null; terapeuta_nombre: string | null; }

/** Selector de servicios (varios) con su terapeuta. Reusado al crear y al editar un tratamiento. */
function ServiciosPicker({ slug, servicios, value, onChange }: {
  slug: string; servicios: Servicio[]; value: ServItem[]; onChange: (v: ServItem[]) => void;
}) {
  const [servSel, setServSel] = useState('');
  const [terSel, setTerSel] = useState('');
  const [teras, setTeras] = useState<Terapeuta[]>([]);
  useEffect(() => {
    setTerSel('');
    if (servSel) terapApi.listTerapeutas(slug, Number(servSel)).then(setTeras).catch(() => setTeras([]));
    else setTeras([]);
  }, [slug, servSel]);
  const agregar = () => {
    if (!servSel) return;
    const sid = Number(servSel);
    if (value.some(v => v.servicio_id === sid)) { setServSel(''); return; }  // ya está
    const sNom = servicios.find(s => s.id === sid)?.nombre ?? '';
    const tid = terSel ? Number(terSel) : null;
    const tNom = tid ? (teras.find(t => t.id === tid)?.nombre ?? null) : null;
    onChange([...value, { servicio_id: sid, servicio_nombre: sNom, terapeuta_id: tid, terapeuta_nombre: tNom }]);
    setServSel(''); setTerSel('');
  };
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(v => (
            <span key={v.servicio_id} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[12px]" style={{ background: '#CCFBF1', color: TEAL }}>
              <b>{v.servicio_nombre}</b>{v.terapeuta_nombre ? ` · ${v.terapeuta_nombre}` : ''}
              <button type="button" onClick={() => onChange(value.filter(x => x.servicio_id !== v.servicio_id))}><X size={12} /></button>
            </span>
          ))}
        </div>
      )}
      {servicios.length === 0 ? (
        <p className="text-[11.5px]" style={{ color: '#94A3B8' }}>Aún no hay servicios. Créalos en la sección «Servicios».</p>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <select className="vx-input max-w-[190px]" value={servSel} onChange={e => setServSel(e.target.value)}>
            <option value="">Servicio…</option>
            {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
          <select className="vx-input max-w-[190px]" value={terSel} onChange={e => setTerSel(e.target.value)} disabled={!servSel}>
            <option value="">{servSel ? 'Terapeuta (opcional)…' : 'Elige servicio'}</option>
            {teras.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <button type="button" onClick={agregar} disabled={!servSel} className="px-2.5 py-2 rounded-lg text-[12px] font-semibold disabled:opacity-40 flex items-center gap-1" style={{ background: '#CCFBF1', color: TEAL }}>
            <Plus size={13} /> Agregar
          </button>
        </div>
      )}
    </div>
  );
}

function BloqueTratamientos({ slug, historia, puedeClinico }: { slug: string; historia: Historia; puedeClinico: boolean }) {
  const [items, setItems] = useState<Tratamiento[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);

  useEffect(() => {
    setLoading(true);
    terapApi.listTratamientos(slug, historia.id).then(setItems).catch(() => {}).finally(() => setLoading(false));
    terapApi.listServicios(slug).then(setServicios).catch(() => {});
  }, [slug, historia.id]);

  const cambiarEstado = async (t: Tratamiento, estado_id: number) => {
    const upd = await terapApi.updateTratamiento(slug, t.id, { estado_id });
    setItems(prev => prev.map(x => x.id === t.id ? upd : x));
  };
  const guardarServicios = async (t: Tratamiento, servs: ServItem[]) => {
    const upd = await terapApi.updateTratamiento(slug, t.id, { servicios: servs.map(s => ({ servicio_id: s.servicio_id, terapeuta_id: s.terapeuta_id })) });
    setItems(prev => prev.map(x => x.id === t.id ? upd : x));
  };
  const borrar = async (t: Tratamiento) => {
    if (!confirm('¿Eliminar este tratamiento? Se borra su registro (las sesiones y tareas no se tocan).')) return;
    await terapApi.deleteTratamiento(slug, t.id);
    setItems(prev => prev.filter(x => x.id !== t.id));
  };

  return (
    <Section icon={ClipboardList} titulo="Tratamientos" accion={puedeClinico ? (
      <button onClick={() => setForm(f => !f)} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: TEAL }}>
        <Plus size={13} /> Nuevo tratamiento
      </button>
    ) : undefined}>
      {form && puedeClinico && (
        <FormTratamiento slug={slug} historiaId={historia.id} servicios={servicios}
          onCreated={t => { setItems(prev => [t, ...prev]); setForm(false); }}
          onCancel={() => setForm(false)} />
      )}
      {loading ? (
        <div className="py-6 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: TEAL }} /></div>
      ) : items.length === 0 ? (
        <Vacio icon={<ClipboardList size={22} />} text="Sin tratamientos. Abre uno cuando el paciente empiece sus terapias; puede incluir varios servicios a la vez." />
      ) : (
        <ul className="space-y-3">
          {items.map(t => <TratamientoCard key={t.id} slug={slug} t={t} servicios={servicios} puedeClinico={puedeClinico}
            onEstado={cambiarEstado} onServicios={guardarServicios} onBorrar={borrar} />)}
        </ul>
      )}
    </Section>
  );
}

function TratamientoCard({ slug, t, servicios, puedeClinico, onEstado, onServicios, onBorrar }: {
  slug: string; t: Tratamiento; servicios: Servicio[]; puedeClinico: boolean;
  onEstado: (t: Tratamiento, id: number) => void;
  onServicios: (t: Tratamiento, s: ServItem[]) => void;
  onBorrar: (t: Tratamiento) => void;
}) {
  const est = estadoTrat(t.estado_id);
  const [editServ, setEditServ] = useState(false);
  const aItems = (): ServItem[] => t.servicios.map(s => ({ servicio_id: s.servicio_id, servicio_nombre: s.servicio_nombre, terapeuta_id: s.terapeuta_id, terapeuta_nombre: s.terapeuta_nombre }));
  const [servs, setServs] = useState<ServItem[]>(aItems());

  return (
    <li className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E9E7' }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: est.bg, color: est.color }}>{t.estado_nombre ?? est.label}</span>
          <span className="text-[12px]" style={{ color: '#6B7280' }}>
            Inicio {fmtFecha(t.fecha_inicio)}{t.estado_id === 3 && t.fecha_fin ? ` · Alta ${fmtFecha(t.fecha_fin)}` : ''}
          </span>
        </div>
        {puedeClinico && (
          <div className="flex items-center gap-1.5">
            {ESTADOS_TRAT.map(e => (
              <button key={e.id} onClick={() => onEstado(t, e.id)} disabled={e.id === t.estado_id}
                className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                style={e.id === t.estado_id ? { background: e.bg, color: e.color } : { background: '#F1F5F4', color: '#64748B' }}>
                {e.label}
              </button>
            ))}
            <button onClick={() => onBorrar(t)} title="Eliminar" className="p-1"><Trash2 size={14} style={{ color: '#DC2626' }} /></button>
          </div>
        )}
      </div>
      {t.motivo && <p className="text-[13px] mt-2" style={{ color: '#0E1A1A' }}>{t.motivo}</p>}

      <div className="mt-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#94A3B8' }}>Servicios</p>
        {t.servicios.length === 0 ? (
          <p className="text-[12px]" style={{ color: '#94A3B8' }}>Sin servicios asignados.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {t.servicios.map(s => (
              <span key={s.servicio_id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px]" style={{ background: '#F0FDFA', color: TEAL, border: '1px solid #CCFBF1' }}>
                <b>{s.servicio_nombre}</b>{s.terapeuta_nombre ? ` · ${s.terapeuta_nombre}` : ''}
              </span>
            ))}
          </div>
        )}
        {puedeClinico && (
          editServ ? (
            <div className="mt-2 rounded-lg p-2.5" style={{ background: '#F6FAF9', border: '1px solid #E5E9E7' }}>
              <ServiciosPicker slug={slug} servicios={servicios} value={servs} onChange={setServs} />
              <div className="flex gap-2 mt-2">
                <button onClick={() => { onServicios(t, servs); setEditServ(false); }} className="px-3 py-1.5 rounded-lg text-white text-[12px] font-semibold" style={{ background: TEAL }}>Guardar servicios</button>
                <button onClick={() => { setServs(aItems()); setEditServ(false); }} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setServs(aItems()); setEditServ(true); }} className="text-[11.5px] font-semibold mt-1.5" style={{ color: TEAL }}>Editar servicios</button>
          )
        )}
      </div>
      {t.nota_cierre && <p className="text-[12px] mt-2 italic" style={{ color: '#6B7280' }}>Nota: {t.nota_cierre}</p>}
    </li>
  );
}

function FormTratamiento({ slug, historiaId, servicios, onCreated, onCancel }: {
  slug: string; historiaId: number; servicios: Servicio[]; onCreated: (t: Tratamiento) => void; onCancel: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [servs, setServs] = useState<ServItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // Obligatorio: al menos un servicio (el tratamiento se define por sus servicios). El motivo es opcional.
    if (servs.length === 0) { setError('Agrega al menos un servicio al tratamiento.'); return; }
    setError(null); setSaving(true);
    try {
      const t = await terapApi.createTratamiento(slug, historiaId, {
        motivo: motivo || null,
        servicios: servs.map(s => ({ servicio_id: s.servicio_id, terapeuta_id: s.terapeuta_id })),
      });
      onCreated(t);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="rounded-xl p-3.5 mb-3 space-y-2.5" style={{ background: '#F6FAF9', border: '1px solid #E5E9E7' }}>
      {error && <p className="text-[12px] font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>{error}</p>}
      <input className="vx-input" placeholder="Motivo del tratamiento (opcional)" value={motivo} onChange={e => setMotivo(e.target.value)} autoFocus />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>
          Servicios <span style={{ color: '#DC2626' }}>*</span> <span className="normal-case font-normal" style={{ color: '#94A3B8' }}>(puedes agregar varios)</span>
        </p>
        <ServiciosPicker slug={slug} servicios={servicios} value={servs} onChange={v => { setServs(v); if (error) setError(null); }} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
        <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg text-white text-[12.5px] font-semibold flex items-center gap-1.5" style={{ background: TEAL }}>
          {saving && <Loader2 size={13} className="animate-spin" />} Abrir tratamiento
        </button>
      </div>
    </form>
  );
}

// ── Evoluciones (SOAP) ────────────────────────────────────────────────────────
function BloqueEvoluciones({ slug, historia, sesiones, puedeClinico, onAdd }: {
  slug: string; historia: Historia; sesiones: Sesion[]; puedeClinico: boolean;
  onAdd: (s: Sesion) => void;
}) {
  const [abrir, setAbrir] = useState(false);
  const [f, setF] = useState({ subjetivo: '', objetivo: '', analisis: '', plan: '' });
  const [firmada, setFirmada] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => { setF(prev => ({ ...prev, [k]: v })); if (error) setError(null); };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    // Debe llevar al menos uno de los campos SOAP; no se guarda una evolución vacía.
    if (!f.subjetivo.trim() && !f.objetivo.trim() && !f.analisis.trim() && !f.plan.trim()) {
      setError('Escribe al menos un campo (S / O / A / P) para guardar la evolución.'); return;
    }
    setError(null);
    setSaving(true);
    const s = await terapApi.createSesion(slug, historia.id, { ...f, firmada });
    onAdd(s);
    setF({ subjetivo: '', objetivo: '', analisis: '', plan: '' }); setFirmada(false); setAbrir(false); setSaving(false);
  };

  return (
    <Section icon={Activity} titulo="Evoluciones" accion={puedeClinico ? (
      <button onClick={() => setAbrir(a => !a)} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: TEAL }}>
        <Plus size={13} /> Nueva evolución
      </button>
    ) : undefined}>
      {abrir && (
        <form onSubmit={guardar} className="rounded-xl p-3.5 mb-4 space-y-2.5" style={{ background: '#F6FAF9', border: '1px solid #E5E9E7' }}>
          {error && (
            <p className="text-[12px] font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>{error}</p>
          )}
          <SoapField label="S · Subjetivo" value={f.subjetivo} onChange={v => set('subjetivo', v)} placeholder="Lo que refiere el paciente…" />
          <SoapField label="O · Objetivo" value={f.objetivo} onChange={v => set('objetivo', v)} placeholder="Observación del terapeuta…" />
          <SoapField label="A · Análisis" value={f.analisis} onChange={v => set('analisis', v)} placeholder="Interpretación / avance…" />
          <SoapField label="P · Plan" value={f.plan} onChange={v => set('plan', v)} placeholder="Plan / tareas para la próxima sesión…" />
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-[12.5px]" style={{ color: '#475569' }}>
              <input type="checkbox" checked={firmada} onChange={e => setFirmada(e.target.checked)} />
              Firmar (no podrá editarse)
            </label>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-white text-[12.5px] font-semibold flex items-center gap-1.5" style={{ background: TEAL }}>
              {saving && <Loader2 size={13} className="animate-spin" />} Guardar evolución
            </button>
          </div>
        </form>
      )}

      {sesiones.length === 0 ? (
        <Vacio icon={<Activity size={22} />} text="Aún no hay evoluciones registradas." />
      ) : (
        <ol className="space-y-3">
          {sesiones.map(s => (
            <li key={s.id} className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E9E7' }}>
              <div className="flex items-center justify-between mb-2.5 pb-2.5" style={{ borderBottom: '1px solid #F1F5F4' }}>
                <span className="inline-flex items-center gap-2 text-[13px] font-bold" style={{ color: '#0E1A1A' }}>
                  <span className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-lg text-[11.5px]" style={{ background: '#CCFBF1', color: TEAL }}>
                    #{s.numero_sesion ?? '—'}
                  </span>
                  {new Date(s.fecha).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: '#6B7280' }}>{s.terapeuta_nombre}</span>
                  {s.firmada
                    ? <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#15803D' }}>✔ Firmada</span>
                    : <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#B45309' }}>Borrador</span>}
                </div>
              </div>
              <div className="space-y-1.5">
                <SoapLine tag="S" color="#0F766E" text={s.subjetivo} />
                <SoapLine tag="O" color="#2563EB" text={s.objetivo} />
                <SoapLine tag="A" color="#7C3AED" text={s.analisis} />
                <SoapLine tag="P" color="#B45309" text={s.plan} />
                {s.evolucion && <p className="text-[12.5px]" style={{ color: '#374151' }}>{s.evolucion}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

// ── Asignación por servicio → terapeuta (ADMIN + ADMISION) ────────────────────
function BloqueTerapeutas({ slug, pacienteId, puedeGestionar }: { slug: string; pacienteId: number; puedeGestionar: boolean }) {
  const [asignados, setAsignados] = useState<Asignacion[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [servSel, setServSel] = useState('');
  const [terSel, setTerSel] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    terapApi.listAsignaciones(slug, pacienteId).then(setAsignados).catch(() => {});
    if (puedeGestionar) terapApi.listServicios(slug).then(setServicios).catch(() => {});

  }, [slug, pacienteId, puedeGestionar]);

  // Al elegir servicio, traer los terapeutas que lo brindan.
  useEffect(() => {
    setTerSel('');
    if (servSel) terapApi.listTerapeutas(slug, Number(servSel)).then(setTerapeutas).catch(() => setTerapeutas([]));
    else setTerapeutas([]);
  }, [slug, servSel]);

  const asignar = async () => {
    if (!servSel || !terSel) return;
    setBusy(true);
    const list = await terapApi.asignarTerapeuta(slug, pacienteId, Number(terSel), Number(servSel));
    setAsignados(list); setServSel(''); setTerSel(''); setBusy(false);
  };
  const quitar = async (a: Asignacion) => {
    await terapApi.quitarAsignacion(slug, a.id);
    setAsignados(prev => prev.filter(x => x.id !== a.id));
  };

  return (
    <Section icon={Users} titulo="Servicios y terapeutas a cargo">
      {asignados.length === 0
        ? <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Sin asignaciones.</p>
        : (
          <div className="flex flex-wrap gap-2">
            {asignados.map(a => (
              <span key={a.id} className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-[12.5px]" style={{ background: '#CCFBF1', color: TEAL }}>
                {a.servicio_nombre && <b className="font-semibold">{a.servicio_nombre}:</b>} {a.terapeuta_nombre}
                {puedeGestionar && <button onClick={() => quitar(a)}><X size={12} /></button>}
              </span>
            ))}
          </div>
        )}
      {puedeGestionar && (
        servicios.length === 0
          ? <p className="text-[12px] mt-3" style={{ color: '#94A3B8' }}>Aún no hay servicios. Créalos en la sección «Servicios».</p>
          : (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <select className="vx-input max-w-[220px]" value={servSel} onChange={e => setServSel(e.target.value)}>
                <option value="">1) Servicio…</option>
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <select className="vx-input max-w-[220px]" value={terSel} onChange={e => setTerSel(e.target.value)} disabled={!servSel}>
                <option value="">{servSel ? '2) Terapeuta…' : '2) Elige servicio primero'}</option>
                {terapeutas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
              <button onClick={asignar} disabled={!servSel || !terSel || busy} className="px-3 py-2 rounded-lg text-white text-[12.5px] font-semibold flex items-center gap-1.5 disabled:opacity-50" style={{ background: TEAL }}>
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Asignar
              </button>
              {servSel && terapeutas.length === 0 && (
                <span className="text-[12px]" style={{ color: '#DC2626' }}>Ningún terapeuta brinda este servicio aún.</span>
              )}
            </div>
          )
      )}
    </Section>
  );
}

// ── Acceso del apoderado al portal (enlace mágico) ────────────────────────────
function BloqueAcceso({ slug, pacienteId }: { slug: string; pacienteId: number }) {
  const [acceso, setAcceso] = useState<AccesoApoderado | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    terapApi.getAcceso(slug, pacienteId).then(a => setAcceso(a ?? null)).catch(() => {}).finally(() => setLoading(false));
  }, [slug, pacienteId]);

  const url = acceso ? `${window.location.origin}${terapPath(slug, `/portal/${acceso.token}`)}` : '';
  const generar = async () => { setBusy(true); try { setAcceso(await terapApi.crearAcceso(slug, pacienteId)); } finally { setBusy(false); } };
  const regenerar = async () => {
    if (!confirm('Se generará un enlace nuevo y el anterior dejará de funcionar. ¿Continuar?')) return;
    setBusy(true); try { setAcceso(await terapApi.regenerarAcceso(slug, pacienteId)); } finally { setBusy(false); }
  };
  const revocar = async () => {
    if (!confirm('El apoderado ya no podrá ver el portal. ¿Desactivar el enlace?')) return;
    setBusy(true); try { await terapApi.revocarAcceso(slug, pacienteId); setAcceso(null); } finally { setBusy(false); }
  };
  const copiar = async () => { try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* noop */ } };
  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent('Sigue el progreso del tratamiento: ' + url)}`, '_blank');

  return (
    <Section icon={Users} titulo="Acceso para el apoderado (portal)">
      {loading ? (
        <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin" style={{ color: TEAL }} /></div>
      ) : !acceso ? (
        <div>
          <p className="text-[12.5px] mb-3" style={{ color: '#6B7280' }}>
            Genera un enlace para que la familia siga el <b>progreso</b> y las <b>próximas citas</b> del paciente (solo lectura, sin contraseña). Lo compartes por WhatsApp.
          </p>
          <button onClick={generar} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] font-semibold" style={{ background: TEAL }}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />} Generar enlace del portal
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <input readOnly value={url} onFocus={e => e.currentTarget.select()} className="vx-input flex-1 text-[12px]" style={{ background: '#F6FAF9' }} />
            <button onClick={copiar} className="px-3 py-2 rounded-lg text-[12.5px] font-semibold shrink-0" style={{ background: copiado ? '#DCFCE7' : '#CCFBF1', color: copiado ? '#15803D' : TEAL }}>
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={whatsapp} className="px-3 py-2 rounded-lg text-white text-[12.5px] font-semibold" style={{ background: '#25D366' }}>Compartir por WhatsApp</button>
            <button onClick={regenerar} disabled={busy} className="px-3 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>Regenerar</button>
            <button onClick={revocar} disabled={busy} className="px-3 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: '#FEF2F2', color: '#B91C1C' }}>Desactivar</button>
          </div>
          <p className="text-[11px]" style={{ color: '#94A3B8' }}>Cualquiera con el enlace puede ver el progreso (sin datos sensibles). Si se filtra, usa «Regenerar».</p>
        </div>
      )}
    </Section>
  );
}

// ── Objetivos terapéuticos + progreso (⭐ diferenciador) ───────────────────────
const EST_OBJ: Record<string, { bg: string; fg: string }> = {
  LOGRADO:  { bg: '#DCFCE7', fg: '#15803D' },
  EN_CURSO: { bg: '#CCFBF1', fg: '#0F766E' },
  PAUSADO:  { bg: '#F1F5F4', fg: '#94A3B8' },
};

function BloqueObjetivos({ slug, historia, puedeClinico }: { slug: string; historia: Historia; puedeClinico: boolean }) {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [avances, setAvances] = useState<Record<number, ObjetivoAvance[]>>({});
  const [expandido, setExpandido] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);

  useEffect(() => {
    setLoading(true);
    terapApi.listObjetivos(slug, historia.id).then(setObjetivos).catch(() => {}).finally(() => setLoading(false));
  }, [slug, historia.id]);

  const toggle = async (o: Objetivo) => {
    if (expandido === o.id) { setExpandido(null); return; }
    setExpandido(o.id);
    if (!avances[o.id]) {
      const a = await terapApi.listAvance(slug, o.id).catch(() => []);
      setAvances(prev => ({ ...prev, [o.id]: a }));
    }
  };

  const onAvance = (objetivo: Objetivo, lista: ObjetivoAvance[]) => {
    setObjetivos(prev => prev.map(x => x.id === objetivo.id ? objetivo : x));
    setAvances(prev => ({ ...prev, [objetivo.id]: lista }));
  };

  return (
    <Section icon={TrendingUp} titulo="Objetivos y progreso" accion={puedeClinico ? (
      <button onClick={() => setForm(f => !f)} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: TEAL }}>
        <Plus size={13} /> Nuevo objetivo
      </button>
    ) : undefined}>
      {form && puedeClinico && (
        <FormObjetivo slug={slug} historiaId={historia.id}
          onCreated={o => { setObjetivos(prev => [o, ...prev]); setForm(false); }}
          onCancel={() => setForm(false)} />
      )}
      {loading ? (
        <div className="py-6 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: TEAL }} /></div>
      ) : objetivos.length === 0 ? (
        <Vacio icon={<TrendingUp size={22} />} text="Sin objetivos. Define metas medibles (ej. «producir /r/ en palabras: 80 %») y registra el avance en cada sesión para ver la curva de progreso." />
      ) : (
        <div className="space-y-3">
          {objetivos.map(o => (
            <ObjetivoCard key={o.id} slug={slug} o={o} puedeClinico={puedeClinico}
              expandido={expandido === o.id} avances={avances[o.id]}
              onToggle={() => toggle(o)} onAvance={onAvance} />
          ))}
        </div>
      )}
    </Section>
  );
}

function ObjetivoCard({ slug, o, puedeClinico, expandido, avances, onToggle, onAvance }: {
  slug: string; o: Objetivo; puedeClinico: boolean; expandido: boolean;
  avances?: ObjetivoAvance[]; onToggle: () => void; onAvance: (o: Objetivo, l: ObjetivoAvance[]) => void;
}) {
  const meta = Number(o.meta) || 0;
  const actual = o.ultimo_valor != null ? Number(o.ultimo_valor) : null;
  const pct = actual != null && meta > 0 ? Math.min(100, Math.round((actual / meta) * 100)) : 0;
  const est = EST_OBJ[o.estado_codigo ?? 'EN_CURSO'] ?? EST_OBJ.EN_CURSO;

  return (
    <div className="rounded-xl" style={{ border: '1px solid #E5E9E7' }}>
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-[13.5px] font-semibold" style={{ color: '#0E1A1A' }}>{o.descripcion}</p>
          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: est.bg, color: est.fg }}>
            {o.estado_nombre ?? 'En curso'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: '#EEF2F1' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#0F766E,#10B981)' }} />
          </div>
          <span className="text-[12px] font-semibold shrink-0" style={{ color: '#0E1A1A' }}>
            {actual != null ? `${actual}` : '—'}<span style={{ color: '#94A3B8' }}> / {meta} {o.unidad}</span>
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px]" style={{ color: '#94A3B8' }}>{o.avances} {o.avances === 1 ? 'medición' : 'mediciones'}</span>
          <button onClick={onToggle} className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: TEAL }}>
            {expandido ? 'Ocultar progreso' : 'Ver progreso'}
            <ChevronDown size={14} style={{ transform: expandido ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
          </button>
        </div>
      </div>
      {expandido && (
        <div className="px-3.5 pb-3.5 pt-1" style={{ borderTop: '1px solid #F1F5F4' }}>
          {avances === undefined
            ? <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin" style={{ color: TEAL }} /></div>
            : <ProgresoChart puntos={avances} meta={meta} unidad={o.unidad} />}
          {puedeClinico && (
            <FormAvance slug={slug} objetivoId={o.id} unidad={o.unidad}
              onAdded={(obj, lista) => onAvance(obj, lista)} />
          )}
        </div>
      )}
    </div>
  );
}

/** Gráfica de línea REAL construida con las mediciones del objetivo. */
function ProgresoChart({ puntos, meta, unidad }: { puntos: ObjetivoAvance[]; meta: number; unidad: string }) {
  if (!puntos.length) {
    return <p className="text-[12px] py-3 text-center" style={{ color: '#94A3B8' }}>Aún sin mediciones. Registra el primer avance para ver la curva.</p>;
  }
  const W = 340, H = 160, padL = 30, padR = 10, padT = 12, padB = 24;
  const vals = puntos.map(p => Number(p.valor));
  const maxY = Math.max(meta, ...vals) * 1.05 || 1;
  const x = (i: number) => puntos.length === 1 ? (padL + (W - padR)) / 2 : padL + (i / (puntos.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / maxY) * (H - padT - padB);
  const linea = puntos.map((p, i) => `${x(i)},${y(Number(p.valor))}`).join(' ');
  const metaY = y(meta);
  const fmt = (f: string) => new Date(f).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });

  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ maxWidth: 460 }}>
        {/* ejes */}
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#E5E9E7" />
        <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="#E5E9E7" />
        {/* referencias Y */}
        {[0, 0.5, 1].map(t => (
          <text key={t} x={padL - 5} y={y(maxY * t) + 3} fontSize="8" fill="#94A3B8" textAnchor="end">{Math.round(maxY * t)}</text>
        ))}
        {/* línea meta */}
        {meta <= maxY && (
          <>
            <line x1={padL} y1={metaY} x2={W - padR} y2={metaY} stroke="#10B981" strokeDasharray="5 4" opacity="0.7" />
            <text x={W - padR} y={metaY - 4} fontSize="8" fill="#059669" textAnchor="end">meta {meta}{unidad}</text>
          </>
        )}
        {/* curva */}
        <polyline fill="none" stroke="#0F766E" strokeWidth="2.5" strokeLinejoin="round" points={linea} />
        {puntos.map((p, i) => (
          <circle key={p.id} cx={x(i)} cy={y(Number(p.valor))} r={i === puntos.length - 1 ? 4 : 3}
            fill="#0F766E" stroke="#fff" strokeWidth={i === puntos.length - 1 ? 2 : 0} />
        ))}
        {/* fechas primera y última */}
        <text x={x(0)} y={H - 8} fontSize="8" fill="#94A3B8" textAnchor="middle">{fmt(puntos[0].fecha)}</text>
        {puntos.length > 1 && <text x={x(puntos.length - 1)} y={H - 8} fontSize="8" fill="#94A3B8" textAnchor="middle">{fmt(puntos[puntos.length - 1].fecha)}</text>}
      </svg>
    </div>
  );
}

function FormObjetivo({ slug, historiaId, onCreated, onCancel }: {
  slug: string; historiaId: number; onCreated: (o: Objetivo) => void; onCancel: () => void;
}) {
  const [desc, setDesc] = useState('');
  const [meta, setMeta] = useState('80');
  const [unidad, setUnidad] = useState('%');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // Obligatorio: la descripción del objetivo. La meta/unidad tienen valor por defecto.
    if (!desc.trim()) { setError('La descripción del objetivo es obligatoria.'); return; }
    setError(null);
    setSaving(true);
    const o = await terapApi.createObjetivo(slug, historiaId, { descripcion: desc, meta: Number(meta) || 100, unidad });
    onCreated(o); setSaving(false);
  };

  return (
    <form onSubmit={submit} className="rounded-xl p-3.5 mb-3 space-y-2.5" style={{ background: '#F6FAF9', border: '1px solid #E5E9E7' }}>
      {error && (
        <p className="text-[12px] font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>{error}</p>
      )}
      <input className="vx-input" placeholder="Objetivo (ej. Producir /r/ en palabras) *" value={desc}
        onChange={e => { setDesc(e.target.value); if (error) setError(null); }} autoFocus
        style={error && !desc.trim() ? { borderColor: '#DC2626' } : undefined} />
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-[12px]" style={{ color: '#64748B' }}>Meta</label>
        <input className="vx-input max-w-[90px]" type="number" value={meta} onChange={e => setMeta(e.target.value)} />
        <input className="vx-input max-w-[110px]" list="unidades-obj" value={unidad} onChange={e => setUnidad(e.target.value)} placeholder="unidad" />
        <datalist id="unidades-obj"><option value="%" /><option value="min" /><option value="palabras" /><option value="puntos" /></datalist>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
          <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg text-white text-[12.5px] font-semibold flex items-center gap-1.5" style={{ background: TEAL }}>
            {saving && <Loader2 size={13} className="animate-spin" />} Crear objetivo
          </button>
        </div>
      </div>
    </form>
  );
}

function FormAvance({ slug, objetivoId, unidad, onAdded }: {
  slug: string; objetivoId: number; unidad: string; onAdded: (o: Objetivo, l: ObjetivoAvance[]) => void;
}) {
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // Obligatorio: el valor medido (numérico). La fecha es opcional (default hoy).
    if (valor.trim() === '' || isNaN(Number(valor))) { setError('Escribe el valor medido (un número) para registrar el avance.'); return; }
    setError(null);
    setSaving(true);
    const r = await terapApi.addAvance(slug, objetivoId, { valor: Number(valor), fecha: fecha || undefined });
    onAdded(r.objetivo, r.avance);
    setValor(''); setFecha(''); setSaving(false);
  };

  return (
    <form onSubmit={submit} className="flex items-end gap-2 mt-3 pt-3 flex-wrap" style={{ borderTop: '1px solid #F1F5F4' }}>
      {error && (
        <p className="w-full text-[12px] font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>{error}</p>
      )}
      <label className="block">
        <span className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>Valor medido ({unidad}) <span style={{ color: '#DC2626' }}>*</span></span>
        <input className="vx-input max-w-[120px]" type="number" step="0.01" value={valor}
          onChange={e => { setValor(e.target.value); if (error) setError(null); }} placeholder="ej. 70"
          style={error ? { borderColor: '#DC2626' } : undefined} />
      </label>
      <label className="block">
        <span className="block text-[10.5px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>Fecha</span>
        <input className="vx-input max-w-[150px]" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      </label>
      <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg text-white text-[12.5px] font-semibold flex items-center gap-1.5 disabled:opacity-50" style={{ background: TEAL }}>
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Registrar avance
      </button>
    </form>
  );
}

// ── Tareas para casa (se sincroniza con el portal del apoderado) ──────────────
const esAudio = (mime?: string | null) => (mime ?? '').startsWith('audio');
const esImagen = (mime?: string | null) => (mime ?? '').startsWith('image');

function BloqueTareas({ slug, historia, puedeClinico }: { slug: string; historia: Historia; puedeClinico: boolean }) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);
  const [subiendoId, setSubiendoId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    terapApi.listTareas(slug, historia.id).then(setTareas).catch(() => {}).finally(() => setLoading(false));
  }, [slug, historia.id]);

  const toggle = async (t: Tarea) => {
    const upd = await terapApi.updateTarea(slug, t.id, { cumplida: !t.cumplida });
    setTareas(prev => prev.map(x => x.id === t.id ? upd : x));
  };
  const borrar = async (t: Tarea) => {
    if (!confirm(`¿Eliminar la tarea «${t.descripcion}»?`)) return;
    await terapApi.deleteTarea(slug, t.id);
    setTareas(prev => prev.filter(x => x.id !== t.id));
  };
  const subirAudio = async (t: Tarea, file?: File) => {
    if (!file) return;
    setSubiendoId(t.id);
    try {
      const upd = await terapApi.uploadTareaAudio(slug, t.id, file);
      setTareas(prev => prev.map(x => x.id === t.id ? upd : x));
    } catch (e: any) { alert(e?.message ?? 'No se pudo subir el archivo'); }
    finally { setSubiendoId(null); }
  };
  const quitarAudio = async (t: Tarea) => {
    const upd = await terapApi.deleteTareaAudio(slug, t.id);
    setTareas(prev => prev.map(x => x.id === t.id ? upd : x));
  };
  // Enlace de YouTube de la tarea (se guarda solo la URL; el video lo sirve YouTube).
  const guardarVideoUrl = async (t: Tarea) => {
    const url = window.prompt('Pega el enlace de YouTube del video:', t.video_url ?? '');
    if (url === null) return;                         // canceló
    const limpio = url.trim();
    if (limpio && !youtubeEmbedUrl(limpio)) { alert('Ese enlace no parece de YouTube. Copia el link del video (youtube.com/watch?v=… o youtu.be/…).'); return; }
    const upd = await terapApi.updateTarea(slug, t.id, { video_url: limpio || null });
    setTareas(prev => prev.map(x => x.id === t.id ? upd : x));
  };
  const quitarVideoUrl = async (t: Tarea) => {
    const upd = await terapApi.updateTarea(slug, t.id, { video_url: null });
    setTareas(prev => prev.map(x => x.id === t.id ? upd : x));
  };

  const pend = tareas.filter(t => !t.cumplida).length;

  return (
    <Section icon={Home} titulo="Tareas para casa" accion={puedeClinico ? (
      <button onClick={() => setForm(f => !f)} className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: TEAL }}>
        <Plus size={13} /> Nueva tarea
      </button>
    ) : undefined}>
      {form && puedeClinico && (
        <FormTarea slug={slug} historiaId={historia.id}
          onCreated={t => { setTareas(prev => [t, ...prev]); setForm(false); }}
          onCancel={() => setForm(false)} />
      )}
      {loading ? (
        <div className="py-6 flex justify-center"><Loader2 size={18} className="animate-spin" style={{ color: TEAL }} /></div>
      ) : tareas.length === 0 ? (
        <Vacio icon={<Home size={22} />} text="Sin tareas. Asigna ejercicios para casa; el apoderado las verá y las marcará como cumplidas desde su portal." />
      ) : (
        <>
          <p className="text-[11.5px] mb-2" style={{ color: '#94A3B8' }}>{pend} pendiente{pend === 1 ? '' : 's'} de {tareas.length}</p>
          <ul className="space-y-1.5">
            {tareas.map(t => {
              const hecha = !!t.cumplida;
              return (
                <li key={t.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#F6FAF9', border: '1px solid #EEF2F1' }}>
                  <button onClick={() => puedeClinico && toggle(t)} disabled={!puedeClinico} title={puedeClinico ? 'Marcar/desmarcar' : undefined} className="mt-0.5 shrink-0">
                    {hecha
                      ? <CheckCircle size={18} style={{ color: '#15803D' }} />
                      : <span className="inline-block h-[18px] w-[18px] rounded-full" style={{ border: '2px solid #CBD5D1' }} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold" style={{ color: hecha ? '#94A3B8' : '#0E1A1A', textDecoration: hecha ? 'line-through' : 'none' }}>{t.descripcion}</p>
                    {t.detalle && <p className="text-[12px]" style={{ color: '#6B7280' }}>{t.detalle}</p>}
                    <p className="text-[11px] mt-0.5" style={{ color: '#94A3B8' }}>
                      {t.fecha_limite ? `Para el ${new Date(t.fecha_limite).toLocaleDateString()}` : 'Sin fecha límite'}
                      {hecha && t.cumplida_at ? ` · ✔ cumplida el ${new Date(t.cumplida_at).toLocaleDateString()}` : ''}
                    </p>
                    {/* Audio / imagen / video propio de apoyo */}
                    <div className="mt-2">
                      {t.adjunto_ruta ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          {esAudio(t.adjunto_mime)
                            ? <audio controls src={imgUrl(t.adjunto_ruta)} style={{ height: 34, maxWidth: 260 }} />
                            : esVideoMime(t.adjunto_mime)
                              ? <video controls playsInline src={imgUrl(t.adjunto_ruta)} className="rounded-lg" style={{ maxWidth: 320, maxHeight: 200, border: '1px solid #E5E9E7', background: '#000' }} />
                              : esImagen(t.adjunto_mime)
                                ? <a href={imgUrl(t.adjunto_ruta)} target="_blank" rel="noopener noreferrer"><img src={imgUrl(t.adjunto_ruta)} alt="" className="h-14 rounded-lg" style={{ border: '1px solid #E5E9E7' }} /></a>
                                : <a href={imgUrl(t.adjunto_ruta)} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold" style={{ color: TEAL }}>📎 {t.adjunto_nombre}</a>}
                          {puedeClinico && <button onClick={() => quitarAudio(t)} className="text-[11px]" style={{ color: '#DC2626' }}>Quitar</button>}
                        </div>
                      ) : puedeClinico ? (
                        <label className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer" style={{ background: '#CCFBF1', color: TEAL }}>
                          {subiendoId === t.id ? <Loader2 size={12} className="animate-spin" /> : '🔊'} Adjuntar audio/video
                          <input type="file" className="hidden" accept="audio/*,image/*,video/*" disabled={subiendoId === t.id}
                            onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; subirAudio(t, f); }} />
                        </label>
                      ) : null}
                    </div>

                    {/* Video de YouTube (enlace): se ve embebido, con pantalla completa */}
                    <div className="mt-2">
                      {youtubeEmbedUrl(t.video_url) ? (
                        <div className="flex flex-col gap-1">
                          <div className="rounded-lg overflow-hidden" style={{ width: '100%', maxWidth: 360, aspectRatio: '16 / 9', border: '1px solid #E5E9E7', background: '#000' }}>
                            <iframe src={youtubeEmbedUrl(t.video_url)!} title="Video de YouTube" style={{ width: '100%', height: '100%', border: 0 }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
                          </div>
                          {puedeClinico && (
                            <div className="flex gap-3">
                              <button onClick={() => guardarVideoUrl(t)} className="text-[11px] font-semibold" style={{ color: TEAL }}>Cambiar enlace</button>
                              <button onClick={() => quitarVideoUrl(t)} className="text-[11px]" style={{ color: '#DC2626' }}>Quitar video</button>
                            </div>
                          )}
                        </div>
                      ) : puedeClinico ? (
                        <button onClick={() => guardarVideoUrl(t)} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                          ▶ Agregar video de YouTube
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {puedeClinico && <button onClick={() => borrar(t)} title="Eliminar" className="shrink-0"><Trash2 size={14} style={{ color: '#DC2626' }} /></button>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Section>
  );
}

function FormTarea({ slug, historiaId, onCreated, onCancel }: {
  slug: string; historiaId: number; onCreated: (t: Tarea) => void; onCancel: () => void;
}) {
  const [descripcion, setDescripcion] = useState('');
  const [detalle, setDetalle] = useState('');
  const [fecha, setFecha] = useState('');
  const [audio, setAudio] = useState<File | null>(null);   // audio/imagen/video propio (opcional)
  const [videoUrl, setVideoUrl] = useState('');            // enlace de YouTube (opcional)
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // Solo el NOMBRE de la tarea es obligatorio; detalle, fecha, adjunto y video son opcionales.
    if (!descripcion.trim()) { setError('El nombre de la tarea es obligatorio.'); return; }
    const yt = videoUrl.trim();
    if (yt && !youtubeEmbedUrl(yt)) { setError('El enlace de YouTube no es válido. Copia el link del video (youtube.com/watch?v=… o youtu.be/…) o déjalo vacío.'); return; }
    setError(null);
    setSaving(true);
    try {
      // 1) Crea la tarea (con enlace de YouTube si lo pusieron). 2) Si adjuntaron
      //    audio/imagen/video propio, lo sube a esa tarea recién creada.
      let t = await terapApi.createTarea(slug, historiaId, { descripcion, detalle: detalle || null, fecha_limite: fecha || null, video_url: yt || null });
      if (audio) {
        try { t = await terapApi.uploadTareaAudio(slug, t.id, audio); }
        catch (err: any) { alert('La tarea se creó, pero no se pudo subir el archivo: ' + (err?.message ?? 'error')); }
      }
      onCreated(t);
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="rounded-xl p-3.5 mb-3 space-y-2.5" style={{ background: '#F6FAF9', border: '1px solid #E5E9E7' }}>
      {error && (
        <p className="text-[12px] font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>{error}</p>
      )}
      <label className="block">
        <span className="text-[11.5px] font-semibold" style={{ color: '#374151' }}>Nombre de la tarea <span style={{ color: '#DC2626' }}>*</span></span>
        <input className="vx-input mt-1" placeholder="Tarea (ej. Practicar tarjetas de /r/ 5 min)" value={descripcion}
          onChange={e => { setDescripcion(e.target.value); if (error) setError(null); }} autoFocus
          style={error && !descripcion.trim() ? { borderColor: '#DC2626' } : undefined} />
      </label>
      <input className="vx-input" placeholder="Detalle / cómo hacerla (opcional)" value={detalle} onChange={e => setDetalle(e.target.value)} />
      {/* Audio / imagen / video propio de apoyo: opcional, se sube junto con la tarea
          (también se puede adjuntar después). El apoderado lo verá en su portal. */}
      <div className="flex items-center gap-2 flex-wrap">
        {audio ? (
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#CCFBF1', color: TEAL }}>
            🔊 {audio.name}
            <button type="button" onClick={() => setAudio(null)} className="text-[11px]" style={{ color: '#DC2626' }}>Quitar</button>
          </div>
        ) : (
          <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer" style={{ background: '#CCFBF1', color: TEAL }}>
            🔊 Adjuntar audio/video (opcional)
            <input type="file" className="hidden" accept="audio/*,image/*,video/*"
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) setAudio(f); }} />
          </label>
        )}
        <span className="text-[11px]" style={{ color: '#94A3B8' }}>Video propio máx. 40 MB. Para videos largos usa YouTube ↓</span>
      </div>
      {/* Enlace de YouTube (opcional): no pesa en el servidor, lo sirve YouTube. */}
      <input className="vx-input" placeholder="Enlace de YouTube (opcional) — ej. https://youtu.be/…" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-[12px]" style={{ color: '#64748B' }}>Fecha límite</label>
        <input type="date" className="vx-input max-w-[160px]" value={fecha} onChange={e => setFecha(e.target.value)} />
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
          <button type="submit" disabled={saving} className="px-3 py-2 rounded-lg text-white text-[12.5px] font-semibold flex items-center gap-1.5" style={{ background: TEAL }}>
            {saving && <Loader2 size={13} className="animate-spin" />} Asignar tarea
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Primitivos ────────────────────────────────────────────────────────────────
function Section({ icon: Icon, titulo, accion, children }: {
  icon: any; titulo: string; accion?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 mb-5" style={{ border: '1px solid #E5E9E7' }}>
      <div className="flex items-center justify-between mb-3.5 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#CCFBF1' }}>
            <Icon size={16} style={{ color: TEAL }} />
          </div>
          <h2 className="text-[15px] font-bold" style={{ color: '#0E1A1A' }}>{titulo}</h2>
        </div>
        {accion}
      </div>
      {children}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>{label}</label>
      {children}
    </div>
  );
}

function SoapField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1" style={{ color: TEAL }}>{label}</label>
      <textarea rows={2} className="vx-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

/** Línea de una evolución SOAP: etiqueta de color + texto. No pinta nada si está vacía. */
function SoapLine({ tag, color, text }: { tag: string; color: string; text?: string | null }) {
  if (!text) return null;
  return (
    <p className="flex gap-2 text-[12.5px]" style={{ color: '#374151' }}>
      <span className="inline-flex items-center justify-center h-5 w-5 rounded text-[11px] font-bold shrink-0 mt-0.5" style={{ background: `${color}1A`, color }}>{tag}</span>
      <span>{text}</span>
    </p>
  );
}

/** Estado vacío compacto para las secciones. */
function Vacio({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="py-8 flex flex-col items-center text-center">
      <div className="h-11 w-11 rounded-2xl flex items-center justify-center mb-2" style={{ background: '#F2F4F3', color: '#94A3B8' }}>{icon}</div>
      <p className="text-[12.5px] max-w-xs" style={{ color: '#94A3B8' }}>{text}</p>
    </div>
  );
}
