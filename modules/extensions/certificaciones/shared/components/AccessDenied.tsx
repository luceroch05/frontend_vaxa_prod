import { useNavigate } from 'react-router-dom';
import { Ban, ArrowLeft, LogIn } from '@/components/ui/icon';
import { authStorage } from '@/lib/auth';
import { certPath } from '@/lib/paths';

interface AccessDeniedProps {
  /** Empresa de la URL a la que se intentó entrar. */
  empresa: string;
  /** Empresa a la que SÍ pertenece la sesión actual (si la hay). */
  sesionEmpresa?: string;
}

/**
 * Pantalla 403. Se muestra cuando hay una sesión activa pero de OTRA empresa,
 * para no exponer el login/plataforma del tenant ajeno.
 */
export default function AccessDenied({ empresa, sesionEmpresa }: AccessDeniedProps) {
  const navigate = useNavigate();

  const irAMiEmpresa = () => navigate(certPath(sesionEmpresa!, '/panel'));
  const loginAqui = () => {
    if (sesionEmpresa) authStorage.clearSession(sesionEmpresa);
    navigate(certPath(empresa, '/login'));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0D0E12' }}>
      <div
        className="w-full max-w-[440px] rounded-2xl p-9 text-center"
        style={{ background: '#15161C', border: '1px solid rgba(253,230,138,0.12)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <Ban size={30} style={{ color: '#F87171' }} />
        </div>

        <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#F8FAFC' }}>
          Acceso denegado
        </h1>

        <p className="text-[14px] leading-relaxed mt-3" style={{ color: '#94A3B8' }}>
          No tienes permiso para entrar al panel de{' '}
          <span className="font-semibold capitalize" style={{ color: '#FCD34D' }}>{empresa}</span>.
          {sesionEmpresa
            ? <> Tu sesión pertenece a otra empresa.</>
            : <> Inicia sesión con una cuenta autorizada.</>}
        </p>

        <div className="flex flex-col gap-2.5 mt-8">
          {sesionEmpresa && (
            <button
              onClick={irAMiEmpresa}
              className="vx-btn w-full py-3 flex items-center justify-center gap-2"
              style={{ background: '#D97706', color: '#FFFFFF' }}
            >
              <ArrowLeft size={15} />
              Ir al panel de <span className="capitalize">{sesionEmpresa}</span>
            </button>
          )}
          <button
            onClick={loginAqui}
            className="w-full py-3 rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition-colors"
            style={{ background: 'transparent', color: '#94A3B8', border: '1px solid rgba(148,163,184,0.2)' }}
          >
            <LogIn size={15} />
            Iniciar sesión en {empresa}
          </button>
        </div>
      </div>
    </div>
  );
}
