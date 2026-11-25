'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import {
  UserPlus, Pencil, Loader2, AlertCircle, Search, QrCode, Download, X, Check, Calendar, MapPin, User, BadgeCheck, Trash2,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import BotonVolver from '../../shared/components/BotonVolver';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError, imgUrl } from '@/lib/api/client';
import { asesorasApi, type Asesora, type AsesoraStats, type AsesoraInput } from '../../shared/api/asesoras.admin.api';

interface Props { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

/** URL pública que codifica el QR del fotocheck. */
const PUBLIC_SITE = (import.meta.env.VITE_PUBLIC_SITE_URL as string) || 'https://vaxa.com.pe';
const urlValidacion = (codigo: string) => `${PUBLIC_SITE}/se-asesora?codigo=${encodeURIComponent(codigo)}`;

const hoy = () => new Date().toISOString().slice(0, 10);
const fmtFecha = (s: string | null) =>
  s ? new Date(`${s.slice(0, 10)}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
const vencida = (a: Asesora) => !!a.vigente_hasta && a.vigente_hasta.slice(0, 10) < hoy();

export default function AsesorasVaxa({ tenantId }: Props) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [items, setItems] = useState<Asesora[]>([]);
  const [stats, setStats] = useState<AsesoraStats>({ total: 0, activas: 0, vencidas: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [estado, setEstado] = useState<'' | 'activas' | 'baja'>('');
  const [q, setQ] = useState('');
  const [buscar, setBuscar] = useState('');

  const [editando, setEditando] = useState<Asesora | 'nueva' | null>(null);
  const [fotocheck, setFotocheck] = useState<Asesora | null>(null);
  const [cambiando, setCambiando] = useState<number | null>(null);
  const [aEliminar, setAEliminar] = useState<Asesora | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setBuscar(q.trim()), 350);
    return () => clearTimeout(t);
  }, [q]);

  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await asesorasApi.list({ estado: estado || undefined, q: buscar || undefined });
      setItems(r.items); setStats(r.stats);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        authStorage.clearAllSessions(); navigate(tenantPath(tenantId, '/login')); return;
      }
      setError((err as Error).message); setItems([]);
    } finally { setLoading(false); }
  }, [tenantId, navigate, estado, buscar]);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(tenantPath(tenantId, '/login')); return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
    cargar();
  }, [tenantId, navigate, cargar]);

  const toggleEstado = async (a: Asesora) => {
    setCambiando(a.id);
    try {
      await asesorasApi.setEstado(a.id, a.activo === 0);
      await cargar();
    } catch (err) { setError((err as Error).message); }
    finally { setCambiando(null); }
  };

  const confirmarEliminar = async () => {
    if (!aEliminar || eliminando) return;
    setEliminando(true); setDelError(null);
    try {
      await asesorasApi.eliminar(aEliminar.id);
      setAEliminar(null);
      await cargar();
    } catch (err) { setDelError((err as Error).message); }
    finally { setEliminando(false); }
  };

  if (!usuario) return null;

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa tenantId={tenantId} usuario={usuario}
        config={{ name: 'Sistemas Vaxa', primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }} />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <BotonVolver to={tenantPath(tenantId, '/sistemas')} />

        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap page-enter">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Comercial</p>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Asesores</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Personal comercial autorizado · fotocheck con QR verificable en la web.</p>
          </div>
          <button onClick={() => setEditando('nueva')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #059669, #0F766E)' }}>
            <UserPlus size={16} /> Nuevo asesor(a)
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3 mb-5 page-enter">
          {([
            { label: 'Total', value: stats.total, fg: '#0D0E12' },
            { label: 'Activos', value: stats.activas, fg: '#047857' },
            { label: 'Vencidos', value: stats.vencidas, fg: '#B45309' },
          ] as const).map((c) => (
            <div key={c.label} className="rounded-2xl px-4 py-3" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{c.label}</p>
              <p className="text-[24px] font-bold leading-none mt-1 tabular-nums" style={{ color: c.fg }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-4 flex-wrap page-enter">
          {([['', 'Todos'], ['activas', 'Activos'], ['baja', 'De baja']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setEstado(k)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
              style={estado === k ? { background: '#0D0E12', color: '#fff' } : { background: '#fff', color: '#64748B', border: '1px solid #EEECE6' }}>
              {label}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#B0A898' }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar código, nombre, DNI…"
              className="text-[12.5px] rounded-lg pl-8 pr-2.5 outline-none"
              style={{ height: 34, minWidth: 230, border: '1px solid #EEECE6', background: '#fff', color: '#374151' }} />
          </div>
        </div>

        {/* Lista */}
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
              <User size={22} style={{ color: '#D1D5DB', margin: '0 auto 8px' }} />
              <p className="text-[13px]" style={{ color: '#9CA3AF' }}>Aún no hay asesores registrados.</p>
            </div>
          ) : (
            <div>
              {items.map((a, i) => {
                const vig = fmtFecha(a.vigente_hasta);
                const venc = vencida(a);
                return (
                  <div key={a.id} className="flex items-center gap-4 px-4 py-3.5" style={{ borderTop: i === 0 ? undefined : '1px solid #F2F0EA' }}>
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: '#EAF1F7', border: '1px solid #E2E8F0' }}>
                      {a.foto_url ? <img src={imgUrl(a.foto_url)} alt={a.nombre} className="w-full h-full object-cover" /> : <User size={20} style={{ color: '#9DB4C7' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>{a.nombre}</p>
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full tabular-nums" style={{ background: '#F1F5F9', color: '#475569' }}>{a.codigo}</span>
                        {a.activo === 1
                          ? <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: venc ? '#FFFBEB' : '#ECFDF5', color: venc ? '#B45309' : '#047857' }}>{venc ? 'Vencido' : 'Activo'}</span>
                          : <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>De baja</span>}
                      </div>
                      <p className="text-[12px] mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: '#9CA3AF' }}>
                        <span>{a.cargo ?? 'Asesor(a) Comercial'}</span>
                        {a.dni && <span>· DNI {a.dni}</span>}
                        {a.zona && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {a.zona}</span>}
                        {vig && <span className="inline-flex items-center gap-1" style={{ color: venc ? '#B45309' : '#9CA3AF' }}><Calendar size={11} /> vence {vig}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setFotocheck(a)} title="Fotocheck y QR"
                        className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[12px] font-semibold transition-colors"
                        style={{ background: '#ECFDF5', color: '#047857' }}>
                        <QrCode size={14} /> Fotocheck
                      </button>
                      <button onClick={() => setEditando(a)} title="Editar"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[#F5F3EE]" style={{ color: '#64748B' }}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => toggleEstado(a)} disabled={cambiando === a.id} title={a.activo === 1 ? 'Dar de baja' : 'Reactivar'}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[#F5F3EE] disabled:opacity-50" style={{ color: a.activo === 1 ? '#B45309' : '#047857' }}>
                        {cambiando === a.id ? <Loader2 size={15} className="animate-spin" /> : a.activo === 1 ? <X size={16} /> : <Check size={16} />}
                      </button>
                      <button onClick={() => { setAEliminar(a); setDelError(null); }} title="Eliminar"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-red-50" style={{ color: '#DC2626' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {editando && (
        <FormModal
          asesora={editando === 'nueva' ? null : editando}
          onClose={() => setEditando(null)}
          onSaved={() => { setEditando(null); cargar(); }}
        />
      )}
      {fotocheck && <FotocheckModal asesora={fotocheck} onClose={() => setFotocheck(null)} />}
      {aEliminar && (
        <ConfirmarEliminar asesora={aEliminar} eliminando={eliminando} error={delError}
          onCancel={() => { if (!eliminando) setAEliminar(null); }} onConfirm={confirmarEliminar} />
      )}
    </div>
  );
}

/* ── Modal de confirmación de borrado ────────────────────────────── */
function ConfirmarEliminar({ asesora, eliminando, error, onCancel, onConfirm }: {
  asesora: Asesora; eliminando: boolean; error: string | null; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <Overlay onClose={onCancel}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <Trash2 size={18} style={{ color: '#DC2626' }} />
        </div>
        <div className="min-w-0">
          <h3 className="text-[16px] font-bold" style={{ color: '#0D0E12' }}>Eliminar asesor(a)</h3>
          <p className="text-[13px] mt-1" style={{ color: '#64748B' }}>
            ¿Eliminar definitivamente a <b style={{ color: '#0D0E12' }}>{asesora.nombre}</b> ({asesora.codigo})?
          </p>
          <p className="text-[12.5px] mt-2" style={{ color: '#9F5757' }}>
            Esta acción no se puede deshacer. Su QR/fotocheck dejará de validar. Si solo quieres pausarla, usa <b>“Dar de baja”</b>.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 px-3 py-2.5 rounded-xl flex items-center gap-2 text-[12.5px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <div className="flex justify-end gap-2.5 mt-5">
        <button onClick={onCancel} disabled={eliminando} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-50" style={{ background: '#F1F5F9', color: '#475569' }}>
          Cancelar
        </button>
        <button onClick={onConfirm} disabled={eliminando}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60" style={{ background: '#DC2626' }}>
          {eliminando ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Eliminar
        </button>
      </div>
    </Overlay>
  );
}

/* ── Modal de alta / edición ─────────────────────────────────────── */
function FormModal({ asesora, onClose, onSaved }: { asesora: Asesora | null; onClose: () => void; onSaved: () => void }) {
  const editar = !!asesora;
  const [form, setForm] = useState<AsesoraInput>({
    nombre: asesora?.nombre ?? '',
    dni: asesora?.dni ?? '',
    cargo: asesora?.cargo ?? 'Asesor(a) Comercial',
    zona: asesora?.zona ?? '',
    telefono: asesora?.telefono ?? '',
    vigente_hasta: asesora?.vigente_hasta ? asesora.vigente_hasta.slice(0, 10) : '',
  });
  const [fotoUrl, setFotoUrl] = useState<string | null>(asesora?.foto_url ?? null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof AsesoraInput) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('La foto debe ser una imagen.'); return; }
    setSubiendo(true); setError(null);
    try { setFotoUrl(await asesorasApi.subirFoto(file)); }
    catch (err) { setError((err as Error).message); }
    finally { setSubiendo(false); }
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    setGuardando(true); setError(null);
    const data: AsesoraInput = { ...form, vigente_hasta: form.vigente_hasta || null, foto_url: fotoUrl ?? '' };
    try {
      if (editar && asesora) await asesorasApi.actualizar(asesora.id, data);
      else await asesorasApi.crear(data);
      onSaved();
    } catch (err) { setError((err as Error).message); }
    finally { setGuardando(false); }
  };

  const INPUT = 'w-full px-3 py-2.5 rounded-xl text-[13.5px] outline-none';
  const ISTYLE = { background: '#F8FAF9', border: '1px solid #EEECE6', color: '#1F2937' } as const;

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>{editar ? 'Editar asesor(a)' : 'Nuevo asesor(a)'}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F3EE]" style={{ color: '#94A3B8' }}><X size={18} /></button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: '#EAF1F7', border: '1px solid #E2E8F0' }}>
          {fotoUrl ? <img src={imgUrl(fotoUrl)} alt="" className="w-full h-full object-cover" /> : <User size={24} style={{ color: '#9DB4C7' }} />}
        </div>
        <div>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-semibold cursor-pointer transition-colors hover:bg-[#F5F3EE]" style={{ border: '1px solid #EEECE6', color: '#374151' }}>
            {subiendo ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="rotate-180" />}
            {fotoUrl ? 'Cambiar foto' : 'Subir foto'}
            <input type="file" accept="image/*" className="hidden" onChange={onFoto} disabled={subiendo} />
          </label>
          {fotoUrl && <button onClick={() => setFotoUrl(null)} className="ml-2 text-[12px] font-medium" style={{ color: '#DC2626' }}>Quitar</button>}
          <p className="text-[11px] mt-1" style={{ color: '#9CA3AF' }}>Se guarda como archivo.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="sm:col-span-2 text-[12px] font-semibold" style={{ color: '#64748B' }}>Nombres y apellidos *
          <input className={`${INPUT} mt-1`} style={ISTYLE} value={form.nombre} onChange={(e) => set('nombre')(e.target.value)} placeholder="Ej. María Pérez Torres" />
        </label>
        <label className="text-[12px] font-semibold" style={{ color: '#64748B' }}>DNI
          <input className={`${INPUT} mt-1`} style={ISTYLE} value={form.dni} inputMode="numeric" maxLength={8}
            onChange={(e) => set('dni')(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="74859632" />
        </label>
        <label className="text-[12px] font-semibold" style={{ color: '#64748B' }}>Cargo
          <input className={`${INPUT} mt-1`} style={ISTYLE} value={form.cargo} onChange={(e) => set('cargo')(e.target.value)} placeholder="Asesor(a) Comercial" />
        </label>
        <label className="text-[12px] font-semibold" style={{ color: '#64748B' }}>Zona
          <input className={`${INPUT} mt-1`} style={ISTYLE} value={form.zona} onChange={(e) => set('zona')(e.target.value)} placeholder="Lima Norte" />
        </label>
        <label className="text-[12px] font-semibold" style={{ color: '#64748B' }}>
          <span className="flex items-center justify-between">
            <span>Vigente hasta <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></span>
            {form.vigente_hasta && (
              <button type="button" onClick={() => set('vigente_hasta')('')} className="text-[11px] font-semibold" style={{ color: '#DC2626' }}>
                Sin vencimiento
              </button>
            )}
          </span>
          <input type="date" className={`${INPUT} mt-1`} style={ISTYLE} value={form.vigente_hasta ?? ''} onChange={(e) => set('vigente_hasta')(e.target.value)} />
          <span className="block text-[11px] mt-1" style={{ color: '#9CA3AF', fontWeight: 400 }}>
            {form.vigente_hasta ? 'Después de esta fecha dejará de figurar como autorizada.' : 'Sin fecha = autorizada permanentemente (no vence).'}
          </span>
        </label>
      </div>

      {error && <p className="text-[13px] mt-3" style={{ color: '#DC2626' }}>{error}</p>}

      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold" style={{ background: '#F1F5F9', color: '#475569' }}>Cancelar</button>
        <button onClick={guardar} disabled={guardando || subiendo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #059669, #0F766E)' }}>
          {guardando ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : <><Check size={15} /> {editar ? 'Guardar cambios' : 'Registrar'}</>}
        </button>
      </div>
    </Overlay>
  );
}

/* ── Modal del fotocheck + QR ────────────────────────────────────── */
function FotocheckModal({ asesora, onClose }: { asesora: Asesora; onClose: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const url = urlValidacion(asesora.codigo);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr(null));
  }, [url]);

  const descargarQR = () => {
    if (!qr) return;
    const a = document.createElement('a'); a.href = qr; a.download = `QR-${asesora.codigo}.png`; a.click();
  };

  const imprimir = () => {
    if (!qr) return;
    const foto = asesora.foto_url ? imgUrl(asesora.foto_url) : '';
    const win = window.open('', '_blank', 'width=420,height=680');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Fotocheck ${asesora.codigo}</title>
      <style>
        *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;margin:0}
        body{display:flex;justify-content:center;padding:24px;background:#fff}
        .card{width:300px;border:1px solid #E2E8F0;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(11,37,64,.12)}
        .top{background:linear-gradient(135deg,#0E3A6B,#0A2A4E);height:46px}
        .body{padding:16px 18px;text-align:center}
        .foto{width:130px;height:140px;margin:-52px auto 10px;border-radius:12px;object-fit:cover;border:4px solid #fff;background:#EAF1F7}
        .nombre{font-size:18px;font-weight:800;color:#0B2540}
        .cargo{display:inline-block;margin-top:6px;padding:3px 12px;border-radius:999px;background:#D1FAE5;color:#047857;font-size:12px;font-weight:700}
        .row{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid #EEF2F6;text-align:left}
        .lbl{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#94A3B8;font-weight:700}
        .val{font-size:13px;font-weight:800;color:#0B2540}
        .qr{width:92px;height:92px}
        .cod{margin-top:10px;font-size:11px;color:#64748B;font-weight:700;letter-spacing:.05em}
      </style></head><body onload="window.print()">
      <div class="card">
        <div class="top"></div>
        <div class="body">
          ${foto ? `<img class="foto" src="${foto}" />` : `<div class="foto"></div>`}
          <div class="nombre">${asesora.nombre}</div>
          <div class="cargo">${asesora.cargo ?? 'Asesor(a) Comercial'}</div>
          <div class="row">
            <div><div class="lbl">DNI</div><div class="val">${asesora.dni ?? '—'}</div>
              <div class="lbl" style="margin-top:8px">Código</div><div class="val">${asesora.codigo}</div></div>
            <img class="qr" src="${qr}" />
          </div>
          <div class="cod">VAXA SYSTEMS S.A.C. · Verifica en ${PUBLIC_SITE.replace(/^https?:\/\//, '')}</div>
        </div>
      </div></body></html>`);
    win.document.close();
  };

  return (
    <Overlay onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>Fotocheck · {asesora.codigo}</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F3EE]" style={{ color: '#94A3B8' }}><X size={18} /></button>
      </div>

      {/* Vista previa del fotocheck */}
      <div className="mx-auto rounded-2xl overflow-hidden" style={{ width: 260, border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(11,37,64,.12)' }}>
        <div style={{ height: 40, background: 'linear-gradient(135deg,#0E3A6B,#0A2A4E)' }} />
        <div className="px-5 pb-5 text-center">
          <div className="w-28 h-32 mx-auto -mt-11 rounded-xl overflow-hidden flex items-center justify-center" style={{ border: '4px solid #fff', background: '#EAF1F7' }}>
            {asesora.foto_url ? <img src={imgUrl(asesora.foto_url)} alt={asesora.nombre} className="w-full h-full object-cover" /> : <User size={34} style={{ color: '#9DB4C7' }} />}
          </div>
          <p className="text-[17px] font-bold mt-2.5" style={{ color: '#0B2540' }}>{asesora.nombre}</p>
          <span className="inline-block mt-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold" style={{ background: '#D1FAE5', color: '#047857' }}>{asesora.cargo ?? 'Asesor(a) Comercial'}</span>
          <div className="flex items-center justify-between mt-3.5 pt-3 text-left" style={{ borderTop: '1px solid #EEF2F6' }}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: '#94A3B8' }}>DNI</p>
              <p className="text-[13px] font-bold tabular-nums" style={{ color: '#0B2540' }}>{asesora.dni ?? '—'}</p>
              <p className="text-[9px] font-bold uppercase tracking-wide mt-1.5" style={{ color: '#94A3B8' }}>Código</p>
              <p className="text-[13px] font-bold tabular-nums" style={{ color: '#0B2540' }}>{asesora.codigo}</p>
            </div>
            {qr ? <img src={qr} alt="QR" className="w-[84px] h-[84px]" /> : <div className="w-[84px] h-[84px] flex items-center justify-center" style={{ color: '#CBD5E1' }}><Loader2 size={22} className="animate-spin" /></div>}
          </div>
        </div>
      </div>

      <div className="rounded-xl p-3 mt-4 text-[12px] flex items-start gap-2" style={{ background: '#F0FDFA', color: '#0F766E' }}>
        <BadgeCheck size={16} className="shrink-0 mt-0.5" />
        <span>El QR lleva a <b>{url}</b>, donde el cliente confirma que es una asesora autorizada.</span>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button onClick={descargarQR} disabled={!qr} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-50" style={{ background: '#F1F5F9', color: '#475569' }}>
          <QrCode size={15} /> Descargar QR
        </button>
        <button onClick={imprimir} disabled={!qr} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #059669, #0F766E)' }}>
          <Download size={15} /> Imprimir fotocheck
        </button>
      </div>
    </Overlay>
  );
}

/* ── Overlay reutilizable ────────────────────────────────────────── */
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5 max-h-[92vh] overflow-y-auto" style={{ background: '#fff' }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
