'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  ArrowLeft,
  Upload,
  Lock,
  Unlock,
  Check,
  X,
  AlertCircle,
  ImageIcon,
  FileSignature,
  Calendar,
  CheckCircle,
  XCircle,
  Package,
} from '@/components/ui/icon';
import Header from '@/components/shared/Header';
import { VAXA_CONFIG } from '../../shared/constants';
import { SISTEMAS_MOCK, CONFIGURACIONES_MOCK } from '../../shared/data/mockData';

interface ElementosSistemaProps {
  tenantId: string;
  tenant: TenantConfig;
  sistemaSlug: string;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

export default function ElementosSistema({ tenantId, tenant, sistemaSlug }: ElementosSistemaProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([
    {
      id: '1',
      tipo: 'logo',
      urlActual: '/videologo.png',
      urlNueva: '/nuevo-logo.png',
      solicitadoPor: 'juan.perez@techpro.com',
      fechaSolicitud: '2026-01-28',
      estado: 'pendiente',
    },
    {
      id: '2',
      tipo: 'firma',
      firmaId: 'f1',
      nombreFirma: 'Dr. Carlos Ruiz',
      urlActual: '/firma1.png',
      urlNueva: '/firma1-nueva.png',
      solicitadoPor: 'maria.garcia@techpro.com',
      fechaSolicitud: '2026-01-27',
      estado: 'pendiente',
    },
  ]);

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

  const configuracion = CONFIGURACIONES_MOCK.find((c) => c.sistemaId === sistema.id);

  const handleAprobar = (solicitudId: string) => {
    setSolicitudesPendientes((prev) =>
      prev.map((s) => (s.id === solicitudId ? { ...s, estado: 'aprobado' } : s))
    );
  };

  const handleRechazar = (solicitudId: string) => {
    setSolicitudesPendientes((prev) =>
      prev.map((s) => (s.id === solicitudId ? { ...s, estado: 'rechazado' } : s))
    );
  };

  const pendientesCount = solicitudesPendientes.filter((s) => s.estado === 'pendiente').length;

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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Logos y Firmas</h1>
            <p className="text-gray-600">{sistema.nombre} - Gestiona elementos visuales del sistema</p>
          </div>
          {pendientesCount > 0 && (
            <span className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl text-sm font-semibold">
              {pendientesCount} solicitudes pendientes
            </span>
          )}
        </div>

        {/* Elementos Actuales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Logo */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Logo del Sistema</h2>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  configuracion?.logo.bloqueado
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {configuracion?.logo.bloqueado ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Bloqueado
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    Editable
                  </>
                )}
              </span>
            </div>

            {sistema.logoUrl ? (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-4">
                <img
                  src={sistema.logoUrl}
                  alt="Logo actual"
                  className="w-40 h-40 object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 mb-4 text-center">
                <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">Sin logo configurado</p>
              </div>
            )}

            {configuracion?.logo.bloqueado && (
              <div className="bg-red-50 rounded-lg border border-red-200 p-4 mb-4">
                <p className="text-xs text-red-700 flex items-center gap-1.5 mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  Bloqueado desde: {configuracion.logo.fechaBloqueo}
                </p>
                <p className="text-xs text-red-600">
                  Solo el administrador puede aprobar cambios para evitar falsificación de certificados.
                </p>
              </div>
            )}

            <button className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors font-semibold flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Cambiar Logo
            </button>
          </div>

          {/* Firmas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Firmas Digitales</h2>
              </div>
              <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold border border-gray-300">
                {configuracion?.firmas.length || 0} firmas
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {configuracion?.firmas.map((firma) => (
                <div key={firma.id} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{firma.nombre}</p>
                      <p className="text-xs text-gray-600">{firma.cargo}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        firma.bloqueado
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {firma.bloqueado ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </span>
                  </div>
                  {firma.url && (
                    <div className="bg-white rounded-lg border border-gray-200 p-3">
                      <img src={firma.url} alt={firma.nombre} className="w-32 h-16 object-contain mx-auto" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors font-semibold flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Agregar Firma
            </button>
          </div>
        </div>

        {/* Solicitudes Pendientes */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Solicitudes de Cambio</h2>

          {solicitudesPendientes.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">No hay solicitudes pendientes</p>
              <p className="text-gray-600">Todas las solicitudes han sido procesadas</p>
            </div>
          ) : (
            <div className="space-y-6">
              {solicitudesPendientes.map((solicitud) => (
                <div
                  key={solicitud.id}
                  className={`bg-white rounded-xl border-2 p-6 transition-all ${
                    solicitud.estado === 'pendiente'
                      ? 'border-orange-200'
                      : solicitud.estado === 'aprobado'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          solicitud.tipo === 'logo' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}
                      >
                        {solicitud.tipo === 'logo' ? (
                          <ImageIcon className="w-6 h-6 text-blue-600" />
                        ) : (
                          <FileSignature className="w-6 h-6 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-base font-bold text-gray-900 mb-1">
                          Cambio de {solicitud.tipo === 'logo' ? 'Logo' : 'Firma'}
                        </p>
                        {solicitud.tipo === 'firma' && solicitud.nombreFirma && (
                          <p className="text-sm text-gray-600 mb-2">{solicitud.nombreFirma}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>Por: {solicitud.solicitadoPor}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {solicitud.fechaSolicitud}
                          </span>
                        </div>
                      </div>
                    </div>

                    {solicitud.estado === 'pendiente' ? (
                      <span className="px-3 py-1.5 bg-orange-100 text-orange-700 border border-orange-300 rounded-lg text-xs font-semibold">
                        Pendiente
                      </span>
                    ) : solicitud.estado === 'aprobado' ? (
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Aprobado
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-red-100 text-red-700 border border-red-300 rounded-lg text-xs font-semibold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Rechazado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-3">Actual</p>
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <img
                          src={solicitud.urlActual}
                          alt="Actual"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-blue-700 mb-3">Propuesto</p>
                      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                        <img
                          src={solicitud.urlNueva}
                          alt="Nuevo"
                          className="w-full h-32 object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {solicitud.estado === 'pendiente' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAprobar(solicitud.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        Aprobar Cambio
                      </button>
                      <button
                        onClick={() => handleRechazar(solicitud.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-red-300 text-red-700 rounded-xl hover:bg-red-50 transition-colors font-semibold"
                      >
                        <X className="w-4 h-4" />
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900 mb-2">Política de Seguridad</p>
              <p className="text-sm text-blue-700">
                Los clientes solo pueden subir logos y firmas una vez. Después de la primera carga, los
                elementos quedan bloqueados automáticamente. Solo el administrador de Vaxa puede aprobar
                cambios posteriores para prevenir la falsificación de certificados.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
