import { GraduationCap } from '@/components/ui/icon';
import { useBranding } from './CertificadosLayout';

/**
 * Identidad compacta de la institución (logo + nombre) para la cabecera de las
 * páginas públicas. Es lo ÚNICO que se comparte entre páginas, para mantener la
 * marca consistente sin que las pantallas se vean clonadas. El recuadro blanco
 * abraza el logo (no se estira).
 */
export default function BrandRow({ center = false }: { center?: boolean }) {
  const { slug, razonSocial, logoUrl } = useBranding();
  const marca = razonSocial ?? slug;

  return (
    <div className={`flex items-center gap-3 ${center ? 'justify-center text-left' : ''}`}>
      {logoUrl ? (
        <span className="inline-flex bg-white rounded-xl p-1.5" style={{ border: '1px solid #EAE7DF' }}>
          <img src={logoUrl} alt={marca ?? 'Logo'} className="h-12 w-auto max-w-[130px] object-contain block" />
        </span>
      ) : (
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#0D0E12' }}>
          <GraduationCap size={24} style={{ color: '#C9962C' }} />
        </div>
      )}
      <div className="min-w-0">
        <p className={`text-[15px] font-bold leading-tight truncate ${razonSocial ? '' : 'capitalize'}`} style={{ color: '#0D0E12' }}>
          {marca}
        </p>
        <p className="text-[9px] font-semibold mt-0.5" style={{ color: '#C9962C', letterSpacing: '0.2em' }}>CERTIFICADOS</p>
      </div>
    </div>
  );
}
