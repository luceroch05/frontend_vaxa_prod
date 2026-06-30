import { useState, FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Search, Loader2, BadgeCheck, XCircle, QrCode, Download } from '@/components/ui/icon';
import { useValidarCertificado } from '../../shared/hooks/useCertificados';
import BrandRow from '../../shared/components/BrandRow';
import BrandAside from '../../shared/components/BrandAside';

const PAGE = { background: '#F4F2EC' } as const;
const CARD = { background: '#FFFFFF', border: '1px solid #EAE7DF', boxShadow: '0 18px 50px rgba(13,14,18,0.07)' } as const;

function formatDate(d: string | Date) {
  if (!d) return '—';
  const s = typeof d === 'string' ? d.substring(0, 10) : d.toISOString().substring(0, 10);
  return new Date(s + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5" style={{ borderBottom: '1px solid #F4F2EC' }}>
      <span className="text-[12px] flex-shrink-0" style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="text-[13px] font-semibold text-right" style={{ color: '#0D0E12' }}>{value}</span>
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

        {/* Resultado */}
        {buscado && !loading && (
          <div className="mt-5">
            {/* No encontrado */}
            {error && (
              <div
                className="rounded-[20px] p-8 text-center page-enter"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
              >
                <XCircle size={40} style={{ color: '#FCA5A5', margin: '0 auto 12px' }} />
                <p className="text-[15px] font-bold mb-1" style={{ color: '#0D0E12' }}>Certificado no encontrado</p>
                <p className="text-[13px]" style={{ color: '#9CA3AF' }}>{error}</p>
              </div>
            )}

            {/* Encontrado */}
            {resultado && (
              <div
                className="rounded-[20px] overflow-hidden page-enter"
                style={{ background: '#FFFFFF', border: `1px solid ${valid ? '#BBF7D0' : '#FECACA'}`, boxShadow: '0 18px 50px rgba(13,14,18,0.07)' }}
              >
                {/* Banner estado */}
                <div
                  className="px-5 py-3.5 flex items-center gap-2.5"
                  style={{
                    background: valid ? '#F0FDF4' : '#FEF2F2',
                    borderBottom: `1px solid ${valid ? '#BBF7D0' : '#FECACA'}`,
                  }}
                >
                  {valid
                    ? <BadgeCheck size={18} style={{ color: '#15803D' }} />
                    : <XCircle    size={18} style={{ color: '#B91C1C' }} />
                  }
                  <span className="text-[14px] font-bold" style={{ color: valid ? '#15803D' : '#B91C1C' }}>
                    {valid ? 'Certificado válido y auténtico' : `Certificado ${resultado.estado.toLowerCase()}`}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Participante */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#B0A898' }}>Participante</p>
                    <p className="text-[22px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>
                      {resultado.participante_nombre}
                    </p>
                    <p className="text-[13px] mt-0.5" style={{ color: '#9CA3AF' }}>
                      {resultado.tipo_doc}: {resultado.numero_documento}
                    </p>
                  </div>

                  {/* Detalles */}
                  <div className="rounded-2xl px-4 py-1" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
                    <Row label="Programa"  value={resultado.programa_nombre} />
                    <Row label="Grupo"     value={resultado.nombre_grupo} />
                    <Row label="Modalidad" value={resultado.modalidad} />
                    <Row label="Duración"  value={`${resultado.horas_academicas} horas académicas`} />
                    <Row label="Periodo"   value={`${formatDate(resultado.fecha_inicio)} — ${formatDate(resultado.fecha_fin)}`} />
                    <Row label="Emitido por" value={resultado.empresa_nombre} />
                    <div className="flex items-start justify-between gap-4 py-2.5">
                      <span className="text-[12px] flex-shrink-0" style={{ color: '#9CA3AF' }}>Fecha de emisión</span>
                      <span className="text-[13px] font-semibold text-right" style={{ color: '#0D0E12' }}>{formatDate(resultado.fecha_emision)}</span>
                    </div>
                  </div>

                  {/* Código */}
                  <div className="rounded-2xl px-4 py-3" style={{ background: '#F4F2EC' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#B0A898' }}>Código único</p>
                    <p className="text-[12px] font-mono break-all" style={{ color: '#374151' }}>{resultado.codigo_unico}</p>
                  </div>

                  {/* Descargar el certificado (solo si es válido y tiene PDF) */}
                  {valid && pdfUrl && (
                    <button
                      type="button"
                      onClick={descargarCertificado}
                      disabled={descargando}
                      className="mt-1 flex items-center justify-center gap-2 w-full rounded-2xl py-3 text-[13px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ background: '#0D0E12', color: '#FFFFFF' }}
                    >
                      {descargando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {descargando ? 'Descargando…' : 'Descargar certificado'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[12px] mt-6" style={{ color: '#B7B1A6' }}>
          ¿Quieres inscribirte?{' '}
          <a href={`/${empresa}/certificados`} className="font-semibold hover:opacity-70 transition-opacity" style={{ color: '#C9962C' }}>
            Ir a inscripción
          </a>
        </p>
        </div>
      </div>
    </div>
  );
}
