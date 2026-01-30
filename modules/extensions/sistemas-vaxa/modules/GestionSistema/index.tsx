'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  ArrowLeft,
  Users,
  CreditCard,
  FileImage,
  Package,
  ChevronRight,
} from '@/components/ui/icon';
import Header from '@/components/shared/Header';
import { VAXA_CONFIG } from '../../shared/constants';
import { SISTEMAS_MOCK } from '../../shared/data/mockData';

interface GestionSistemaProps {
  tenantId: string;
  tenant: TenantConfig;
  sistemaSlug: string;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

export default function GestionSistema({ tenantId, tenant, sistemaSlug }: GestionSistemaProps) {
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

  // Buscar sistema
  const sistema = SISTEMAS_MOCK.find((s) => s.slug === sistemaSlug);

  if (!sistema) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sistema no encontrado</h2>
          <p className="text-gray-600 mb-6">El sistema que buscas no existe</p>
          <button
            onClick={() => router.push(`/${tenantId}/sistemas`)}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
          >
            Volver a Sistemas
          </button>
        </div>
      </div>
    );
  }

  const menuOptions = [
    {
      id: 'usuarios',
      title: 'Gestión de Usuarios',
      description: 'Administra los usuarios de este sistema',
      icon: Users,
      color: 'emerald',
      path: `/${tenantId}/${sistemaSlug}/usuarios`,
    },
    {
      id: 'plan',
      title: 'Plan y Facturación',
      description: 'Cambia el plan y gestiona la facturación',
      icon: CreditCard,
      color: 'blue',
      path: `/${tenantId}/${sistemaSlug}/plan`,
    },
    {
      id: 'elementos',
      title: 'Logos y Firmas',
      description: 'Gestiona logos, firmas y elementos visuales',
      icon: FileImage,
      color: 'purple',
      path: `/${tenantId}/${sistemaSlug}/elementos`,
    },
  ];

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
          onClick={() => router.push(`/${tenantId}/sistemas`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Volver a Sistemas</span>
        </button>

        {/* Header del sistema */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            {sistema.logoUrl ? (
              <img
                src={sistema.logoUrl}
                alt={sistema.nombre}
                className="w-16 h-16 rounded-xl object-contain border border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-200">
                <Package className="w-8 h-8 text-emerald-600" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{sistema.nombre}</h1>
              <p className="text-gray-500 text-sm">/{sistema.slug}</p>
            </div>
          </div>
          <p className="text-gray-600 mt-2">Selecciona una opción para gestionar este sistema</p>
        </div>

        {/* Menu de opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => router.push(option.path)}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all text-left group"
              >
                <div className={`w-12 h-12 rounded-xl bg-${option.color}-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 text-${option.color}-600`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center justify-between">
                  {option.title}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-sm text-gray-600">{option.description}</p>
              </button>
            );
          })}
        </div>

        {/* Info del sistema */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Usuarios Activos</p>
            <p className="text-2xl font-bold text-gray-900">
              {sistema.usuariosActivos} / {sistema.usuariosMax === -1 ? '∞' : sistema.usuariosMax}
            </p>
          </div>
          {sistema.certificadosGenerados !== undefined && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">Certificados Generados</p>
              <p className="text-2xl font-bold text-gray-900">
                {sistema.certificadosGenerados} / {sistema.certificadosMax === -1 ? '∞' : sistema.certificadosMax}
              </p>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Estado</p>
            <p className="text-2xl font-bold text-emerald-600 capitalize">{sistema.estado}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
