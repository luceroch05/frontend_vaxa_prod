import { useState, FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { certPath } from '@/lib/paths';
import { Search, Loader2, BadgeCheck, XCircle, QrCode, Download } from '@/components/ui/icon';
import { useValidarCertificado } from '../../shared/hooks/useCertificados';
import { periodoCurso } from '../../shared/utils/certVariables';
import BrandRow from '../../shared/components/BrandRow';
import BrandAside from '../../shared/components/BrandAside';
import VaxaFooter from '../../shared/components/VaxaFooter';

const PAGE = { background: '#F4F2EC' } as const;
const CARD = { background: '#FFFFFF', border: '1px solid #EAE7DF', boxShadow: '0 18px 50px rgba(13,14,18,0.07)' } as const;

function formatDate(d: string | Date) {
  if (!d) return '—';
  const s = typeof d === 'string' ? d.substring(0, 10) : d.toISOString().substring(0, 10);
  return new Date(s + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Campo en modo "echado": etiqueta chica arriba y valor debajo, para acomodar
 *  varios datos en una grilla de 2 columnas (en vez de una fila por dato). */
function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#B0A898' }}>{label}</p>
      <p className="text-[13.5px] font-semibold leading-snug" style={{ color: '#0D0E12' }}>{value}</p>
    </div>
  );
}

export default function PublicValidar() {
  const { empresa }      = useParams<{ empresa: string }>();
  const [searchParams]   = useSearchParams();
  const { resultado, loading, error, buscado, validar } = useValidarCertificado();
  const [codigo, setCodigo] = useState(searchParams.get('codigo') ?? '');
  const [descargando, setDescargando] = useState(false);

  useState(() => {
    const c = searchParams.get('codigo');
    if (c && empresa) validar(empresa, c);
  });

  const handleSubmit = (e: FormEvent) => { e.preventDefault(); if (empresa) validar(empresa, codigo); };

  const valid = resultado && (resultado.estado === 'EMITIDO' || resultado.estado === 'VIGENTE');
  // Con resultado en pantalla, el encabezado se encoge para que TODO entre a la vista
  // (sin scroll): título chico y sin subtítulo, dejando el alto para la tarjeta.
  const hasResultado = buscado && !loading && !!resultado;

  // URL absoluta del PDF del certificado (para el botón de descarga).
  const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
  const pdfUrl = resultado?.url
    ? (/^https?:\/\//.test(resultado.url) ? resultado.url : `${apiBase}${resultado.url.startsWith('/') ? '' : '/'}${resultado.url}`)
    : null;

  // Fuerza la DESCARGA del PDF (lo baja como archivo, no lo abre en el visor).
  const descargarCertificado = async () => {
    if (!pdfUrl || !resultado) return;
    setDescargando(true);
    try {
      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error('No disponible');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificado-${resultado.codigo_unico}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Si falla la descarga directa (CORS/red), al menos abrirlo en otra pestaña.
      window.open(pdfUrl, '_blank');
    } finally {
      setDescargando(false);
    }
  };

  // Buscador (se reusa en el aterrizaje y en la barra superior del resultado).
  const buscador = (
    <form onSubmit={handleSubmit} className="rounded-[20px] p-3 page-enter" style={CARD}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B0A898' }} />
          <input
            type="text"
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            placeholder="CERT-1-1748..."
            className="vx-input vx-input-icon font-mono"
            style={{ textTransform: 'uppercase' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !codigo.trim()}
          className="vx-btn vx-btn-primary px-5 flex-shrink-0 justify-center w-full sm:w-auto"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Verificar
        </button>
      </div>
    </form>
  );

  // ── Con resultado: layout a TODO el ancho (sin scroll) ──────────
  // El aterrizaje mete todo en una columna angosta; con un certificado encontrado
  // usamos el ancho completo (participante a la izquierda, detalles a la derecha)
  // para que quepa entero a primera vista.
  if (hasResultado && resultado) {
    return (
      <div className="min-h-screen px-4 sm:px-6 py-6 flex items-center justify-center" style={PAGE}>
        <div className="w-full max-w-[1040px]">
          {/* Barra superior: marca + buscador compacto */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="shrink-0"><BrandRow /></div>
            <div className="w-full sm:max-w-md sm:ml-auto">{buscador}</div>
          </div>

          {/* Tarjeta de resultado a todo el ancho */}
          <div
            className="rounded-[20px] overflow-hidden page-enter"
            style={{ background: '#FFFFFF', border: `1px solid ${valid ? '#BBF7D0' : '#FECACA'}`, boxShadow: '0 18px 50px rgba(13,14,18,0.07)' }}
          >
            {/* Banner estado */}
            <div
              className="px-5 py-3 flex items-center gap-2.5"
              style={{ background: valid ? '#F0FDF4' : '#FEF2F2', borderBottom: `1px solid ${valid ? '#BBF7D0' : '#FECACA'}` }}
            >
              {valid ? <BadgeCheck size={18} style={{ color: '#15803D' }} /> : <XCircle size={18} style={{ color: '#B91C1C' }} />}
              <span className="text-[14px] font-bold" style={{ color: valid ? '#15803D' : '#B91C1C' }}>
                {valid ? 'Certificado válido y auténtico' : `Certificado ${resultado.estado.toLowerCase()}`}
              </span>
            </div>

            {/* Cuerpo en 2 columnas: participante+código a la izquierda, detalles a la derecha */}
            <div className="p-5 grid lg:grid-cols-[minmax(0,320px)_1fr] gap-5 lg:gap-8">
              {/* Izquierda */}
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#B0A898' }}>{(resultado.calidad?.trim() || 'Participante')}</p>
                  <p className="text-[22px] font-bold tracking-tight leading-tight" style={{ color: '#0D0E12' }}>
                    {resultado.participante_nombre}
                  </p>
                  <p className="text-[13px] mt-0.5" style={{ color: '#9CA3AF' }}>
                    {resultado.tipo_doc}: {resultado.numero_documento}
                  </p>
                </div>

                <div className="rounded-2xl px-4 py-2.5" style={{ background: '#F4F2EC' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#B0A898' }}>Código único</p>
                  <p className="text-[12px] font-mono break-all" style={{ color: '#374151' }}>{resultado.codigo_unico}</p>
                </div>

                {valid && pdfUrl && (
                  <button
                    type="button"
                    onClick={descargarCertificado}
                    disabled={descargando}
                    className="flex items-center justify-center gap-2 w-full rounded-2xl py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: '#0D0E12', color: '#FFFFFF' }}
                  >
                    {descargando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {descargando ? 'Descargando…' : 'Descargar certificado'}
                  </button>
                )}

                {valid && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <BadgeCheck size={14} style={{ color: '#15803D' }} />
                    <span className="text-[12px]" style={{ color: '#9CA3AF' }}>Verificado por</span>
                    <img src="/vaxa-comprobante.png" alt="Vaxa" style={{ height: 15, width: 'auto', objectFit: 'contain' }} />
                  </div>
                )}
              </div>

              {/* Derecha · detalles en grilla */}
              <div className="rounded-2xl px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 content-start" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
                <Field label="Programa"  value={resultado.programa_nombre} full />
                <Field label="Tipo"      value={resultado.tipo_programa} />
                <Field label="Modalidad" value={resultado.modalidad} />
                <Field label="Grupo"     value={resultado.nombre_grupo} />
                <Field label="Duración"  value={`${resultado.horas_academicas} horas académicas`} />
                <Field label="Periodo"   value={(() => {
                  const p = periodoCurso(resultado.fecha_inicio, resultado.fecha_fin, resultado.fecha_dia2, resultado.fecha_dia3);
                  return p ? p.charAt(0).toUpperCase() + p.slice(1) : formatDate(resultado.fecha_inicio);
                })()} full />
                <Field label="Emitido por" value={resultado.empresa_nombre} />
                <Field label="Fecha de emisión" value={formatDate(resultado.fecha_emision)} />
              </div>
            </div>
          </div>

          <p className="text-center text-[12px] mt-4" style={{ color: '#B7B1A6' }}>
            ¿Quieres inscribirte?{' '}
            <a href={certPath(empresa!)} className="font-semibold hover:opacity-70 transition-opacity" style={{ color: '#C9962C' }}>
              Ir a inscripción
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── Aterrizaje / sin resultado (o no encontrado) ────────────────
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-10 flex items-start lg:items-center justify-center" style={PAGE}>
      <div className="w-full max-w-[1040px] grid lg:grid-cols-2 gap-8 lg:gap-24 items-center">

        {/* Columna izquierda · logo de la institución (solo desktop) */}
        <BrandAside subtitulo="VERIFICACIÓN DE CERTIFICADOS" />

        {/* Columna derecha · contenido */}
        <div className="w-full max-w-xl mx-auto">
          {/* Marca compacta solo en móvil (en desktop está a la izquierda) */}
          <div className="lg:hidden mb-2">
            <BrandRow />
          </div>

        {/* Hero de búsqueda */}
        <div className="text-center mt-6 sm:mt-10 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: '#0D0E12' }}
          >
            <QrCode size={26} style={{ color: '#C9962C' }} />
          </div>
          <h1 className="text-[22px] sm:text-[27px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Verificar certificado</h1>
          <p className="text-[13.5px] sm:text-[14px] mt-1.5" style={{ color: '#9CA3AF' }}>
            Ingresa el código único del certificado para comprobar su autenticidad.
          </p>
        </div>

        {/* Buscador */}
        {buscador}

        {/* No encontrado */}
        {buscado && !loading && error && (
          <div className="mt-5">
            <div
              className="rounded-[20px] p-8 text-center page-enter"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              <XCircle size={40} style={{ color: '#FCA5A5', margin: '0 auto 12px' }} />
              <p className="text-[15px] font-bold mb-1" style={{ color: '#0D0E12' }}>Certificado no encontrado</p>
              <p className="text-[13px]" style={{ color: '#9CA3AF' }}>{error}</p>
            </div>
          </div>
        )}

        <p className="text-center text-[12px] mt-6" style={{ color: '#B7B1A6' }}>
          ¿Quieres inscribirte?{' '}
          <a href={certPath(empresa!)} className="font-semibold hover:opacity-70 transition-opacity" style={{ color: '#C9962C' }}>
            Ir a inscripción
          </a>
        </p>
        <VaxaFooter />
        </div>
      </div>
    </div>
  );
}
