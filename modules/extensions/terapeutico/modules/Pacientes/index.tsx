import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Search, Loader2, X, ChevronRight, FileText, Sparkles } from '@/components/ui/icon';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';
import { terapApi, type Paciente, type Catalogos, type PacienteDto, type Apoderado } from '../../shared/api/terapeutico.api';

const TEAL = '#0F766E';
const puedeGestionar = (rol?: string) => ['ADMINISTRADOR', 'ADMISION'].includes((rol ?? '').toUpperCase());
const MAX_APODERADOS = 2;

/** Edad en años a partir de la fecha de nacimiento (o null si no hay fecha válida). */
function edadDe(fechaNac?: string | null): number | null {
  if (!fechaNac) return null;
  const d = new Date(fechaNac);
  if (isNaN(d.getTime())) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) e--;
  return e;
}

/* ── Utilidades de presentación ─────────────────────────────────── */
const DOC = { '1': 'DNI', '4': 'C.E.', '7': 'Pas.', '0': 'S/D' } as Record<string, string>;

const iniciales = (n: string, a: string) =>
  `${(n.trim()[0] ?? '')}${(a.trim()[0] ?? '')}`.toUpperCase() || '?';

/** Edad en años (o "X m" para bebés) a partir de la fecha de nacimiento. */
function edad(fecha?: string | null): string | null {
  if (!fecha) return null;
  const f = new Date(fecha); if (isNaN(+f)) return null;
  const hoy = new Date();
  let a = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) a--;
  if (a <= 0) {
    const meses = Math.max(0, m + (hoy.getDate() < f.getDate() ? -1 : 0) + (hoy.getFullYear() - f.getFullYear()) * 12);
    return `${meses} m`;
  }
  return `${a} años`;
}

/* Paleta suave para el avatar (variedad sin ruido, estable por id). */
const AV = [
  { bg: '#CCFBF1', fg: '#0F766E' }, { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#FCE7F3', fg: '#BE185D' }, { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#E9D5FF', fg: '#7C3AED' }, { bg: '#D1FAE5', fg: '#047857' },
];
const avatar = (id: number) => AV[id % AV.length];

export default function Pacientes() {
  const slug = useEmpresaSlug()!;
  const navigate = useNavigate();
  const rol = authStorage.getUser(slug)?.rol;

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [verTodos, setVerTodos] = useState(false);
  const [modal, setModal] = useState(false);

  const cargar = () => {
    setLoading(true);
    terapApi.listPacientes(slug, verTodos)
      .then(setPacientes)
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [slug, verTodos]);
  useEffect(() => { terapApi.catalogos(slug).then(setCatalogos).catch(() => {}); }, [slug]);

  const filtrados = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return pacientes;
    return pacientes.filter(p =>
      `${p.nombres} ${p.apellidos}`.toLowerCase().includes(t) ||
      (p.num_doc ?? '').toLowerCase().includes(t));
  }, [pacientes, q]);

  const conHistoria = pacientes.filter(p => p.historia_id).length;
  const sinHistoria = pacientes.length - conHistoria;

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#CCFBF1' }}>
            <Users size={19} style={{ color: TEAL }} />
          </div>
          <div>
            <h1 className="text-[21px] font-bold leading-tight" style={{ color: '#0E1A1A' }}>Pacientes</h1>
            <p className="text-[12.5px]" style={{ color: '#6B7280' }}>
              {pacientes.length} {pacientes.length === 1 ? 'registrado' : 'registrados'}
            </p>
          </div>
        </div>
        {puedeGestionar(rol) && (
          <button onClick={() => setModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[13.5px] font-semibold shadow-sm hover:opacity-95 transition"
            style={{ background: TEAL }}>
            <UserPlus size={16} /> Nuevo paciente
          </button>
        )}
      </div>

      {/* Mini-métricas */}
      {!loading && pacientes.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Total" value={pacientes.length} tint="#CCFBF1" fg={TEAL} icon={<Users size={15} />} />
          <StatCard label="Con historia" value={conHistoria} tint="#DCFCE7" fg="#15803D" icon={<FileText size={15} />} />
          <StatCard label="Sin historia" value={sinHistoria} tint="#FEF3C7" fg="#B45309" icon={<Sparkles size={15} />} />
        </div>
      )}

      {/* Barra: buscar + filtro activos/todos */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o documento…" className="vx-input vx-input-icon w-full" />
        </div>
        <div className="inline-flex rounded-xl overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
          {[['Activos', false], ['Todos', true]].map(([lbl, val]) => (
            <button key={String(val)} onClick={() => setVerTodos(val as boolean)}
              className="px-3.5 py-2 text-[12.5px] font-semibold transition"
              style={verTodos === val ? { background: TEAL, color: '#fff' } : { background: '#fff', color: '#64748B' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
        {loading ? (
          <SkeletonList />
        ) : filtrados.length === 0 ? (
          q ? (
            <EmptyState icon={<Search size={26} />} title="Sin resultados"
              text={<>No hay pacientes que coincidan con <b>“{q}”</b>.</>} />
          ) : (
            <EmptyState icon={<Users size={26} />} title="Aún no hay pacientes"
              text="Registra el primer paciente para empezar su historia clínica."
              action={puedeGestionar(rol) ? <button onClick={() => setModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13px] font-semibold" style={{ background: TEAL }}>
                <UserPlus size={15} /> Registrar paciente</button> : undefined} />
          )
        ) : (
          <ul>
            {filtrados.map((p, i) => {
              const av = avatar(p.id);
              const e = edad(p.fecha_nacimiento);
              const inactivo = p.activo === 0;
              return (
                <li key={p.id}>
                  <button onClick={() => navigate(terapPath(slug, `/panel/pacientes/${p.id}`))}
                    className="w-full flex items-center gap-3.5 px-4 py-3 text-left hover:bg-[#F8FBFA] transition group"
                    style={{ borderTop: i === 0 ? 'none' : '1px solid #F1F5F4', opacity: inactivo ? 0.6 : 1 }}>
                    <div className="h-11 w-11 rounded-full flex items-center justify-center text-[14px] font-bold shrink-0"
                      style={{ background: av.bg, color: av.fg }}>
                      {iniciales(p.nombres, p.apellidos)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[14.5px] font-semibold truncate" style={{ color: '#0E1A1A' }}>
                          {p.apellidos}, {p.nombres}
                        </p>
                        {inactivo && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#F1F5F4', color: '#94A3B8' }}>Inactivo</span>}
                      </div>
                      <p className="text-[12px] truncate" style={{ color: '#6B7280' }}>
                        {DOC[p.tipo_doc] ?? 'Doc'} {p.num_doc || '—'}
                        {e && <> · {e}</>}
                        {p.apoderado_nombre && <> · Apod.: {p.apoderado_nombre}</>}
                      </p>
                    </div>
                    {p.historia_id
                      ? <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: '#DCFCE7', color: '#15803D' }}>
                          <FileText size={12} /> {p.historia_numero || 'Con historia'}
                        </span>
                      : <span className="hidden sm:inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0" style={{ background: '#FEF3C7', color: '#B45309' }}>Sin historia</span>}
                    <ChevronRight size={17} className="shrink-0 transition group-hover:translate-x-0.5" style={{ color: '#94A3B8' }} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!loading && filtrados.length > 0 && q && (
        <p className="text-[11.5px] mt-2 px-1" style={{ color: '#94A3B8' }}>{filtrados.length} de {pacientes.length} pacientes</p>
      )}

      {modal && catalogos && (
        <ModalNuevoPaciente
          slug={slug}
          catalogos={catalogos}
          onClose={() => setModal(false)}
          onCreate={async (dto) => {
            const nuevo = await terapApi.createPaciente(slug, dto);
            setModal(false);
            navigate(terapPath(slug, `/panel/pacientes/${nuevo.id}`));
          }}
        />
      )}
    </div>
  );
}

/* ── Componentes de apoyo ───────────────────────────────────────── */
function StatCard({ label, value, tint, fg, icon }: { label: string; value: number; tint: string; fg: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 flex items-center gap-3" style={{ border: '1px solid #E5E9E7' }}>
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: tint, color: fg }}>{icon}</div>
      <div className="leading-tight">
        <p className="text-[19px] font-bold" style={{ color: '#0E1A1A' }}>{value}</p>
        <p className="text-[11px]" style={{ color: '#6B7280' }}>{label}</p>
      </div>
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-center gap-3.5 px-4 py-3" style={{ borderTop: i === 0 ? 'none' : '1px solid #F1F5F4' }}>
          <div className="h-11 w-11 rounded-full shrink-0" style={{ background: '#EEF2F1' }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded" style={{ background: '#EEF2F1', width: '45%' }} />
            <div className="h-2.5 rounded" style={{ background: '#F1F5F4', width: '30%' }} />
          </div>
          <div className="h-5 w-20 rounded-full" style={{ background: '#EEF2F1' }} />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="p-12 flex flex-col items-center text-center">
      <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: '#F2F4F3', color: '#94A3B8' }}>{icon}</div>
      <p className="text-[15px] font-bold" style={{ color: '#0E1A1A' }}>{title}</p>
      <p className="text-[13px] mt-1 max-w-xs" style={{ color: '#6B7280' }}>{text}</p>
      {action}
    </div>
  );
}

/* ── Modal: nuevo paciente (por secciones) ──────────────────────── */
function ModalNuevoPaciente({ slug, catalogos, onClose, onCreate }: {
  slug: string;
  catalogos: Catalogos;
  onClose: () => void;
  onCreate: (dto: PacienteDto) => Promise<void>;
}) {
  const [f, setF] = useState<PacienteDto>({ nombres: '', apellidos: '', tipo_doc: '1', num_doc: '' });
  const [apoderados, setApoderados] = useState<Apoderado[]>([]);
  const [docMsg, setDocMsg] = useState<string | null>(null);   // aviso: documento ya registrado
  const [chkDoc, setChkDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof PacienteDto, v: any) => setF(prev => ({ ...prev, [k]: v }));

  const edad = edadDe(f.fecha_nacimiento);
  const esMenor = edad !== null && edad < 18;
  const sinDoc = (f.tipo_doc ?? '1') === '0';

  // Verifica el documento contra el sistema al salir del input (todos se identifican por doc).
  const verificarDoc = async () => {
    const num = (f.num_doc ?? '').trim();
    setDocMsg(null);
    if (!num || sinDoc) return;
    setChkDoc(true);
    try {
      const r = await terapApi.existePaciente(slug, f.tipo_doc ?? '1', num);
      if (r.existe) setDocMsg(`Ya hay un paciente registrado con este documento: ${r.paciente?.nombre}.`);
    } catch { /* si falla la verificación no bloqueamos, se valida igual al guardar */ }
    finally { setChkDoc(false); }
  };

  // Apoderados dinámicos (hasta MAX_APODERADOS). Es una LISTA (escalable), no campos fijos.
  const setApo = (i: number, k: keyof Apoderado, v: string) => setApoderados(prev => prev.map((a, j) => j === i ? { ...a, [k]: v } : a));
  const addApo = () => setApoderados(prev => prev.length >= MAX_APODERADOS ? prev : [...prev, { nombre: '', relacion: '', telefono: '' }]);
  const delApo = (i: number) => setApoderados(prev => prev.filter((_, j) => j !== i));

  // Al detectar que es menor, arranca con un apoderado listo para llenar.
  useEffect(() => { if (esMenor && apoderados.length === 0) setApoderados([{ nombre: '', relacion: '', telefono: '' }]); }, [esMenor]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.nombres.trim() || !f.apellidos.trim()) { setError('Nombres y apellidos son obligatorios.'); return; }
    if (!sinDoc && !(f.num_doc ?? '').trim()) { setError('El número de documento es obligatorio (identifica al paciente).'); return; }
    if (docMsg) { setError('Ese documento ya está registrado. Busca al paciente existente en la lista.'); return; }
    const apoValidos = apoderados.filter(a => a.nombre.trim());
    if (esMenor && apoValidos.length === 0) { setError('El paciente es menor de edad: registra al menos un apoderado.'); return; }
    setSaving(true); setError(null);
    try { await onCreate({ ...f, apoderados: apoValidos }); }
    catch (err: any) { setError(err?.message ?? 'No se pudo guardar'); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,26,26,0.5)', backdropFilter: 'blur(3px)' }} onMouseDown={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-auto shadow-xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white z-10" style={{ borderBottom: '1px solid #EEF2F1' }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#CCFBF1' }}><UserPlus size={16} style={{ color: TEAL }} /></div>
            <h2 className="text-[16px] font-bold" style={{ color: '#0E1A1A' }}>Nuevo paciente</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: '#6B7280' }} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <SectionLabel>Datos del paciente</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombres *"><input className="vx-input" value={f.nombres} onChange={e => set('nombres', e.target.value)} autoFocus /></Field>
            <Field label="Apellidos *"><input className="vx-input" value={f.apellidos} onChange={e => set('apellidos', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo doc.">
              <select className="vx-input" value={f.tipo_doc} onChange={e => set('tipo_doc', e.target.value)}>
                <option value="1">DNI</option><option value="4">Carnet ext.</option>
                <option value="7">Pasaporte</option><option value="0">Sin documento</option>
              </select>
            </Field>
            <Field label={sinDoc ? 'N° documento' : 'N° documento *'}>
              <input className="vx-input" value={f.num_doc ?? ''} disabled={sinDoc}
                onChange={e => { set('num_doc', e.target.value); if (docMsg) setDocMsg(null); }}
                onBlur={verificarDoc}
                style={docMsg ? { borderColor: '#DC2626' } : undefined} />
              {chkDoc && <p className="text-[11px] mt-1" style={{ color: '#94A3B8' }}>Verificando…</p>}
              {docMsg && <p className="text-[11.5px] mt-1 font-semibold" style={{ color: '#B91C1C' }}>{docMsg}</p>}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Fecha nac.${edad !== null ? `  ·  ${edad} años${esMenor ? ' (menor)' : ''}` : ''}`}>
              <input type="date" className="vx-input" value={f.fecha_nacimiento ?? ''} onChange={e => set('fecha_nacimiento', e.target.value)} />
            </Field>
            <Field label="Sexo">
              <select className="vx-input" value={f.sexo_id ?? ''} onChange={e => set('sexo_id', e.target.value ? Number(e.target.value) : null)}>
                <option value="">—</option>
                {catalogos.sexos.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono"><input className="vx-input" value={f.telefono ?? ''} onChange={e => set('telefono', e.target.value)} /></Field>
            <Field label="Email"><input className="vx-input" value={f.email ?? ''} onChange={e => set('email', e.target.value)} /></Field>
          </div>
          <Field label="Dirección"><input className="vx-input" value={f.direccion ?? ''} onChange={e => set('direccion', e.target.value)} /></Field>

          {(esMenor || apoderados.length > 0) && (
            <>
              <div className="flex items-center justify-between pt-1">
                <SectionLabel>
                  Apoderado(s){esMenor && <span style={{ color: '#DC2626' }}> *</span>}
                  <span className="normal-case font-normal" style={{ color: '#94A3B8' }}> (máx. {MAX_APODERADOS})</span>
                </SectionLabel>
                {apoderados.length < MAX_APODERADOS && (
                  <button type="button" onClick={addApo} className="text-[12px] font-semibold" style={{ color: TEAL }}>+ Agregar apoderado</button>
                )}
              </div>
              {esMenor && <p className="text-[11.5px]" style={{ color: '#B45309' }}>El paciente es menor de edad: registra a su apoderado (mín. 1).</p>}
              {apoderados.map((a, i) => (
                <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: '#F6FAF9', border: '1px solid #E5E9E7' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>Apoderado {i + 1}</span>
                    <button type="button" onClick={() => delApo(i)} className="text-[11px] font-semibold" style={{ color: '#DC2626' }}>Quitar</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Nombre *"><input className="vx-input" value={a.nombre} onChange={e => setApo(i, 'nombre', e.target.value)} /></Field>
                    <Field label="Relación">
                      <input className="vx-input" list="rel-apod" value={a.relacion ?? ''} onChange={e => setApo(i, 'relacion', e.target.value)} placeholder="Madre, Padre…" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Teléfono"><input className="vx-input" value={a.telefono ?? ''} onChange={e => setApo(i, 'telefono', e.target.value)} /></Field>
                    <Field label="N° documento"><input className="vx-input" value={a.num_doc ?? ''} onChange={e => setApo(i, 'num_doc', e.target.value)} /></Field>
                  </div>
                </div>
              ))}
              <datalist id="rel-apod"><option value="Madre" /><option value="Padre" /><option value="Tutor(a)" /><option value="Abuelo(a)" /></datalist>
            </>
          )}

          {error && <p className="text-[12.5px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 disabled:opacity-60" style={{ background: TEAL }}>
              {saving && <Loader2 size={14} className="animate-spin" />} Guardar paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-wider pt-1" style={{ color: TEAL }}>{children}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>{label}</span>
      {children}
    </label>
  );
}
