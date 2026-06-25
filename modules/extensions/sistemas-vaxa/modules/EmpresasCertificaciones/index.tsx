'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import {
  Search, Plus, Building2, Eye, Loader2, AlertCircle, AlertTriangle, Trash2, CheckCircle, RefreshCw,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import BotonVolver from '../../shared/components/BotonVolver';
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

  // Eliminar empresa desde el listado (con confirmación en modal).
  const [aEliminar, setAEliminar] = useState<EmpresaCreditos | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Filtro Activas / Inactivas y reactivación rápida.
  const [estadoFiltro, setEstadoFiltro] = useState<'activas' | 'inactivas'>('activas');
  const [reactivandoId, setReactivandoId] = useState<number | null>(null);

  const reactivar = async (e: EmpresaCreditos) => {
    if (reactivandoId) return;
    setReactivandoId(e.id); setError(null);
    try {
      await creditosAdminApi.editarEmpresa(e.id, { activo: true });
      setOkMsg(`"${e.razon_social}" se reactivó.`);
      await fetchEmpresas();
      setTimeout(() => setOkMsg(null), 4000);
    } catch (err) { setError((err as Error).message); }
    finally { setReactivandoId(null); }
  };

  const confirmarEliminar = async () => {
    if (!aEliminar || eliminando) return;
    setEliminando(true); setDelError(null);
    try {
      const r = await creditosAdminApi.eliminarEmpresa(aEliminar.id);
      setOkMsg(
        r.modo === 'eliminada'
          ? `"${aEliminar.razon_social}" se eliminó por completo.`
          : `"${aEliminar.razon_social}" se desactivó (tenía datos asociados).`,
      );
      setAEliminar(null);
      await fetchEmpresas();
      setTimeout(() => setOkMsg(null), 4000);
    } catch (e) { setDelError((e as Error).message); }
    finally { setEliminando(false); }
  };

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

  const activasCount = empresas.filter((e) => e.activo).length;
  const inactivasCount = empresas.length - activasCount;

  const q = searchTerm.toLowerCase().trim();
  const filtradas = empresas
    .filter((e) => (estadoFiltro === 'activas' ? !!e.activo : !e.activo))
    .filter((e) =>
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
        <BotonVolver to={`/${tenantId}/certificaciones`} />

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

        {/* Segmentado Activas / Inactivas */}
        <div className="mb-4 flex items-center gap-1 p-1 rounded-xl w-fit page-enter stagger-1" style={{ background: '#ECEAE4', border: '1px solid #E5E1D8' }}>
          {([
            { id: 'activas' as const, label: 'Activas', count: activasCount },
            { id: 'inactivas' as const, label: 'Inactivas', count: inactivasCount },
          ]).map((seg) => {
            const active = estadoFiltro === seg.id;
            return (
              <button
                key={seg.id}
                onClick={() => setEstadoFiltro(seg.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all"
                style={{
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#0D0E12' : '#8A8678',
                  boxShadow: active ? '0 1px 2px rgba(13,14,18,0.08)' : 'none',
                }}
              >
                {seg.label}
                <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold tabular-nums"
                  style={{ background: active ? '#F0FDF4' : 'rgba(13,14,18,0.05)', color: active ? '#15803D' : '#9CA3AF' }}>
                  {seg.count}
                </span>
              </button>
            );
          })}
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

        {okMsg && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]"
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D' }}>
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> {okMsg}
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
              <span className="w-16" />
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
                  <div className="w-16 flex justify-end items-center gap-1">
                    {e.activo ? (
                      <button
                        onClick={(ev) => { ev.stopPropagation(); setAEliminar(e); setDelError(null); }}
                        title="Eliminar empresa"
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ color: '#DC2626' }}
                        onMouseEnter={(ev) => { ev.currentTarget.style.background = '#FEF2F2'; }}
                        onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent'; }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={(ev) => { ev.stopPropagation(); reactivar(e); }}
                        disabled={reactivandoId === e.id}
                        title="Reactivar empresa"
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ color: '#059669' }}
                        onMouseEnter={(ev) => { ev.currentTarget.style.background = '#ECFDF5'; }}
                        onMouseLeave={(ev) => { ev.currentTarget.style.background = 'transparent'; }}
                      >
                        {reactivandoId === e.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <RefreshCw className="w-4 h-4" />}
                      </button>
                    )}
                    <Eye className="w-4 h-4 transition-all group-hover:translate-x-0.5" style={{ color: '#C8C3BB' }} />
                  </div>
                </div>
              );
            })}

            {filtradas.length === 0 && (
              <div className="text-center py-14">
                <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#E5E1D8' }} />
                <p className="text-[14px] font-semibold mb-3" style={{ color: '#0D0E12' }}>
                  {estadoFiltro === 'inactivas' ? 'No hay empresas inactivas' : 'No hay empresas activas'}
                </p>
                {estadoFiltro === 'activas' && (
                  <button
                    onClick={() => navigate(`/${tenantId}/certificaciones/registrar-empresa`)}
                    className="sv-btn sv-btn-primary mx-auto"
                  >
                    <Plus className="w-4 h-4" /> Registrar primera empresa
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Modal de confirmación de eliminación ────────────── */}
      {aEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,14,18,0.45)' }}
          onClick={() => { if (!eliminando) setAEliminar(null); }}
        >
          <div
            className="sv-card w-full max-w-md p-6"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#DC2626' }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>Eliminar empresa</h3>
                <p className="text-[13px] mt-1" style={{ color: '#64748B' }}>
                  ¿Eliminar <b style={{ color: '#0D0E12' }}>{aEliminar.razon_social}</b>?
                </p>
                <p className="text-[12.5px] mt-2" style={{ color: '#9F5757' }}>
                  Si tiene certificados, alumnos o usuarios, no se borra: se desactiva (reversible).
                  Solo si está vacía se elimina por completo.
                </p>
              </div>
            </div>

            {delError && (
              <div className="mt-4 px-3 py-2.5 rounded-xl flex items-center gap-2 text-[12.5px]"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {delError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={() => setAEliminar(null)}
                disabled={eliminando}
                className="sv-btn sv-btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold rounded-lg transition-all disabled:opacity-50"
                style={{ background: '#DC2626', color: '#FFFFFF' }}
              >
                {eliminando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
