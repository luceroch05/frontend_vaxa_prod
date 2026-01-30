'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  Search,
  Plus,
  Edit2,
  Eye,
  Package,
  Activity,
  Users,
  FileText,
  Calendar,
  ExternalLink,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import { VAXA_CONFIG, PLANES } from '../../shared/constants';
import { SISTEMAS_MOCK } from '../../shared/data/mockData';
import type { Sistema } from '../../shared/types';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activo' | 'inactivo' | 'suspendido'>('todos');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'certificados' | 'medico' | 'inventario'>('todos');
  const [sistemas, setSistemas] = useState<Sistema[]>(SISTEMAS_MOCK);

  // Simular autenticación
  useState(() => {
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
  });

  if (loading || !usuario) {
    return null;
  }

  // Filtrado
  const sistemasFiltrados = sistemas.filter((s) => {
    const matchSearch =
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchEstado = filterEstado === 'todos' || s.estado === filterEstado;
    const matchTipo = filterTipo === 'todos' || s.tipo === filterTipo;

    return matchSearch && matchEstado && matchTipo;
  });

  // Estadísticas
  const totalSistemas = sistemas.length;
  const sistemasActivos = sistemas.filter((s) => s.estado === 'activo').length;
  const sistemasSuspendidos = sistemas.filter((s) => s.estado === 'suspendido').length;
  const totalUsuarios = sistemas.reduce((acc, s) => acc + s.usuariosActivos, 0);

  const stats = [
    { title: 'Total Sistemas', value: totalSistemas, icon: Package, color: 'blue' },
    { title: 'Activos', value: sistemasActivos, icon: CheckCircle, color: 'green' },
    { title: 'Suspendidos', value: sistemasSuspendidos, icon: AlertCircle, color: 'orange' },
    { title: 'Total Usuarios', value: totalUsuarios, icon: Users, color: 'purple' },
  ];

  const getPlanNombre = (planId: string) => {
    const plan = Object.values(PLANES).find((p) => p.id === planId);
    return plan?.nombre || planId;
  };

  const handleViewSistema = (slug: string) => {
    window.open(`/${slug}`, '_blank');
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistemas Registrados</h1>
            <p className="text-gray-600">Visualiza y gestiona todos los sistemas de Vaxa</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold">
            <Plus className="w-5 h-5" />
            Nuevo Sistema
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-xl bg-${stat.color}-50 flex items-center justify-center`}>
                  <stat.icon className={`w-7 h-7 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="suspendido">Suspendidos</option>
            </select>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos los tipos</option>
              <option value="certificados">Certificados</option>
              <option value="medico">Médico</option>
              <option value="inventario">Inventario</option>
            </select>
          </div>
        </div>

        {/* Grid de Sistemas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sistemasFiltrados.map((sistema) => (
            <div
              key={sistema.id}
              className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all overflow-hidden"
            >
              {/* Header del Card */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {sistema.logoUrl ? (
                      <img
                        src={sistema.logoUrl}
                        alt={sistema.nombre}
                        className="w-12 h-12 rounded-lg bg-white p-1 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold">{sistema.nombre}</h3>
                      <p className="text-sm text-white/80">/{sistema.slug}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      sistema.estado === 'activo'
                        ? 'bg-green-400 text-green-900'
                        : sistema.estado === 'suspendido'
                        ? 'bg-orange-400 text-orange-900'
                        : 'bg-gray-400 text-gray-900'
                    }`}
                  >
                    {sistema.estado.charAt(0).toUpperCase() + sistema.estado.slice(1)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                    <Package className="w-4 h-4" />
                    {sistema.tipo.charAt(0).toUpperCase() + sistema.tipo.slice(1)}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-3 py-1 rounded-full">
                    Plan {getPlanNombre(sistema.planId)}
                  </span>
                </div>
              </div>

              {/* Body del Card */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Usuarios</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {sistema.usuariosActivos} / {sistema.usuariosMax === -1 ? '∞' : sistema.usuariosMax}
                      </p>
                    </div>
                  </div>

                  {sistema.certificadosGenerados !== undefined && (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Certificados</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {sistema.certificadosGenerados} / {sistema.certificadosMax === -1 ? '∞' : sistema.certificadosMax}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Creado</p>
                      <p className="text-sm font-semibold text-gray-900">{sistema.fechaCreacion}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Última actividad</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {sistema.fechaUltimaActividad}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleViewSistema(sistema.slug)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-semibold"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Sistema
                  </button>
                  <button
                    onClick={() => router.push(`/${tenantId}/${sistema.slug}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    <Edit2 className="w-4 h-4" />
                    Gestionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sistemasFiltrados.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900 mb-2">No se encontraron sistemas</p>
            <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </main>
    </div>
  );
}
