'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import {
  ClipboardList, Loader2, AlertCircle, Search, MessageCircle, Mail, Phone, ChevronDown,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import BotonVolver from '../../shared/components/BotonVolver';
import Pager from '../../shared/components/Pager';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { solicitudesApi, type Solicitud, type SolicitudEstado, type SolicitudStats } from '../../shared/api/solicitudes.admin.api';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const POR_PAGINA = 12;

const ESTADO_META: Record<SolicitudEstado, { label: string; bg: string; fg: string }> = {
  pendiente:  { label: 'Pendiente',  bg: '#FFFBEB', fg: '#B45309' },
  atendida:   { label: 'Atendida',   bg: '#ECFDF5', fg: '#047857' },
  descartada: { label: 'Descartada', bg: '#F1F5F9', fg: '#475569' },
};
const ESTADOS: SolicitudEstado[] = ['pendiente', 'atendida', 'descartada'];

const fmtFechaHora = (s: string) =>
  new Date(s.replace(' ', 'T')).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const soloDigitos = (v: string) => v.replace(/\D/g, '');

/** Selector de estado por fila: guarda en el backend al instante. */
function EstadoSelect({ value, onChange, busy }: { value: SolicitudEstado; onChange: (e: SolicitudEstado) => void; busy: boolean }) {
  const m = ESTADO_META[value];
  return (
    <div className="relative inline-flex items-center">
      <select value={value} disabled={busy} onChange={(e) => onChange(e.target.value as SolicitudEstado)}
        className="appearance-none text-[11px] font-bold rounded-full pl-2.5 pr-6 py-1 outline-none cursor-pointer disabled:opacity-60"
        style={{ background: m.bg, color: m.fg }}>
        {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_META[e].label}</option>)}
      </select>
      {busy
        ? <Loader2 size={12} className="animate-spin absolute right-1.5 pointer-events-none" style={{ color: m.fg }} />
        : <ChevronDown size={12} className="absolute right-1.5 pointer-events-none" style={{ color: m.fg }} />}
    </div>
  );
}

/** Detalle expandible: tipo de organización, necesidad e info adicional. */
function Detalle({ s }: { s: Solicitud }) {
  const campo = (label: string, valor: string | null) => valor ? (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>{label}</p>
      <p className="text-[12.5px] mt-0.5" style={{ color: '#374151' }}>{valor}</p>
    </div>
  ) : null;
  return (
    <div className="px-4 py-3.5 grid gap-3 sm:grid-cols-2" style={{ background: '#FAFAF8' }}>
      {campo('Tipo de organización', s.tipo_organizacion)}
      {campo('Servicio solicitado', s.servicio)}
      {campo('Necesidad del cliente', s.necesidad)}
      {campo('Información adicional', s.info_adicional)}
      {campo('Origen', s.origen)}
    </div>
  );
}

export default function SolicitudesVaxa({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [items, setItems]   = useState<Solicitud[]>([]);
  const [total, setTotal]   = useState(0);
  const [stats, setStats]   = useState<SolicitudStats>({ total: 0, pendiente: 0, atendida: 0, descartada: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const [estado, setEstado] = useState<SolicitudEstado | 'TODOS'>('TODOS');
  const [q, setQ]           = useState('');
  const [buscar, setBuscar] = useState('');
  const [page, setPage]     = useState(1);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [guardando, setGuardando] = useState<number | null>(null);

  // Debounce de la búsqueda.
  useEffect(() => {
    const t = setTimeout(() => { setBuscar(q.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await solicitudesApi.list({
        estado: estado === 'TODOS' ? undefined : estado,
        q: buscar || undefined,
        limit: POR_PAGINA,
        offset: (page - 1) * POR_PAGINA,
      });
      setItems(r.items);
      setTotal(r.total);
      setStats(r.stats);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        authStorage.clearAllSessions(); navigate(tenantPath(tenantId, '/login')); return;
      }
      setError((err as Error).message);
      setItems([]); setTotal(0);
    } finally { setLoading(false); }
  }, [tenantId, navigate, estado, buscar, page]);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(tenantPath(tenantId, '/login')); return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
    cargar();
  }, [tenantId, navigate, cargar]);

  const cambiarEstado = async (s: Solicitud, nuevo: SolicitudEstado) => {
    if (nuevo === s.estado) return;
    setGuardando(s.id);
    const anterior = s.estado;
    setItems((xs) => xs.map((x) => x.id === s.id ? { ...x, estado: nuevo } : x));   // optimista
    try {
      await solicitudesApi.cambiarEstado(s.id, nuevo);
    } catch (err) {
      setItems((xs) => xs.map((x) => x.id === s.id ? { ...x, estado: anterior } : x));   // revertir
      setError((err as Error).message);
    } finally { setGuardando(null); }
  };

  if (!usuario) return null;

  const pages = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa tenantId={tenantId} usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }} />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <BotonVolver to={tenantPath(tenantId, '/sistemas')} />

        <div className="mb-6 page-enter">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Comercial</p>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Solicitudes</h1>
          <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Leads recibidos desde el formulario inteligente de la web</p>
        </div>

        {/* Estadísticas (clic para filtrar) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 page-enter">
          {([
            { key: 'TODOS',      label: 'Total',       value: stats.total,      fg: '#0D0E12' },
            { key: 'pendiente',  label: 'Pendientes',  value: stats.pendiente,  fg: ESTADO_META.pendiente.fg },
            { key: 'atendida',   label: 'Atendidas',   value: stats.atendida,   fg: ESTADO_META.atendida.fg },
            { key: 'descartada', label: 'Descartadas', value: stats.descartada, fg: ESTADO_META.descartada.fg },
          ] as const).map((c) => {
            const active = estado === c.key;
            return (
              <button key={c.key} onClick={() => { setEstado(c.key); setPage(1); }}
                className="text-left rounded-2xl px-4 py-3 transition-all"
                style={{ background: '#fff', border: `1px solid ${active ? '#0D0E12' : '#EEECE6'}`, boxShadow: active ? '0 8px 20px -10px rgba(13,14,18,0.35)' : 'none' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{c.label}</p>
                <p className="text-[26px] font-bold leading-none mt-1 tabular-nums" style={{ color: c.fg }}>{c.value}</p>
              </button>
            );
          })}
        </div>

        {/* Búsqueda */}
        <div className="flex items-center mb-4 page-enter">
          <div className="relative w-full sm:w-auto sm:ml-auto">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#B0A898' }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar código, nombre, correo…"
              className="text-[12.5px] rounded-lg pl-8 pr-2.5 outline-none w-full"
              style={{ height: 34, minWidth: 230, border: '1px solid #EEECE6', background: '#fff', color: '#374151' }} />
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl overflow-hidden page-enter" style={{ border: '1px solid #EEECE6' }}>
          {loading ? (
            <div className="flex justify-center py-16" style={{ color: '#D1D5DB' }}><Loader2 size={24} className="animate-spin" /></div>
          ) : error ? (
            <div className="py-12 text-center">
              <AlertCircle size={20} style={{ color: '#DC2626', margin: '0 auto 8px' }} />
              <p className="text-[13px]" style={{ color: '#B91C1C' }}>{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-14 text-center">
              <ClipboardList size={22} style={{ color: '#D1D5DB', margin: '0 auto 8px' }} />
              <p className="text-[13px]" style={{ color: '#9CA3AF' }}>No hay solicitudes registradas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898', background: '#FAFAF8' }}>
                    <th className="text-right px-3 py-2.5 w-12">#</th>
                    <th className="text-left px-4 py-2.5">Fecha</th>
                    <th className="text-left px-4 py-2.5">Código</th>
                    <th className="text-left px-4 py-2.5">Cliente</th>
                    <th className="text-left px-4 py-2.5">Servicio</th>
                    <th className="text-left px-4 py-2.5">Contacto</th>
                    <th className="text-left px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s, i) => {
                    const wa = soloDigitos(s.whatsapp);
                    const abierto = abierta === s.id;
                    const nro = (Math.min(page, pages) - 1) * POR_PAGINA + i + 1;
                    return (
                      <Fragment key={s.id}>
                        <tr style={{ borderTop: '1px solid #F2F0EA' }}>
                          <td className="px-3 py-3 text-right tabular-nums align-top font-semibold" style={{ color: '#B0A898' }}>{nro}</td>
                          <td className="px-4 py-3 tabular-nums whitespace-nowrap align-top" style={{ color: '#64748B' }}>{fmtFechaHora(s.created_at)}</td>
                          <td className="px-4 py-3 align-top font-bold tabular-nums whitespace-nowrap" style={{ color: '#0D0E12' }}>{s.codigo}</td>
                          <td className="px-4 py-3 align-top">
                            <p className="font-semibold" style={{ color: '#0D0E12' }}>{s.nombre}</p>
                            {s.empresa && <p className="text-[11px]" style={{ color: '#9CA3AF' }}>{s.empresa}</p>}
                          </td>
                          <td className="px-4 py-3 align-top" style={{ color: '#374151', maxWidth: 220 }}>{s.servicio ?? '—'}</td>
                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {wa && (
                                <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" title={`WhatsApp ${s.whatsapp}`}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-transform hover:-translate-y-0.5"
                                  style={{ background: '#ECFDF5', color: '#25A05A' }}>
                                  <MessageCircle size={14} />
                                </a>
                              )}
                              {wa && (
                                <a href={`tel:${wa}`} title={s.whatsapp}
                                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-transform hover:-translate-y-0.5"
                                  style={{ background: '#F5F4F0', color: '#64748B' }}>
                                  <Phone size={13} />
                                </a>
                              )}
                              <a href={`mailto:${s.correo}`} title={s.correo}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-transform hover:-translate-y-0.5"
                                style={{ background: '#EFF6FF', color: '#2563EB' }}>
                                <Mail size={13} />
                              </a>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <EstadoSelect value={s.estado} busy={guardando === s.id} onChange={(e) => cambiarEstado(s, e)} />
                          </td>
                          <td className="px-4 py-3 align-top text-right">
                            <button onClick={() => setAbierta(abierto ? null : s.id)}
                              className="inline-flex items-center gap-1 text-[11.5px] font-semibold transition-colors hover:text-[#0D0E12]"
                              style={{ color: '#9CA3AF' }}>
                              {abierto ? 'Ocultar' : 'Ver detalle'}
                              <ChevronDown size={13} style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                            </button>
                          </td>
                        </tr>
                        {abierto && (
                          <tr>
                            <td colSpan={8} style={{ borderTop: '1px solid #F2F0EA' }}><Detalle s={s} /></td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && !error && total > 0 && (
          <div className="mt-4">
            <Pager page={Math.min(page, pages)} pages={pages} total={total} onPage={setPage} />
          </div>
        )}
      </main>
    </div>
  );
}
