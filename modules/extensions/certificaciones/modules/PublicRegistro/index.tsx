import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, UserPlus } from '@/components/ui/icon';
import { isPossiblePhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { publicApi } from '../../shared/api/public.api';
import { useBranding } from '../../shared/components/CertificadosLayout';
import BrandRow from '../../shared/components/BrandRow';
import BrandAside from '../../shared/components/BrandAside';
import PhoneField from '../../shared/components/PhoneField';
import ProgramaGrupoPicker from '../../shared/components/ProgramaGrupoPicker';
import { aTituloNombre } from '../../shared/utils/text';
import { ApiError }  from '@/lib/api/client';
import { certPath }  from '@/lib/paths';
import type { Catalogos, Grupo, RegistroPublicoDto } from '../../shared/types';

type Paso = 'formulario' | 'exito';

const NOMBRE_MAX   = 100;
const APELLIDO_MAX = 100;
const DOC_MAX      = 20;

const PAGE = { background: '#F4F2EC' } as const;
const CARD = { background: '#FFFFFF', border: '1px solid #EAE7DF', boxShadow: '0 18px 50px rgba(13,14,18,0.07)' } as const;

/** Regla de validación del N.° de documento según el tipo seleccionado. */
function getDocRule(codigo?: string): { max: number; numeric: boolean; hint: string } {
  const c = (codigo ?? '').toUpperCase();
  if (c.includes('DNI'))                        return { max: 8,  numeric: true,  hint: '8 dígitos' };
  if (c.includes('RUC'))                        return { max: 11, numeric: true,  hint: '11 dígitos' };
  if (c.includes('CE') || c.includes('EXTRANJER')) return { max: 12, numeric: false, hint: 'hasta 12 caracteres' };
  if (c.includes('PAS'))                        return { max: 12, numeric: false, hint: 'hasta 12 caracteres' };
  return { max: DOC_MAX, numeric: false, hint: `hasta ${DOC_MAX} caracteres` };
}

/** Etiqueta de sección dentro del formulario. */
function SectionLabel({ n, children }: { n: number; children: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
        style={{ background: '#0D0E12', color: '#FFFFFF' }}
      >
        {n}
      </span>
      <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#374151' }}>{children}</span>
    </div>
  );
}

export default function PublicRegistro() {
  const { empresa } = useParams<{ empresa: string }>();
  const { activo } = useBranding();
  const [searchParams] = useSearchParams();
  // Link compartido por la empresa: ?programa=ID preselecciona el programa,
  // ?grupo=ID preselecciona el aula concreta.
  const programaParam = Number(searchParams.get('programa')) || undefined;
  const grupoParam    = Number(searchParams.get('grupo')) || 0;
  const [paso,          setPaso]         = useState<Paso>('formulario');
  const [loading,       setLoading]      = useState(false);
  const [loadingData,   setLoadingData]  = useState(true);
  const [error,         setError]        = useState<string | null>(null);
  const [catalogos,     setCatalogos]    = useState<Catalogos | null>(null);
  const [grupos,        setGrupos]       = useState<Grupo[]>([]);
  const [inscripcionId, setInscripcionId] = useState<number | null>(null);

  const [form, setForm] = useState<RegistroPublicoDto>({
    tipo_documento_id: 0, numero_documento: '', nombres: '',
    apellidos: '', email: '', telefono: '', grupo_id: grupoParam,
  });
  const [yaRegistrado, setYaRegistrado] = useState(false);
  const [buscando,     setBuscando]     = useState(false);

  useEffect(() => {
    // Empresa desactivada: no se cargan programas; la inscripción está cerrada.
    if (!activo) { setLoadingData(false); return; }
    Promise.all([publicApi.getCatalogos(empresa!), publicApi.getGrupos(empresa!)])
      .then(([cat, grp]) => { setCatalogos(cat); setGrupos(grp); })
      .catch(() => setError('No se pudo cargar la información. Intenta recargar la página.'))
      .finally(() => setLoadingData(false));
  }, [empresa, activo]);

  const set = (field: keyof RegistroPublicoDto, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }));

  // Regla del documento según el tipo elegido (límite y si es solo numérico).
  const docRule = getDocRule(
    catalogos?.tipos_documento.find(td => td.id === form.tipo_documento_id)?.codigo
  );

  // Filtra y recorta lo que escribe el alumno según el tipo de documento.
  const sanitizeDoc = (raw: string, rule = docRule) => {
    const cleaned = rule.numeric ? raw.replace(/\D/g, '') : raw.replace(/[^a-zA-Z0-9]/g, '');
    return cleaned.slice(0, rule.max);
  };

  // Al cambiar el N.° de documento: si veníamos de un alumno ya completado,
  // borramos sus datos anteriores (ya no corresponde seguir autocompletado).
  const handleDocChange = (raw: string) => {
    const v = sanitizeDoc(raw);
    if (yaRegistrado) {
      setForm(f => ({ ...f, numero_documento: v, nombres: '', apellidos: '', email: '', telefono: '' }));
      setYaRegistrado(false);
    } else {
      set('numero_documento', v);
    }
  };

  // Al cambiar el tipo de documento, re-aplicamos su regla al número ya escrito.
  const handleTipoChange = (id: number) => {
    const rule = getDocRule(catalogos?.tipos_documento.find(td => td.id === id)?.codigo);
    setForm(f => ({ ...f, tipo_documento_id: id, numero_documento: sanitizeDoc(f.numero_documento, rule) }));
  };

  // Autocompletado: al terminar de escribir el documento, busca si ya está registrado.
  // `reqId` garantiza que solo aplique la respuesta de la ÚLTIMA búsqueda.
  const reqIdRef = useRef(0);
  useEffect(() => {
    const d = form.numero_documento.trim();
    if (d.length < 6) return;
    const reqId = ++reqIdRef.current;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const p = await publicApi.buscarParticipante(empresa!, d);
        if (reqId !== reqIdRef.current) return;
        setForm(f => ({
          ...f,
          tipo_documento_id: p.tipo_documento_id || f.tipo_documento_id,
          nombres: p.nombres, apellidos: p.apellidos,
          email: p.email ?? '', telefono: p.telefono ?? '',
        }));
        setYaRegistrado(true);
      } catch {
        if (reqId !== reqIdRef.current) return;
        setYaRegistrado(false);
      } finally {
        if (reqId === reqIdRef.current) setBuscando(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [form.numero_documento, empresa]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.tipo_documento_id || !form.grupo_id) { setError('Selecciona tipo de documento y programa'); return; }
    // Validación del teléfono según el país (solo si se ingresó y es editable).
    if (!yaRegistrado && form.telefono && !isPossiblePhoneNumber(form.telefono)) {
      setError('El número de teléfono está incompleto para el país seleccionado.');
      return;
    }
    setLoading(true); setError(null);
    try {
      // País (ISO-2) derivado del teléfono, solo para alumnos nuevos (editable).
      const telefono_pais = (!yaRegistrado && form.telefono)
        ? (parsePhoneNumber(form.telefono)?.country ?? null)
        : null;
      const { inscripcion_id } = await publicApi.registro(empresa!, { ...form, telefono_pais });
      setInscripcionId(inscripcion_id);
      setPaso('exito');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al procesar tu registro. Intenta nuevamente.');
    } finally { setLoading(false); }
  };

  const handleNuevo = () => {
    setPaso('formulario');
    setForm({ tipo_documento_id: 0, numero_documento: '', nombres: '', apellidos: '', email: '', telefono: '', grupo_id: 0 });
    setError(null);
    setYaRegistrado(false);
  };

  const lockStyle = yaRegistrado ? { background: '#F4F2EC', color: '#6B7280' } : undefined;

  /* ── Empresa desactivada: inscripción cerrada ─────────────── */
  if (!activo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={PAGE}>
        <div className="w-full max-w-[440px]">
          <div className="rounded-[20px] p-9 text-center page-enter" style={CARD}>
            <div className="lg:hidden mb-6"><BrandRow /></div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: '#FEF2F2', border: '2px solid #FECACA' }}
            >
              <AlertCircle size={32} style={{ color: '#DC2626' }} />
            </div>
            <h1 className="text-[22px] font-bold mb-2" style={{ color: '#0D0E12' }}>Inscripciones cerradas</h1>
            <p className="text-[14px]" style={{ color: '#6B7280' }}>
              Esta institución no está aceptando nuevas inscripciones en este momento.
            </p>
            <p className="text-[13px] mt-3 mb-6" style={{ color: '#9CA3AF' }}>
              ¿Necesitas validar un certificado ya emitido? Hazlo aquí:
            </p>
            <Link
              to={certPath(empresa!, '/validar')}
              className="vx-btn vx-btn-primary w-full py-3 inline-flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} /> Validar un certificado
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Éxito ────────────────────────────────────────────────── */
  if (paso === 'exito') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10" style={PAGE}>
        <div className="w-full max-w-[440px]">
          <div className="rounded-[20px] p-9 text-center page-enter" style={CARD}>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: '#F0FDF4', border: '2px solid #BBF7D0' }}
            >
              <CheckCircle size={32} style={{ color: '#15803D' }} />
            </div>
            <h1 className="text-[23px] font-bold mb-2" style={{ color: '#0D0E12' }}>¡Registro exitoso!</h1>
            <p className="text-[14px]" style={{ color: '#6B7280' }}>Tu inscripción ha sido registrada correctamente.</p>
            {inscripcionId && (
              <p className="text-[12px] mt-2 font-mono" style={{ color: '#B0A898' }}>
                N.° de inscripción: <strong style={{ color: '#0D0E12' }}>#{inscripcionId}</strong>
              </p>
            )}
            <div
              className="my-6 rounded-2xl px-4 py-3 text-[13px]"
              style={{ background: '#FBF7EC', border: '1px solid #EBD9A8', color: '#7A5B16' }}
            >
              Al aprobar el programa, recibirás tu certificado digital.
            </div>
            <button
              onClick={handleNuevo}
              className="text-[13px] font-semibold transition-opacity hover:opacity-70"
              style={{ color: '#C9962C' }}
            >
              Registrar otro participante →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Formulario ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-10 flex items-start lg:items-center justify-center" style={PAGE}>
      <div className="w-full max-w-[1180px] grid lg:grid-cols-[300px_1fr] gap-8 lg:gap-16 items-start lg:items-center">

        {/* Columna izquierda · logo de la institución (solo desktop) */}
        <BrandAside subtitulo="INSCRIPCIÓN AL PROGRAMA" />

        {/* Columna derecha · formulario */}
        <div className="w-full max-w-2xl mx-auto">
          {/* Marca compacta solo en móvil (en desktop está a la izquierda) */}
          <div className="lg:hidden mb-4">
            <BrandRow />
          </div>

        <div className="rounded-[20px] p-6 lg:p-9 page-enter" style={CARD}>
          <div className="mb-7">
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Inscripción al programa</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Completa tus datos y elige el programa.</p>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-12" style={{ color: '#D1D5DB' }}>
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-7">

              {/* 1 · Programa */}
              <div>
                <SectionLabel n={1}>Programa y horario</SectionLabel>
                <ProgramaGrupoPicker grupos={grupos} value={form.grupo_id} onChange={id => set('grupo_id', id)} initialProgramaId={programaParam} />
                {grupos.length === 0 && (
                  <p className="text-[12px] mt-1.5" style={{ color: '#C9962C' }}>No hay programas disponibles actualmente.</p>
                )}
              </div>

              {/* 2 · Identificación */}
              <div>
                <SectionLabel n={2}>Tus datos</SectionLabel>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#6B7280' }}>Tipo de doc.</label>
                    <select required value={form.tipo_documento_id} onChange={e => handleTipoChange(+e.target.value)} className="vx-input" disabled={yaRegistrado}>
                      <option value={0} disabled>Tipo</option>
                      {catalogos?.tipos_documento.map(td => (
                        <option key={td.id} value={td.id}>{td.codigo}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#6B7280' }}>N.° de documento</label>
                    <div className="relative">
                      <input type="text" required maxLength={docRule.max}
                        inputMode={docRule.numeric ? 'numeric' : 'text'}
                        value={form.numero_documento}
                        onChange={e => handleDocChange(e.target.value)}
                        placeholder="12345678" className="vx-input" />
                      {buscando && <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#C9962C' }} />}
                    </div>
                    <p className="text-[11px] mt-1" style={{ color: '#B0A898' }}>{docRule.hint}</p>
                  </div>
                </div>

                {yaRegistrado && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[12px]" style={{ background: '#F0FAF4', border: '1px solid #CDEBD8', color: '#15803D' }}>
                    <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      Ya estás registrado — usamos tus datos guardados (ocultos en parte por seguridad).
                      Si alguno cambió, contacta con la institución. Solo elige el programa.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#6B7280' }}>Nombres</label>
                    <input type="text" required maxLength={NOMBRE_MAX} value={form.nombres}
                      onChange={e => set('nombres', e.target.value)}
                      onBlur={() => set('nombres', aTituloNombre(form.nombres))}
                      readOnly={yaRegistrado}
                      style={lockStyle} placeholder="María Fernanda" className="vx-input" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#6B7280' }}>Apellidos</label>
                    <input type="text" required maxLength={APELLIDO_MAX} value={form.apellidos}
                      onChange={e => set('apellidos', e.target.value)}
                      onBlur={() => set('apellidos', aTituloNombre(form.apellidos))}
                      readOnly={yaRegistrado}
                      style={lockStyle} placeholder="García López" className="vx-input" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#6B7280' }}>Correo <span style={{ color: '#B0A898' }}>· opcional</span></label>
                    <input type="email" value={form.email ?? ''}
                      onChange={e => set('email', e.target.value)} readOnly={yaRegistrado}
                      style={lockStyle} placeholder="correo@ejemplo.com" className="vx-input" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#6B7280' }}>Teléfono <span style={{ color: '#B0A898' }}>· opcional</span></label>
                    {yaRegistrado ? (
                      <input type="tel" value={form.telefono ?? ''} readOnly
                        style={lockStyle} className="vx-input" />
                    ) : (
                      <>
                        <PhoneField
                          value={form.telefono ?? ''}
                          onChange={v => set('telefono', v)}
                        />
                        {/* Validación en vivo según la cantidad de dígitos del país */}
                        {form.telefono && (
                          isPossiblePhoneNumber(form.telefono) ? (
                            <p className="flex items-center gap-1 text-[11px] mt-1" style={{ color: '#15803D' }}>
                              <CheckCircle size={12} className="flex-shrink-0" /> Número completo
                            </p>
                          ) : (
                            <p className="flex items-center gap-1 text-[11px] mt-1" style={{ color: '#DC2626' }}>
                              <AlertCircle size={12} className="flex-shrink-0" /> Faltan dígitos para el país seleccionado
                            </p>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px]"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
                  <AlertCircle size={14} className="flex-shrink-0" /> {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="vx-btn vx-btn-primary w-full py-3">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={15} />}
                {loading ? 'Registrando...' : 'Inscribirme al programa'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[12px] mt-5" style={{ color: '#B7B1A6' }}>
          ¿Ya tienes certificado?{' '}
          <a href={certPath(empresa!, '/validar')} className="font-semibold hover:opacity-70 transition-opacity" style={{ color: '#C9962C' }}>
            Verifícalo aquí
          </a>
        </p>
        </div>
      </div>
    </div>
  );
}
