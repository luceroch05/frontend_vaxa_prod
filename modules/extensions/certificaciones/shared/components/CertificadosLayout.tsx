import { useEffect, useState } from 'react';
import { Outlet, useOutletContext, useParams } from 'react-router-dom';
import { Loader2 } from '@/components/ui/icon';
import { publicApi } from '../api/public.api';
import EmpresaNotFound from './EmpresaNotFound';

type Estado = 'verificando' | 'existe' | 'no-existe';

/** Branding de la institución, disponible para las páginas públicas vía Outlet. */
export interface Branding {
  slug: string;
  razonSocial: string | null;
  logoUrl: string | null;
  /** false = empresa desactivada: solo se permite validar certificados. */
  activo: boolean;
}

/** Hook para que las páginas públicas lean el branding de la institución. */
export const useBranding = () => useOutletContext<Branding>();

/**
 * Envuelve todo /:empresa/certificados (público + admin). Valida contra la BD
 * que el slug exista ANTES de renderizar login, registro o panel. Si no existe,
 * muestra la pantalla 404 en vez de la plataforma.
 */
export default function CertificadosLayout() {
  const { empresa } = useParams<{ empresa: string }>();
  const slug = empresa!;
  const [estado, setEstado] = useState<Estado>('verificando');
  const [branding, setBranding] = useState<Branding>({ slug, razonSocial: null, logoUrl: null, activo: true });

  useEffect(() => {
    let activo = true;
    setEstado('verificando');
    setBranding({ slug, razonSocial: null, logoUrl: null, activo: true });
    publicApi
      .existeEmpresa(slug)
      .then(r => {
        if (!activo) return;
        // Una empresa desactivada SIGUE existiendo (exists=true): se renderiza la
        // plataforma para que la validación funcione; el login/inscripción se
        // bloquean según `activo` en cada página.
        setEstado(r.exists ? 'existe' : 'no-existe');
        setBranding({ slug, razonSocial: r.razon_social ?? null, logoUrl: r.logo_url ?? null, activo: r.activo ?? true });
      })
      // Falla ABIERTO: si no se pudo verificar (red caída, CORS, 500), dejamos
      // pasar y que el backend imponga la seguridad. Solo bloqueamos cuando la
      // API dice explícitamente que la empresa no existe.
      .catch(() => { if (activo) setEstado('existe'); });
    return () => { activo = false; };
  }, [slug]);

  if (estado === 'verificando') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0E12' }}>
        <Loader2 size={26} className="animate-spin" style={{ color: '#D97706' }} />
      </div>
    );
  }

  if (estado === 'no-existe') {
    return <EmpresaNotFound empresa={slug} />;
  }

  return <Outlet context={branding} />;
}
