'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Loader2,
  FolderOpen,
  Package,
  ArrowLeft
} from '@/components/ui/icon';
import { TENANT_CONFIG } from '../../shared/constants';
import { Header } from '../../shared/components';
import { getHeaderConfig } from '../../shared/utils/config';
import PageTransition from '@/components/shared/PageTransition';

interface HistorialLotesProps {
  tenantId: string;
  tenant: TenantConfig;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

interface Lote {
  id: number;
  nombreArchivo: string;
  cantidadCertificados: number;
  fechaProcesado: string;
  totalCertificados: number;
  tieneZip: boolean;
}

// Datos estáticos de ejemplo
const LOTES_ESTATICOS: Lote[] = [
  {
    id: 1,
    nombreArchivo: 'Capacitacion_Seguridad_Industrial_2024.xlsx',
    cantidadCertificados: 45,
    fechaProcesado: '2024-01-15T10:30:00',
    totalCertificados: 45,
    tieneZip: true
  },
  {
    id: 2,
    nombreArchivo: 'Curso_Liderazgo_Empresarial_Enero.xlsx',
    cantidadCertificados: 32,
    fechaProcesado: '2024-01-10T14:20:00',
    totalCertificados: 32,
    tieneZip: true
  },
  {
    id: 3,
    nombreArchivo: 'Taller_Innovacion_Digital.xlsx',
    cantidadCertificados: 28,
    fechaProcesado: '2024-01-05T09:15:00',
    totalCertificados: 28,
    tieneZip: true
  },
  {
    id: 4,
    nombreArchivo: 'Seminario_Gestion_Proyectos.xlsx',
    cantidadCertificados: 56,
    fechaProcesado: '2023-12-20T16:45:00',
    totalCertificados: 56,
    tieneZip: true
  }
];

export default function HistorialLotes({ tenantId, tenant }: HistorialLotesProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [descargandoZip, setDescargandoZip] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const lotesPerPage = 10;

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

    // Cargar lotes estáticos
    setLotes(LOTES_ESTATICOS);
    setLoading(false);
  }, [tenantId, router]);

  const descargarZip = async (loteId: number) => {
    try {
      setDescargandoZip(loteId);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log(`Descargando ZIP del lote ${loteId}`);
      alert(`Descargando ZIP del lote ${loteId}`);
    } catch (error) {
      console.error('Error al descargar ZIP:', error);
      alert('Error al descargar el archivo ZIP');
    } finally {
      setDescargandoZip(null);
    }
  };

  const verCertificados = (loteId: number) => {
    router.push(`/${tenantId}/historial/${loteId}/certificados`);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && lotes.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">Cargando lotes...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  const totalPages = Math.ceil(lotes.length / lotesPerPage);
  const startIndex = (page - 1) * lotesPerPage;
  const lotesPaginados = lotes.slice(startIndex, startIndex + lotesPerPage);

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle background grid - Vercel style */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* HEADER NAVBAR */}
      <Header tenantId={tenantId} usuario={usuario} config={getHeaderConfig()} />

      <PageTransition>
        <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${tenantId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
              >
                <FolderOpen className="w-6 h-6" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">Historial de Lotes</h1>
                <p className="text-sm text-gray-600">
                  Gestiona y descarga todos tus lotes de certificados
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">Total de lotes</p>
                <p className="text-xl font-semibold text-gray-900">{lotes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Lotes */}
        {lotes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
            >
              <Package className="w-8 h-8" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay lotes generados aún
            </h3>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
              Comienza generando tu primer lote de certificados desde el dashboard principal
            </p>
            <button
              onClick={() => router.push(`/${tenantId}`)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium"
              style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
            >
              Ir al Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {lotesPaginados.map((lote) => (
              <div
                key={lote.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Info del Lote */}
                  <div className="lg:col-span-6">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
                      >
                        <FileText className="w-5 h-5" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                          {lote.nombreArchivo}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatearFecha(lote.fechaProcesado)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="lg:col-span-3">
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 mb-0.5">Total certificados</p>
                      <p className="text-lg font-semibold text-gray-900">{lote.totalCertificados}</p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="lg:col-span-3 flex gap-2">
                    <button
                      onClick={() => verCertificados(lote.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium"
                      style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden xl:inline">Ver</span>
                    </button>
                    <button
                      onClick={() => descargarZip(lote.id)}
                      disabled={descargandoZip === lote.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {descargandoZip === lote.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden xl:inline">...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span className="hidden xl:inline">ZIP</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
            >
              Anterior
            </button>
            <span
              className="px-4 py-2 text-white rounded-lg text-sm font-medium"
              style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
            >
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
            >
              Siguiente
            </button>
          </div>
        )}
        </div>
      </PageTransition>
    </div>
  );
}