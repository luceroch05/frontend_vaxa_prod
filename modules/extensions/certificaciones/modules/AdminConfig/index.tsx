import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Upload, Trash2, Loader2, ImageIcon, FileSignature,
  AlertCircle, Plus, X, Settings, CheckCircle, BookOpen,
  ChevronDown, ChevronUp, Search, Lock, Layers, Save,
  ChevronLeft, ChevronRight,
} from '@/components/ui/icon';
import { imgUrl } from '@/lib/api/client';
import { useConfirm } from '../../shared/hooks/useConfirm';
import { logosApi }  from '../../shared/api/logos.api';
import { firmasApi } from '../../shared/api/firmas.api';
import { configApi } from '../../shared/api/config.api';
import { useProgramas } from '../../shared/hooks/useProgramas';
import { useGrupos }    from '../../shared/hooks/useGrupos';
import CertificadoPreview from '../../shared/components/CertificadoPreview';
import { VARIABLES_CERTIFICADO } from '../../shared/utils/certVariables';
import EditorLienzo from '../../personalizado/EditorLienzo';
import { LayoutLienzo, parseLayout } from '../../personalizado/layout';
import type { Logo, Firma } from '../../shared/types';

/* ── Campo de texto del certificado con variables insertables ──── */
function TextoCertificadoField({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const MAX = 500;

  const insertar = (token: string) => {
    const el = ref.current;
    const v  = value ?? '';
    let start = v.length, end = v.length;
    if (el) { start = el.selectionStart ?? v.length; end = el.selectionEnd ?? v.length; }
    const next = (v.slice(0, start) + token + v.slice(end)).slice(0, MAX);
    onChange(next);
    // Reposiciona el cursor justo después del token insertado.
    requestAnimationFrame(() => {
      if (!el) return;
      const pos = Math.min(start + token.length, MAX);
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#374151' }}>
        Texto del certificado
        <span className="ml-2 normal-case font-normal tracking-normal" style={{ color: '#9CA3AF' }}>
          ({(value ?? '').length}/{MAX} · vacío = texto automático)
        </span>
      </label>
      <textarea
        ref={ref}
        rows={5}
        maxLength={MAX}
        value={value}
        onChange={e => onChange(e.target.value.slice(0, MAX))}
        placeholder={placeholder}
        className="vx-input resize-none"
        style={{ fontSize: '13px', lineHeight: 1.6, height: 140 }}
      />
      {/* Variables insertables */}
      <div className="mt-2 rounded-xl p-2.5" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
        <p className="text-[11px] font-semibold mb-1.5" style={{ color: '#374151' }}>Variables disponibles</p>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES_CERTIFICADO.map(v => (
            <button
              key={v.token}
              type="button"
              onClick={() => insertar(v.token)}
              title={v.desc}
              className="text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors hover:brightness-95"
              style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', fontFamily: 'monospace' }}
            >
              {v.token}
            </button>
          ))}
        </div>
        <p className="text-[10.5px] mt-1.5" style={{ color: '#9CA3AF' }}>
          Haz clic para insertarla en el texto. Al emitir se reemplaza por el dato real del participante.
        </p>
      </div>
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Sección Logos ──────────────────────────────────────────── */
function SeccionLogos({ empresa, onChanged }: { empresa: string; onChanged: () => void }) {
  const [logos,     setLogos]     = useState<Logo[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [nombre,    setNombre]    = useState('');
  const [busqueda,  setBusqueda]  = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    logosApi.list(empresa).then(setLogos).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  const confirm = useConfirm();

  const logosFiltrados = logos.filter(l =>
    (l.nombre ?? '').toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  useEffect(() => { load(); }, [empresa]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const base64 = await toBase64(file);
      await logosApi.create(empresa, { nombre: nombre || file.name, imagen_logo: base64 });
      setNombre('');
      if (fileRef.current) fileRef.current.value = '';
      load(); onChanged();
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm({
      title: 'Eliminar logo',
      message: '¿Seguro que quieres eliminar este logo? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    }))) return;
    try { await logosApi.delete(empresa, id); load(); onChanged(); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #EEECE6' }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
          <ImageIcon size={15} style={{ color: '#2563EB' }} />
        </div>
        <div>
          <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>
            Logos
            {logos.length > 0 && (
              <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#EFF6FF', color: '#2563EB' }}>
                {logos.length}
              </span>
            )}
          </p>
          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>Sube los logos para usarlos en certificados</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-xl mb-3"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
          placeholder="Nombre del logo (opcional)" className="vx-input flex-1"
          style={{ padding: '0.5rem 0.75rem' }} />
        <label className={`flex items-center gap-2 px-3.5 py-2 text-[12px] font-semibold rounded-xl cursor-pointer flex-shrink-0 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' }}>
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          Subir
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading && <div className="flex justify-center py-6" style={{ color: '#D1D5DB' }}><Loader2 size={18} className="animate-spin" /></div>}
      {!loading && logos.length === 0 && (
        <div className="py-8 text-center rounded-xl" style={{ background: '#FAFAF8', border: '1px dashed #EEECE6' }}>
          <p className="text-[13px]" style={{ color: '#B0A898' }}>No hay logos subidos</p>
        </div>
      )}

      {/* Buscador (solo cuando hay suficientes para que valga la pena) */}
      {logos.length > 6 && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B0A898' }} />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar logo por nombre…"
            className="vx-input w-full"
            style={{ padding: '0.5rem 0.75rem 0.5rem 2.1rem' }}
          />
        </div>
      )}

      {/* Grilla con altura limitada + scroll interno para que la sección no crezca de más */}
      {logos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1" style={{ maxHeight: '20rem' }}>
          {logosFiltrados.map(logo => {
            const esDefault = !!logo.es_default;
            return (
            <div key={logo.id} className="relative group rounded-xl overflow-hidden" style={{ border: `1px solid ${esDefault ? '#A7F3D0' : '#EEECE6'}` }}>
              <img src={imgUrl(logo.imagen_logo)} alt={logo.nombre ?? 'logo'} className="w-full h-20 object-contain p-2" style={{ background: '#FAFAF8' }} />
              {esDefault ? (
                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}
                  title="Logo de la empresa: obligatorio en tu plan, no se puede eliminar">
                  Obligatorio
                </span>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(13,14,18,0.5)' }}>
                  <button onClick={() => handleDelete(logo.id)} className="p-1.5 rounded-lg" style={{ background: '#EF4444', color: '#fff' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
              {logo.nombre && (
                <p className="text-[11px] px-2 py-1.5 truncate" style={{ color: '#9CA3AF', borderTop: '1px solid #F5F4F0' }}>{logo.nombre}</p>
              )}
            </div>
            );
          })}
          {logosFiltrados.length === 0 && (
            <p className="col-span-full text-center text-[13px] py-6" style={{ color: '#B0A898' }}>
              Sin resultados para “{busqueda}”
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sección Firmas ─────────────────────────────────────────── */
function SeccionFirmas({ empresa, onChanged }: { empresa: string; onChanged: () => void }) {
  const [firmas,    setFirmas]    = useState<Firma[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ nombre_autoridad: '', cargo: '' });
  const [busqueda,  setBusqueda]  = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    firmasApi.list(empresa).then(setFirmas).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  const confirm = useConfirm();

  const q = busqueda.trim().toLowerCase();
  const firmasFiltradas = firmas.filter(f =>
    f.nombre_autoridad.toLowerCase().includes(q) || f.cargo.toLowerCase().includes(q),
  );

  useEffect(() => { load(); }, [empresa]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form.nombre_autoridad || !form.cargo) {
      setError('Completa nombre y cargo antes de subir la firma'); return;
    }
    setUploading(true); setError(null);
    try {
      const base64 = await toBase64(file);
      await firmasApi.create(empresa, { ...form, imagen_firma: base64 });
      setForm({ nombre_autoridad: '', cargo: '' });
      setShowForm(false);
      if (fileRef.current) fileRef.current.value = '';
      load(); onChanged();
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!(await confirm({
      title: 'Eliminar firma',
      message: '¿Seguro que quieres eliminar esta firma? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
    }))) return;
    try { await firmasApi.delete(empresa, id); load(); onChanged(); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #EEECE6' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F0FDF4' }}>
            <FileSignature size={15} style={{ color: '#15803D' }} />
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>
              Firmas
              {firmas.length > 0 && (
                <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#F0FDF4', color: '#15803D' }}>
                  {firmas.length}
                </span>
              )}
            </p>
            <p className="text-[11px]" style={{ color: '#9CA3AF' }}>Autoridades que firman los certificados</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl"
            style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
            <Plus size={13} /> Nueva
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[12px] px-3 py-2 rounded-xl mb-3"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {showForm && (
        <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: '#FAFAF8', border: '1px dashed #EEECE6' }}>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold" style={{ color: '#0D0E12' }}>Nueva firma</p>
            <button onClick={() => { setShowForm(false); setError(null); }} style={{ color: '#9CA3AF' }}><X size={15} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Nombre y apellido" value={form.nombre_autoridad}
              onChange={e => setForm(f => ({ ...f, nombre_autoridad: e.target.value }))}
              className="vx-input" style={{ padding: '0.5rem 0.75rem' }} />
            <input type="text" placeholder="Cargo" value={form.cargo}
              onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
              className="vx-input" style={{ padding: '0.5rem 0.75rem' }} />
          </div>
          <label className={`flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-xl cursor-pointer w-full ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ background: '#F5F3FF', color: '#7C3AED', border: '1.5px dashed #DDD6FE' }}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Subir imagen de firma
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      )}

      {loading && <div className="flex justify-center py-6" style={{ color: '#D1D5DB' }}><Loader2 size={18} className="animate-spin" /></div>}
      {!loading && firmas.length === 0 && (
        <div className="py-8 text-center rounded-xl" style={{ background: '#FAFAF8', border: '1px dashed #EEECE6' }}>
          <p className="text-[13px]" style={{ color: '#B0A898' }}>No hay firmas registradas</p>
        </div>
      )}

      {/* Buscador (solo cuando hay suficientes) */}
      {firmas.length > 5 && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#B0A898' }} />
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar firma por nombre o cargo…"
            className="vx-input w-full"
            style={{ padding: '0.5rem 0.75rem 0.5rem 2.1rem' }}
          />
        </div>
      )}

      {/* Lista con altura limitada + scroll interno */}
      <div className="space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: '20rem' }}>
        {firmasFiltradas.map(firma => (
          <div key={firma.id} className="flex items-center gap-3 rounded-xl p-3" style={{ border: '1px solid #EEECE6' }}>
            <img src={imgUrl(firma.imagen_firma)} alt={firma.nombre_autoridad} className="h-10 w-24 object-contain rounded-lg" style={{ background: '#FAFAF8' }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: '#0D0E12' }}>{firma.nombre_autoridad}</p>
              <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>{firma.cargo}</p>
            </div>
            <button onClick={() => handleDelete(firma.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: '#B0A898' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {firmas.length > 0 && firmasFiltradas.length === 0 && (
          <p className="text-center text-[13px] py-6" style={{ color: '#B0A898' }}>
            Sin resultados para “{busqueda}”
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Multi-selector genérico ────────────────────────────────── */
const MAX_SEL = 3;

function PosicionBadge({ pos }: { pos: number }) {
  const colors = ['#2563EB', '#7C3AED', '#15803D'];
  const bgs    = ['#EFF6FF', '#F5F3FF', '#F0FDF4'];
  return (
    <span
      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
      style={{ background: colors[pos - 1] ?? '#6B7280', color: '#fff', zIndex: 2 }}
    >
      {pos}
    </span>
  );
}

/* ── Plantillas por programa ─────────────────────────────────── */
type ProgramCfg = {
  plantilla_url:      string;
  texto_personalizado: string;
  logos:  number[];
  firmas: number[];
  /** Modo "Diseño Personalizado (Lienzo)". null = diseño por defecto de Vaxa. */
  layout: LayoutLienzo | null;
};

/* ── GrupoCombobox: select con búsqueda integrada ───────────── */
interface GrupoOption {
  id: number;
  nombre: string;
  hasCustom: boolean;
}

function GrupoCombobox({
  value, options, onChange, allLabel = 'Configuración base del programa',
}: {
  value: number;
  options: GrupoOption[];
  onChange: (val: number) => void;
  allLabel?: string;
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const selected = value === 0
    ? { id: 0, nombre: allLabel, hasCustom: false, isBase: true }
    : options.find(o => o.id === value);

  const filtered = options.filter(o =>
    !query || o.nombre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: '1 1 280px', maxWidth: 380 }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="vx-input flex items-center justify-between gap-2"
        style={{ textAlign: 'left', cursor: 'pointer' }}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {value === 0 ? (
            <Settings size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          ) : selected && (selected as GrupoOption).hasCustom ? (
            <Lock size={13} style={{ color: '#92400E', flexShrink: 0 }} />
          ) : (
            <Layers size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          )}
          <span className="truncate" style={{ color: '#0D0E12' }}>
            {selected?.nombre ?? allLabel}
          </span>
        </span>
        <ChevronDown
          size={14}
          style={{
            color: '#9CA3AF',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            zIndex: 20, maxHeight: 320, overflow: 'hidden',
            background: '#fff', border: '1px solid #EEECE6', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Buscador */}
          <div style={{ padding: 8, borderBottom: '1px solid #F5F4F0' }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#B0A898' }} />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar grupo..."
                style={{
                  width: '100%', padding: '7px 10px 7px 28px', fontSize: 13,
                  border: '1px solid #EEECE6', borderRadius: 8, outline: 'none',
                  background: '#FAFAF8',
                }}
              />
            </div>
          </div>

          {/* Opciones */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* Default (base) */}
            <button
              type="button"
              onClick={() => { onChange(0); setOpen(false); setQuery(''); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
              style={{
                background: value === 0 ? '#FAFAF8' : 'transparent',
                borderBottom: '1px solid #F5F4F0',
              }}
              onMouseEnter={e => { if (value !== 0) e.currentTarget.style.background = '#FAFAF8'; }}
              onMouseLeave={e => { if (value !== 0) e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
                <Settings size={13} style={{ color: '#2563EB' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold truncate" style={{ color: '#0D0E12' }}>
                  {allLabel}
                </p>
                <p className="text-[11px]" style={{ color: '#9CA3AF' }}>Default · se usa si el grupo no tiene override</p>
              </div>
              {value === 0 && <CheckCircle size={14} style={{ color: '#15803D', flexShrink: 0 }} />}
            </button>

            {/* Grupos filtrados */}
            {filtered.length === 0 && (
              <p className="text-[12px] py-6 text-center" style={{ color: '#B0A898' }}>
                No hay grupos {query ? `con "${query}"` : ''}
              </p>
            )}
            {filtered.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => { onChange(g.id); setOpen(false); setQuery(''); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors"
                style={{ background: value === g.id ? '#FAFAF8' : 'transparent' }}
                onMouseEnter={e => { if (value !== g.id) e.currentTarget.style.background = '#FAFAF8'; }}
                onMouseLeave={e => { if (value !== g.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: g.hasCustom ? '#FFFBEB' : '#F5F4F0' }}
                >
                  {g.hasCustom
                    ? <Lock   size={13} style={{ color: '#92400E' }} />
                    : <Layers size={13} style={{ color: '#9CA3AF' }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: '#0D0E12' }}>{g.nombre}</p>
                  <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                    {g.hasCustom ? 'Configuración propia' : 'Hereda del programa'}
                  </p>
                </div>
                {value === g.id && <CheckCircle size={14} style={{ color: '#15803D', flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SeccionPlantillas({ empresa, refreshKey }: { empresa: string; refreshKey: number }) {
  const confirm = useConfirm();
  const { programas, loading: loadingProgs } = useProgramas(empresa);
  const { grupos }   = useGrupos(empresa);
  const [logos,  setLogos]  = useState<Logo[]>([]);
  const [firmas, setFirmas] = useState<Firma[]>([]);

  /* configs: key = `${progId}-${grupoId}`, value = ProgramCfg */
  const [configs, setConfigs] = useState<Record<string, ProgramCfg>>({});
  /* baselines: snapshot (normalizado) de la config tal como se cargó/guardó,
     para deshabilitar "Guardar" cuando no hay cambios reales. */
  const [baselines, setBaselines] = useState<Record<string, string>>({});
  /* Lista de grupos con config propia por programa: progId -> Set<grupoId> */
  const [gruposConCfg, setGruposConCfg] = useState<Record<number, Set<number>>>({});
  /* Cuál grupo se está editando para cada programa (0 = default) */
  const [grupoSelected, setGrupoSelected] = useState<Record<number, number>>({});

  const [saving,    setSaving]    = useState<number | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [savedOk,   setSavedOk]   = useState<number | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [expandedId,  setExpandedId]  = useState<number | null>(null);
  const [busqueda,    setBusqueda]    = useState('');
  const [queryLogos,  setQueryLogos]  = useState('');
  const [queryFirmas, setQueryFirmas] = useState('');

  useEffect(() => {
    Promise.all([logosApi.list(empresa), firmasApi.list(empresa)])
      .then(([l, f]) => { setLogos(l); setFirmas(f); });
  }, [empresa, refreshKey]);

  const cfgKey = (progId: number, grupoId: number) => `${progId}-${grupoId}`;
  const cfg = (progId: number, grupoId: number = 0): ProgramCfg =>
    configs[cfgKey(progId, grupoId)] ?? { plantilla_url: '', texto_personalizado: '', logos: [], firmas: [], layout: null };

  /* Firma normalizada de una config para comparar cambios (orden de ids no importa). */
  const normCfg = (c: ProgramCfg) => JSON.stringify({
    plantilla_url: c.plantilla_url ?? '',
    texto_personalizado: c.texto_personalizado ?? '',
    layout: c.layout ?? null,
    logos: [...c.logos].sort((a, b) => a - b),
    firmas: [...c.firmas].sort((a, b) => a - b),
  });
  /* ¿La config (prog/grupo) cambió respecto a lo cargado/guardado? */
  const esModificado = (progId: number, grupoId: number) => {
    const k = cfgKey(progId, grupoId);
    if (baselines[k] === undefined) return true;   // aún sin baseline → no bloquear
    return normCfg(cfg(progId, grupoId)) !== baselines[k];
  };

  const setCfg = (progId: number, grupoId: number, partial: Partial<ProgramCfg>) =>
    setConfigs(prev => ({ ...prev, [cfgKey(progId, grupoId)]: { ...cfg(progId, grupoId), ...partial } }));

  const grupoActivo = (progId: number) => grupoSelected[progId] ?? 0;

  // Logo OBLIGATORIO de la empresa (planes Básico/Profesional): siempre va primero,
  // no se puede quitar ni deseleccionar. El cliente agrega/ordena los suyos aparte.
  const defaultLogo = logos.find(l => !!l.es_default) ?? null;
  const defaultLogoId = defaultLogo?.id ?? null;

  /* Cargar config base (grupo_id=0) para cada programa, y lista de grupos con config propia */
  useEffect(() => {
    if (!programas.length) return;
    programas.forEach(p => {
      configApi.get(empresa, p.id, 0)
        .then(c => {
          const cargado: ProgramCfg = {
            plantilla_url:      c.plantilla_url ?? '',
            texto_personalizado: c.texto_personalizado ?? '',
            layout: parseLayout(c.layout_personalizado),
            logos:  c.logos?.map(l => l.id)  ?? [],
            firmas: c.firmas?.map(f => f.id) ?? [],
          };
          setConfigs(prev => ({ ...prev, [cfgKey(p.id, 0)]: cargado }));
          setBaselines(prev => ({ ...prev, [cfgKey(p.id, 0)]: normCfg(cargado) }));
        })
        .catch(() => {
          const vacio: ProgramCfg = { plantilla_url: '', texto_personalizado: '', logos: [], firmas: [], layout: null };
          setConfigs(prev => ({ ...prev, [cfgKey(p.id, 0)]: vacio }));
          setBaselines(prev => ({ ...prev, [cfgKey(p.id, 0)]: normCfg(vacio) }));
        });

      configApi.listGruposConConfig(empresa, p.id)
        .then(r => setGruposConCfg(prev => ({ ...prev, [p.id]: new Set(r.grupos) })))
        .catch(() => setGruposConCfg(prev => ({ ...prev, [p.id]: new Set() })));
    });
  }, [empresa, programas, refreshKey]);

  /* Cuando el usuario cambia el grupo seleccionado en un programa, cargar su config */
  const cargarConfigGrupo = async (progId: number, grupoId: number) => {
    if (configs[cfgKey(progId, grupoId)]) return; // ya está cargada
    try {
      const c = await configApi.get(empresa, progId, grupoId);
      const cargado: ProgramCfg = {
        plantilla_url:      c.plantilla_url ?? '',
        texto_personalizado: c.texto_personalizado ?? '',
        layout: parseLayout(c.layout_personalizado),
        logos:  c.logos?.map(l => l.id)  ?? [],
        firmas: c.firmas?.map(f => f.id) ?? [],
      };
      setConfigs(prev => ({ ...prev, [cfgKey(progId, grupoId)]: cargado }));
      setBaselines(prev => ({ ...prev, [cfgKey(progId, grupoId)]: normCfg(cargado) }));
    } catch {
      // Si el grupo no tiene config, arrancamos vacío
      const vacio: ProgramCfg = { plantilla_url: '', texto_personalizado: '', logos: [], firmas: [], layout: null };
      setConfigs(prev => ({ ...prev, [cfgKey(progId, grupoId)]: vacio }));
      setBaselines(prev => ({ ...prev, [cfgKey(progId, grupoId)]: normCfg(vacio) }));
    }
  };

  const toggleLogo = (progId: number, logoId: number) => {
    if (logoId === defaultLogoId) return;   // el logo obligatorio no se quita ni se mueve
    const g = grupoActivo(progId);
    const c = cfg(progId, g);
    // El default cuenta como 1 de los MAX_SEL. Solo cuentan logos que existen (sin fantasma).
    const ocupados = c.logos.filter(id => id !== defaultLogoId && logos.some(l => l.id === id)).length + (defaultLogoId ? 1 : 0);
    if (c.logos.includes(logoId)) {
      setCfg(progId, g, { logos: c.logos.filter(id => id !== logoId) });
    } else if (ocupados < MAX_SEL) {
      setCfg(progId, g, { logos: [...c.logos, logoId] });
    }
  };

  /** Mueve un logo (incluido el obligatorio) una posición a la izq/der en el orden del cert. */
  const moveLogo = (progId: number, logoId: number, dir: -1 | 1) => {
    const g = grupoActivo(progId);
    const c = cfg(progId, g);
    const valid = c.logos.filter(id => logos.some(l => l.id === id));
    const ordered = (defaultLogoId && !valid.includes(defaultLogoId)) ? [defaultLogoId, ...valid] : valid;
    const i = ordered.indexOf(logoId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    const next = [...ordered];
    [next[i], next[j]] = [next[j], next[i]];
    setCfg(progId, g, { logos: next });
  };

  const toggleFirma = (progId: number, firmaId: number) => {
    const g = grupoActivo(progId);
    const c = cfg(progId, g);
    // Solo cuentan firmas que existen (ignora ids fantasma de firmas borradas).
    const ocupadas = c.firmas.filter(id => firmas.some(f => f.id === id)).length;
    if (c.firmas.includes(firmaId)) {
      setCfg(progId, g, { firmas: c.firmas.filter(id => id !== firmaId) });
    } else if (ocupadas < MAX_SEL) {
      setCfg(progId, g, { firmas: [...c.firmas, firmaId] });
    }
  };

  const handleUploadFondo = async (progId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(progId);
    try {
      const base64 = await toBase64(file);
      setCfg(progId, grupoActivo(progId), { plantilla_url: base64 });
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setUploading(null); }
  };

  const handleSave = async (progId: number) => {
    const g = grupoActivo(progId);
    const c = cfg(progId, g);
    setSaving(progId); setError(null); setSavedOk(null);
    try {
      // Se guarda el ORDEN elegido (incluido dónde puso el obligatorio). Se limpian
      // ids "fantasma" (logos/firmas borrados) y se garantiza que el default esté.
      const validLogos = c.logos.filter(id => logos.some(l => l.id === id));
      const logoIds = (defaultLogoId && !validLogos.includes(defaultLogoId))
        ? [defaultLogoId, ...validLogos] : validLogos;
      const firmaIds = c.firmas.filter(id => firmas.some(f => f.id === id));
      await configApi.upsert(empresa, progId, {
        plantilla_url:      c.plantilla_url || null,
        texto_personalizado: c.texto_personalizado || null,
        layout_personalizado: c.layout ? JSON.stringify(c.layout) : null,
        logo_ids:  logoIds,
        firma_ids: firmaIds,
        grupo_id:  g,
      });
      // Si guardamos para un grupo, refrescar lista de grupos con config
      if (g !== 0) {
        setGruposConCfg(prev => {
          const next = { ...prev };
          const set = new Set(next[progId] ?? []);
          set.add(g);
          next[progId] = set;
          return next;
        });
      }
      // Lo guardado pasa a ser el nuevo baseline (ya no hay cambios pendientes).
      setBaselines(prev => ({ ...prev, [cfgKey(progId, g)]: normCfg(c) }));
      setSavedOk(progId);
      setTimeout(() => setSavedOk(null), 2500);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setSaving(null); }
  };

  /* Eliminar config del grupo → vuelve a heredar del programa */
  const handleEliminarConfigGrupo = async (progId: number, grupoId: number) => {
    if (!(await confirm({
      title: 'Eliminar configuración del grupo',
      message: 'El grupo volverá a usar la configuración del programa.',
      confirmText: 'Eliminar',
      variant: 'danger',
    }))) return;
    try {
      await configApi.eliminarConfigGrupo(empresa, progId, grupoId);
      setConfigs(prev => {
        const next = { ...prev };
        delete next[cfgKey(progId, grupoId)];
        return next;
      });
      setGruposConCfg(prev => {
        const next = { ...prev };
        const set = new Set(next[progId] ?? []);
        set.delete(grupoId);
        next[progId] = set;
        return next;
      });
      // Volver al default
      setGrupoSelected(prev => ({ ...prev, [progId]: 0 }));
    } catch (e: unknown) { setError((e as Error).message); }
  };

  if (loadingProgs) return <div className="flex justify-center py-8" style={{ color: '#D1D5DB' }}><Loader2 size={20} className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FFFBEB' }}>
          <Settings size={15} style={{ color: '#D97706' }} />
        </div>
        <div>
          <p className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Plantillas de certificado</p>
          <p className="text-[12px]" style={{ color: '#9CA3AF' }}>Configura fondo, logos y firmas por programa — máx. 3 logos y 3 firmas</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[13px] px-4 py-3 rounded-xl"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {programas.length === 0 && (
        <div className="bg-white rounded-2xl py-10 text-center" style={{ border: '1px solid #EEECE6' }}>
          <BookOpen size={24} style={{ color: '#D1D5DB', margin: '0 auto 8px' }} />
          <p className="text-[13px]" style={{ color: '#9CA3AF' }}>Crea programas primero</p>
        </div>
      )}

      {/* Búsqueda y acciones globales */}
      {programas.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
            <input
              type="text"
              placeholder="Buscar programa..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="vx-input vx-input-icon"
            />
          </div>
          {expandedId !== null && (
            <button
              onClick={() => setExpandedId(null)}
              className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl transition-all flex-shrink-0"
              style={{ background: '#fff', color: '#6B7280', border: '1px solid #EEECE6' }}
            >
              <ChevronUp size={12} /> Cerrar todo
            </button>
          )}
        </div>
      )}

      {programas
        .filter(p => !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
        .map(p => {
        const g = grupoActivo(p.id);
        const c = cfg(p.id, g);
        const baseCfg = cfg(p.id, 0);                        // siempre referencia la del programa para los badges
        // Orden efectivo de logos: ids válidos (sin fantasma) con el obligatorio
        // garantizado. Este array DEFINE el orden en el certificado (reordenable).
        const validLogos = c.logos.filter(id => logos.some(l => l.id === id));
        const orderedLogos = (defaultLogoId && !validLogos.includes(defaultLogoId))
          ? [defaultLogoId, ...validLogos] : validLogos;
        const clientLogos = orderedLogos.filter(id => id !== defaultLogoId);
        const maxLogosCliente = MAX_SEL - (defaultLogo ? 1 : 0);
        const logosSel  = clientLogos.length;     // solo lo que el cliente seleccionó
        // Firmas que existen (ignora fantasma de firmas borradas).
        const clientFirmas = c.firmas.filter(id => firmas.some(f => f.id === id));
        const firmasSel = clientFirmas.length;
        const isExpanded = expandedId === p.id;
        const hasFondo   = !!baseCfg.plantilla_url;
        const hasTexto   = !!baseCfg.texto_personalizado?.trim();
        const totalConfig = (hasFondo ? 1 : 0) + (hasTexto ? 1 : 0) + baseCfg.logos.length + baseCfg.firmas.length;
        const gruposProg = grupos.filter(gr => gr.programa_id === p.id);
        const gruposConCfgSet = gruposConCfg[p.id] ?? new Set();
        const grupoEsCustom = g !== 0 && gruposConCfgSet.has(g);
        // Logos/firmas seleccionados (en el orden definido) para la vista previa en vivo.
        const selLogos  = orderedLogos.map(id => logos.find(l => l.id === id)).filter(Boolean) as Logo[];
        const selFirmas = c.firmas.map(id => firmas.find(f => f.id === id)).filter(Boolean) as Firma[];

        return (
          <div key={p.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #EEECE6' }}>
            {/* Header colapsable */}
            <div
              className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors"
              style={{
                borderBottom: isExpanded ? '1px solid #F5F4F0' : undefined,
                background: isExpanded ? '#FAFAF8' : 'transparent',
              }}
              onClick={() => setExpandedId(isExpanded ? null : p.id)}
              onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = '#FAFAF8'; }}
              onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Icono del programa */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hasFondo || logosSel || firmasSel ? '#F0FDF4' : '#F5F4F0', color: hasFondo || logosSel || firmasSel ? '#15803D' : '#9CA3AF' }}>
                <BookOpen size={15} />
              </div>

              {/* Nombre + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold truncate" style={{ color: '#0D0E12' }}>{p.nombre}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[11px]" style={{ color: '#9CA3AF' }}>{p.tipo_programa_nombre} · {p.horas_academicas}h</span>
                  {hasFondo  && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: '#F0FDF4', color: '#15803D' }}>Fondo</span>}
                  {hasTexto  && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: '#F5F3FF', color: '#7C3AED' }}>Texto</span>}
                  {(logosSel + (defaultLogo ? 1 : 0)) > 0 && (() => { const t = logosSel + (defaultLogo ? 1 : 0); return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: '#EFF6FF', color: '#2563EB' }}>{t} {t === 1 ? 'logo' : 'logos'}</span>; })()}
                  {firmasSel > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: '#FEF3C7', color: '#92400E' }}>{firmasSel} {firmasSel === 1 ? 'firma' : 'firmas'}</span>}
                  {totalConfig === 0 && <span className="text-[10px] italic" style={{ color: '#B0A898' }}>Sin configurar</span>}
                </div>
              </div>

              {/* Botón guardar (visible solo cuando expandido) + Chevron */}
              {isExpanded && (
                <button
                  onClick={e => { e.stopPropagation(); handleSave(p.id); }}
                  disabled={saving === p.id || (!esModificado(p.id, g) && savedOk !== p.id)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold px-3.5 py-2 rounded-xl transition-all flex-shrink-0 disabled:opacity-50"
                  style={savedOk === p.id
                    ? { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
                    : { background: '#0D0E12', color: '#fff' }
                  }
                >
                  {saving === p.id ? <Loader2 size={13} className="animate-spin" /> : savedOk === p.id ? <CheckCircle size={13} /> : <Save size={13} />}
                  {saving === p.id
                    ? 'Guardando...'
                    : savedOk === p.id
                      ? '¡Guardado!'
                      : g === 0 ? 'Guardar' : 'Guardar para este grupo'}
                </button>
              )}

              <ChevronDown
                size={16}
                style={{
                  color: '#9CA3AF',
                  transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 200ms ease',
                  flexShrink: 0,
                }}
              />
            </div>

            {/* Body (solo si expandido) */}
            {isExpanded && (
            <div className="p-5 space-y-5 page-fade">

              {/* ── Selector: configuración base o por grupo ───── */}
              <div
                className="rounded-2xl p-4"
                style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#374151' }}>
                  Configurando
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <GrupoCombobox
                    value={g}
                    options={gruposProg.map(gr => ({
                      id: gr.id,
                      nombre: gr.nombre_grupo,
                      hasCustom: gruposConCfgSet.has(gr.id),
                    }))}
                    onChange={async val => {
                      setGrupoSelected(prev => ({ ...prev, [p.id]: val }));
                      if (val !== 0) await cargarConfigGrupo(p.id, val);
                    }}
                  />

                  {/* Etiqueta de estado del grupo */}
                  {g !== 0 && (
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={grupoEsCustom
                        ? { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }
                        : { background: '#F5F4F0', color: '#92400E', border: '1px solid #EEECE6' }
                      }
                    >
                      {grupoEsCustom ? 'Configuración propia' : 'Usando la del programa'}
                    </span>
                  )}

                  {/* Botón para volver a usar la config del programa */}
                  {g !== 0 && grupoEsCustom && (
                    <button
                      onClick={() => handleEliminarConfigGrupo(p.id, g)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl transition-all"
                      style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
                      title="Borra la configuración propia de este grupo y vuelve a usar la del programa"
                    >
                      <Trash2 size={12} />
                      Usar la del programa
                    </button>
                  )}
                </div>

                {/* Mini-explicación */}
                <p className="text-[11.5px] mt-2 leading-relaxed" style={{ color: '#9CA3AF' }}>
                  {g === 0
                    ? 'Configuración por defecto del programa. Los grupos sin configuración propia usan esta.'
                    : grupoEsCustom
                      ? `Este grupo guarda su propia configuración. Aunque cambies la del programa, este grupo (y sus certificados, incluso los que emitas después) seguirán usando esta. Los cambios aquí solo afectan a "${gruposProg.find(x => x.id === g)?.nombre_grupo}".`
                      : `Estás viendo la configuración del programa. Si la guardas aquí, este grupo la conservará tal cual, aunque luego cambies la del programa — útil para emitir certificados atrasados con la misma configuración que sus compañeros.`
                  }
                </p>
              </div>

              {/* Vista previa en vivo del certificado */}
              <div className="rounded-2xl p-4" style={{ background: '#0F1115', border: '1px solid #1F2937' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                    Vista previa
                  </p>
                  <span className="text-[10.5px]" style={{ color: '#6B7280' }}>
                    datos de ejemplo · así quedará al emitir
                  </span>
                </div>
                <div className="flex justify-center overflow-x-auto">
                  <CertificadoPreview
                    plantillaUrl={c.plantilla_url}
                    logos={selLogos}
                    firmas={selFirmas}
                    texto={c.texto_personalizado}
                    tipoPrograma={p.tipo_programa_nombre}
                    programaNombre={p.nombre}
                    horas={p.horas_academicas}
                    creditos={p.creditos}
                    layout={c.layout}
                    displayWidth={640}
                  />
                </div>
              </div>

              {/* Fondo + Texto en dos columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Fondo */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#374151' }}>
                    Fondo del certificado
                  </p>
                  {c.plantilla_url ? (
                    <div className="relative rounded-xl overflow-hidden group" style={{ border: '1px solid #EEECE6', height: 170, background: '#FAFAF8' }}>
                      <img src={imgUrl(c.plantilla_url)} alt="Fondo" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(13,14,18,0.6)' }}>
                        <label className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer"
                          style={{ background: '#fff', color: '#0D0E12' }}>
                          <Upload size={11} /> Cambiar
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadFondo(p.id, e)} />
                        </label>
                        <button onClick={() => setCfg(p.id, g, { plantilla_url: '' })}
                          className="p-1.5 rounded-lg" style={{ background: '#EF4444', color: '#fff' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                      {uploading === p.id && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                          <Loader2 size={18} className="animate-spin" style={{ color: '#fff' }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                      style={{ border: '1.5px dashed #EEECE6', height: 170 }}>
                      {uploading === p.id
                        ? <Loader2 size={18} className="animate-spin" style={{ color: '#D1D5DB' }} />
                        : <>
                            <ImageIcon size={20} style={{ color: '#D1D5DB' }} />
                            <span className="text-[12px]" style={{ color: '#B0A898' }}>Subir fondo (PNG/JPG)</span>
                          </>
                      }
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => handleUploadFondo(p.id, e)} disabled={uploading === p.id} />
                    </label>
                  )}
                </div>

                {/* Texto personalizado con variables insertables */}
                <TextoCertificadoField
                  value={c.texto_personalizado}
                  onChange={v => setCfg(p.id, g, { texto_personalizado: v })}
                  placeholder={`Por haber completado satisfactoriamente el programa "${p.nombre}" con una duración de ${p.horas_academicas} horas académicas...`}
                />
              </div>

              {/* Diseño personalizado (Lienzo) — servicio a medida */}
              <EditorLienzo
                value={c.layout}
                onChange={l => setCfg(p.id, g, { layout: l })}
              />

              {/* Logos — multi-select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#374151' }}>
                    Logos
                  </p>
                  <span className="text-[11px] font-medium" style={{ color: logosSel >= maxLogosCliente ? '#D97706' : '#9CA3AF' }}>
                    {logosSel}/{maxLogosCliente} seleccionados{defaultLogo ? ' · +1 obligatorio' : ''}
                  </span>
                </div>

                {logos.length === 0 ? (
                  <p className="text-[12px]" style={{ color: '#B0A898' }}>Sube logos en la sección superior primero</p>
                ) : (
                  <>
                    {logos.length > 6 && (
                      <div className="relative mb-2">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
                        <input
                          type="text"
                          value={queryLogos}
                          onChange={e => setQueryLogos(e.target.value)}
                          placeholder={`Buscar entre ${logos.length} logos...`}
                          className="vx-input"
                          style={{ padding: '6px 10px 6px 28px', fontSize: 12 }}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[280px] overflow-y-auto p-0.5">
                      {logos
                        .filter(l => !queryLogos || (l.nombre ?? '').toLowerCase().includes(queryLogos.toLowerCase()))
                        .map(logo => {
                      const esDef = !!logo.es_default;
                      const selected = orderedLogos.includes(logo.id);
                      const full = !esDef && logosSel >= maxLogosCliente && !selected;
                      return (
                        <div
                          key={logo.id}
                          onClick={() => { if (esDef || full) return; toggleLogo(p.id, logo.id); }}
                          className="relative rounded-xl overflow-hidden transition-all duration-150 select-none"
                          style={{
                            border: esDef ? '2px solid #10B981' : selected ? '2px solid #2563EB' : '1.5px solid #EEECE6',
                            opacity: full ? 0.4 : 1,
                            cursor: esDef ? 'default' : full ? 'not-allowed' : 'pointer',
                          }}
                          title={esDef ? 'Logo de la empresa: obligatorio (no se puede quitar)' : (logo.nombre ?? undefined)}
                        >
                          {selected && !esDef && (
                            <span className="absolute top-1 left-1 z-10 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                              style={{ background: '#2563EB', color: '#fff' }}>✓</span>
                          )}
                          {esDef && (
                            <span className="absolute top-1 right-1 z-10 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
                              Obligatorio
                            </span>
                          )}
                          <img src={imgUrl(logo.imagen_logo)} alt={logo.nombre ?? 'logo'}
                            className="w-full h-16 object-contain p-1.5"
                            style={{ background: esDef ? '#ECFDF5' : selected ? '#EFF6FF' : '#FAFAF8' }} />
                          {logo.nombre && (
                            <p className="text-[10px] px-1.5 py-1 truncate text-center"
                              style={{ color: esDef ? '#047857' : selected ? '#1D4ED8' : '#9CA3AF', borderTop: '1px solid #F5F4F0', background: esDef ? '#ECFDF5' : selected ? '#EFF6FF' : '#fff' }}>
                              {logo.nombre}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    </div>

                    {/* ── Orden en el certificado: tira con flechas SIEMPRE visibles ── */}
                    {selLogos.length > 0 && (
                      <div className="mt-3 rounded-xl p-3" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#374151' }}>
                          Orden en el certificado
                        </p>
                        <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
                          {selLogos.map((logo, i) => {
                            const esDef = !!logo.es_default;
                            return (
                              <div key={logo.id} className="flex-shrink-0 rounded-lg overflow-hidden" style={{ width: 96, background: '#fff', border: `1.5px solid ${esDef ? '#A7F3D0' : '#E5E7EB'}` }}>
                                <div className="flex items-center justify-between px-1.5 py-1" style={{ background: esDef ? '#ECFDF5' : '#F8FAFC' }}>
                                  <span className="text-[10px] font-bold" style={{ color: esDef ? '#047857' : '#475569' }}>#{i + 1}</span>
                                  {esDef && <span className="text-[8px] font-bold" style={{ color: '#047857' }}>OBLIG.</span>}
                                </div>
                                <img src={imgUrl(logo.imagen_logo)} alt={logo.nombre ?? 'logo'} className="w-full h-12 object-contain p-1" />
                                <div className="flex items-center justify-between px-1 py-1" style={{ borderTop: '1px solid #F0EEE9' }}>
                                  <button type="button" disabled={i === 0} onClick={() => moveLogo(p.id, logo.id, -1)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center"
                                    style={{ border: '1px solid #E5E7EB', background: '#fff', opacity: i === 0 ? 0.3 : 1, cursor: i === 0 ? 'default' : 'pointer' }}
                                    title="Mover a la izquierda">
                                    <ChevronLeft size={14} style={{ color: '#374151' }} />
                                  </button>
                                  <button type="button" disabled={i === selLogos.length - 1} onClick={() => moveLogo(p.id, logo.id, 1)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center"
                                    style={{ border: '1px solid #E5E7EB', background: '#fff', opacity: i === selLogos.length - 1 ? 0.3 : 1, cursor: i === selLogos.length - 1 ? 'default' : 'pointer' }}
                                    title="Mover a la derecha">
                                    <ChevronRight size={14} style={{ color: '#374151' }} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10.5px] mt-1.5" style={{ color: '#9CA3AF' }}>
                          Así saldrán de izquierda a derecha. Usa ◀ ▶ para moverlos (el obligatorio también).
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Firmas — multi-select */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#374151' }}>
                    Firmas
                  </p>
                  <span className="text-[11px] font-medium" style={{ color: firmasSel === MAX_SEL ? '#D97706' : '#9CA3AF' }}>
                    {firmasSel}/{MAX_SEL} seleccionadas
                  </span>
                </div>

                {firmas.length === 0 ? (
                  <p className="text-[12px]" style={{ color: '#B0A898' }}>Sube firmas en la sección superior primero</p>
                ) : (
                  <>
                    {firmas.length > 5 && (
                      <div className="relative mb-2">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
                        <input
                          type="text"
                          value={queryFirmas}
                          onChange={e => setQueryFirmas(e.target.value)}
                          placeholder={`Buscar entre ${firmas.length} firmas...`}
                          className="vx-input"
                          style={{ padding: '6px 10px 6px 28px', fontSize: 12 }}
                        />
                      </div>
                    )}
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto p-0.5">
                      {firmas
                        .filter(f => !queryFirmas ||
                          f.nombre_autoridad.toLowerCase().includes(queryFirmas.toLowerCase()) ||
                          f.cargo.toLowerCase().includes(queryFirmas.toLowerCase())
                        )
                        .map(firma => {
                      const pos = clientFirmas.indexOf(firma.id) + 1;  // posición entre firmas existentes
                      const selected = pos > 0;
                      const full = firmasSel >= MAX_SEL && !selected;
                      return (
                        <button
                          key={firma.id}
                          type="button"
                          onClick={() => !full && toggleFirma(p.id, firma.id)}
                          disabled={full}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
                          style={{
                            border: selected ? '1.5px solid #7C3AED' : '1.5px solid #EEECE6',
                            background: selected ? '#F5F3FF' : '#FAFAF8',
                            opacity: full ? 0.4 : 1,
                            cursor: full ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {/* Indicador de posición */}
                          <div
                            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
                            style={{
                              background: selected ? '#7C3AED' : '#E5E7EB',
                              color: selected ? '#fff' : '#9CA3AF',
                            }}
                          >
                            {selected ? pos : '·'}
                          </div>
                          <img src={imgUrl(firma.imagen_firma)} alt={firma.nombre_autoridad}
                            className="h-8 w-20 object-contain rounded flex-shrink-0"
                            style={{ background: '#F0EEE9' }} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold truncate" style={{ color: selected ? '#5B21B6' : '#0D0E12' }}>
                              {firma.nombre_autoridad}
                            </p>
                            <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>{firma.cargo}</p>
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  </>
                )}
              </div>
            </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function AdminConfig() {
  const { empresa } = useParams<{ empresa: string }>();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="space-y-6 page-enter">
      {/* Banner */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
        style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <CheckCircle size={15} style={{ color: '#D97706', flexShrink: 0, marginTop: 1 }} />
        <p className="text-[13px] leading-relaxed" style={{ color: '#92400E' }}>
          Primero sube tus <strong>logos</strong> y <strong>firmas</strong>. Luego en <strong>Plantillas</strong> selecciona cuáles usar en cada programa — puedes elegir hasta <strong>3 logos</strong> y <strong>3 firmas</strong> por certificado.
        </p>
      </div>

      {/* Logos y Firmas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SeccionLogos empresa={empresa!} onChanged={refresh} />
        <SeccionFirmas empresa={empresa!} onChanged={refresh} />
      </div>

      <div className="h-px" style={{ background: '#EEECE6' }} />

      {/* Plantillas */}
      <SeccionPlantillas empresa={empresa!} refreshKey={refreshKey} />
    </div>
  );
}
