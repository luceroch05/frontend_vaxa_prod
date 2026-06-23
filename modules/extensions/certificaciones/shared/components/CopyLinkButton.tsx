import { useState } from 'react';
import { Copy, Check, Link2 } from '@/components/ui/icon';

interface Props {
  /** URL completa a copiar y compartir. */
  url: string;
  /** Texto del botón (ej. "Copiar link de inscripción"). */
  label?: string;
  /** Variante compacta (solo ícono + “Copiar”), para filas/tablas. */
  compact?: boolean;
}

/**
 * Botón que copia un link al portapapeles para mandárselo al cliente/alumno.
 * Muestra "¡Copiado!" unos segundos como confirmación. Tiene fallback para
 * navegadores/entornos sin clipboard API (http o permisos).
 */
export default function CopyLinkButton({ url, label = 'Copiar link', compact = false }: Props) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback (entornos sin clipboard API).
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Último recurso: mostrar el link para copiar a mano.
      window.prompt('Copia este link:', url);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={copiar}
        title={url}
        className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg transition-all"
        style={copiado
          ? { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
          : { background: '#F4F2EC', color: '#8A6D1F', border: '1px solid #EBD9A8' }}
      >
        {copiado ? <Check size={12} /> : <Copy size={12} />}
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2"
      style={{ background: '#FBF7EC', border: '1px solid #EBD9A8' }}
    >
      <Link2 size={14} style={{ color: '#C9962C', flexShrink: 0 }} />
      <span className="text-[12px] font-mono truncate flex-1" style={{ color: '#7A5B16' }} title={url}>
        {url}
      </span>
      <button
        type="button"
        onClick={copiar}
        className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-all"
        style={copiado
          ? { background: '#15803D', color: '#fff' }
          : { background: '#0D0E12', color: '#fff' }}
      >
        {copiado ? <Check size={13} /> : <Copy size={13} />}
        {copiado ? '¡Copiado!' : label}
      </button>
    </div>
  );
}
