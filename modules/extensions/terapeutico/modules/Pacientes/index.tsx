import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Users, UserPlus, Search, Loader2, X, ChevronRight } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { terapPath } from '@/lib/paths';
import { terapApi, type Paciente, type Catalogos, type PacienteDto } from '../../shared/api/terapeutico.api';

const TEAL = '#0F766E';
const puedeGestionar = (rol?: string) => ['ADMINISTRADOR', 'ADMISION'].includes((rol ?? '').toUpperCase());

export default function Pacientes() {
  const { empresa } = useParams<{ empresa: string }>();
  const slug = empresa!;
  const navigate = useNavigate();
  const rol = authStorage.getUser(slug)?.rol;

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);

  const cargar = () => {
    setLoading(true);
    terapApi.listPacientes(slug)
      .then(setPacientes)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    terapApi.catalogos(slug).then(setCatalogos).catch(() => {});

  }, [slug]);

  const filtrados = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return pacientes;
    return pacientes.filter(p =>
      `${p.nombres} ${p.apellidos}`.toLowerCase().includes(t) ||
      (p.num_doc ?? '').toLowerCase().includes(t));
  }, [pacientes, q]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#CCFBF1' }}>
            <Users size={18} style={{ color: TEAL }} />
          </div>
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: '#0E1A1A' }}>Pacientes</h1>
            <p className="text-[12.5px]" style={{ color: '#6B7280' }}>{pacientes.length} registrados</p>
          </div>
        </div>
        {puedeGestionar(rol) && (
          <button onClick={() => setModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-[13.5px] font-semibold" style={{ background: TEAL }}>
            <UserPlus size={15} /> Nuevo paciente
          </button>
        )}
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre o documento…" className="vx-input vx-input-icon" />
      </div>

      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #E5E9E7' }}>
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 size={22} className="animate-spin" style={{ color: TEAL }} /></div>
        ) : filtrados.length === 0 ? (
          <div className="p-10 text-center text-[13.5px]" style={{ color: '#6B7280' }}>Sin pacientes.</div>
        ) : (
          <ul>
            {filtrados.map(p => (
              <li key={p.id}>
                <button onClick={() => navigate(terapPath(slug, `/panel/pacientes/${p.id}`))}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                  style={{ borderTop: '1px solid #F1F5F4' }}>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: '#0E1A1A' }}>{p.apellidos}, {p.nombres}</p>
                    <p className="text-[12px]" style={{ color: '#6B7280' }}>
                      {p.num_doc || 'Sin documento'}{p.historia_numero ? ` · ${p.historia_numero}` : ' · Sin historia'}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: '#94A3B8' }} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && catalogos && (
        <ModalNuevoPaciente
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

function ModalNuevoPaciente({ catalogos, onClose, onCreate }: {
  catalogos: Catalogos;
  onClose: () => void;
  onCreate: (dto: PacienteDto) => Promise<void>;
}) {
  const [f, setF] = useState<PacienteDto>({ nombres: '', apellidos: '', tipo_doc: '1', num_doc: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof PacienteDto, v: any) => setF(prev => ({ ...prev, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.nombres.trim() || !f.apellidos.trim()) { setError('Nombres y apellidos son obligatorios'); return; }
    setSaving(true); setError(null);
    try { await onCreate(f); }
    catch (err: any) { setError(err?.message ?? 'No se pudo guardar'); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,26,26,0.45)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #EEF2F1' }}>
          <h2 className="text-[16px] font-bold" style={{ color: '#0E1A1A' }}>Nuevo paciente</h2>
          <button onClick={onClose}><X size={18} style={{ color: '#6B7280' }} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombres *"><input className="vx-input" value={f.nombres} onChange={e => set('nombres', e.target.value)} /></Field>
            <Field label="Apellidos *"><input className="vx-input" value={f.apellidos} onChange={e => set('apellidos', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo doc.">
              <select className="vx-input" value={f.tipo_doc} onChange={e => set('tipo_doc', e.target.value)}>
                <option value="1">DNI</option><option value="4">Carnet ext.</option>
                <option value="7">Pasaporte</option><option value="0">Sin documento</option>
              </select>
            </Field>
            <Field label="N° documento"><input className="vx-input" value={f.num_doc ?? ''} onChange={e => set('num_doc', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha nac."><input type="date" className="vx-input" value={f.fecha_nacimiento ?? ''} onChange={e => set('fecha_nacimiento', e.target.value)} /></Field>
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
          <Field label="Apoderado / contacto"><input className="vx-input" value={f.apoderado_nombre ?? ''} onChange={e => set('apoderado_nombre', e.target.value)} placeholder="Nombre del apoderado (opcional)" /></Field>

          {error && <p className="text-[12.5px]" style={{ color: '#B91C1C' }}>{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F4', color: '#374151' }}>Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2" style={{ background: TEAL }}>
              {saving && <Loader2 size={14} className="animate-spin" />} Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#64748B' }}>{label}</span>
      {children}
    </label>
  );
}
