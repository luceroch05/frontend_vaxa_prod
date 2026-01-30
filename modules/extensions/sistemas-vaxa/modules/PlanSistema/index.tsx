'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  ArrowLeft,
  Check,
  Star,
  Users,
  FileText,
  Package,
  CreditCard,
  AlertCircle,
} from '@/components/ui/icon';
import Header from '@/components/shared/Header';
import { VAXA_CONFIG, PLANES } from '../../shared/constants';
import { SISTEMAS_MOCK } from '../../shared/data/mockData';

interface PlanSistemaProps {
  tenantId: string;
  tenant: TenantConfig;
  sistemaSlug: string;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

export default function PlanSistema({ tenantId, tenant, sistemaSlug }: PlanSistemaProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');

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

  if (!selectedPlan) {
    setSelectedPlan(sistema.planId);
  }

  const planActual = Object.values(PLANES).find((p) => p.id === sistema.planId);

  const planes = [
    { ...PLANES.BASICO, popular: false },
    { ...PLANES.PROFESIONAL, popular: true },
    { ...PLANES.EMPRESARIAL, popular: false },
  ];

  const porcentajeUsuarios = sistema.usuariosMax > 0
    ? (sistema.usuariosActivos / sistema.usuariosMax) * 100
    : 0;

  const porcentajeCertificados = sistema.certificadosMax && sistema.certificadosMax > 0
    ? ((sistema.certificadosGenerados || 0) / sistema.certificadosMax) * 100
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan y Facturación</h1>
          <p className="text-gray-600">{sistema.nombre} - Gestiona el plan de suscripción</p>
        </div>

        {/* Plan Actual */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-6 h-6 text-emerald-700" />
                <h2 className="text-lg font-bold text-emerald-900">Plan Actual</h2>
              </div>
              <p className="text-3xl font-bold text-emerald-900 mb-2">{planActual?.nombre}</p>
              <p className="text-emerald-700 text-lg">${planActual?.precio}/mes</p>
            </div>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-sm">
              <Check className="w-4 h-4" />
              Activo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/60 backdrop-blur rounded-xl border border-emerald-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-700" />
                  <p className="text-sm font-semibold text-emerald-900">Usuarios</p>
                </div>
                <span className="text-xs font-medium text-emerald-700">
                  {sistema.usuariosActivos} / {sistema.usuariosMax === -1 ? '∞' : sistema.usuariosMax}
                </span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-2.5">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(porcentajeUsuarios, 100)}%` }}
                />
              </div>
            </div>

            {sistema.certificadosGenerados !== undefined && (
              <div className="bg-white/60 backdrop-blur rounded-xl border border-emerald-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-700" />
                    <p className="text-sm font-semibold text-emerald-900">Certificados</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-700">
                    {sistema.certificadosGenerados} / {sistema.certificadosMax === -1 ? '∞' : sistema.certificadosMax}
                  </span>
                </div>
                <div className="w-full bg-emerald-200 rounded-full h-2.5">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(porcentajeCertificados, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Planes Disponibles */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Planes Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planes.map((plan) => {
              const isCurrentPlan = plan.id === sistema.planId;
              const isSelected = plan.id === selectedPlan;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-xl border-2 p-6 transition-all ${
                    isSelected
                      ? 'border-emerald-600 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-md">
                        <Star className="w-3 h-3" />
                        Más Popular
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold shadow-md">
                        <Check className="w-3 h-3" />
                        Actual
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6 pt-2">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.nombre}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900">${plan.precio}</span>
                      <span className="text-gray-600">/mes</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span>{plan.usuarios === -1 ? 'Usuarios ilimitados' : `${plan.usuarios} usuarios`}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3 h-3 text-blue-600" />
                      </div>
                      <span>
                        {plan.certificados === -1 ? 'Certificados ilimitados' : `${plan.certificados} certificados/mes`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => !isCurrentPlan && setSelectedPlan(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : isSelected
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {isCurrentPlan ? 'Plan Actual' : isSelected ? 'Seleccionado' : 'Seleccionar Plan'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alerta de cambio */}
        {selectedPlan !== sistema.planId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-blue-900 mb-2">Cambio de Plan Pendiente</p>
                <p className="text-sm text-blue-700 mb-4">
                  Has seleccionado el plan <strong>{planes.find((p) => p.id === selectedPlan)?.nombre}</strong>.
                  Los cambios se aplicarán de forma inmediata y se ajustará la facturación.
                </p>
                <div className="flex gap-3">
                  <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-sm">
                    Confirmar Cambio
                  </button>
                  <button
                    onClick={() => setSelectedPlan(sistema.planId)}
                    className="px-6 py-2.5 bg-white border-2 border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
