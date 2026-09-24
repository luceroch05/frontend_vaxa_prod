'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import { Loader2, Package, DollarSign, TrendingUp, CreditCard, AlertTriangle, Calendar } from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';
import {
  infraRecursosApi, infraAlquileresApi, enviarAvisosCobro,
  type InfraRecurso, type InfraAlquiler,
  aMensual, diasHasta, estadoVencimiento, fechaCorta,
} from '../../shared/api/infra.admin.api';
import RecursosPanel from './RecursosPanel';
import AlquileresPanel from './AlquileresPanel';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const GREEN = '#059669';

const fmt = (n: number, moneda = 'PEN') =>
  `${moneda === 'USD' ? '$' : 'S/'} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function InfraestructuraVaxa({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [tab, setTab] = useState<'resumen' | 'recursos' | 'alquileres'>('resumen');
  const [recursos, setRecursos] = useState<InfraRecurso[]>([]);
  const [alquileres, setAlquileres] = useState<InfraAlquiler[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [avisoMsg, setAvisoMsg] = useState<string | null>(null);

  const enviarAviso = async () => {
    setEnviando(true); setAvisoMsg(null);
    try {
      const r = await enviarAvisosCobro();
      setAvisoMsg(r.enviado ? `Correo enviado a info@vaxa.com.pe (${r.cantidad} cobro(s)).` : `Sin envío: ${r.motivo}.`);
    } catch (e) { setAvisoMsg('No se pudo enviar el correo. Revisa la config SMTP.'); }
    finally { setEnviando(false); }
  };

  useEffect(() => {
    if (!tenantId) return;
    const authData = localStorage.getItem(`auth_${tenantId}`);
    const userData = localStorage.getItem(`auth_user_${tenantId}`);
    if (authData !== 'true') { navigate(tenantPath(tenantId, '/login')); return; }
    if (userData) { try { setUsuario(JSON.parse(userData)); } catch { navigate(tenantPath(tenantId, '/login')); return; } }
  }, [tenantId, navigate]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([infraRecursosApi.list(), infraAlquileresApi.list()]);
      setRecursos(Array.isArray(r) ? r : []);
      setAlquileres(Array.isArray(a) ? a : []);
    } catch { /* noop */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (!usuario) return null;

  // ── Métricas del resumen ─────────────────────────────────
  const pagoMensual = recursos.filter((r) => r.activo !== 0).reduce((s, r) => s + aMensual(Number(r.costo) || 0, r.ciclo), 0);
  const cobroMensual = alquileres.filter((a) => a.activo !== 0).reduce((s, a) => s + aMensual(Number(a.precio) || 0, a.ciclo), 0);
  const ganancia = cobroMensual - pagoMensual;

  // Próximos vencimientos (recursos = pagar, alquileres = cobrar), ordenados por fecha
  type Venc = { tipo: 'pagar' | 'cobrar'; nombre: string; sub: string; fecha: string; dias: number };
  const vencs: Venc[] = [
    ...recursos.filter((r) => r.activo !== 0 && r.fecha_renovacion).map((r) => ({
      tipo: 'pagar' as const, nombre: r.nombre, sub: `${r.tipo}${r.proveedor ? ` · ${r.proveedor}` : ''}`,
      fecha: r.fecha_renovacion!, dias: diasHasta(r.fecha_renovacion) ?? 9999,
    })),
    ...alquileres.filter((a) => a.activo !== 0 && a.proximo_cobro).map((a) => ({
      tipo: 'cobrar' as const, nombre: a.empresa_nombre || a.cliente || 'Cliente', sub: a.descripcion || a.recurso_nombre || 'Servicio',
      fecha: a.proximo_cobro!, dias: diasHasta(a.proximo_cobro) ?? 9999,
    })),
  ].sort((x, y) => x.dias - y.dias).slice(0, 8);

  const semColor = (f: string) => {
    const e = estadoVencimiento(f);
    return e === 'vencido' ? '#DC2626' : e === 'por_vencer' ? '#D97706' : GREEN;
  };
  const semTxt = (dias: number) => dias < 0 ? `Venció hace ${Math.abs(dias)} d` : dias === 0 ? 'Hoy' : `En ${dias} d`;

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa tenantId={tenantId} usuario={usuario}
        config={{ name: VAXA_CONFIG.NAME, primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }} />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <div className="mb-6 page-enter flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: '#ECFDF5' }}>
            <Package size={18} style={{ color: GREEN }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Infraestructura</h1>
            <p className="text-[13px] mt-0.5" style={{ color: '#9CA3AF' }}>Tus VPS, dominios y hosting: lo que pagas al proveedor y lo que le cobras a tus clientes.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: '#ECECE7' }}>
          {([['resumen', 'Resumen'], ['recursos', 'Recursos'], ['alquileres', 'Alquileres']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className="px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors"
              style={tab === k ? { background: '#fff', color: '#0D0E12', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: '#7B8B89' }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: GREEN }} /></div>
        ) : tab === 'recursos' ? (
          <RecursosPanel recursos={recursos} onChange={cargar} />
        ) : tab === 'alquileres' ? (
          <AlquileresPanel alquileres={alquileres} recursos={recursos} onChange={cargar} />
        ) : (
          /* ── Resumen ── */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard icon={<CreditCard size={18} />} label="Pagas al mes" value={fmt(pagoMensual)} tint="#0D0E12" />
              <MetricCard icon={<DollarSign size={18} />} label="Cobras al mes" value={fmt(cobroMensual)} tint={GREEN} />
              <MetricCard icon={<TrendingUp size={18} />} label="Ganancia mensual" value={fmt(ganancia)} tint={ganancia >= 0 ? GREEN : '#DC2626'} />
            </div>

            <div className="sv-card p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} style={{ color: GREEN }} />
                  <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Próximos vencimientos</h3>
                </div>
                <button onClick={enviarAviso} disabled={enviando}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                  style={{ background: '#ECFDF5', color: GREEN, border: '1px solid #A7F3D0' }}>
                  {enviando ? <Loader2 size={13} className="animate-spin" /> : null} Enviar aviso por correo
                </button>
              </div>
              {avisoMsg && <p className="text-[12px] mb-3 px-3 py-2 rounded-lg" style={{ background: '#F0FDF4', color: '#047857', border: '1px solid #A7F3D0' }}>{avisoMsg}</p>}
              {vencs.length === 0 ? (
                <p className="text-[13px] py-6 text-center" style={{ color: '#9CA3AF' }}>No hay fechas registradas todavía.</p>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
                  {vencs.map((v, i) => (
                    <button key={i} type="button" onClick={() => setTab(v.tipo === 'pagar' ? 'recursos' : 'alquileres')}
                      className="w-full text-left flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-gray-50"
                      style={{ borderBottom: i < vencs.length - 1 ? '1px solid #F1F4F3' : undefined, background: '#fff' }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0" style={{
                          background: v.tipo === 'pagar' ? '#FEF3C7' : '#ECFDF5',
                          color: v.tipo === 'pagar' ? '#B45309' : GREEN,
                        }}>{v.tipo === 'pagar' ? 'PAGAR' : 'COBRAR'}</span>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold truncate" style={{ color: '#0D0E12' }}>{v.nombre}</p>
                          <p className="text-[11.5px] truncate" style={{ color: '#9CA3AF' }}>{v.sub}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-2">
                        {v.dias <= 7 && <AlertTriangle size={14} style={{ color: semColor(v.fecha) }} />}
                        <div>
                          <p className="text-[12.5px] font-semibold" style={{ color: semColor(v.fecha) }}>{semTxt(v.dias)}</p>
                          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{fechaCorta(v.fecha)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: string; tint: string }) {
  return (
    <div className="sv-card p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12.5px] font-medium" style={{ color: '#9CA3AF' }}>{label}</p>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5', color: GREEN }}>{icon}</span>
      </div>
      <p className="text-[24px] font-bold tracking-tight" style={{ color: tint }}>{value}</p>
    </div>
  );
}
