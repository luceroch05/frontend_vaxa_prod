'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
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
import { PLANES, VAXA_CONFIG } from '../../shared/constants';
import { creditosAdminApi } from '../../shared/api/creditos.admin.api';
import { AlertCircle } from '@/components/ui/icon';

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
  ruc: string;
  email: string;
  telefono: string;
  direccion: string;
  pais: string;
  planId: string;
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

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    slug: '',
    dominio: '',
    ruc: '',
    email: '',
    telefono: '',
    direccion: '',
    pais: 'Perú',
    planId: 'basico',
    contactoNombre: '',
    contactoEmail: '',
    contactoCargo: '',
  });

  useEffect(() => {
    const authData = localStorage.getItem(`auth_${tenantId}`);
    const userData = localStorage.getItem(`auth_user_${tenantId}`);

    if (!authData || authData !== 'true') {
      navigate(`/${tenantId}/login`);
      return;
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUsuario(user);
      } catch (error) {
        navigate(`/${tenantId}/login`);
      }
    }
  }, [tenantId, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    // El plan elegido define los créditos iniciales (límite de certificados del plan).
    const plan = Object.values(PLANES).find((p) => p.id === formData.planId);
    const creditosIniciales = plan && plan.certificadosMax > 0 ? plan.certificadosMax : 0;

    try {
      // El backend tiene columnas razon_social, ruc, tenant_slug. El resto de
      // campos (teléfono, dirección, contacto, logo) aún no se persisten.
      const empresa = await creditosAdminApi.crearEmpresa({
        razon_social: formData.nombre,
        tenant_slug: formData.slug || undefined,   // si vacío, el backend lo genera del nombre
        dominio: formData.dominio || undefined,
        ruc: formData.ruc || undefined,
        logo: logoPreview || undefined,            // data URL base64 del logo subido
        creditos_iniciales: creditosIniciales,
      });
      navigate(`/${tenantId}/certificaciones/empresa/${empresa.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  if (!usuario) {
    return null;
  }

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
          onClick={() => navigate(`/${tenantId}/certificaciones`)}
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
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Instituto TechPro Capacitaciones"
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
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  Dominio (opcional)
                </label>
                <input
                  type="text"
                  name="dominio"
                  value={formData.dominio}
                  onChange={handleChange}
                  placeholder="techpro.edu.pe"
                  className="sv-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  RUC / NIF *
                </label>
                <input
                  type="text"
                  name="ruc"
                  value={formData.ruc}
                  onChange={handleChange}
                  required
                  placeholder="20123456789"
                  className="sv-input"
                />
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
              El cobro es <span className="font-semibold text-emerald-600">por usuario</span>. El
              plan define el límite de certificados que puede generar la empresa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(PLANES).map((plan) => (
                <label
                  key={plan.id}
                  className="relative cursor-pointer rounded-2xl p-5 transition-all"
                  style={formData.planId === plan.id
                    ? { border: '1.5px solid #059669', background: '#F0FDF9', boxShadow: '0 4px 16px rgba(5,150,105,0.12)' }
                    : { border: '1.5px solid #EEECE6', background: '#fff' }}
                >
                  <input type="radio" name="planId" value={plan.id} checked={formData.planId === plan.id} onChange={handleChange} className="sr-only" />
                  <div className="text-center">
                    <h3 className="text-[14px] font-bold mb-2" style={{ color: '#0D0E12' }}>{plan.nombre}</h3>
                    <div className="mb-4">
                      <span className="text-[26px] font-bold" style={{ color: '#0D0E12' }}>${plan.precioPorUsuario}</span>
                      <span className="text-[12px]" style={{ color: '#9CA3AF' }}>/usuario/mes</span>
                    </div>
                    <div className="space-y-1.5 text-left">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[12.5px]" style={{ color: '#64748B' }}>
                          <span className="mt-0.5" style={{ color: '#059669' }}>✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2.5 text-[13px]" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center justify-end gap-2.5 pt-6" style={{ borderTop: '1px solid #F2F0EA' }}>
            <button type="button" onClick={() => navigate(`/${tenantId}/certificaciones`)} className="sv-btn sv-btn-ghost px-5">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="sv-btn sv-btn-primary px-5">
              <Save className="w-4 h-4" />
              {loading ? 'Registrando…' : 'Registrar empresa'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
