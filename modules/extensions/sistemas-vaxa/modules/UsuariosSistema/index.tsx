'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  ArrowLeft,
  Search,
  Plus,
  Mail,
  Shield,
  User,
  Package,
} from '@/components/ui/icon';
import Header from '@/components/shared/Header';
import { VAXA_CONFIG } from '../../shared/constants';
import { SISTEMAS_MOCK, USUARIOS_MOCK } from '../../shared/data/mockData';
import type { UsuarioSistema } from '../../shared/types';

interface UsuariosSistemaProps {
  tenantId: string;
  tenant: TenantConfig;
  sistemaSlug: string;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

export default function UsuariosSistema({ tenantId, tenant, sistemaSlug }: UsuariosSistemaProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<'todos' | 'admin' | 'operador' | 'usuario'>('todos');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos');

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

  const sistema = SISTEMAS_MOCK.find((s) => s.slug === sistemaSlug);

  if (!sistema) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sistema no encontrado</h2>
          <button
            onClick={() => router.push(`/${tenantId}/sistemas`)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold"
          >
            Volver a Sistemas
          </button>
        </div>
      </div>
    );
  }

  // Obtener usuarios del sistema
  const usuariosSistema = USUARIOS_MOCK.filter((u) => u.sistemaId === sistema.id);

  // Filtrado
  const usuariosFiltrados = usuariosSistema.filter((u) => {
    const matchSearch =
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRol = filterRol === 'todos' || u.rol === filterRol;
    const matchEstado = filterEstado === 'todos' || u.estado === filterEstado;

    return matchSearch && matchRol && matchEstado;
  });

  const getRolBadge = (rol: string) => {
    const badges = {
      admin: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      operador: 'bg-blue-50 text-blue-700 border-blue-200',
      usuario: 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return badges[rol as keyof typeof badges] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getRolIcon = (rol: string) => {
    if (rol === 'admin') return Shield;
    return User;
  };

  const porcentajeUso = sistema.usuariosMax > 0
    ? (sistema.usuariosActivos / sistema.usuariosMax) * 100
    : 0;

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
        {/* Back button */}
        <button
          onClick={() => router.push(`/${tenantId}/${sistemaSlug}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver a {sistema.nombre}</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Usuarios del Sistema</h1>
          <p className="text-gray-600">{sistema.nombre} - Gestiona los usuarios de este sistema</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total de Usuarios</p>
            <p className="text-3xl font-bold text-gray-900">{usuariosSistema.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-3">Uso de Licencias</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                {sistema.usuariosActivos} / {sistema.usuariosMax === -1 ? '∞' : sistema.usuariosMax}
              </span>
              <span className="text-sm font-bold text-emerald-600">
                {sistema.usuariosMax > 0 ? `${porcentajeUso.toFixed(0)}%` : '0%'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(porcentajeUso, 100)}%` }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Usuarios Activos</p>
            <p className="text-3xl font-bold text-emerald-600">
              {usuariosSistema.filter((u) => u.estado === 'activo').length}
            </p>
          </div>
        </div>

        {/* Acciones y Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="operador">Operadores</option>
              <option value="usuario">Usuarios</option>
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>

            <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold whitespace-nowrap shadow-sm">
              <Plus className="w-5 h-5" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {usuariosFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">No se encontraron usuarios</p>
              <p className="text-gray-600">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {usuariosFiltrados.map((usr) => {
                const RolIcon = getRolIcon(usr.rol);
                return (
                  <div
                    key={usr.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-700 font-semibold text-base">
                            {usr.nombre.charAt(0)}
                            {usr.apellido.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {usr.nombre} {usr.apellido}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {usr.email}
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              Último acceso: {usr.ultimoAcceso || 'Nunca'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getRolBadge(
                            usr.rol
                          )}`}
                        >
                          <RolIcon className="w-3.5 h-3.5" />
                          {usr.rol.charAt(0).toUpperCase() + usr.rol.slice(1)}
                        </span>

                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            usr.estado === 'activo'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {usr.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>

                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <span className="text-lg">⋮</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
