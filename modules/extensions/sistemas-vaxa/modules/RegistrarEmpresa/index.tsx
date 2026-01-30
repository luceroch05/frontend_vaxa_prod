'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import { ArrowLeft, Building2, Mail, Phone, MapPin, Globe, Save } from '@/components/ui/icon';
import Header from '@/components/shared/Header';
import { VAXA_CONFIG, PLANES } from '../../shared/constants';
import type { Empresa } from '../../shared/types';

interface RegistrarEmpresaProps {
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

export default function RegistrarEmpresa({ tenantId, tenant }: RegistrarEmpresaProps) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simular creación de empresa
    const slug = formData.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    const nuevaEmpresa: Empresa = {
      id: Date.now().toString(),
      nombre: formData.nombre,
      ruc: formData.ruc,
      email: formData.email,
      telefono: formData.telefono,
      direccion: formData.direccion,
      pais: formData.pais,
      slug,
      tipo: 'certificados',
      estado: 'activo',
      planId: formData.planId,
      logoBloqueado: false,
      firmas: [],
      usuariosActivos: 0,
      certificadosGenerados: 0,
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaUltimaActividad: new Date().toISOString().split('T')[0],
      contactoPrincipal: {
        nombre: formData.contactoNombre,
        email: formData.contactoEmail,
        cargo: formData.contactoCargo,
      },
    };

    // Aquí iría la llamada al API
    console.log('Nueva empresa:', nuevaEmpresa);

    setTimeout(() => {
      setLoading(false);
      router.push(`/${tenantId}/sistemas`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        tenantId={tenantId}
        usuario={usuario}
        config={{
          name: VAXA_CONFIG.NAME,
          primaryColor: VAXA_CONFIG.PRIMARY_COLOR,
          secondaryColor: VAXA_CONFIG.SECONDARY_COLOR,
        }}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push(`/${tenantId}/sistemas`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver a Empresas</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-200">
              <Building2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Registrar Nueva Empresa</h1>
              <p className="text-gray-500 text-sm">Sistema de Certificaciones</p>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Registra una nueva empresa que utilizará el sistema de certificaciones
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8">
          {/* Información de la Empresa */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              Información de la Empresa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Empresa *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  placeholder="Instituto TechPro Capacitaciones"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  RUC / NIF *
                </label>
                <input
                  type="text"
                  name="ruc"
                  value={formData.ruc}
                  onChange={handleChange}
                  required
                  placeholder="20123456789"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">País *</label>
                <select
                  name="pais"
                  value={formData.pais}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="Perú">Perú</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Chile">Chile</option>
                  <option value="Argentina">Argentina</option>
                  <option value="México">México</option>
                  <option value="España">España</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Contacto Principal */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Contacto Principal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="contactoNombre"
                  value={formData.contactoNombre}
                  onChange={handleChange}
                  required
                  placeholder="María González"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  name="contactoEmail"
                  value={formData.contactoEmail}
                  onChange={handleChange}
                  required
                  placeholder="maria.gonzalez@techpro.edu.pe"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo *</label>
                <input
                  type="text"
                  name="contactoCargo"
                  value={formData.contactoCargo}
                  onChange={handleChange}
                  required
                  placeholder="Gerente de Operaciones"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Plan */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Plan de Suscripción
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(PLANES).map((plan) => (
                <label
                  key={plan.id}
                  className={`relative cursor-pointer rounded-xl border-2 p-6 transition-all ${
                    formData.planId === plan.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="planId"
                    value={plan.id}
                    checked={formData.planId === plan.id}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.nombre}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        ${plan.precioPorUsuario}
                      </span>
                      <span className="text-sm text-gray-600">/usuario/mes</span>
                    </div>
                    <div className="space-y-2 text-left">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-emerald-600 mt-0.5">✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push(`/${tenantId}/sistemas`)}
              className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Registrando...' : 'Registrar Empresa'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
