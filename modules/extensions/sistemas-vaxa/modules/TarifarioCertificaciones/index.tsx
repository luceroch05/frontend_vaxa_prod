'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import {
  DollarSign, CreditCard, Users, FileText, Check, Loader2, PrinterIcon, Sparkles,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import BotonVolver from '../../shared/components/BotonVolver';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { creditosAdminApi, type PlanCatalogo } from '../../shared/api/creditos.admin.api';
import { tarifarioApi, type TarifaPaquete, type TarifaTramo } from '../../shared/api/tarifario.admin.api';
import { PAQUETES_CREDITOS, CREDITOS_INDIVIDUALES, USUARIO_EXTRA, costoPorCertificado } from '../../shared/data/tarifario';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const sol = (n: number) => `S/ ${n.toFixed(2)}`;
const sol0 = (n: number) => `S/ ${n.toFixed(0)}`;

/** Etiqueta de "ilimitado" (0 = sin tope, convención del backend). */
const ilim = (n: number, unidad: string) => (n === 0 ? 'Ilimitado' : `${n} ${unidad}`);

/** Paquetes por defecto (respaldo si aún no se corre la migración del tarifario). */
const PAQUETES_FALLBACK: TarifaPaquete[] = PAQUETES_CREDITOS.map((p, i) => ({
  id: i, slug: p.id, planSlug: p.planSlug, nombre: p.nombre, creditos: p.creditos, precio: p.precio,
}));

const FEATURES: Array<{ key: keyof PlanCatalogo; label: string }> = [
  { key: 'permite_diseno',       label: 'Diseño personalizado' },
  { key: 'permite_subdominio',   label: 'Subdominio propio' },
  { key: 'permite_api',          label: 'Acceso a la API' },
  { key: 'permite_carga_masiva', label: 'Carga masiva por Excel' },
  { key: 'permite_metricas',     label: 'Reportes y métricas' },
  { key: 'permite_auditoria',    label: 'Auditoría' },
];

export default function TarifarioCertificaciones({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [planes, setPlanes] = useState<PlanCatalogo[]>([]);
  const [paquetes, setPaquetes] = useState<TarifaPaquete[]>([]);
  const [tramos, setTramos] = useState<TarifaTramo[]>([]);
  const [usuarioExtra, setUsuarioExtra] = useState({ activacion: USUARIO_EXTRA.activacion, mensual: USUARIO_EXTRA.mensual });
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      setPlanes(await creditosAdminApi.listPlanes());
      // El tarifario (paquetes/tramos/parámetros) sale de la BD. Si aún no se
      // corre la migración, se usan los valores por defecto como respaldo.
      try {
        const t = await tarifarioApi.get();
        setPaquetes(t.paquetes?.length ? t.paquetes : PAQUETES_FALLBACK);
        setTramos(t.tramos?.length ? t.tramos : CREDITOS_INDIVIDUALES);
        setUsuarioExtra({
          activacion: t.parametros?.usuario_extra_activacion ?? USUARIO_EXTRA.activacion,
          mensual: t.parametros?.usuario_extra_mensual ?? USUARIO_EXTRA.mensual,
        });
      } catch {
        setPaquetes(PAQUETES_FALLBACK); setTramos(CREDITOS_INDIVIDUALES);
      }
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        authStorage.clearAllSessions(); navigate(`/${tenantId}/login`);
      }
    } finally { setLoading(false); }
  }, [tenantId, navigate]);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(`/${tenantId}/login`); return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
    cargar();
  }, [tenantId, navigate, cargar]);

  if (!usuario) return null;

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa tenantId={tenantId} usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }} />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <div className="no-print"><BotonVolver to={`/${tenantId}/certificaciones`} /></div>

        <div className="mb-6 flex items-end justify-between gap-4 page-enter">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Referencia comercial</p>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Tarifario · Certificados Digital</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Planes, paquetes de créditos y precios oficiales 2026. Todos los precios incluyen IGV.</p>
          </div>
          <button onClick={() => window.print()} className="vx-btn px-4 py-2.5 flex-shrink-0 no-print"
            style={{ background: '#0D0E12', color: '#fff' }}>
            <PrinterIcon className="w-4 h-4" /> Imprimir
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            {/* ── Planes ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 page-enter stagger-1">
              {planes.map((p) => {
                const ilimitado = p.creditos_incluidos === 0;
                return (
                  <div key={p.id} className="rounded-2xl p-5 flex flex-col"
                    style={{ background: '#FFFFFF', border: '1px solid #EEECE6', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                        <Sparkles className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
                      </div>
                      <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>{p.nombre}</h3>
                    </div>

                    <div className="mb-3">
                      <p className="text-[26px] font-bold leading-none" style={{ color: '#0D0E12' }}>
                        {sol0(p.mantenimiento_mensual)}<span className="text-[12px] font-medium" style={{ color: '#9CA3AF' }}> /mes</span>
                      </p>
                      <p className="text-[12px] mt-1" style={{ color: '#9CA3AF' }}>
                        + {sol0(p.implementacion)} implementación (pago único)
                      </p>
                    </div>

                    <div className="space-y-1.5 mb-3 pb-3" style={{ borderBottom: '1px solid #F2F0EA' }}>
                      <div className="flex items-center gap-2 text-[12.5px]" style={{ color: '#374151' }}>
                        <CreditCard className="w-4 h-4" style={{ color: '#D97706' }} />
                        {ilimitado ? 'Créditos ilimitados' : `${p.creditos_incluidos} créditos incluidos`}
                      </div>
                      <div className="flex items-center gap-2 text-[12.5px]" style={{ color: '#374151' }}>
                        <Users className="w-4 h-4" style={{ color: '#0EA5E9' }} />
                        {ilim(p.usuarios_incluidos, p.usuarios_incluidos === 1 ? 'usuario' : 'usuarios')}
                      </div>
                    </div>

                    <ul className="space-y-1.5 flex-1">
                      {FEATURES.filter((f) => p[f.key]).map((f) => (
                        <li key={f.label} className="flex items-center gap-2 text-[12px]" style={{ color: '#64748B' }}>
                          <Check className="w-3.5 h-3.5" style={{ color: '#059669' }} /> {f.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* ── Paquetes de créditos ── */}
            <div className="mb-8 page-enter stagger-2">
              <h2 className="text-[15px] font-bold mb-1" style={{ color: '#0D0E12' }}>Paquetes de créditos</h2>
              <p className="text-[12.5px] mb-4" style={{ color: '#9CA3AF' }}>Recargas de certificados con descuento por volumen. Cada certificado emitido consume 1 crédito.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {paquetes.map((pq, idx) => (
                  <div key={pq.slug ?? idx} className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EEECE6' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13.5px] font-semibold" style={{ color: '#0D0E12' }}>{pq.nombre}</p>
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#FFFBEB', color: '#B45309' }}>
                        {pq.creditos} créditos
                      </span>
                    </div>
                    <p className="text-[24px] font-bold leading-none" style={{ color: '#0D0E12' }}>{sol0(pq.precio)}</p>
                    <p className="text-[12px] mt-1.5" style={{ color: '#059669' }}>{sol(costoPorCertificado(pq))} por certificado</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Créditos individuales + usuario extra ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 page-enter stagger-3">
              <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EEECE6' }}>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
                  <h2 className="text-[14.5px] font-bold" style={{ color: '#0D0E12' }}>Créditos individuales</h2>
                </div>
                <div className="space-y-2">
                  {tramos.map((t) => (
                    <div key={t.desde} className="flex items-center justify-between text-[13px]">
                      <span style={{ color: '#64748B' }}>{t.desde}–{t.hasta} créditos</span>
                      <span className="font-semibold tabular-nums" style={{ color: '#0D0E12' }}>{sol(t.precio)} c/u</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11.5px] mt-3 pt-3" style={{ color: '#9CA3AF', borderTop: '1px solid #F2F0EA' }}>
                  Desde 100 créditos conviene un paquete.
                </p>
              </div>

              <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #EEECE6' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-[18px] h-[18px]" style={{ color: '#0EA5E9' }} />
                  <h2 className="text-[14.5px] font-bold" style={{ color: '#0D0E12' }}>Usuario adicional</h2>
                </div>
                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#64748B' }}>Activación (pago único)</span>
                    <span className="font-semibold tabular-nums" style={{ color: '#0D0E12' }}>{sol0(usuarioExtra.activacion)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#64748B' }}>Mensualidad</span>
                    <span className="font-semibold tabular-nums" style={{ color: '#0D0E12' }}>{sol0(usuarioExtra.mensual)} /mes</span>
                  </div>
                </div>
                <p className="text-[11.5px] mt-3 pt-3" style={{ color: '#9CA3AF', borderTop: '1px solid #F2F0EA' }}>
                  Para agregar usuarios por encima del cupo del plan. Descuentos por pago semestral/anual del mantenimiento.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[12px] no-print" style={{ color: '#9CA3AF' }}>
              <FileText className="w-4 h-4" />
              ¿Vas a proponerle esto a un cliente? Arma una <button onClick={() => navigate(`/${tenantId}/certificaciones/cotizaciones`)} className="font-semibold underline" style={{ color: '#059669' }}>cotización</button>.
            </div>
          </>
        )}
      </main>
    </div>
  );
}
