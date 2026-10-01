'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import { Activity, Building2, Plus, CreditCard, ChevronRight } from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const TEAL = '#0F766E';

/** Hub administrativo de Historias Clínicas (centros terapéuticos). Reusa las páginas
 *  compartidas de clientes/cobranza; el perfil de empresa separa la config por sistema. */
export default function DashboardHistorias({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(tenantPath(tenantId, '/login'));
      return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
  }, [tenantId, navigate]);

  if (!usuario) return null;

  const menu = [
    { to: '/historias-clinicas/empresas', Icon: Building2, t: 'Centros', d: 'Clientes con Historias Clínicas: usuarios y módulos' },
    { to: '/historias-clinicas/registrar-empresa', Icon: Plus, t: 'Registrar centro', d: 'Alta de un nuevo cliente y sus sistemas' },
    { to: '/historias-clinicas/cobranza', Icon: CreditCard, t: 'Cobranza', d: 'Pagos y vencimientos de los centros' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa
        tenantId={tenantId}
        usuario={usuario}
        config={{ name: VAXA_CONFIG.NAME, primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }}
      />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        {/* Cabecera del hub */}
        <button onClick={() => navigate(tenantPath(tenantId, '/sistemas'))}
          className="text-[13px] font-medium mb-5" style={{ color: '#64748B' }}>← Volver al panel</button>

        <div className="mb-6 flex items-center gap-3.5 page-enter">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg,#14B8A6,${TEAL})`, boxShadow: '0 10px 24px -8px rgba(15,118,110,0.55)' }}>
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-0.5" style={{ color: TEAL }}>Sistema</p>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Historias Clínicas</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Administra los centros terapéuticos y su acceso.</p>
          </div>
        </div>

        {/* Accesos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {menu.map(({ to, Icon, t, d }) => (
            <button key={to} onClick={() => navigate(tenantPath(tenantId, to))}
              className="sv-card p-4 flex items-center justify-between text-left transition-all group hover:-translate-y-0.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#ECFDF5', color: TEAL }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>{t}</p>
                  <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>{d}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
            </button>
          ))}
        </div>

        <div className="mt-6 px-4 py-3 rounded-xl text-[12.5px]" style={{ background: '#F0FDFA', border: '1px solid #CCFBF1', color: '#0F766E' }}>
          Los <b>centros</b> son las empresas con Historias Clínicas activa. Dentro de cada cliente, la pestaña <b>Historias Clínicas</b> maneja sus usuarios y módulos.
        </div>
      </main>
    </div>
  );
}
