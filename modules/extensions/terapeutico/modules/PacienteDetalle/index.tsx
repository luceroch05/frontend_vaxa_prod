import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, FileText, Activity, ClipboardList, Plus, Save, User, Users, X,
  FolderOpen, Upload, Download, Trash2, PrinterIcon, Calendar as CalendarIcon } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';
import { imgUrl } from '@/lib/api/client';
import {
  terapApi, terapAuthApi, type Paciente, type Historia, type Sesion, type Diagnostico, type Catalogos,
  type Terapeuta, type Asignacion, type Servicio, type Adjunto, type Cita,
} from '../../shared/api/terapeutico.api';
import { imprimirHistoria } from './imprimir';

const TEAL = '#0F766E';
const escribeClinico = (rol?: string) => ['ADMINISTRADOR', 'TERAPEUTA'].includes((rol ?? '').toUpperCase());
const gestiona = (rol?: string) => ['ADMINISTRADOR', 'ADMISION'].includes((rol ?? '').toUpperCase());

type TabId = 'datos' | 'historia' | 'sesiones' | 'citas' | 'documentos';
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'datos',      label: 'Datos',       icon: User },
  { id: 'historia',   label: 'Historia',    icon: FileText },
  { id: 'sesiones',   label: 'Sesiones',    icon: Activity },
  { id: 'citas',      label: 'Citas',       icon: CalendarIcon },
  { id: 'documentos', label: 'Documentos',  icon: FolderOpen },
];

export default function PacienteDetalle() {
  const { empresa, id } = useParams<{ empresa: string; id: string }>();
  const slug = empresa!;
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
      <div className="rounded-2xl bg-white p-5 mb-5" style={{ border: '1px solid #E5E9E7' }}>
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: '#CCFBF1' }}>
            <User size={20} style={{ color: TEAL }} />
          </div>
          <div className="flex-1">
            <h1 className="text-[19px] font-bold" style={{ color: '#0E1A1A' }}>{paciente.apellidos}, {paciente.nombres}</h1>
            <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7280' }}>
              {paciente.num_doc || 'Sin documento'}
              {paciente.sexo_nombre ? ` · ${paciente.sexo_nombre}` : ''}
              {paciente.fecha_nacimiento ? ` · ${paciente.fecha_nacimiento}` : ''}
              {paciente.telefono ? ` · ${paciente.telefono}` : ''}
            </p>
            {historia?.numero && (
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: '#CCFBF1', color: TEAL }}>
                {historia.numero} · {historia.estado_nombre}
              </span>
            )}
          </div>
          {historia && (
            <button
              onClick={() => imprimirHistoria({ slug, paciente, historia, diagnosticos, sesiones })}
              className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-2 rounded-lg shrink-0"
              style={{ border: `1px solid ${TEAL}`, color: TEAL }}
              title="Exportar / imprimir la historia clínica en PDF">
              <PrinterIcon size={14} /> Exportar PDF
            </button>
          )}
        </div>
      </div>

      {/* Barra de pestañas: divide el perfil en secciones para no ser un scroll infinito */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-0.5" style={{ borderBottom: '1px solid #E5E9E7' }}>
        {TABS.map(t => {
          const activo = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap -mb-px"
              style={activo
                ? { color: TEAL, borderBottom: `2px solid ${TEAL}` }
                : { color: '#6B7280', borderBottom: '2px solid transparent' }}>
              <t.icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Contenido de la pestaña activa */}
      {tab === 'datos' && (
        <>
          <BloqueDatos paciente={paciente} />
          <BloqueTerapeutas slug={slug} pacienteId={pacienteId} puedeGestionar={gestiona(rol)} />
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

      {tab === 'sesiones' && (
        !historia ? <AbreHistoriaPrimero /> : (
          <BloqueEvoluciones slug={slug} historia={historia} sesiones={sesiones} puedeClinico={puedeClinico}
            onAdd={s => setSesiones(prev => [s, ...prev])} />
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
        <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Este paciente no tiene citas registradas. Agéndalas desde la sección «Agenda».</p>
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
      {error && <p className="text-[12.5px] mb-2" style={{ color: '#B91C1C' }}>{error}</p>}
      {adjuntos.length === 0 ? (
        <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Sin documentos. Sube informes, exámenes o PDFs (máx. {MAX_MB} MB).</p>
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

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
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
          <div className="grid grid-cols-3 gap-2">
            <input className="vx-input col-span-2" placeholder="Descripción del diagnóstico" value={desc} onChange={e => setDesc(e.target.value)} />
            <input className="vx-input" placeholder="CIE-10" value={cie} onChange={e => setCie(e.target.value)} />
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
        <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Sin diagnósticos registrados.</p>
      ) : (
        <ul className="space-y-1.5">
          {diagnosticos.map(d => (
            <li key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-[13px]" style={{ background: '#F6FAF9' }}>
              <span style={{ color: '#0E1A1A' }}>{d.codigo_cie10 ? <b>{d.codigo_cie10}</b> : null} {d.descripcion}</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: '#E2E8E6', color: '#475569' }}>{d.tipo_nombre}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
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
  const set = (k: keyof typeof f, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.subjetivo && !f.objetivo && !f.analisis && !f.plan) return;
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
        <p className="text-[12.5px]" style={{ color: '#94A3B8' }}>Aún no hay evoluciones registradas.</p>
      ) : (
        <ol className="space-y-3">
          {sesiones.map(s => (
            <li key={s.id} className="rounded-xl p-3.5" style={{ background: '#F6FAF9', border: '1px solid #E5E9E7' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12.5px] font-semibold" style={{ color: '#0E1A1A' }}>
                  Sesión {s.numero_sesion ?? ''} · {new Date(s.fecha).toLocaleDateString()}
                </span>
                <span className="text-[11px]" style={{ color: '#6B7280' }}>
                  {s.terapeuta_nombre}{s.firmada ? ' · ✔ firmada' : ''}
                </span>
              </div>
              <div className="space-y-1 text-[12.5px]" style={{ color: '#374151' }}>
                {s.subjetivo && <p><b>S:</b> {s.subjetivo}</p>}
                {s.objetivo && <p><b>O:</b> {s.objetivo}</p>}
                {s.analisis && <p><b>A:</b> {s.analisis}</p>}
                {s.plan && <p><b>P:</b> {s.plan}</p>}
                {s.evolucion && <p>{s.evolucion}</p>}
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

// ── Primitivos ────────────────────────────────────────────────────────────────
function Section({ icon: Icon, titulo, accion, children }: {
  icon: any; titulo: string; accion?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 mb-5" style={{ border: '1px solid #E5E9E7' }}>
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Icon size={17} style={{ color: TEAL }} />
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
