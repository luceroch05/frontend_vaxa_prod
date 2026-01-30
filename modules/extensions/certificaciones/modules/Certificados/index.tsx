'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  Users,
  Search,
  Download,
  Edit2,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  Filter,
  Eye,
  ArrowLeft,
  Star,
  AlertCircle
} from 'lucide-react';
import { TENANT_CONFIG } from '../../shared/constants';
import { Header } from '../../shared/components';
import { getHeaderConfig } from '../../shared/utils/config';
import PageTransition from '@/components/shared/PageTransition';

interface CertificadosProps {
  tenantId: string;
  tenant: TenantConfig;
  loteId: string;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

interface Participante {
  certificado_id: number;
  codigo: string;
  participante_id: number;
  termino: string | null;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  tipo_documento: string;
  numero_documento: string;
  correo_electronico: string | null;
  curso: string;
  horas: number;
  fecha_emision: string;
  nombre_actual?: string;
  tiene_override?: boolean;
}

// Datos estáticos de ejemplo para certificados
const generarCertificadosEstaticos = (loteId: string): Participante[] => {
  const cursos: Record<string, { curso: string; horas: number }> = {
    '1': { curso: 'Capacitación en Seguridad Industrial', horas: 40 },
    '2': { curso: 'Curso de Liderazgo Empresarial', horas: 32 },
    '3': { curso: 'Taller de Innovación Digital', horas: 28 },
    '4': { curso: 'Seminario de Gestión de Proyectos', horas: 56 }
  };

  const cursoData = cursos[loteId] || { curso: 'Curso General', horas: 24 };

  const participantes = [
    { nombres: 'Juan Carlos', apellidos: 'Pérez García', documento: '45678901', email: 'juan.perez@email.com' },
    { nombres: 'María Elena', apellidos: 'Rodríguez López', documento: '45678902', email: 'maria.rodriguez@email.com' },
    { nombres: 'Pedro José', apellidos: 'González Martínez', documento: '45678903', email: 'pedro.gonzalez@email.com' },
    { nombres: 'Ana María', apellidos: 'Torres Sánchez', documento: '45678904', email: 'ana.torres@email.com' },
    { nombres: 'Luis Alberto', apellidos: 'Ramírez Flores', documento: '45678905', email: 'luis.ramirez@email.com' },
    { nombres: 'Carmen Rosa', apellidos: 'Díaz Herrera', documento: '45678906', email: 'carmen.diaz@email.com' },
    { nombres: 'Jorge Luis', apellidos: 'Vargas Castro', documento: '45678907', email: 'jorge.vargas@email.com' },
    { nombres: 'Patricia', apellidos: 'Mendoza Ruiz', documento: '45678908', email: 'patricia.mendoza@email.com' },
    { nombres: 'Roberto', apellidos: 'Cruz Romero', documento: '45678909', email: 'roberto.cruz@email.com' },
    { nombres: 'Sofía', apellidos: 'Morales Ortiz', documento: '45678910', email: 'sofia.morales@email.com' },
    { nombres: 'Fernando', apellidos: 'Gutiérrez Rojas', documento: '45678911', email: 'fernando.gutierrez@email.com' },
    { nombres: 'Laura', apellidos: 'Paredes Vega', documento: '45678912', email: 'laura.paredes@email.com' },
    { nombres: 'Andrés', apellidos: 'Castillo Reyes', documento: '45678913', email: 'andres.castillo@email.com' },
    { nombres: 'Daniela', apellidos: 'Salazar Muñoz', documento: '45678914', email: 'daniela.salazar@email.com' },
    { nombres: 'Mauricio', apellidos: 'Ríos Campos', documento: '45678915', email: 'mauricio.rios@email.com' }
  ];

  return participantes.map((p, index) => ({
    certificado_id: parseInt(loteId) * 100 + index + 1,
    codigo: `CERT-${loteId}-${String(index + 1).padStart(4, '0')}`,
    participante_id: index + 1,
    termino: index % 3 === 0 ? 'Sr.' : index % 3 === 1 ? 'Sra.' : null,
    nombres: p.nombres,
    apellidos: p.apellidos,
    nombre_completo: `${p.nombres} ${p.apellidos}`,
    tipo_documento: 'DNI',
    numero_documento: p.documento,
    correo_electronico: p.email,
    curso: cursoData.curso,
    horas: cursoData.horas,
    fecha_emision: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

export default function CertificadosLote({ tenantId, tenant, loteId }: CertificadosProps) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [filteredParticipantes, setFilteredParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [editandoCertificado, setEditandoCertificado] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [regenerando, setRegenerando] = useState<number | null>(null);

  const [sortField, setSortField] = useState<'nombre' | 'documento' | 'fecha'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

    // Cargar certificados estáticos
    const certs = generarCertificadosEstaticos(loteId);
    setParticipantes(certs);
    setLoading(false);
  }, [tenantId, loteId, router]);

  useEffect(() => {
    filterAndSortParticipantes();
    setCurrentPage(1);
  }, [participantes, searchTerm, sortField, sortOrder]);

  const filterAndSortParticipantes = () => {
    let filtered = [...participantes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre_completo.toLowerCase().includes(term) ||
          (p.nombre_actual && p.nombre_actual.toLowerCase().includes(term)) ||
          p.numero_documento.includes(term) ||
          p.correo_electronico?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'nombre':
          comparison = a.apellidos.localeCompare(b.apellidos);
          break;
        case 'documento':
          comparison = a.numero_documento.localeCompare(b.numero_documento);
          break;
        case 'fecha':
          comparison = new Date(a.fecha_emision).getTime() - new Date(b.fecha_emision).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredParticipantes(filtered);
  };

  const iniciarEdicionCertificado = (participante: Participante) => {
    setEditandoCertificado(participante.certificado_id);
    setNombreEditado(participante.nombre_actual || participante.nombre_completo);
  };

  const cancelarEdicionCertificado = () => {
    setEditandoCertificado(null);
    setNombreEditado('');
  };

  const guardarYRegenerar = async (certificadoId: number) => {
    if (!nombreEditado.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    setRegenerando(certificadoId);

    try {
      // Simular guardado y regeneración
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Actualizar localmente
      setParticipantes((prev) =>
        prev.map((p) =>
          p.certificado_id === certificadoId
            ? {
                ...p,
                nombre_actual: nombreEditado,
                tiene_override: true
              }
            : p
        )
      );

      setEditandoCertificado(null);
      setNombreEditado('');
      alert('Certificado actualizado y regenerado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al regenerar el certificado');
    } finally {
      setRegenerando(null);
    }
  };

  const downloadCertificate = async (certificadoId: number, codigo: string) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log(`Descargando certificado ${codigo}`);
      alert(`Descargando certificado ${codigo}`);
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar el certificado');
    }
  };

  const previewCertificate = (certificadoId: number, codigo: string) => {
    alert(`Vista previa de certificado ${codigo} - Funcionalidad pendiente de implementar`);
  };

  const toggleSort = (field: 'nombre' | 'documento' | 'fecha') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-red-600">Error: No se pudo cargar la información</p>
      </div>
    );
  }

  const stats = {
    total: participantes.length
  };

  const totalPages = Math.ceil(filteredParticipantes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentParticipantes = filteredParticipantes.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle background grid */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* HEADER NAVBAR */}
      <Header tenantId={tenantId} usuario={usuario} config={getHeaderConfig()} />

      {/* MAIN CONTENT */}
      <PageTransition>
        <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/${tenantId}/historial`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Historial
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
            >
              <Users className="w-6 h-6" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Lote #{loteId}</h1>
              <p className="text-sm text-gray-600">
                {stats.total} certificados - {participantes[0]?.curso || 'Curso'}
              </p>
            </div>
          </div>
        </div>

        {/* FILTROS */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, DNI o correo..."
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-4 border-t border-gray-200">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">Ordenar:</span>
            <button
              onClick={() => toggleSort('nombre')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sortField === 'nombre'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                sortField === 'nombre'
                  ? { backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }
                  : undefined
              }
            >
              Nombre {sortField === 'nombre' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('documento')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sortField === 'documento'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                sortField === 'documento'
                  ? { backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }
                  : undefined
              }
            >
              Documento {sortField === 'documento' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('fecha')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sortField === 'fecha'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={
                sortField === 'fecha'
                  ? { backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }
                  : undefined
              }
            >
              Fecha {sortField === 'fecha' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Nombre en Certificado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentParticipantes.map((participante, index) => {
                  const isEditingCert = editandoCertificado === participante.certificado_id;
                  const globalIndex = startIndex + index + 1;

                  return (
                    <tr
                      key={participante.certificado_id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg">
                          {globalIndex}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1.5 rounded-md border w-fit"
                            style={{
                              backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}08`,
                              color: TENANT_CONFIG.PRIMARY_COLOR,
                              borderColor: `${TENANT_CONFIG.PRIMARY_COLOR}20`
                            }}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {participante.codigo}
                          </span>
                          {participante.tiene_override && (
                            <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md w-fit">
                              <Star className="w-3 h-3 fill-purple-600" />
                              Personalizado
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {isEditingCert ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={nombreEditado}
                              onChange={(e) => setNombreEditado(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                              placeholder="Nombre completo..."
                              disabled={regenerando === participante.certificado_id}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => guardarYRegenerar(participante.certificado_id)}
                                disabled={regenerando === participante.certificado_id}
                                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium disabled:opacity-50"
                                style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
                              >
                                {regenerando === participante.certificado_id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Regenerando...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Guardar
                                  </>
                                )}
                              </button>
                              <button
                                onClick={cancelarEdicionCertificado}
                                disabled={regenerando === participante.certificado_id}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                              >
                                <X className="w-4 h-4" />
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {participante.nombre_actual || participante.nombre_completo}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                DNI: {participante.numero_documento}
                              </p>
                            </div>
                            <button
                              onClick={() => iniciarEdicionCertificado(participante)}
                              className="flex items-center gap-2 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all text-sm font-medium"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Editar
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Activo
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              previewCertificate(participante.certificado_id, participante.codigo)
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Vista previa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              downloadCertificate(participante.certificado_id, participante.codigo)
                            }
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Descargar"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredParticipantes.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                No se encontraron certificados
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Este lote no tiene certificados registrados'}
              </p>
            </div>
          )}
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-gray-600">
                Mostrando <span className="font-medium text-gray-900">{startIndex + 1}</span> -{' '}
                <span className="font-medium text-gray-900">{Math.min(endIndex, filteredParticipantes.length)}</span> de{' '}
                <span className="font-medium text-gray-900">{filteredParticipantes.length}</span> participantes
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Primera
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                          currentPage === pageNum
                            ? 'text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                        style={
                          currentPage === pageNum
                            ? { backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }
                            : undefined
                        }
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Siguiente
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Última
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONSEJOS */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-2">Consejos:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Haz clic en <strong>Editar</strong> para modificar el nombre en el certificado</li>
                <li>Los cambios se guardan y el PDF se regenera automáticamente</li>
                <li>Los certificados personalizados muestran un icono de <strong>estrella</strong></li>
                <li>Usa <strong>vista previa</strong> para ver el certificado actualizado</li>
              </ul>
            </div>
          </div>
        </div>
        </main>
      </PageTransition>
    </div>
  );
}