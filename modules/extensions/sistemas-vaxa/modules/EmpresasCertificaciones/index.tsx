'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  Search,
  Plus,
  Building2,
  Users,
  FileText,
  ArrowLeft,
  Eye,
  Calendar,
  Mail,
  Phone,
} from '@/components/ui/icon';
import Header from '@/components/shared/Header';
import { PLANES } from '../../shared/constants';
import { EMPRESAS_MOCK } from '../../shared/data/mockData';
import type { Empresa } from '../../shared/types';

// Configuración específica del sistema de certificaciones
const CERTIFICACIONES_CONFIG = {
  NAME: 'Sistema de Certificaciones',
  PRIMARY_COLOR: '#ea6733',
  SECONDARY_COLOR: '#b63b19',
};

interface EmpresasCertificacionesProps {
  tenantId: string;
  tenant: TenantConfig;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

export default function EmpresasCertificaciones({ tenantId, tenant }: EmpresasCertificacionesProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [empresas] = useState<Empresa[]>(EMPRESAS_MOCK);

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

  // Filtrado
  const empresasFiltradas = empresas.filter((e) => {
    const matchSearch =
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ruc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSearch;
  });

  const getPlanNombre = (planId: string) => {
    const plan = Object.values(PLANES).find((p) => p.id === planId);
    return plan?.nombre || planId;
  };

  const getPlanPrecio = (planId: string, usuariosActivos: number) => {
    const plan = Object.values(PLANES).find((p) => p.id === planId);
    if (!plan) return 0;
    return plan.precioPorUsuario * usuariosActivos;
  };

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
          onClick={() => router.push(`/${tenantId}/certificaciones`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver al Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Empresas Registradas</h1>
            <p className="text-gray-600">
              Gestiona las empresas que utilizan el sistema de certificaciones
            </p>
          </div>
          <button
            onClick={() => router.push(`/${tenantId}/certificaciones/registrar-empresa`)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Registrar Empresa
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, RUC o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabla de Empresas */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Usuarios
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Certificados
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Facturación
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {empresasFiltradas.map((empresa) => (
                  <tr
                    key={empresa.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/${tenantId}/certificaciones/empresa/${empresa.id}`)
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {empresa.logoUrl ? (
                          <img
                            src={empresa.logoUrl}
                            alt={empresa.nombre}
                            className="w-10 h-10 rounded-lg object-contain border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                            <Building2 className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{empresa.nombre}</p>
                          <p className="text-sm text-gray-500">{empresa.ruc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">
                          {empresa.contactoPrincipal.nombre}
                        </p>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {empresa.contactoPrincipal.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700">
                        {getPlanNombre(empresa.planId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {empresa.usuariosActivos}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {empresa.certificadosGenerados}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-bold text-emerald-600">
                          ${getPlanPrecio(empresa.planId, empresa.usuariosActivos)}
                        </p>
                        <p className="text-gray-500">/mes</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          empresa.estado === 'activo'
                            ? 'bg-green-50 text-green-700'
                            : empresa.estado === 'suspendido'
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {empresa.estado.charAt(0).toUpperCase() + empresa.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/${tenantId}/certificaciones/empresa/${empresa.id}`);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {empresasFiltradas.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron empresas
              </p>
              <p className="text-gray-500 mb-6">Intenta ajustar los filtros de búsqueda</p>
              <button
                onClick={() => router.push(`/${tenantId}/certificaciones/registrar-empresa`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold"
              >
                <Plus className="w-5 h-5" />
                Registrar Primera Empresa
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
