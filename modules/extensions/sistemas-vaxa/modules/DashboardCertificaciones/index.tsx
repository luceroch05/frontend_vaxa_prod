'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
} from '@/components/ui/icon';
import Header from '@/components/shared/Header';
import { EMPRESAS_MOCK } from '../../shared/data/mockData';

// Configuración específica del sistema de certificaciones
const CERTIFICACIONES_CONFIG = {
  NAME: 'Sistema de Certificaciones',
  PRIMARY_COLOR: '#ea6733',
  SECONDARY_COLOR: '#b63b19',
  LOGO: '/videologo.png',
};

interface DashboardCertificacionesProps {
  tenantId: string;
  tenant: TenantConfig;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

export default function DashboardCertificaciones({ tenantId, tenant }: DashboardCertificacionesProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

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

  // Estadísticas
  const totalEmpresas = EMPRESAS_MOCK.length;
  const empresasActivas = EMPRESAS_MOCK.filter(e => e.estado === 'activo').length;
  const totalUsuarios = EMPRESAS_MOCK.reduce((acc, e) => acc + e.usuariosActivos, 0);
  const totalCertificados = EMPRESAS_MOCK.reduce((acc, e) => acc + e.certificadosGenerados, 0);

  const stats = [
    {
      title: 'Empresas Registradas',
      value: totalEmpresas,
      icon: Building2,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Empresas Activas',
      value: empresasActivas,
      icon: TrendingUp,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Usuarios',
      value: totalUsuarios,
      icon: Users,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Certificados Generados',
      value: totalCertificados,
      icon: FileText,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  // Empresas recientes
  const empresasRecientes = EMPRESAS_MOCK.slice(0, 3);

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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Certificaciones</h1>
            <p className="text-gray-600">Gestiona empresas, usuarios y certificados</p>
          </div>
          <button
            onClick={() => router.push(`/${tenantId}/certificaciones/registrar-empresa`)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Registrar Empresa
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => router.push(`/${tenantId}/certificaciones/empresas`)}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-emerald-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Ver Todas las Empresas</h3>
            <p className="text-sm text-gray-600">Gestiona las empresas registradas en el sistema</p>
          </button>

          <button
            onClick={() => router.push(`/${tenantId}/certificaciones/registrar-empresa`)}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Registrar Nueva Empresa</h3>
            <p className="text-sm text-gray-600">Agrega una nueva empresa al sistema de certificaciones</p>
          </button>
        </div>

        {/* Empresas Recientes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Empresas Recientes</h2>
            <button
              onClick={() => router.push(`/${tenantId}/certificaciones/empresas`)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {empresasRecientes.map((empresa) => (
              <div
                key={empresa.id}
                onClick={() => router.push(`/${tenantId}/certificaciones/empresa/${empresa.id}`)}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  {empresa.logoUrl ? (
                    <img
                      src={empresa.logoUrl}
                      alt={empresa.nombre}
                      className="w-12 h-12 rounded-lg object-contain border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {empresa.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">{empresa.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Usuarios</p>
                    <p className="font-semibold text-gray-900">{empresa.usuariosActivos}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Certificados</p>
                    <p className="font-semibold text-gray-900">{empresa.certificadosGenerados}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
