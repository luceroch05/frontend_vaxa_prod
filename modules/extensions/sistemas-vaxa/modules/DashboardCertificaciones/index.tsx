'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import {
  Building2, FileText, TrendingUp, CreditCard, Plus, ArrowRight, Loader2,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { creditosAdminApi, type EmpresaCreditos } from '../../shared/api/creditos.admin.api';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

export default function DashboardCertificaciones({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaCreditos[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setEmpresas(await creditosAdminApi.listEmpresas());
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        authStorage.clearAllSessions();
        navigate(`/${tenantId}/login`);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, navigate]);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(`/${tenantId}/login`);
      return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
    fetchData();
  }, [tenantId, navigate, fetchData]);

  if (!usuario) return null;

  const totalEmpresas = empresas.length;
  const activas = empresas.filter((e) => e.activo).length;
  const creditosDisponibles = empresas.reduce((a, e) => a + e.creditos_disponibles, 0);
  const consumidos = empresas.reduce((a, e) => a + e.creditos_consumidos, 0);

  const stats = [
    { title: 'Empresas',     value: totalEmpresas,       icon: Building2,   bg: '#ECFDF5', bd: '#A7F3D0', color: '#059669' },
    { title: 'Activas',      value: activas,             icon: TrendingUp,  bg: '#F0FDF4', bd: '#BBF7D0', color: '#15803D' },
    { title: 'Créditos disp.', value: creditosDisponibles, icon: CreditCard, bg: '#FFFBEB', bd: '#FDE68A', color: '#D97706' },
    { title: 'Certificados',  value: consumidos,         icon: FileText,    bg: '#F5F4F0', bd: '#EAE7DF', color: '#0D0E12' },
  ];

  const recientes = empresas.slice(0, 5);

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa
        tenantId={tenantId}
        usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }}
      />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        {/* Encabezado */}
        <div className="mb-6 flex items-end justify-between gap-4 page-enter">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>
              Panel de administración
            </p>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>
              Certificaciones
            </h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Gestiona empresas, usuarios y créditos.</p>
          </div>
          <button
            onClick={() => navigate(`/${tenantId}/certificaciones/registrar-empresa`)}
            className="vx-btn px-4 py-2.5 flex-shrink-0 text-white"
            style={{ background: '#059669', boxShadow: '0 1px 2px rgba(5,150,105,0.25), 0 4px 12px rgba(5,150,105,0.18)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#047857'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#059669'; }}
          >
            <Plus className="w-4 h-4" /> Registrar empresa
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 page-enter stagger-1">
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={i}
                    className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
                    style={{ background: '#FFFFFF', border: '1px solid #EEECE6', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: s.bg, border: `1px solid ${s.bd}` }}>
                      <Icon className="w-[18px] h-[18px]" style={{ color: s.color }} />
                    </div>
                    <p className="text-[26px] font-bold leading-none tabular-nums" style={{ color: '#0D0E12' }}>{s.value}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider mt-1.5" style={{ color: '#B0A898' }}>{s.title}</p>
                  </div>
                );
              })}
            </div>

            {/* Accesos rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5 page-enter stagger-2">
              {[
                { to: `/${tenantId}/certificaciones/empresas`, Icon: Building2, t: 'Ver todas las empresas', d: 'Empresas, créditos y usuarios' },
                { to: `/${tenantId}/certificaciones/cobranza`, Icon: CreditCard, t: 'Cobranza y vencimientos', d: 'Quién debe pagar y cuándo vence' },
                { to: `/${tenantId}/certificaciones/facturacion`, Icon: FileText, t: 'Facturación electrónica', d: 'Emite y consulta comprobantes SUNAT' },
                { to: `/${tenantId}/certificaciones/registrar-empresa`, Icon: Plus, t: 'Registrar nueva empresa', d: 'Agrega una empresa al sistema' },
              ].map(({ to, Icon, t, d }) => (
                <button key={to} onClick={() => navigate(to)}
                  className="rounded-2xl p-5 text-left transition-all hover:-translate-y-0.5 group"
                  style={{ background: '#FFFFFF', border: '1px solid #EEECE6', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: '#059669' }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <ArrowRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
                  </div>
                  <h3 className="text-[14.5px] font-bold" style={{ color: '#0D0E12' }}>{t}</h3>
                  <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>{d}</p>
                </button>
              ))}
            </div>

            {/* Empresas recientes */}
            <div className="rounded-2xl overflow-hidden page-enter stagger-3"
              style={{ background: '#FFFFFF', border: '1px solid #EEECE6' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F2F0EA' }}>
                <h2 className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>Empresas recientes</h2>
                <button onClick={() => navigate(`/${tenantId}/certificaciones/empresas`)}
                  className="text-[12.5px] font-semibold flex items-center gap-1 transition-colors hover:opacity-70"
                  style={{ color: '#059669' }}>
                  Ver todas <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {recientes.length === 0 ? (
                <p className="text-[13px] py-10 text-center" style={{ color: '#B0A898' }}>Aún no hay empresas registradas.</p>
              ) : (
                <div>
                  {recientes.map((e, idx) => (
                    <div key={e.id} onClick={() => navigate(`/${tenantId}/certificaciones/empresa/${e.id}`)}
                      className="flex items-center justify-between px-5 py-3.5 cursor-pointer group transition-colors"
                      style={{ borderBottom: idx < recientes.length - 1 ? '1px solid #F5F4F0' : undefined }}
                      onMouseEnter={(ev) => { ev.currentTarget.style.background = '#FAFAF8'; }}
                      onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent'; }}>
                      <div className="flex items-center gap-3 min-w-0">
                        {e.logo_url ? (
                          <img src={e.logo_url} alt={e.razon_social}
                            className="w-10 h-10 rounded-xl object-contain flex-shrink-0 bg-white"
                            style={{ border: '1px solid #EEECE6' }} />
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: '#F5F4F0', border: '1px solid #EEECE6' }}>
                            <Building2 className="w-5 h-5" style={{ color: '#B0A898' }} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="text-[13.5px] font-semibold truncate" style={{ color: '#0D0E12' }}>{e.razon_social}</h3>
                          <p className="text-[11.5px] truncate" style={{ color: '#9CA3AF' }}>{e.tenant_slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[14px] font-bold tabular-nums" style={{ color: '#0D0E12' }}>{e.creditos_disponibles}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>créditos</p>
                        </div>
                        <ArrowRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
