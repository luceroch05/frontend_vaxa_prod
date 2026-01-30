'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  ArrowLeft,
  Building2,
  Users,
  CreditCard,
  FileImage,
  Info,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
} from '@/components/ui/icon';
import Header from '@/components/shared/Header';
import { EMPRESAS_MOCK } from '../../shared/data/mockData';

// Configuración específica del sistema de certificaciones
const CERTIFICACIONES_CONFIG = {
  NAME: 'Sistema de Certificaciones',
  PRIMARY_COLOR: '#ea6733',
  SECONDARY_COLOR: '#b63b19',
};
import TabInformacion from './TabInformacion';
import TabPlan from './TabPlan';
import TabUsuarios from './TabUsuarios';
import TabLogos from './TabLogos';

interface PerfilEmpresaProps {
  tenantId: string;
  tenant: TenantConfig;
  empresaId: string;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

type TabType = 'informacion' | 'plan' | 'usuarios' | 'logos';

export default function PerfilEmpresa({ tenantId, tenant, empresaId }: PerfilEmpresaProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('informacion');

  useEffect(() => {
    const authData = localStorage.getItem(`auth_${tenantId}`);
    const userData = localStorage.getItem(`auth_user_${tenantId}`);

    if (!authData || authData !== 'true') {
      router.push(`/${tenantId}/login`);
      return;
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUsuario(user);
      } catch (error) {
        router.push(`/${tenantId}/login`);
        return;
      }
    }

    setLoading(false);
  }, [tenantId, router]);

  if (loading || !usuario) {
    return null;
  }

  const empresa = EMPRESAS_MOCK.find((e) => e.id === empresaId);

  if (!empresa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Empresa no encontrada</h2>
          <p className="text-gray-600 mb-6">La empresa que buscas no existe</p>
          <button
            onClick={() => router.push(`/${tenantId}/certificaciones/empresas`)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
          >
            Volver a Empresas
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'informacion' as TabType, label: 'Información', icon: Info },
    { id: 'plan' as TabType, label: 'Plan y Facturación', icon: CreditCard },
    { id: 'usuarios' as TabType, label: 'Usuarios', icon: Users },
    { id: 'logos' as TabType, label: 'Logos y Firmas', icon: FileImage },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        tenantId={tenantId}
        usuario={usuario}
        config={{
          name: CERTIFICACIONES_CONFIG.NAME,
          primaryColor: CERTIFICACIONES_CONFIG.PRIMARY_COLOR,
          secondaryColor: CERTIFICACIONES_CONFIG.SECONDARY_COLOR,
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push(`/${tenantId}/certificaciones/empresas`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver a Empresas</span>
        </button>

        {/* Header de la empresa */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              {empresa.logoUrl ? (
                <img
                  src={empresa.logoUrl}
                  alt={empresa.nombre}
                  className="w-24 h-24 rounded-xl object-contain border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-200">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{empresa.nombre}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {empresa.ruc}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {empresa.email}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      empresa.estado === 'activo'
                        ? 'bg-green-50 text-green-700'
                        : empresa.estado === 'suspendido'
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {empresa.estado.charAt(0).toUpperCase() + empresa.estado.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Usuarios Activos</p>
              <p className="text-2xl font-bold text-gray-900">{empresa.usuariosActivos}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Certificados Generados</p>
              <p className="text-2xl font-bold text-gray-900">{empresa.certificadosGenerados}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Firmas Registradas</p>
              <p className="text-2xl font-bold text-gray-900">{empresa.firmas.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Fecha de Registro</p>
              <p className="text-2xl font-bold text-gray-900">{empresa.fechaCreacion}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-emerald-600 text-emerald-600 bg-emerald-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'informacion' && <TabInformacion empresa={empresa} />}
            {activeTab === 'plan' && <TabPlan empresa={empresa} tenantId={tenantId} />}
            {activeTab === 'usuarios' && <TabUsuarios empresa={empresa} tenantId={tenantId} />}
            {activeTab === 'logos' && <TabLogos empresa={empresa} tenantId={tenantId} />}
          </div>
        </div>
      </main>
    </div>
  );
}
