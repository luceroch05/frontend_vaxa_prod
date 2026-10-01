'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, User, Mail, Loader2, AlertCircle, X, Edit, Trash2 } from '@/components/ui/icon';
import {
  creditosAdminApi, type EmpresaCreditos, type UsuarioEmpresa, type Rol, type EstadoPlanEmpresa,
  type HcModulos, type ProductoEmpresa,
} from '../../shared/api/creditos.admin.api';

/** Módulos del panel de Historias Clínicas, en orden de menú, para los toggles de Vaxa. */
const HC_MODULOS_UI: { key: keyof HcModulos; label: string; desc: string }[] = [
  { key: 'pacientes',  label: 'Pacientes',  desc: 'Registro de pacientes y datos' },
  { key: 'historia',   label: 'Historia clínica', desc: 'Expediente: historia, tratamientos, objetivos, sesiones, tareas' },
  { key: 'agenda',     label: 'Agenda',     desc: 'Citas y calendario' },
  { key: 'servicios',  label: 'Servicios',  desc: 'Catálogo de servicios del centro' },
  { key: 'ventas',     label: 'Ventas',     desc: 'Ventas y comprobantes' },
  { key: 'inventario', label: 'Inventario', desc: 'Productos y stock' },
  { key: 'caja',       label: 'Caja',       desc: 'Ingresos y egresos' },
  { key: 'web',        label: 'Mi Web',     desc: 'Landing pública del centro' },
];

interface TabUsuariosProps { empresa: EmpresaCreditos; producto: string; }

const VACIO = { nombres: '', apellidos: '', correo: '', contrasena: '', rol_id: '' as number | '', activo: true };

/** Precio del usuario adicional (Tarifario 2026): S/50 activación única + S/5/mes. */
const USUARIO_EXTRA = { activacion: 50, mensual: 5 };
const sol = (n: number) => `S/ ${n.toFixed(2)}`;

/** Productos con panel propio: cada uno tiene SUS usuarios (no se comparten). */
const PRODUCTOS = [
  { slug: 'certificaciones', label: 'Certificados' },
  { slug: 'historias-clinicas', label: 'Historias Clínicas' },
] as const;

export default function TabUsuarios({ empresa, producto }: TabUsuariosProps) {
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[] | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [estado, setEstado] = useState<EstadoPlanEmpresa | null>(null);   // plan vigente (usuarios incluidos)
  const [error, setError] = useState<string | null>(null);
  // El producto lo decide la pestaña de sistema del perfil (no hay selector interno).

  // null = cerrado · 'nuevo' = crear · number = editar ese usuario
  const [modal, setModal] = useState<'nuevo' | number | null>(null);
  const [form, setForm] = useState(VACIO);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<UsuarioEmpresa | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estado de los productos del centro (Certificados / Historias Clínicas activo o no).
  const [productos, setProductos] = useState<ProductoEmpresa[] | null>(null);
  const [prodSaving, setProdSaving] = useState(false);

  // Módulos activos del centro (solo aplica al panel de Historias Clínicas).
  const esHC = producto === 'historias-clinicas';
  const [modulos, setModulos] = useState<HcModulos | null>(null);
  const [modSaving, setModSaving] = useState(false);
  const [modMsg, setModMsg] = useState<string | null>(null);

  const editando = typeof modal === 'number';

  const cargar = useCallback(async () => {
    setError(null); setUsuarios(null);
    try {
      const [us, rs, est] = await Promise.all([
        creditosAdminApi.listUsuarios(empresa.id, producto),
        creditosAdminApi.listRoles(),
        creditosAdminApi.getPlanEmpresa(empresa.id).catch(() => null),
      ]);
      setUsuarios(us); setRoles(rs); setEstado(est);
    } catch (e) { setError((e as Error).message); }
  }, [empresa.id, producto]);

  useEffect(() => { cargar(); }, [cargar]);

  // Estado de productos del centro (para el toggle Certificados/HC activo o no).
  useEffect(() => {
    let vivo = true;
    creditosAdminApi.getProductosEmpresa(empresa.id)
      .then((p) => { if (vivo) setProductos(p); })
      .catch(() => { if (vivo) setProductos([]); });
    return () => { vivo = false; };
  }, [empresa.id]);

  const productoActivo = productos?.find((p) => p.slug === producto)?.activo === 1;

  const toggleProducto = async () => {
    if (!productos || prodSaving) return;
    setProdSaving(true);
    try {
      const actualizado = await creditosAdminApi.setProductoEmpresa(empresa.id, producto, !productoActivo);
      setProductos(actualizado);
    } catch (e) { setError((e as Error).message); }
    finally { setProdSaving(false); }
  };

  // Carga los módulos del centro al entrar al panel de Historias Clínicas.
  useEffect(() => {
    if (!esHC) { setModulos(null); return; }
    let vivo = true;
    setModMsg(null); setModulos(null);
    creditosAdminApi.getHcModulos(empresa.id)
      .then((m) => { if (vivo) setModulos(m); })
      .catch(() => { if (vivo) setModMsg('No se pudieron cargar los módulos.'); });
    return () => { vivo = false; };
  }, [esHC, empresa.id]);

  const toggleModulo = async (key: keyof HcModulos) => {
    if (!modulos || modSaving) return;
    const siguiente = { ...modulos, [key]: !modulos[key] };
    setModulos(siguiente); setModSaving(true); setModMsg(null);
    try {
      const guardado = await creditosAdminApi.setHcModulos(empresa.id, siguiente);
      setModulos(guardado);
      setModMsg('Cambios guardados');
    } catch (e) {
      setModulos(modulos);   // revertir el optimista
      setModMsg((e as Error).message || 'No se pudo guardar.');
    } finally { setModSaving(false); }
  };

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
          contrasena: form.contrasena, rol_id: Number(form.rol_id), producto,
        });
        setUsuarios((prev) => [...(prev ?? []), nuevo]);
      }
      cerrar();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  const set = (k: keyof typeof VACIO, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // ¿Se puede guardar? Requeridos completos y, si es edición, que algo haya cambiado.
  const original = editando ? (usuarios ?? []).find((u) => u.id === modal) : undefined;
  // Contraseña: al crear es obligatoria (mín. 6). Al editar es opcional, pero si se
  // escribe algo debe tener al menos 6 caracteres.
  const passLen = form.contrasena.trim().length;
  const passwordCorta = editando ? (passLen > 0 && passLen < 6) : passLen < 6;
  const requeridosOk =
    form.nombres.trim() !== '' && form.apellidos.trim() !== '' && form.correo.trim() !== '' &&
    !!form.rol_id && !passwordCorta;
  const huboCambios = !original
    ? true
    : form.nombres !== original.nombres || form.apellidos !== original.apellidos ||
      form.correo !== original.correo || Number(form.rol_id) !== original.rol_id ||
      form.activo !== (original.activo === 1) || form.contrasena.trim() !== '';
  const puedeGuardar = requeridosOk && (!editando || huboCambios);

  const eliminar = async () => {
    if (!confirmDel) return;
    setDeleting(true); setError(null);
    try {
      await creditosAdminApi.eliminarUsuario(empresa.id, confirmDel.id, producto);
      setUsuarios((prev) => (prev ?? []).filter((u) => u.id !== confirmDel.id));
      setConfirmDel(null);
    } catch (e) { setError((e as Error).message); }
    finally { setDeleting(false); }
  };

  // ── Cupo de usuarios según el plan vigente ──────────────────
  const plan = estado?.plan ?? null;
  const incluidos = plan?.usuarios_incluidos ?? null;      // 0 = ilimitado
  const ilimitadoU = incluidos === 0;
  const enUso = usuarios?.length ?? 0;
  const adicionales = (incluidos != null && !ilimitadoU) ? Math.max(enUso - incluidos, 0) : 0;
  // Crear uno más sería ADICIONAL (cobra S/50 + S/5/mes) si ya se llenó el cupo del plan.
  // Solo aplica a Certificados (su tarifario); Historias Clínicas no cobra por usuario aquí.
  const esCert = producto === 'certificaciones';
  const creandoSeraAdicional = esCert && incluidos != null && !ilimitadoU && enUso >= incluidos;
  const productoLabel = PRODUCTOS.find((p) => p.slug === producto)?.label ?? producto;

  return (
    <div className="space-y-6">
      {/* Estado del producto para el centro: Vaxa lo activa o desactiva por completo. */}
      {productos && (
        <div className="rounded-2xl p-4 flex items-center justify-between gap-3"
          style={{ background: productoActivo ? '#F0FDFA' : '#FEF2F2', border: `1px solid ${productoActivo ? '#CCFBF1' : '#FECACA'}` }}>
          <div>
            <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>
              {productoLabel} · {productoActivo ? 'Activo' : 'Desactivado'}
            </h3>
            <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>
              {productoActivo
                ? `Este centro puede ingresar al panel de ${productoLabel}.`
                : `El centro NO puede ingresar a ${productoLabel} (el login queda bloqueado).`}
            </p>
          </div>
          <button type="button" onClick={toggleProducto} disabled={prodSaving}
            className="relative inline-block h-6 w-11 rounded-full shrink-0 transition-colors disabled:opacity-60"
            style={{ background: productoActivo ? '#0F766E' : '#D4D2CA' }}>
            <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
              style={{ left: productoActivo ? '22px' : '2px' }} />
          </button>
        </div>
      )}

      {/* Módulos activos del centro (solo Historias Clínicas). Vaxa prende/apaga lo que contrató. */}
      {esHC && productoActivo && (
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Módulos activos</h3>
              <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>
                Qué secciones ve este centro en su panel. Se aplican al instante.
              </p>
            </div>
            {modMsg && <span className="text-[12px] font-medium" style={{ color: modSaving ? '#9CA3AF' : '#0F766E' }}>{modMsg}</span>}
          </div>
          {!modulos ? (
            <p className="text-[12.5px]" style={{ color: '#9CA3AF' }}>Cargando módulos…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HC_MODULOS_UI.map((m) => {
                const on = modulos[m.key];
                return (
                  <button key={m.key} type="button" onClick={() => toggleModulo(m.key)} disabled={modSaving}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors disabled:opacity-60"
                    style={{ border: '1px solid #EEECE6', background: on ? '#F0FDFA' : '#FAFAF8' }}>
                    <span>
                      <span className="block text-[13px] font-semibold" style={{ color: '#0D0E12' }}>{m.label}</span>
                      <span className="block text-[11.5px]" style={{ color: '#9CA3AF' }}>{m.desc}</span>
                    </span>
                    <span className="relative inline-block h-5 w-9 rounded-full shrink-0 transition-colors"
                      style={{ background: on ? '#0F766E' : '#D4D2CA' }}>
                      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                        style={{ left: on ? '18px' : '2px' }} />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Usuarios de {productoLabel}</h3>
          <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Operadores que acceden al panel de {productoLabel} de <b style={{ color: '#64748B' }}>{empresa.razon_social}</b></p>
        </div>
        <button onClick={abrirNuevo} className="sv-btn sv-btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> Agregar usuario
        </button>
      </div>

      {/* Cupo de usuarios del plan + precio del usuario adicional (solo Certificados). */}
      {esCert && plan && (
        <div className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4" style={{ background: '#fff', border: '1px solid #EEECE6' }}>
          <div className="flex items-center gap-5 flex-wrap">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>Plan</p>
              <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>{plan.nombre}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>Usuarios incluidos</p>
              <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>{ilimitadoU ? 'Ilimitados' : incluidos}</p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>En uso</p>
              <p className="text-[14px] font-bold tabular-nums" style={{ color: adicionales > 0 ? '#B45309' : '#0D0E12' }}>
                {enUso}{!ilimitadoU && adicionales > 0 && <span className="text-[11px] font-semibold"> · {adicionales} adicional{adicionales === 1 ? '' : 'es'}</span>}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: '#B0A898' }}>Usuario adicional</p>
            <p className="text-[12.5px] font-semibold" style={{ color: '#0D7C66' }}>{sol(USUARIO_EXTRA.activacion)} activación · {sol(USUARIO_EXTRA.mensual)}/mes</p>
          </div>
        </div>
      )}

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
              {!editando && creandoSeraAdicional && (
                <div className="px-3 py-2.5 rounded-xl text-[12px]" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
                  Este será un <b>usuario adicional</b> (el plan {plan?.nombre} incluye {incluidos}). Se cobra <b>{sol(USUARIO_EXTRA.activacion)} de activación</b> + <b>{sol(USUARIO_EXTRA.mensual)}/mes</b>. Regístralo en <b>Nueva venta</b>.
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <input value={form.nombres} onChange={(e) => set('nombres', e.target.value)} placeholder="Nombres" required className="sv-input" />
                <input value={form.apellidos} onChange={(e) => set('apellidos', e.target.value)} placeholder="Apellidos" required className="sv-input" />
              </div>
              <input type="text" value={form.correo} onChange={(e) => set('correo', e.target.value)} placeholder="Usuario o correo" required className="sv-input" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input type="text" value={form.contrasena} onChange={(e) => set('contrasena', e.target.value)}
                    placeholder={editando ? 'Nueva contraseña (opcional)' : 'Contraseña (mín. 6)'} required={!editando}
                    className="sv-input w-full" />
                  <p className="text-[11px] mt-1" style={{ color: passwordCorta ? '#DC2626' : '#9CA3AF' }}>
                    {editando ? 'Déjala vacía para no cambiarla · mínimo 6 caracteres' : 'Mínimo 6 caracteres'}
                  </p>
                </div>
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
                <button type="submit" disabled={saving || !puedeGuardar} className="sv-btn sv-btn-primary flex-1">
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
              Se quitará el acceso de <b>{confirmDel.nombres} {confirmDel.apellidos}</b> al panel de {productoLabel} de esta empresa. Esta acción no se puede deshacer.
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
