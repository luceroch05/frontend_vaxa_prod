'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { ArrowLeft, Plus, User, Mail, Edit, Trash2, Search, Loader2, AlertCircle, X } from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import Pager from '../../shared/components/Pager';
import { VAXA_CONFIG } from '../../shared/constants';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { creditosAdminApi, type UsuarioEmpresa, type Rol } from '../../shared/api/creditos.admin.api';

interface UsuariosSistemasVaxaProps { tenantId: string; tenant: TenantConfig; }
interface Usuario { email: string; nombre: string; role: string; }

const ROOT_SLUG = 'vaxa';
const VACIO = { nombres: '', apellidos: '', correo: '', contrasena: '', rol_id: '' as number | '', activo: true };

export default function UsuariosSistemasVaxa({ tenantId }: UsuariosSistemasVaxaProps) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [empresaVaxaId, setEmpresaVaxaId] = useState<number | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[] | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<'nuevo' | number | null>(null);
  const [form, setForm] = useState(VACIO);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<UsuarioEmpresa | null>(null);
  const [deleting, setDeleting] = useState(false);
  const editando = typeof modal === 'number';

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [empresas, rs] = await Promise.all([
        creditosAdminApi.listEmpresas(),
        creditosAdminApi.listRoles(),
      ]);
      setRoles(rs);
      const vaxa = empresas.find((e) => e.tenant_slug === ROOT_SLUG);
      if (!vaxa) { setError('No se encontró la empresa raíz Vaxa.'); setUsuarios([]); return; }
      setEmpresaVaxaId(vaxa.id);
      setUsuarios(await creditosAdminApi.listUsuarios(vaxa.id, 'sistemas-vaxa'));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        authStorage.clearAllSessions();
        navigate(`/${tenantId}/login`);
        return;
      }
      setError((e as Error).message);
    }
  }, [tenantId, navigate]);

  useEffect(() => {
    if (localStorage.getItem(`auth_${tenantId}`) !== 'true' || !authStorage.getToken('vaxa')) {
      navigate(`/${tenantId}/login`);
      return;
    }
    try { setUsuario(JSON.parse(localStorage.getItem(`auth_user_${tenantId}`) ?? 'null')); } catch { /* noop */ }
    cargar();
  }, [tenantId, navigate, cargar]);

  if (!usuario) return null;

  const q = searchTerm.toLowerCase().trim();
  const filtrados = (usuarios ?? []).filter((u) =>
    `${u.nombres} ${u.apellidos}`.toLowerCase().includes(q) || u.correo.toLowerCase().includes(q),
  );

  // Paginación del listado de usuarios.
  const POR_PAGINA = 12;
  const pages = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const pageSafe = Math.min(page, pages);
  const filtradosPagina = filtrados.slice((pageSafe - 1) * POR_PAGINA, pageSafe * POR_PAGINA);

  const abrirNuevo = () => { setError(null); setForm({ ...VACIO, rol_id: roles[0]?.id ?? '' }); setModal('nuevo'); };
  const abrirEditar = (u: UsuarioEmpresa) => {
    setError(null);
    setForm({ nombres: u.nombres, apellidos: u.apellidos, correo: u.correo, contrasena: '', rol_id: u.rol_id, activo: u.activo === 1 });
    setModal(u.id);
  };
  const cerrar = () => setModal(null);
  const set = (k: keyof typeof VACIO, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const eliminar = async () => {
    if (!confirmDel || !empresaVaxaId) return;
    setDeleting(true); setError(null);
    try {
      await creditosAdminApi.eliminarUsuario(empresaVaxaId, confirmDel.id, 'sistemas-vaxa');
      setUsuarios((prev) => (prev ?? []).filter((u) => u.id !== confirmDel.id));
      setConfirmDel(null);
    } catch (e) { setError((e as Error).message); }
    finally { setDeleting(false); }
  };

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!empresaVaxaId) return;
    if (!form.rol_id) { setError('Selecciona un rol'); return; }
    setSaving(true); setError(null);
    try {
      if (editando) {
        const upd = await creditosAdminApi.editarUsuario(empresaVaxaId, modal as number, {
          nombres: form.nombres, apellidos: form.apellidos, correo: form.correo,
          rol_id: Number(form.rol_id), activo: form.activo,
          ...(form.contrasena ? { contrasena: form.contrasena } : {}),
        });
        setUsuarios((prev) => (prev ?? []).map((u) => (u.id === upd.id ? upd : u)));
      } else {
        const nuevo = await creditosAdminApi.crearUsuario(empresaVaxaId, {
          nombres: form.nombres, apellidos: form.apellidos, correo: form.correo,
          contrasena: form.contrasena, rol_id: Number(form.rol_id), producto: 'sistemas-vaxa',
        });
        setUsuarios((prev) => [...(prev ?? []), nuevo]);
      }
      cerrar();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa
        tenantId={tenantId}
        usuario={usuario}
        config={{ name: VAXA_CONFIG.NAME, primaryColor: VAXA_CONFIG.PRIMARY_COLOR, secondaryColor: VAXA_CONFIG.SECONDARY_COLOR }}
      />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        <button onClick={() => navigate(`/${tenantId}/sistemas`)}
          className="flex items-center gap-1.5 mb-5 text-[13px] font-medium transition-colors group" style={{ color: '#64748B' }}>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Volver al panel
        </button>

        <div className="mb-5 flex items-end justify-between gap-4 page-enter">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Sistemas Vaxa</p>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Gestión de usuarios</h1>
            <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Usuarios que pueden acceder a sistemas-vaxa.</p>
          </div>
          <button onClick={abrirNuevo} disabled={!usuarios} className="sv-btn sv-btn-primary flex-shrink-0">
            <Plus className="w-4 h-4" /> Agregar usuario
          </button>
        </div>

        <div className="relative mb-4 page-enter stagger-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px]" style={{ color: '#B0A898' }} />
          <input type="text" placeholder="Buscar por nombre o email…" value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="sv-input" style={{ paddingLeft: '2.5rem' }} />
        </div>

        {error && modal === null && (
          <div className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="sv-card overflow-hidden page-enter stagger-2">
          {!usuarios ? (
            <div className="flex justify-center py-14" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-14">
              <User className="w-12 h-12 mx-auto mb-3" style={{ color: '#E5E1D8' }} />
              <p className="text-[14px] font-semibold mb-1" style={{ color: '#0D0E12' }}>Sin usuarios</p>
              <p className="text-[12.5px]" style={{ color: '#9CA3AF' }}>{searchTerm ? 'Ajusta la búsqueda.' : 'Agrega el primer usuario.'}</p>
            </div>
          ) : (
            <>
            {filtradosPagina.map((u, idx) => (
              <div key={u.id} className="flex items-center justify-between px-5 py-3.5 transition-colors"
                style={{ borderBottom: idx < filtradosPagina.length - 1 ? '1px solid #F5F4F0' : undefined }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAF8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                    <User className="w-5 h-5" style={{ color: '#059669' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold truncate" style={{ color: '#0D0E12' }}>{u.nombres} {u.apellidos}</p>
                    <p className="text-[11.5px] flex items-center gap-1 truncate" style={{ color: '#9CA3AF' }}><Mail className="w-3 h-3 flex-shrink-0" />{u.correo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="inline-flex px-2.5 py-1 rounded-lg text-[10.5px] font-semibold" style={{ background: '#F5F3FF', color: '#6D28D9' }}>{u.rol}</span>
                  <span className="inline-flex px-2.5 py-1 rounded-lg text-[10.5px] font-semibold"
                    style={u.activo ? { background: '#ECFDF5', color: '#059669' } : { background: '#F3F4F6', color: '#6B7280' }}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <button onClick={() => abrirEditar(u)} title="Editar usuario" className="p-1.5 rounded-lg transition-colors hover:bg-emerald-50" style={{ color: '#94A3B8' }}>
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setError(null); setConfirmDel(u); }} title="Eliminar usuario" className="p-1.5 rounded-lg transition-colors hover:bg-red-50" style={{ color: '#94A3B8' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="px-5">
              <Pager page={pageSafe} pages={pages} total={filtrados.length} onPage={setPage} />
            </div>
            </>
          )}
        </div>
      </main>

      {modal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }} onMouseDown={cerrar}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" style={{ boxShadow: '0 24px 70px -12px rgba(13,14,18,0.4)' }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <h3 className="text-[18px] font-bold" style={{ color: '#0D0E12' }}>{editando ? 'Editar usuario' : 'Agregar usuario'}</h3>
              <button onClick={cerrar} className="p-1 rounded-lg transition-colors hover:bg-gray-100" style={{ color: '#B0A898' }}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={guardar} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={form.nombres} onChange={(e) => set('nombres', e.target.value)} placeholder="Nombres" required className="sv-input" />
                <input value={form.apellidos} onChange={(e) => set('apellidos', e.target.value)} placeholder="Apellidos" required className="sv-input" />
              </div>
              <input type="text" value={form.correo} onChange={(e) => set('correo', e.target.value)} placeholder="Usuario o correo" required className="sv-input" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={form.contrasena} onChange={(e) => set('contrasena', e.target.value)}
                  placeholder={editando ? 'Nueva contraseña (opcional)' : 'Contraseña (mín. 6)'} required={!editando} className="sv-input" />
                <select value={form.rol_id} onChange={(e) => set('rol_id', Number(e.target.value))} className="sv-input">
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              {editando && (
                <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                  <input type="checkbox" checked={form.activo} onChange={(e) => set('activo', e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                  <span className="text-[13px]" style={{ color: '#374151' }}>{form.activo ? 'Usuario activo' : 'Usuario inactivo'}</span>
                </label>
              )}
              {error && <p className="text-[12.5px]" style={{ color: '#DC2626' }}>{error}</p>}
              <div className="flex items-center gap-2.5 pt-2">
                <button type="button" onClick={cerrar} className="sv-btn sv-btn-ghost flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="sv-btn sv-btn-primary flex-1">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editando ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDel && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.5)', backdropFilter: 'blur(4px)' }} onMouseDown={() => !deleting && setConfirmDel(null)}>
          <div className="bg-white rounded-2xl max-w-[400px] w-full p-6" style={{ boxShadow: '0 24px 70px -12px rgba(13,14,18,0.4)' }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#FEF2F2', color: '#DC2626' }}>
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>Eliminar usuario</h3>
            <p className="text-[13px] mt-1.5" style={{ color: '#6B7280', lineHeight: 1.5 }}>
              Se quitará el acceso de <b>{confirmDel.nombres} {confirmDel.apellidos}</b> a sistemas-vaxa. Esta acción no se puede deshacer.
            </p>
            {error && <p className="text-[12.5px] mt-3" style={{ color: '#DC2626' }}>{error}</p>}
            <div className="flex items-center gap-2.5 mt-6">
              <button onClick={() => setConfirmDel(null)} disabled={deleting} className="sv-btn sv-btn-ghost flex-1">Cancelar</button>
              <button onClick={eliminar} disabled={deleting} className="sv-btn flex-1 text-white" style={{ background: '#DC2626' }}>
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
