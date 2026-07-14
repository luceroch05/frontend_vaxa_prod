'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Save,
  Upload,
  X,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';
import { creditosAdminApi, type PlanCatalogo } from '../../shared/api/creditos.admin.api';
import { DOC_RULES, sanitizeDoc, nombreLabel, esEmpresa } from '../../shared/docs';
import { AlertCircle, CheckCircle } from '@/components/ui/icon';

/** Ciclos de contrato (catálogo fijo: id 1/2/3).
 *  meses_pago = mensualidades que se cobran · meses_vigencia = meses de servicio. */
const CICLOS = [
  { id: 1, label: 'Mensual',                      corto: 'Mensual',   mesesPago: 1,  mesesVigencia: 1 },
  { id: 2, label: 'Semestral (paga 5, recibe 6)', corto: 'Semestral', mesesPago: 5,  mesesVigencia: 6 },
  { id: 3, label: 'Anual (paga 10, recibe 12)',   corto: 'Anual',     mesesPago: 10, mesesVigencia: 12 },
];
const sol = (n: number) => `S/ ${n.toFixed(2)}`;
/** Precio del certificado adicional = proporcional al plan (precio mensual ÷ cupo). */
const adicionalProporcional = (precioMensual: number, cupo: number) =>
  cupo > 0 ? Math.round((precioMensual / cupo) * 100) / 100 : 0;

// Configuración específica del sistema de certificaciones
const CERTIFICACIONES_CONFIG = {
  NAME: 'Sistema de Certificaciones',
  PRIMARY_COLOR: VAXA_CONFIG.PRIMARY_COLOR, // Verde de sistemas-vaxa
  SECONDARY_COLOR: VAXA_CONFIG.SECONDARY_COLOR,
};

interface RegistrarEmpresaCertificacionesProps {
  tenantId: string;
  tenant: TenantConfig;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

interface FormData {
  nombre: string;
  slug: string;
  dominio: string;
  tipoDoc: string;   // cat.06: '6' RUC · '1' DNI · '4' CE · '7' pasaporte
  ruc: string;       // número de documento (genérico)
  email: string;
  telefono: string;
  direccion: string;
  pais: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoCargo: string;
}

export default function RegistrarEmpresaCertificaciones({
  tenantId,
  tenant,
}: RegistrarEmpresaCertificacionesProps) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [planes, setPlanes] = useState<PlanCatalogo[]>([]);
  const [planId, setPlanId] = useState<number>(0);
  const [cicloId, setCicloId] = useState<number>(1);
  const [verificandoRuc, setVerificandoRuc] = useState(false);
  const [rucMsg, setRucMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    slug: '',
    dominio: '',
    tipoDoc: '6',
    ruc: '',
    email: '',
    telefono: '',
    direccion: '',
    pais: 'Perú',
    contactoNombre: '',
    contactoEmail: '',
    contactoCargo: '',
  });

  useEffect(() => {
    const authData = localStorage.getItem(`auth_${tenantId}`);
    const userData = localStorage.getItem(`auth_user_${tenantId}`);

    if (!authData || authData !== 'true') {
      navigate(tenantPath(tenantId, '/login'));
      return;
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUsuario(user);
      } catch (error) {
        navigate(tenantPath(tenantId, '/login'));
      }
    }
  }, [tenantId, navigate]);

  // Carga los planes reales de la BD para el selector.
  useEffect(() => {
    creditosAdminApi.listPlanes()
      .then((ps) => { setPlanes(ps); setPlanId((id) => id || ps[0]?.id || 0); })
      .catch(() => { /* el backend dará el error al guardar si falla */ });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Verifica el RUC en SUNAT (dato público) y autocompleta razón social + dirección.
  const verificarRuc = async () => {
    const ruc = formData.ruc.trim();
    if (!ruc) { setRucMsg({ ok: false, texto: 'Ingresa el RUC primero.' }); return; }
    setVerificandoRuc(true); setRucMsg(null);
    try {
      const info = await creditosAdminApi.consultarRuc(ruc);
      setFormData((prev) => ({ ...prev, nombre: info.razonSocial, direccion: info.direccion || prev.direccion }));
      const det = [info.estado, info.condicion].filter(Boolean).join(' · ');
      setRucMsg({ ok: true, texto: `✓ ${info.razonSocial}${det ? ` (${det})` : ''}` });
    } catch (e) {
      setRucMsg({ ok: false, texto: `${(e as Error).message} Puedes escribir la razón social a mano.` });
    } finally { setVerificandoRuc(false); }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // El backend tiene columnas razon_social, ruc, tenant_slug, dominio. El resto de
      // campos (teléfono, dirección, contacto) aún no se persisten. El plan elegido se
      // asigna como suscripción vigente en el backend.
      const empresa = await creditosAdminApi.crearEmpresa({
        razon_social: formData.nombre,
        tenant_slug: formData.slug || undefined,   // si vacío, el backend lo genera del nombre
        dominio: formData.dominio || undefined,
        ruc: formData.ruc || undefined,
        tipo_doc: formData.tipoDoc,
        logo: logoPreview || undefined,            // data URL base64 del logo subido
        plan_id: planId || undefined,
        ciclo_id: cicloId,
      });
      // No se emite ningún comprobante al registrar. La factura/boleta se hace
      // manualmente desde Facturación Electrónica.
      navigate(tenantPath(tenantId, `/certificaciones/empresa/${empresa.id}`));
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  if (!usuario) {
    return null;
  }

  // Ciclo de pago elegido (define cuántas mensualidades se cobran y la vigencia).
  const cicloSel = CICLOS.find((c) => c.id === cicloId) ?? CICLOS[0];

  // ¿Se puede registrar? Todos los campos marcados con * deben estar completos.
  const f = formData;
  const puedeRegistrar =
    f.nombre.trim() !== '' && f.ruc.trim() !== '' && f.pais.trim() !== '' &&
    f.email.trim() !== '' && f.telefono.trim() !== '' && f.direccion.trim() !== '' &&
    f.contactoNombre.trim() !== '' && f.contactoEmail.trim() !== '' && f.contactoCargo.trim() !== '' &&
    !!planId;

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa
        tenantId={tenantId}
        usuario={usuario}
        config={{
          name: 'Sistemas Vaxa',
          primaryColor: CERTIFICACIONES_CONFIG.PRIMARY_COLOR,
          secondaryColor: CERTIFICACIONES_CONFIG.SECONDARY_COLOR,
        }}
      />

      <main className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        {/* Back button */}
        <button
          onClick={() => navigate(tenantPath(tenantId, '/certificaciones'))}
          className="flex items-center gap-1.5 mb-5 text-[13px] font-medium transition-colors group"
          style={{ color: '#64748B' }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver al panel
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3.5 page-enter">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
            <Building2 className="w-6 h-6" style={{ color: '#059669' }} />
          </div>
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Registrar nueva empresa</h1>
            <p className="text-[13px]" style={{ color: '#9CA3AF' }}>Sistema de Certificaciones</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="sv-card p-6 sm:p-8 page-enter stagger-1">
          {/* Logo */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-6">Logo de la Empresa</h2>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-32 h-32 rounded-xl object-contain border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <Building2 className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="block">
                  <div className="px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Subir Logo</p>
                        <p className="text-sm text-gray-500">PNG, JPG hasta 5MB</p>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Información de la Empresa */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Información de la Empresa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  {nombreLabel(formData.tipoDoc)} *
                  <span className="ml-2 normal-case tracking-normal font-medium" style={{ color: esEmpresa(formData.tipoDoc) ? '#059669' : '#1D4ED8' }}>
                    · Cliente {esEmpresa(formData.tipoDoc) ? 'Empresa (RUC)' : 'Persona (DNI/CE)'}
                  </span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder={esEmpresa(formData.tipoDoc) ? 'Instituto TechPro Capacitaciones' : 'Juan Pérez García'}
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Identificador / Slug (URL)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="techpro"
                  className="sv-input"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Portal: <code className="text-emerald-600">/{formData.slug || '<se-genera-del-nombre>'}/certificados</code>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Documento *
                </label>
                <div className="flex gap-2">
                  <select
                    name="tipoDoc"
                    value={formData.tipoDoc}
                    onChange={(e) => {
                      const t = e.target.value;
                      setFormData((prev) => ({ ...prev, tipoDoc: t, ruc: sanitizeDoc(prev.ruc, t) }));
                      setRucMsg(null);
                    }}
                    className="sv-input"
                    style={{ width: 110 }}
                  >
                    <option value="6">RUC</option>
                    <option value="1">DNI</option>
                    <option value="4">CE</option>
                    <option value="7">Pasaporte</option>
                  </select>
                  <input
                    type="text"
                    name="ruc"
                    value={formData.ruc}
                    onChange={(e) => { setFormData((prev) => ({ ...prev, ruc: sanitizeDoc(e.target.value, prev.tipoDoc) })); setRucMsg(null); }}
                    inputMode={DOC_RULES[formData.tipoDoc]?.numeric ? 'numeric' : 'text'}
                    maxLength={DOC_RULES[formData.tipoDoc]?.max || 15}
                    required
                    placeholder={formData.tipoDoc === '6' ? '20123456789' : formData.tipoDoc === '1' ? '12345678' : 'N° de documento'}
                    className="sv-input flex-1"
                  />
                  {formData.tipoDoc === '6' && (
                    <button
                      type="button"
                      onClick={verificarRuc}
                      disabled={verificandoRuc || !formData.ruc.trim()}
                      className="sv-btn sv-btn-ghost px-3 whitespace-nowrap disabled:opacity-50"
                      style={{ border: '1px solid #EEECE6' }}
                    >
                      {verificandoRuc ? 'Verificando…' : 'Verificar'}
                    </button>
                  )}
                </div>
                {rucMsg && (
                  <p className="text-[11.5px] mt-1.5" style={{ color: rucMsg.ok ? '#15803D' : '#B45309' }}>{rucMsg.texto}</p>
                )}
                {formData.tipoDoc !== '6' && (
                  <p className="text-[11.5px] mt-1.5" style={{ color: '#9CA3AF' }}>Con DNI/CE solo se emiten boletas (desde Facturación). La factura requiere RUC.</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">País *</label>
                <select
                  name="pais"
                  value={formData.pais}
                  onChange={handleChange}
                  required
                  className="sv-input"
                >
                  <option value="Perú">Perú</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Chile">Chile</option>
                  <option value="Argentina">Argentina</option>
                  <option value="México">México</option>
                  <option value="España">España</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email de la Empresa *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="contacto@techpro.edu.pe"
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  placeholder="+51 999 888 777"
                  className="sv-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                  placeholder="Av. Javier Prado 1234, San Isidro"
                  className="sv-input"
                />
              </div>
            </div>
          </div>

          {/* Contacto Principal */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Contacto Principal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="contactoNombre"
                  value={formData.contactoNombre}
                  onChange={handleChange}
                  required
                  placeholder="María González"
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">Email *</label>
                <input
                  type="email"
                  name="contactoEmail"
                  value={formData.contactoEmail}
                  onChange={handleChange}
                  required
                  placeholder="maria.gonzalez@techpro.edu.pe"
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">Cargo *</label>
                <input
                  type="text"
                  name="contactoCargo"
                  value={formData.contactoCargo}
                  onChange={handleChange}
                  required
                  placeholder="Gerente de Operaciones"
                  className="sv-input"
                />
              </div>
            </div>
          </div>

          {/* Plan */}
          <div className="mb-8">
            <h2 className="text-[15px] font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Plan de Suscripción
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              El plan define el <span className="font-semibold text-emerald-600">mantenimiento</span>, la implementación,
              los <span className="font-semibold text-emerald-600">créditos incluidos</span> y el límite de usuarios.
              Cada certificado consume 1 crédito; se recargan con paquetes.
            </p>

            {/* Tarjetas de plan (reales de la BD) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {planes.map((plan) => {
                const sel = planId === plan.id;
                return (
                  <label key={plan.id} className="relative cursor-pointer rounded-2xl p-4 transition-all flex flex-col"
                    style={sel
                      ? { border: '1.5px solid #059669', background: '#F0FDF9', boxShadow: '0 4px 16px rgba(5,150,105,0.12)' }
                      : { border: '1.5px solid #EEECE6', background: '#fff' }}>
                    <input type="radio" name="plan" value={plan.id} checked={sel} onChange={() => setPlanId(plan.id)} className="sr-only" />
                    <h3 className="text-[14px] font-bold mb-1" style={{ color: '#0D0E12' }}>{plan.nombre}</h3>
                    <div className="mb-2">
                      <span className="text-[22px] font-bold" style={{ color: '#0D0E12' }}>{sol(plan.mantenimiento_mensual)}</span>
                      <span className="text-[12px]" style={{ color: '#9CA3AF' }}>/mes mant.</span>
                    </div>
                    <p className="text-[12px] font-semibold" style={{ color: '#059669' }}>
                      {plan.creditos_incluidos > 0 ? `${plan.creditos_incluidos} créditos incluidos` : 'Créditos a medida'}
                    </p>
                    <p className="text-[11.5px] mt-0.5" style={{ color: '#9CA3AF' }}>
                      Implementación {sol(plan.implementacion)} · {plan.usuarios_incluidos === 0 ? '∞' : plan.usuarios_incluidos} usuario{plan.usuarios_incluidos === 1 ? '' : 's'}
                    </p>
                    {/* Mantenimiento total según el ciclo elegido (semestral/anual) */}
                    {cicloId !== 1 && plan.mantenimiento_mensual > 0 && (
                      <p className="text-[11.5px] mt-1 font-semibold" style={{ color: '#059669' }}>
                        {cicloSel.corto}: {sol(plan.mantenimiento_mensual * cicloSel.mesesPago)}
                        <span className="font-normal" style={{ color: '#9CA3AF' }}> · {cicloSel.mesesVigencia} meses</span>
                      </p>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Ciclo de facturación */}
            <div className="mt-4 max-w-xs">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">Ciclo de facturación</label>
              <select value={cicloId} onChange={(e) => setCicloId(Number(e.target.value))} className="sv-input">
                {CICLOS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            {/* Total inicial: implementación + mantenimiento del ciclo */}
            {(() => {
              const p = planes.find((x) => x.id === planId);
              if (!p) return null;
              const mantTotal = p.mantenimiento_mensual * cicloSel.mesesPago;
              const ahorro    = p.mantenimiento_mensual * (cicloSel.mesesVigencia - cicloSel.mesesPago);
              const totalInicial = p.implementacion + mantTotal;
              return (
                <div className="mt-3 rounded-xl px-4 py-3" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12.5px] font-semibold" style={{ color: '#065F46' }}>
                      {p.nombre} · {cicloSel.corto} (primera venta)
                    </span>
                    <span className="text-[20px] font-bold" style={{ color: '#047857' }}>{sol(totalInicial)}</span>
                  </div>
                  <p className="text-[11.5px] mt-1" style={{ color: '#059669' }}>
                    Implementación <b>{sol(p.implementacion)}</b> + mantenimiento {cicloSel.mesesPago} mes{cicloSel.mesesPago !== 1 ? 'es' : ''} <b>{sol(mantTotal)}</b>
                    {ahorro > 0 && <> · ahorras <b>{sol(ahorro)}</b> ({cicloSel.mesesVigencia} meses de servicio)</>}.
                    {' '}Incluye <b>{p.creditos_incluidos} créditos</b>.
                  </p>
                </div>
              );
            })()}

            {/* Qué incluye el plan elegido + campos que pide (dominio, etc.) */}
            {(() => {
              const p = planes.find((x) => x.id === planId);
              if (!p) return null;
              const incluidos = [
                p.permite_diseno       && 'Diseño personalizado del certificado',
                p.permite_subdominio   && 'Dominio o subdominio propio',
                p.permite_carga_masiva && 'Carga masiva (Excel) / API',
                p.permite_api          && 'Acceso por API',
                p.permite_metricas     && 'Panel de métricas',
                p.permite_auditoria    && 'Auditoría completa',
              ].filter(Boolean) as string[];

              return (
                <div className="mt-4 rounded-2xl p-4" style={{ background: '#FAFAF8', border: '1px solid #EEECE6' }}>
                  <p className="text-[12px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#374151' }}>
                    Incluye el {p.nombre}
                  </p>
                  {incluidos.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {incluidos.map((f) => (
                        <div key={f} className="flex items-center gap-1.5 text-[12.5px]" style={{ color: '#15803D' }}>
                          <CheckCircle className="w-3.5 h-3.5" /> {f}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12.5px]" style={{ color: '#64748B' }}>Funciones base: códigos, validación pública y PDF.</p>
                  )}

                  {/* Si el plan incluye dominio propio, se pide el dominio aquí. */}
                  {p.permite_subdominio && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid #EEECE6' }}>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-2" style={{ color: '#374151' }}>
                        <Globe className="w-4 h-4 text-emerald-600" /> Dominio propio del cliente
                      </label>
                      <input
                        type="text" name="dominio" value={formData.dominio} onChange={handleChange}
                        placeholder="validar.suempresa.com" className="sv-input"
                      />
                      <p className="text-[11.5px] mt-1" style={{ color: '#9CA3AF' }}>
                        Este plan incluye dominio propio. Si lo provee Vaxa, déjalo y se configura luego.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* El comprobante (factura/boleta) NO se emite al registrar: se hace
              manualmente desde Facturación Electrónica. */}
          <div className="mb-6 px-4 py-3 rounded-xl text-[12.5px]" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1' }}>
            Al registrar <b>no se emite ningún comprobante</b>. La factura o boleta se emite luego desde <b>Facturación Electrónica</b>.
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-2.5 pt-6" style={{ borderTop: '1px solid #F2F0EA' }}>
            <button type="button" onClick={() => navigate(tenantPath(tenantId, '/certificaciones'))} className="sv-btn sv-btn-ghost px-5">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !puedeRegistrar} className="sv-btn sv-btn-primary px-5">
              <Save className="w-4 h-4" />
              {loading ? 'Registrando…' : 'Registrar empresa'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
