'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenants';
import {
  Search,
  User,
  FileText,
  Calendar,
  Download,
  Eye,
  Loader2,
  Edit2,
  Save,
  X,
  RefreshCw,
  Package,
  Users,
  AlertCircle,
  Star,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from '@/components/ui/icon';
import Header from '@/components/shared/Header';
import PageTransition from '@/components/shared/PageTransition';
import { TENANT_CONFIG } from '../../shared/constants';
import { getHeaderConfig } from '../../shared/utils/config';

interface ParticipantesProps {
  tenantId: string;
  tenant: TenantConfig;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

interface Certificado {
  id: number;
  codigo_unico: string;
  nombre_actual: string;
  tiene_override: boolean;
  fecha_emision: string;
  lote_id: number;
  tipo_documento: string;
  curso: string;
}

interface Participante {
  id: number;
  dni: string;
  nombre: string;
  email: string;
  telefono: string;
  certificados: Certificado[];
}

// Datos estáticos de ejemplo
const PARTICIPANTES_ESTATICOS: Participante[] = [
  {
    id: 1,
    dni: '45678901',
    nombre: 'Juan Carlos Pérez García',
    email: 'juan.perez@email.com',
    telefono: '987654321',
    certificados: [
      {
        id: 101,
        codigo_unico: 'CERT-1-0001',
        nombre_actual: 'Juan Carlos Pérez García',
        tiene_override: false,
        fecha_emision: '2024-01-15T10:30:00',
        lote_id: 1,
        tipo_documento: 'Certificado',
        curso: 'Capacitación en Seguridad Industrial'
      },
      {
        id: 102,
        codigo_unico: 'CERT-2-0005',
        nombre_actual: 'Juan Carlos Pérez García',
        tiene_override: false,
        fecha_emision: '2024-01-10T14:20:00',
        lote_id: 2,
        tipo_documento: 'Certificado',
        curso: 'Curso de Liderazgo Empresarial'
      }
    ]
  },
  {
    id: 2,
    dni: '45678902',
    nombre: 'María Elena Rodríguez López',
    email: 'maria.rodriguez@email.com',
    telefono: '987654322',
    certificados: [
      {
        id: 201,
        codigo_unico: 'CERT-1-0002',
        nombre_actual: 'María Elena Rodríguez López',
        tiene_override: false,
        fecha_emision: '2024-01-15T10:30:00',
        lote_id: 1,
        tipo_documento: 'Certificado',
        curso: 'Capacitación en Seguridad Industrial'
      }
    ]
  }
];

export default function Participantes({ tenantId, tenant }: ParticipantesProps) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [buscando, setBuscando] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [noEncontrado, setNoEncontrado] = useState(false);

  // Estados para edición de certificados
  const [editandoCertificado, setEditandoCertificado] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [regenerando, setRegenerando] = useState<number | null>(null);

  // Estados para edición de participante
  const [editandoParticipante, setEditandoParticipante] = useState<number | null>(null);
  const [participanteEditado, setParticipanteEditado] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    dni: ''
  });
  const [guardandoParticipante, setGuardandoParticipante] = useState(false);

  // Estado para expandir/contraer certificados
  const [certificadosExpandidos, setCertificadosExpandidos] = useState<Record<number, boolean>>({});

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

  const buscarParticipante = async () => {
    if (!terminoBusqueda.trim()) {
      alert('Por favor ingresa un DNI o nombre para buscar');
      return;
    }

    setBuscando(true);
    setNoEncontrado(false);
    setParticipantes([]);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const resultados = PARTICIPANTES_ESTATICOS.filter(
      (p) =>
        p.dni.includes(terminoBusqueda) ||
        p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase())
    );

    if (resultados.length === 0) {
      setNoEncontrado(true);
    } else {
      setParticipantes(resultados);
    }

    setBuscando(false);
  };

  const iniciarEdicion = (certificado: Certificado) => {
    setEditandoCertificado(certificado.id);
    setNombreEditado(certificado.nombre_actual);
  };

  const cancelarEdicion = () => {
    setEditandoCertificado(null);
    setNombreEditado('');
  };

  const iniciarEdicionParticipante = (participante: Participante) => {
    setEditandoParticipante(participante.id);
    const nombreCompleto = participante.nombre.split(' ');
    const apellidos = nombreCompleto.slice(-2).join(' ');
    const nombres = nombreCompleto.slice(0, -2).join(' ') || nombreCompleto[0];

    setParticipanteEditado({
      nombres: nombres,
      apellidos: apellidos,
      email: participante.email || '',
      telefono: participante.telefono || '',
      dni: participante.dni
    });
  };

  const cancelarEdicionParticipante = () => {
    setEditandoParticipante(null);
    setParticipanteEditado({
      nombres: '',
      apellidos: '',
      email: '',
      telefono: '',
      dni: ''
    });
  };

  const guardarParticipante = async (participanteId: number) => {
    if (!participanteEditado.nombres.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    setGuardandoParticipante(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setParticipantes((prevParticipantes) =>
        prevParticipantes.map((p) =>
          p.id === participanteId
            ? {
                ...p,
                nombre: `${participanteEditado.nombres} ${participanteEditado.apellidos}`.trim(),
                email: participanteEditado.email,
                telefono: participanteEditado.telefono
              }
            : p
        )
      );

      setEditandoParticipante(null);
      alert('Participante actualizado correctamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar los datos');
    } finally {
      setGuardandoParticipante(false);
    }
  };

  const guardarYRegenerar = async (certificadoId: number) => {
    if (!nombreEditado.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    setRegenerando(certificadoId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setParticipantes((prevParticipantes) =>
        prevParticipantes.map((p) => ({
          ...p,
          certificados: p.certificados.map((cert) =>
            cert.id === certificadoId
              ? {
                  ...cert,
                  nombre_actual: nombreEditado,
                  tiene_override: true
                }
              : cert
          )
        }))
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarParticipante();
    }
  };

  const toggleCertificados = (participanteId: number) => {
    setCertificadosExpandidos((prev) => ({
      ...prev,
      [participanteId]: !prev[participanteId]
    }));
  };

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
            onClick={() => router.push(`/${tenantId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
            >
              <Users className="w-6 h-6" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">Buscar Participantes</h1>
              <p className="text-sm text-gray-600">
                Encuentra y gestiona la información de tus participantes
              </p>
            </div>
          </div>
        </div>

        {/* BUSCADOR */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
            >
              <Search className="w-5 h-5" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Buscar Participante</h3>
              <p className="text-sm text-gray-600">Ingresa DNI o nombre completo</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Buscar por DNI o nombre completo..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            />
            <button
              onClick={buscarParticipante}
              disabled={buscando}
              className="px-6 py-2.5 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
            >
              {buscando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Buscar
                </>
              )}
            </button>
          </div>
        </div>

        {/* NO ENCONTRADO */}
        {noEncontrado && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div
              className="w-16 h-16 rounded-lg mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
            >
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Participante no encontrado</h3>
            <p className="text-sm text-gray-700 mb-1">
              No se encontró ningún participante con:{' '}
              <strong className="text-gray-900">{terminoBusqueda}</strong>
            </p>
            <p className="text-xs text-gray-600 mt-2">Verifica que el DNI o nombre sean correctos</p>
          </div>
        )}

        {/* RESULTADOS */}
        {participantes.length > 0 && (
          <div className="space-y-6">
            {/* Badge de resultados */}
            <div
              className="rounded-lg p-4 border"
              style={{
                backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}08`,
                borderColor: `${TENANT_CONFIG.PRIMARY_COLOR}20`
              }}
            >
              <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
                Se {participantes.length === 1 ? 'encontró' : 'encontraron'}{' '}
                <span style={{ color: TENANT_CONFIG.PRIMARY_COLOR }}>{participantes.length}</span> participante
                {participantes.length !== 1 ? 's' : ''}
              </p>
            </div>

            {participantes.map((participante) => {
              const mostrarTodos = certificadosExpandidos[participante.id];
              const certificadosMostrar = mostrarTodos
                ? participante.certificados
                : participante.certificados.slice(0, 2);
              const tieneMas = participante.certificados.length > 2;

              return (
                <div
                  key={participante.id}
                  className="bg-white border border-gray-200 rounded-lg p-6"
                >
                  {/* INFO DEL PARTICIPANTE */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
                        >
                          <User className="w-5 h-5" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">Información del Participante</h3>
                          <p className="text-sm text-gray-600">DNI: {participante.dni}</p>
                        </div>
                      </div>
                      {editandoParticipante === participante.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => guardarParticipante(participante.id)}
                            disabled={guardandoParticipante}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-medium disabled:opacity-50"
                          >
                            {guardandoParticipante ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Guardando...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Guardar
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelarEdicionParticipante}
                            disabled={guardandoParticipante}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => iniciarEdicionParticipante(participante)}
                          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all text-sm font-medium"
                          style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar Datos
                        </button>
                      )}
                    </div>

                    {editandoParticipante === participante.id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombres *</label>
                            <input
                              type="text"
                              value={participanteEditado.nombres}
                              onChange={(e) =>
                                setParticipanteEditado({ ...participanteEditado, nombres: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                              placeholder="Nombres"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Apellidos *</label>
                            <input
                              type="text"
                              value={participanteEditado.apellidos}
                              onChange={(e) =>
                                setParticipanteEditado({ ...participanteEditado, apellidos: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                              placeholder="Apellidos"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              DNI (no editable)
                            </label>
                            <input
                              type="text"
                              value={participanteEditado.dni}
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                              type="email"
                              value={participanteEditado.email}
                              onChange={(e) =>
                                setParticipanteEditado({ ...participanteEditado, email: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                              placeholder="correo@ejemplo.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                            <input
                              type="tel"
                              value={participanteEditado.telefono}
                              onChange={(e) =>
                                setParticipanteEditado({ ...participanteEditado, telefono: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                              placeholder="999 999 999"
                            />
                          </div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-xs text-yellow-800 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong>Importante:</strong> Los cambios solo afectan los datos del participante. Los
                              certificados ya generados mantendrán el nombre original.
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Nombre Completo</p>
                          <p className="text-sm font-semibold text-gray-900">{participante.nombre}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                          <p className="text-xs text-gray-600 mb-1 font-medium">DNI</p>
                          <p className="text-sm font-semibold text-gray-900">{participante.dni}</p>
                        </div>
                        {participante.email && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Email</p>
                            <p className="text-sm font-semibold text-gray-900">{participante.email}</p>
                          </div>
                        )}
                        {participante.telefono && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <p className="text-xs text-gray-600 mb-1 font-medium">Teléfono</p>
                            <p className="text-sm font-semibold text-gray-900">{participante.telefono}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CERTIFICADOS */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}15` }}
                        >
                          <FileText className="w-5 h-5" style={{ color: TENANT_CONFIG.PRIMARY_COLOR }} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            Certificados ({participante.certificados.length})
                          </h3>
                          <p className="text-xs text-gray-600">Documentos emitidos</p>
                        </div>
                      </div>
                      {tieneMas && (
                        <button
                          onClick={() => toggleCertificados(participante.id)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                          style={{
                            color: TENANT_CONFIG.PRIMARY_COLOR,
                            backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}10`
                          }}
                        >
                          {mostrarTodos ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Mostrar menos
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Ver todos ({participante.certificados.length})
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {participante.certificados.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Este participante aún no tiene certificados generados
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {certificadosMostrar.map((cert) => (
                          <div
                            key={cert.id}
                            className="border rounded-lg p-4"
                            style={{
                              backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}05`,
                              borderColor: editandoCertificado === cert.id ? TENANT_CONFIG.PRIMARY_COLOR : `${TENANT_CONFIG.PRIMARY_COLOR}15`
                            }}
                          >
                            {/* Header del certificado */}
                            <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-medium text-gray-600">Código:</span>
                                  <span
                                    className="text-xs font-mono font-medium px-2 py-1 rounded border"
                                    style={{
                                      color: TENANT_CONFIG.PRIMARY_COLOR,
                                      backgroundColor: `${TENANT_CONFIG.PRIMARY_COLOR}10`,
                                      borderColor: `${TENANT_CONFIG.PRIMARY_COLOR}20`
                                    }}
                                  >
                                    {cert.codigo_unico}
                                  </span>
                                  {cert.tiene_override && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded border border-purple-200 flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-purple-600" />
                                      Personalizado
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div className="bg-white rounded p-2 border border-gray-200">
                                    <p className="text-xs text-gray-600 mb-0.5">Tipo</p>
                                    <p className="text-xs font-medium text-gray-900">
                                      {cert.tipo_documento || 'N/A'}
                                    </p>
                                  </div>
                                  <div className="bg-white rounded p-2 border border-gray-200">
                                    <p className="text-xs text-gray-600 mb-0.5">Curso</p>
                                    <p className="text-xs font-medium text-gray-900">{cert.curso || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-3">
                                <button
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-medium"
                                  onClick={() => alert('Vista previa del certificado')}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Ver
                                </button>
                                <button
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-xs font-medium"
                                  onClick={() => alert('Descargando certificado')}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Descargar
                                </button>
                              </div>
                            </div>

                            {/* Edición de nombre */}
                            <div className="pt-2">
                              {editandoCertificado === cert.id ? (
                                <div className="space-y-2">
                                  <label className="block text-xs font-medium text-gray-700">
                                    Editar nombre en el certificado:
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={nombreEditado}
                                      onChange={(e) => setNombreEditado(e.target.value)}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                                      placeholder="Nombre completo..."
                                      disabled={regenerando === cert.id}
                                    />
                                    <button
                                      onClick={() => guardarYRegenerar(cert.id)}
                                      disabled={regenerando === cert.id}
                                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium disabled:opacity-50 text-xs"
                                    >
                                      {regenerando === cert.id ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Regenerando...
                                        </>
                                      ) : (
                                        <>
                                          <RefreshCw className="w-4 h-4" />
                                          Guardar
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={cancelarEdicion}
                                      disabled={regenerando === cert.id}
                                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-xs font-medium"
                                    >
                                      <X className="w-4 h-4" />
                                      Cancelar
                                    </button>
                                  </div>
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                    <p className="text-xs text-blue-800 flex items-start gap-2">
                                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                      <span>
                                        Al guardar se regenerará automáticamente el PDF con el nuevo nombre
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                                  <div>
                                    <p className="text-xs text-gray-600 mb-0.5">
                                      Nombre en el certificado:
                                    </p>
                                    <p className="text-sm font-medium text-gray-900">{cert.nombre_actual}</p>
                                  </div>
                                  <button
                                    onClick={() => iniciarEdicion(cert)}
                                    className="flex items-center gap-2 px-3 py-1.5 text-white rounded-lg transition-all text-xs font-medium"
                                    style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    Editar
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-3 text-xs text-gray-600">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>
                                    {new Date(cert.fecha_emision).toLocaleDateString('es-PE', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                <div className="h-3 w-px bg-gray-300"></div>
                                <div className="flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5" />
                                  <span>Lote #{cert.lote_id}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </main>
      </PageTransition>
    </div>
  );
}