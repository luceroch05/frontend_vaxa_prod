'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  FileText,
  Calendar,
  TrendingUp,
  Loader2,
  Activity,
  CheckCircle2,
  ArrowRight,
} from '@/components/ui/icon';
import { TENANT_CONFIG } from '../../shared/constants';
import { Header } from '../../shared/components';
import { getHeaderConfig } from '../../shared/utils/config';
import PageTransition from '@/components/shared/PageTransition';
import GeneradorCertificados from './GeneradorCertificados';

interface DashboardProps {
  tenantId: string;
  tenant: TenantConfig;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

interface DashboardStats {
  total_certificados: number;
  certificados_mes: number;
  ultimo_lote: string | null;
}

export default function TechProDashboard({
  tenantId,
  tenant,
}: DashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    total_certificados: 1247,
    certificados_mes: 89,
    ultimo_lote: 'Hace 2 días'
  });

  useEffect(() => {
    // Verificar autenticación
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
        console.error('Error al parsear usuario:', error);
        router.push(`/${tenantId}/login`);
        return;
      }
    }

    setLoading(false);
  }, [tenantId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle background grid - Vercel style */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div 
          className="absolute inset-0 opacity-[0.15]"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${TENANT_CONFIG.PRIMARY_COLOR}15, transparent 50%)`
          }}
        ></div>
      </div>

      {/* HEADER */}
      <Header tenantId={tenantId} usuario={usuario} config={getHeaderConfig()} />

      {/* CONTENIDO PRINCIPAL */}
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 md:py-12">
        {/* Welcome Section */}
        <div className="mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium mb-4">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}></div>
            <span>Dashboard Personalizado</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Hola, {usuario.nombre.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Aquí tienes un resumen de tu actividad
          </p>
        </div>

        {/* ESTADÍSTICAS - Vercel Cards Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 animate-fade-in-delay-1">
          {/* Card 1 - Total Certificados */}
          <div className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
              >
                <FileText className="w-5 h-5" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </span>
            </div>
            <p
              className="text-3xl font-bold mb-1"
              style={{ color: TENANT_CONFIG.PRIMARY_COLOR }}
            >
              {stats.total_certificados.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Certificados emitidos</p>
          </div>

          {/* Card 2 - Este Mes */}
          <div className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
              >
                <Calendar className="w-5 h-5" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mes
              </span>
            </div>
            <p
              className="text-3xl font-bold mb-1"
              style={{ color: TENANT_CONFIG.PRIMARY_COLOR }}
            >
              {stats.certificados_mes.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Nuevos este mes</p>
          </div>

          {/* Card 3 - Actividad */}
          <div className="group p-6 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último
              </span>
            </div>
            <p
              className="text-xl font-bold mb-1 truncate"
              style={{ color: TENANT_CONFIG.PRIMARY_COLOR }}
            >
              {stats.ultimo_lote || 'Sin actividad'}
            </p>
            <p className="text-sm text-gray-600">Lote generado</p>
          </div>
        </div>

        {/* Sección de actividad y estado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12 animate-fade-in-delay-2">
          {/* Actividad Reciente */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
              <h3 className="text-base font-semibold text-gray-900">Actividad Reciente</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Sistema iniciado</p>
                  <p className="text-xs text-gray-500 mt-0.5">Hace unos momentos</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Dashboard personalizado cargado</p>
                  <p className="text-xs text-gray-500 mt-0.5">Vista exclusiva de {TENANT_CONFIG.NAME}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado del Sistema */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
              <h3 className="text-base font-semibold text-gray-900">Estado del Sistema</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Sistema Operativo</span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-md">
                  Activo
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Autenticación</span>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-md">
                  Conectado
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">Módulo Dashboard</span>
                <span 
                  className="px-2.5 py-1 text-white text-xs font-medium rounded-md"
                  style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
                >
                  Personalizado
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Generador de Certificados */}
        <div className="mb-12 animate-fade-in-delay-3">
          <GeneradorCertificados />
        </div>

        {/* Información del tenant */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg animate-fade-in-delay-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Información del Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Nombre de la Empresa
              </p>
              <p className="text-sm font-semibold text-gray-900">{TENANT_CONFIG.NAME}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Tenant ID
              </p>
              <p className="text-sm font-mono font-semibold text-gray-900">{tenantId}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Usuario Activo
              </p>
              <p className="text-sm font-semibold text-gray-900">{usuario.nombre}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Rol
              </p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{usuario.role}</p>
            </div>
          </div>
          <div
            className="mt-6 p-4 rounded-lg border"
            style={{ 
              backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}08`,
              borderColor: `${TENANT_CONFIG.PRIMARY_COLOR}20`
            }}
          >
            <p className="text-sm text-gray-700">
              <strong>Nota:</strong> Dashboard personalizado para {TENANT_CONFIG.NAME}, ubicado en{' '}
              <code className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono text-gray-800">
                /modules/extensions/empresa-techpro/modules/Dashboard
              </code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Powered by <strong className="text-gray-900">VAXA</strong> · Sistema de Gestión Empresarial
          </p>
        </div>

        {/* Animations */}
        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }

          .animate-fade-in-delay-1 {
            animation: fade-in 0.5s ease-out 0.1s both;
          }

          .animate-fade-in-delay-2 {
            animation: fade-in 0.5s ease-out 0.2s both;
          }

          .animate-fade-in-delay-3 {
            animation: fade-in 0.5s ease-out 0.3s both;
          }

          .animate-fade-in-delay-4 {
            animation: fade-in 0.5s ease-out 0.4s both;
          }
        `}</style>
      </main>
      </PageTransition>
    </div>
  );
}