'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import {
  Package,
  Users,
  Settings,
  ChevronRight,
  Building2,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';
import { SISTEMAS_MOCK } from '../../shared/data/mockData';

interface SistemasProps {
  tenantId: string;
  tenant: TenantConfig;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

export default function Sistemas({ tenantId, tenant }: SistemasProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    // Verificar que tenantId existe
    if (!tenantId) {
      console.error('TenantId is undefined');
      return;
    }

    const authData = localStorage.getItem(`auth_${tenantId}`);
    const userData = localStorage.getItem(`auth_user_${tenantId}`);

    if (!authData || authData !== 'true') {
      navigate(`/${tenantId}/login`);
      return;
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUsuario(user);
      } catch (error) {
        navigate(`/${tenantId}/login`);
        return;
      }
    }

    setLoading(false);
  }, [tenantId, navigate]);

  if (loading || !usuario) {
    return null;
  }

  // Verificar que tenantId está disponible antes de renderizar
  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F4F0' }}>
        <p className="text-[15px] font-semibold" style={{ color: '#DC2626' }}>Error: Tenant ID no disponible</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa
        tenantId={tenantId}
        usuario={usuario}
        config={{
          name: VAXA_CONFIG.NAME,
          primaryColor: VAXA_CONFIG.PRIMARY_COLOR,
          secondaryColor: VAXA_CONFIG.SECONDARY_COLOR,
        }}
      />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        {/* Header */}
        <div className="mb-6 page-enter">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Sistemas Vaxa</p>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Panel de administración</h1>
          <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Gestiona los sistemas y usuarios de Vaxa.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sistemas Registrados */}
          <div className="sv-card p-5 page-enter stagger-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Sistemas registrados</h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Software activo de Vaxa</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#059669' }}>
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              {SISTEMAS_MOCK.map((sistema) => (
                <button
                  key={sistema.id}
                  onClick={() => navigate(`/${tenantId}/${sistema.slug}`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all group"
                  style={{ border: '1px solid #EEECE6' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAF8'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#EEECE6'; }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                      <Building2 className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
                    </div>
                    <div className="text-left">
                      <p className="text-[13.5px] font-semibold" style={{ color: '#0D0E12' }}>{sistema.nombre}</p>
                      <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>/{sistema.slug}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Gestión de Usuarios */}
          <div className="sv-card p-5 page-enter stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Gestión de usuarios</h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Usuarios de sistemas-vaxa</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0D0E12' }}>
                <Users className="w-5 h-5" style={{ color: '#059669' }} />
              </div>
            </div>

            <button
              onClick={() => navigate(`/${tenantId}/usuarios`)}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all group"
              style={{ border: '1px solid #EEECE6' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAF8'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#EEECE6'; }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <Users className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
                </div>
                <div className="text-left">
                  <p className="text-[13.5px] font-semibold" style={{ color: '#0D0E12' }}>Ver usuarios</p>
                  <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>Gestiona accesos a sistemas-vaxa</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
