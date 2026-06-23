import { GraduationCap } from '@/components/ui/icon';
import { useBranding } from './CertificadosLayout';

/**
 * Columna lateral con el logo de la institución cliente, idéntica a la del login.
 * Se usa en las páginas públicas (validar / inscribir) para que muestren la marca
 * de la empresa al costado. Solo se ve en desktop (lg+); en móvil cada página
 * mantiene su BrandRow arriba.
 */
export default function BrandAside({ subtitulo = 'SISTEMA DE CERTIFICADOS' }: { subtitulo?: string }) {
  const { slug, razonSocial, logoUrl } = useBranding();
  const marca = razonSocial ?? slug;

  return (
    <div className="hidden lg:flex flex-col items-center text-center page-enter">
      <div
        className="rounded-[28px] p-8 mb-6 bg-white"
        style={{ border: '1px solid #EAE7DF', boxShadow: '0 18px 50px rgba(13,14,18,0.08)' }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={marca ?? 'Logo'} className="h-36 w-36 object-contain" />
        ) : (
          <div className="w-36 h-36 rounded-[2rem] flex items-center justify-center" style={{ background: '#0D0E12' }}>
            <GraduationCap size={56} style={{ color: '#C9962C' }} />
          </div>
        )}
      </div>
      <h1 className={`text-[30px] font-bold tracking-tight leading-tight ${razonSocial ? '' : 'capitalize'}`} style={{ color: '#0D0E12' }}>
        {marca}
      </h1>
      <div className="h-px w-16 my-4" style={{ background: '#D8D3C7' }} />
      <p className="text-[11px] font-semibold" style={{ color: '#C9962C', letterSpacing: '0.28em' }}>
        {subtitulo}
      </p>
    </div>
  );
}
