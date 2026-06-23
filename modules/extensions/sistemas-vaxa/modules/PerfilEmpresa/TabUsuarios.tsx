'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, User, Mail, Loader2, AlertCircle, X, Edit, Trash2 } from '@/components/ui/icon';
import {
  creditosAdminApi, type EmpresaCreditos, type UsuarioEmpresa, type Rol,
} from '../../shared/api/creditos.admin.api';

interface TabUsuariosProps { empresa: EmpresaCreditos; }

const VACIO = { nombres: '', apellidos: '', correo: '', contrasena: '', rol_id: '' as number | '', activo: true };

export default function TabUsuarios({ empresa }: TabUsuariosProps) {
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[] | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [error, setError] = useState<string | null>(null);

  // null = cerrado · 'nuevo' = crear · number = editar ese usuario
  const [modal, setModal] = useState<'nuevo' | number | null>(null);
  const [form, setForm] = useState(VACIO);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<UsuarioEmpresa | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editando = typeof modal === 'number';

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [us, rs] = await Promise.all([
        creditosAdminApi.listUsuarios(empresa.id, 'certificaciones'),
        creditosAdminApi.listRoles(),
      ]);
      setUsuarios(us); setRoles(rs);
    } catch (e) { setError((e as Error).message); }
  }, [empresa.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => {
    setError(null);
    setForm({ ...VACIO, rol_id: roles[0]?.id ?? '' });
    setModal('nuevo');
  };

  const abrirEditar = (u: UsuarioEmpresa) => {
    setError(null);
    setForm({ nombres: u.nombres, apellidos: u.apellidos, correo: u.correo, contrasena: '', rol_id: u.rol_id, activo: u.activo === 1 });
    setModal(u.id);
  };

  const cerrar = () => setModal(null);

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.rol_id) { setError('Selecciona un rol'); return; }
    setSaving(true); setError(null);
    try {
      if (editando) {
        const actualizado = await creditosAdminApi.editarUsuario(empresa.id, modal as number, {
          nombres: form.nombres,
          apellidos: form.apellidos,
          correo: form.correo,
          rol_id: Number(form.rol_id),
          activo: form.activo,
          ...(form.contrasena ? { contrasena: form.contrasena } : {}),
        });
        setUsuarios((prev) => (prev ?? []).map((u) => (u.id === actualizado.id ? actualizado : u)));
      } else {
        const nuevo = await creditosAdminApi.crearUsuario(empresa.id, {
          nombres: form.nombres, apellidos: form.apellidos, correo: form.correo,
          contrasena: form.contrasena, rol_id: Number(form.rol_id), producto: 'certificaciones',
        });
        setUsuarios((prev) => [...(prev ?? []), nuevo]);
      }
      cerrar();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const set = (k: keyof typeof VACIO, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const eliminar = async () => {
    if (!confirmDel) return;
    setDeleting(true); setError(null);
    try {
      await creditosAdminApi.eliminarUsuario(empresa.id, confirmDel.id, 'certificaciones');
      setUsuarios((prev) => (prev ?? []).filter((u) => u.id !== confirmDel.id));
      setConfirmDel(null);
    } catch (e) { setError((e as Error).message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Usuarios de la empresa</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Operadores que acceden al panel de certificados de <b style={{ color: '#64748B' }}>{empresa.razon_social}</b></p>
        </div>
        <button onClick={abrirNuevo} className="sv-btn sv-btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> Agregar usuario
        </button>
      </div>

      {error && modal === null && (
        <div className="px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
        {!usuarios ? (
          <div className="flex justify-center py-12" style={{ color: '#D1D5DB' }}><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : usuarios.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto mb-3" style={{ color: '#E5E1D8' }} />
            <p className="text-[14px] font-semibold mb-3" style={{ color: '#0D0E12' }}>No hay usuarios registrados</p>
            <button onClick={abrirNuevo} className="sv-btn sv-btn-primary mx-auto">
              <Plus className="w-4 h-4" /> Agregar primer usuario
            </button>
          </div>
        ) : (
          usuarios.map((u, idx) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3.5 transition-colors group"
              style={{ borderBottom: idx < usuarios.length - 1 ? '1px solid #F5F4F0' : undefined }}
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
                <span className="inline-flex px-2.5 py-1 rounded-lg text-[10.5px] font-semibold" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{u.rol}</span>
                <span className="inline-flex px-2.5 py-1 rounded-lg text-[10.5px] font-semibold"
                  style={u.activo ? { background: '#ECFDF5', color: '#059669' } : { background: '#F3F4F6', color: '#6B7280' }}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
                <button onClick={() => abrirEditar(u)} title="Editar usuario"
                  className="p-1.5 rounded-lg transition-colors hover:bg-emerald-50" style={{ color: '#94A3B8' }}>
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => { setError(null); setConfirmDel(u); }} title="Eliminar usuario"
                  className="p-1.5 rounded-lg transition-colors hover:bg-red-50" style={{ color: '#94A3B8' }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modal !== null && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }} onMouseDown={cerrar}>
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
        </div>,
        document.body,
      )}

      {confirmDel && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(13,14,18,0.5)', backdropFilter: 'blur(4px)' }} onMouseDown={() => !deleting && setConfirmDel(null)}>
          <div className="bg-white rounded-2xl max-w-[400px] w-full p-6" style={{ boxShadow: '0 24px 70px -12px rgba(13,14,18,0.4)' }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#FEF2F2', color: '#DC2626' }}>
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-[17px] font-bold" style={{ color: '#0D0E12' }}>Eliminar usuario</h3>
            <p className="text-[13px] mt-1.5" style={{ color: '#6B7280', lineHeight: 1.5 }}>
              Se quitará el acceso de <b>{confirmDel.nombres} {confirmDel.apellidos}</b> al panel de certificados de esta empresa. Esta acción no se puede deshacer.
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
