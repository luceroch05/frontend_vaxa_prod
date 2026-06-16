'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import {
  Search, Plus, Building2, Eye, Loader2, AlertCircle,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { creditosAdminApi, type EmpresaCreditos } from '../../shared/api/creditos.admin.api';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

export default function EmpresasCertificaciones({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaCreditos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEmpresas = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      setEmpresas(await creditosAdminApi.listEmpresas());
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
  }, [tenantId, navigate]);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(`/${tenantId}/login`);
      return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
    fetchEmpresas();
  }, [tenantId, navigate, fetchEmpresas]);

  if (!usuario) return null;

  const q = searchTerm.toLowerCase().trim();
  const filtradas = empresas.filter((e) =>
    e.razon_social.toLowerCase().includes(q) ||
    e.tenant_slug.toLowerCase().includes(q) ||
    (e.ruc ?? '').toLowerCase().includes(q),
  );

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa
        tenantId={tenantId}
        usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }}
      />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <div className="mb-5 flex items-end justify-between gap-4 page-enter">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Certificaciones</p>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Empresas registradas</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Gestiona las empresas que usan el sistema de certificados.</p>
          </div>
          <button
            onClick={() => navigate(`/${tenantId}/certificaciones/registrar-empresa`)}
            className="sv-btn sv-btn-primary flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Registrar empresa
          </button>
        </div>

        <div className="relative mb-4 page-enter stagger-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px]" style={{ color: '#B0A898' }} />
          <input
            type="text" placeholder="Buscar por nombre, slug o RUC…"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="sv-input" style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="sv-card overflow-hidden page-enter stagger-2">
            {/* Encabezado de tabla */}
            <div className="hidden sm:grid items-center px-5 py-3 gap-3" style={{ gridTemplateColumns: '1fr auto auto auto auto', borderBottom: '1px solid #F2F0EA' }}>
              <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>Empresa</span>
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-center w-20" style={{ color: '#B0A898' }}>Créditos</span>
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-center w-24" style={{ color: '#B0A898' }}>Consumidos</span>
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-center w-20" style={{ color: '#B0A898' }}>Estado</span>
              <span className="w-9" />
            </div>

            {filtradas.map((e, idx) => {
              const bajo = e.creditos_disponibles <= 0, medio = e.creditos_disponibles > 0 && e.creditos_disponibles <= 10;
              return (
                <div key={e.id}
                  className="grid items-center px-5 py-3.5 gap-3 cursor-pointer group transition-colors"
                  style={{ gridTemplateColumns: '1fr auto auto auto auto', borderBottom: idx < filtradas.length - 1 ? '1px solid #F5F4F0' : undefined }}
                  onClick={() => navigate(`/${tenantId}/certificaciones/empresa/${e.id}`)}
                  onMouseEnter={(ev) => { ev.currentTarget.style.background = '#FAFAF8'; }}
                  onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent'; }}>
                  <div className="flex items-center gap-3 min-w-0">
                    {e.logo_url ? (
                      <img src={e.logo_url} alt={e.razon_social}
                        className="w-10 h-10 rounded-xl object-contain flex-shrink-0 bg-white"
                        style={{ border: '1px solid #EEECE6' }} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F5F4F0', border: '1px solid #EEECE6' }}>
                        <Building2 className="w-5 h-5" style={{ color: '#B0A898' }} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold truncate" style={{ color: '#0D0E12' }}>{e.razon_social}</p>
                      <p className="text-[11.5px] truncate" style={{ color: '#9CA3AF' }}>{e.tenant_slug}{e.ruc ? ` · ${e.ruc}` : ''}</p>
                    </div>
                  </div>
                  <div className="w-20 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-lg text-[12.5px] font-bold"
                      style={{ background: bajo ? '#FEF2F2' : medio ? '#FFFBEB' : '#F0FDF4', color: bajo ? '#DC2626' : medio ? '#D97706' : '#15803D' }}>
                      {e.creditos_disponibles}
                    </span>
                  </div>
                  <div className="w-24 text-center text-[13px] font-semibold tabular-nums" style={{ color: '#64748B' }}>{e.creditos_consumidos}</div>
                  <div className="w-20 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-[10.5px] font-semibold"
                      style={e.activo ? { background: '#ECFDF5', color: '#059669' } : { background: '#F3F4F6', color: '#6B7280' }}>
                      {e.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="w-9 flex justify-end">
                    <Eye className="w-4 h-4 transition-all group-hover:translate-x-0.5" style={{ color: '#C8C3BB' }} />
                  </div>
                </div>
              );
            })}

            {filtradas.length === 0 && (
              <div className="text-center py-14">
                <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#E5E1D8' }} />
                <p className="text-[14px] font-semibold mb-3" style={{ color: '#0D0E12' }}>No hay empresas</p>
                <button
                  onClick={() => navigate(`/${tenantId}/certificaciones/registrar-empresa`)}
                  className="sv-btn sv-btn-primary mx-auto"
                >
                  <Plus className="w-4 h-4" /> Registrar primera empresa
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
