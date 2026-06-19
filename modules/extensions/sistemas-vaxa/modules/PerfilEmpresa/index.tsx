'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import {
  ArrowLeft, Building2, Users, CreditCard, Info, Loader2, AlertCircle,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { creditosAdminApi, type EmpresaCreditos } from '../../shared/api/creditos.admin.api';
import TabInformacion from './TabInformacion';
import TabPlan from './TabPlan';
import TabUsuarios from './TabUsuarios';

interface PerfilEmpresaProps { tenantId: string; tenant: TenantConfig; empresaId: string; }
interface Usuario { email: string; nombre: string; role: string; }
type TabType = 'informacion' | 'plan' | 'usuarios';

export default function PerfilEmpresa({ tenantId, empresaId }: PerfilEmpresaProps) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaCreditos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('informacion');

  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const lista = await creditosAdminApi.listEmpresas();
      setEmpresa(lista.find((e) => e.id === Number(empresaId)) ?? null);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        authStorage.clearAllSessions();
        navigate(`/${tenantId}/login`);
        return;
      }
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [empresaId, tenantId, navigate]);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(`/${tenantId}/login`);
      return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
    cargar();
  }, [tenantId, navigate, cargar]);

  if (!usuario) return null;

  const tabs = [
    { id: 'informacion' as TabType, label: 'Información', icon: Info },
    { id: 'plan' as TabType, label: 'Plan', icon: CreditCard },
    { id: 'usuarios' as TabType, label: 'Usuarios', icon: Users },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa
        tenantId={tenantId}
        usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }}
      />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <button
          onClick={() => navigate(`/${tenantId}/certificaciones/empresas`)}
          className="flex items-center gap-1.5 mb-5 text-[13px] font-medium transition-colors group"
          style={{ color: '#64748B' }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver a empresas
        </button>

        {loading ? (
          <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : error ? (
          <div className="px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
          </div>
        ) : !empresa ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#E5E1D8' }} />
            <h2 className="text-[16px] font-bold mb-3" style={{ color: '#0D0E12' }}>Empresa no encontrada</h2>
            <button onClick={() => navigate(`/${tenantId}/certificaciones/empresas`)} className="sv-btn sv-btn-primary mx-auto">Volver a empresas</button>
          </div>
        ) : (
          <>
            {/* Header empresa */}
            <div className="sv-card p-6 mb-4 page-enter">
              <div className="flex items-center gap-4 mb-5">
                {empresa.logo_url ? (
                  <img src={empresa.logo_url} alt={empresa.razon_social}
                    className="w-16 h-16 rounded-2xl object-contain flex-shrink-0 bg-white"
                    style={{ border: '1px solid #EEECE6' }} />
                ) : (
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                    <Building2 className="w-8 h-8" style={{ color: '#059669' }} />
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="text-[22px] font-bold tracking-tight truncate" style={{ color: '#0D0E12' }}>{empresa.razon_social}</h1>
                  <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                    <span className="text-[12.5px] flex items-center gap-1" style={{ color: '#9CA3AF' }}><Building2 className="w-3.5 h-3.5" />{empresa.tenant_slug}</span>
                    {empresa.ruc && <span className="text-[12.5px]" style={{ color: '#9CA3AF' }}>· RUC {empresa.ruc}</span>}
                    <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-semibold"
                      style={empresa.activo ? { background: '#ECFDF5', color: '#059669' } : { background: '#F3F4F6', color: '#6B7280' }}>
                      {empresa.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              {/* El plan y el consumo del mes se gestionan en la pestaña "Plan". */}
            </div>

            {/* Tabs */}
            <div className="sv-card overflow-hidden page-enter stagger-1">
              <div style={{ borderBottom: '1px solid #F2F0EA' }}>
                <nav className="flex">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 text-[13px] font-semibold transition-all"
                        style={{
                          borderBottom: active ? '2px solid #059669' : '2px solid transparent',
                          color: active ? '#059669' : '#64748B',
                          background: active ? '#F0FDF9' : 'transparent',
                        }}>
                        <Icon className="w-4 h-4" /> {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className="p-6">
                {activeTab === 'informacion' && <TabInformacion empresa={empresa} onChange={cargar} />}
                {activeTab === 'plan' && <TabPlan empresa={empresa} onChange={cargar} />}
                {activeTab === 'usuarios' && <TabUsuarios empresa={empresa} />}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
