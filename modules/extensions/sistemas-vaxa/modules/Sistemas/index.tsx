'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  Package,
  Users,
  Settings,
  ChevronRight,
  Building2,
} from '@/components/ui/icon';
import Header from '@/components/shared/Header';
import { VAXA_CONFIG } from '../../shared/constants';
import { SISTEMAS_MOCK } from '../../shared/data/mockData';

interface SistemasProps {
  tenantId: string;
  tenant: TenantConfig;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

export default function Sistemas({ tenantId, tenant }: SistemasProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    // Verificar que tenantId existe
    if (!tenantId) {
      console.error('TenantId is undefined');
      return;
    }

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

  // Verificar que tenantId está disponible antes de renderizar
  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600">Error: Tenant ID no disponible</p>
        </div>
      </div>
    );
  }

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona los sistemas y usuarios de Vaxa</p>
        </div>

        {/* Opciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sistemas Registrados */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Sistemas Registrados</h2>
                <p className="text-sm text-gray-600">
                  Gestiona los sistemas activos de Vaxa
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-3">
              {SISTEMAS_MOCK.map((sistema) => (
                <button
                  key={sistema.id}
                  onClick={() => router.push(`/${tenantId}/${sistema.slug}`)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                        {sistema.nombre}
                      </p>
                      <p className="text-sm text-gray-500">/{sistema.slug}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Gestión de Usuarios */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Gestión de Usuarios</h2>
                <p className="text-sm text-gray-600">
                  Administra los usuarios de sistemas-vaxa
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <button
              onClick={() => router.push(`/${tenantId}/usuarios`)}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Ver Usuarios
                  </p>
                  <p className="text-sm text-gray-500">Gestiona accesos a sistemas-vaxa</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
