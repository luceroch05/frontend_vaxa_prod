'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import {
  Building2, CreditCard, AlertCircle, CheckCircle, Loader2, ArrowRight, TrendingUp,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import BotonVolver from '../../shared/components/BotonVolver';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import {
  creditosAdminApi, type VencimientoEmpresa, type EstadoCobranza,
} from '../../shared/api/creditos.admin.api';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const fmtFecha = (s: string) =>
  new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

/** Estilo y texto del semáforo de cobranza. */
const COBRANZA: Record<EstadoCobranza, { bg: string; bd: string; fg: string; label: string }> = {
  vigente:    { bg: '#ECFDF5', bd: '#A7F3D0', fg: '#047857', label: 'Al día' },
  por_vencer: { bg: '#FFFBEB', bd: '#FDE68A', fg: '#B45309', label: 'Por vencer' },
  vencido:    { bg: '#FEF2F2', bd: '#FECACA', fg: '#B91C1C', label: 'Vencido' },
};

export default function CobranzaCertificaciones({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [filas, setFilas] = useState<VencimientoEmpresa[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setFilas(await creditosAdminApi.listCobranza());
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

  const conPlan = filas.filter((f) => f.cobranza);
  const vencidos   = conPlan.filter((f) => f.cobranza!.estado_cobranza === 'vencido').length;
  const porVencer  = conPlan.filter((f) => f.cobranza!.estado_cobranza === 'por_vencer').length;
  const alDia      = conPlan.filter((f) => f.cobranza!.estado_cobranza === 'vigente').length;
  const sinPlan    = filas.filter((f) => !f.cobranza).length;

  const stats = [
    { title: 'Vencidos',   value: vencidos,  icon: AlertCircle, bg: '#FEF2F2', bd: '#FECACA', color: '#B91C1C' },
    { title: 'Por vencer', value: porVencer, icon: CreditCard,  bg: '#FFFBEB', bd: '#FDE68A', color: '#B45309' },
    { title: 'Al día',     value: alDia,     icon: CheckCircle, bg: '#ECFDF5', bd: '#A7F3D0', color: '#047857' },
    { title: 'Sin plan',   value: sinPlan,   icon: TrendingUp,  bg: '#F5F4F0', bd: '#EAE7DF', color: '#0D0E12' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa
        tenantId={tenantId}
        usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }}
      />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <BotonVolver to={`/${tenantId}/certificaciones`} />

        <div className="mb-6 page-enter">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>
            Control de pagos
          </p>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Cobranza y vencimientos</h1>
          <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>
            Quién está por vencer, quién venció y cuándo debe pagar cada cliente para renovar.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5 page-enter stagger-1">
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="rounded-2xl p-4"
                    style={{ background: '#FFFFFF', border: '1px solid #EEECE6', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
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

            {/* Tabla */}
            <div className="rounded-2xl overflow-hidden page-enter stagger-2"
              style={{ background: '#FFFFFF', border: '1px solid #EEECE6' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #F2F0EA' }}>
                <h2 className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>Clientes ({filas.length})</h2>
              </div>

              {filas.length === 0 ? (
                <p className="text-[13px] py-10 text-center" style={{ color: '#B0A898' }}>Aún no hay empresas registradas.</p>
              ) : (
                <div>
                  {/* Cabecera (desktop) */}
                  <div className="hidden md:grid px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider"
                    style={{ color: '#B0A898', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 24px', borderBottom: '1px solid #F5F4F0' }}>
                    <span>Empresa</span><span>Plan · ciclo</span><span>Vence</span><span>Pago máx.</span><span>Estado</span><span />
                  </div>

                  {filas.map((f) => {
                    const cb = f.cobranza;
                    const est = cb?.estado_cobranza;
                    const style = est ? COBRANZA[est] : { bg: '#F5F4F0', bd: '#EAE7DF', fg: '#6B7280', label: 'Sin plan' };
                    return (
                      <div key={f.empresa_id}
                        onClick={() => navigate(`/${tenantId}/certificaciones/empresa/${f.empresa_id}`)}
                        className="grid items-center px-5 py-3.5 cursor-pointer transition-colors"
                        style={{ gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 24px', borderBottom: '1px solid #F5F4F0' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAF8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        {/* Empresa */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: '#F5F4F0', border: '1px solid #EEECE6' }}>
                            <Building2 className="w-4 h-4" style={{ color: '#B0A898' }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold truncate" style={{ color: '#0D0E12' }}>{f.razon_social}</p>
                            <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>{f.tenant_slug}</p>
                          </div>
                        </div>
                        {/* Plan · ciclo */}
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-medium truncate" style={{ color: f.plan ? '#374151' : '#B0A898' }}>{f.plan ?? '—'}</p>
                          <p className="text-[11px] truncate" style={{ color: '#9CA3AF' }}>{f.ciclo ?? 'sin suscripción'}</p>
                        </div>
                        {/* Pagado hasta — '—' si aún no hay pagos (fecha_fin anterior a la implementación) */}
                        {(() => {
                          const conPagos = !!f.fecha_fin && !!f.fecha_inicio && f.fecha_fin >= f.fecha_inicio;
                          return (
                            <p className="text-[12.5px] tabular-nums" style={{ color: conPagos ? '#374151' : '#B0A898' }}>
                              {conPagos ? fmtFecha(f.fecha_fin!) : '—'}
                            </p>
                          );
                        })()}
                        {/* Pago máx. */}
                        <p className="text-[12.5px] tabular-nums" style={{ color: cb ? '#374151' : '#B0A898' }}>
                          {cb ? fmtFecha(cb.fecha_limite_pago) : '—'}
                        </p>
                        {/* Estado */}
                        <div>
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full inline-block"
                            style={{ background: style.bg, color: style.fg, border: `1px solid ${style.bd}` }}>
                            {style.label}
                          </span>
                          {cb && (
                            <p className="text-[10.5px] mt-1" style={{ color: '#9CA3AF' }}>
                              {cb.dias_para_vencer < 0
                                ? `hace ${Math.abs(cb.dias_para_vencer)}d`
                                : `en ${cb.dias_para_vencer}d`}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 justify-self-end" style={{ color: '#C8C3BB' }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
