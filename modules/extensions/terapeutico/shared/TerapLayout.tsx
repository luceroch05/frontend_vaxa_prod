import { useEffect, useState } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { Loader2 } from '@/components/ui/icon';
import { imgUrl } from '@/lib/api/client';
import { useEmpresaSlug } from '@/lib/useEmpresa';
import { terapAuthApi } from './api/terapeutico.api';

type Estado = 'verificando' | 'existe' | 'no-existe';

export interface Branding {
  slug: string;
  razonSocial: string | null;
  logoUrl: string | null;
  activo: boolean;
}

export const useBranding = () => useOutletContext<Branding>();

/**
 * Envuelve /:empresa/terapeutico. Valida contra la BD que el slug exista antes de
 * renderizar login/panel y provee el branding (logo) a las páginas hijas.
 */
export default function TerapLayout() {
  const slug = useEmpresaSlug()!;
  const [estado, setEstado] = useState<Estado>('verificando');
  const [branding, setBranding] = useState<Branding>({ slug, razonSocial: null, logoUrl: null, activo: true });

  useEffect(() => {
    let vivo = true;
    setEstado('verificando');
    terapAuthApi.existeEmpresa(slug)
      .then(r => {
        if (!vivo) return;
        setEstado(r.exists ? 'existe' : 'no-existe');
        setBranding({ slug, razonSocial: r.razon_social ?? null, logoUrl: r.logo_url ? imgUrl(r.logo_url) : null, activo: r.activo ?? true });
      })
      .catch(() => { if (vivo) setEstado('existe'); });   // falla abierto
    return () => { vivo = false; };
  }, [slug]);

  if (estado === 'verificando') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0E1A1A' }}>
        <Loader2 size={26} className="animate-spin" style={{ color: '#14B8A6' }} />
      </div>
    );
  }

  if (estado === 'no-existe') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#F2F4F3' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#0E1A1A' }}>Centro no encontrado</h1>
        <p className="mt-2 text-sm" style={{ color: '#6B7280' }}>El enlace «{slug}» no corresponde a ningún centro registrado.</p>
      </div>
    );
  }

  return <Outlet context={branding} />;
}
