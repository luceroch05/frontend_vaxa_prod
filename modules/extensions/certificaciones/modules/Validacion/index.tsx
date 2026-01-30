'use client';

import { useState, useRef, useEffect } from 'react';
import { TenantConfig } from '@/lib/tenants';
import Image from 'next/image';
import {
  Search,
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  User,
  FileText,
  Download,
  Shield,
  Clock,
  Building2,
  Verified,
  Sparkles,
} from '@/components/ui/icon';
import {
  getCertificadoByCodigo,
  type Certificado,
} from '../../shared/data/mockData';
import PageTransition from '@/components/shared/PageTransition';

const VAXA_CONFIG = {
  NAME: 'VAXA',
  LOGO: '/videologo.png',
  PRIMARY_COLOR: '#ea6733',
  SECONDARY_COLOR: '#b63b19',
  DESCRIPTION: 'Sistema de Gestión de Certificaciones',
};

interface ValidacionProps {
  tenantId: string;
  tenant: TenantConfig;
}

export default function Validacion({ tenantId, tenant }: ValidacionProps) {
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [certificado, setCertificado] = useState<Certificado | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [noEncontrado, setNoEncontrado] = useState(false);

  const resultadoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (certificado || noEncontrado) {
      setTimeout(() => {
        resultadoRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [certificado, noEncontrado]);

  const handleBuscar = async () => {
    if (!codigoBusqueda.trim()) return;

    setBuscando(true);
    setNoEncontrado(false);
    setCertificado(null);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const cert = getCertificadoByCodigo(codigoBusqueda);

    if (cert) {
      setCertificado(cert);
    } else {
      setNoEncontrado(true);
    }

    setBuscando(false);
  };

  const handleDescargar = () => {
    if (!certificado) return;
    alert('Función de descarga de certificado en desarrollo');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-white relative overflow-hidden">
      {/* ========== FONDO ANIMADO PROFESIONAL ========== */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-50"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-blue-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgb(0 0 0 / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(0 0 0 / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px'
          }}
        />
        
        {/* Dot texture */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgb(0 0 0 / 0.15) 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}
        />
        
        {/* Radial gradient overlays */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-radial from-orange-100/30 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-radial from-purple-100/20 via-transparent to-transparent"></div>
        
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/50 to-transparent"></div>
        
        {/* Floating shapes */}
        <div className="absolute top-20 right-10 w-72 h-72 border border-orange-200/30 rounded-full animate-spin-very-slow"></div>
        <div className="absolute bottom-20 left-10 w-56 h-56 border border-purple-200/30 rounded-full animate-spin-reverse-slow"></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-orange-400/40 rounded-full animate-pulse-slow"></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-purple-400/40 rounded-full animate-pulse-slow animation-delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-blue-400/40 rounded-full animate-pulse-slow animation-delay-2000"></div>
      </div>
      {/* ========== FIN FONDO ========== */}

      {/* Header con glassmorphism */}
      <div className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {VAXA_CONFIG.LOGO && (
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-400/20 blur-xl rounded-full"></div>
                  <Image
                    src={VAXA_CONFIG.LOGO}
                    alt={VAXA_CONFIG.NAME}
                    width={40}
                    height={40}
                    className="rounded-lg relative z-10"
                  />
                </div>
              )}
              <div>
                <h1 className="text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {VAXA_CONFIG.NAME}
                </h1>
                <p className="text-xs text-slate-500">{VAXA_CONFIG.DESCRIPTION}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/50">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-slate-600 font-medium">Validación Pública</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="relative max-w-5xl mx-auto px-6 py-16">
        {/* Hero Section - Buscador */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="text-center mb-8">
            {/* Icon con glow effect */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 mb-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-purple-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <Shield className="w-8 h-8 text-slate-700 relative z-10" />
              <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-orange-400 animate-pulse" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Validar Certificado
            </h2>
            <p className="text-slate-600 text-base">
              Verifica la autenticidad de tu certificado en tiempo real
            </p>
          </div>

          {/* Search Box */}
          <div className="space-y-4">
            <div className="group relative">
              {/* Glow effect on focus */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-purple-400 rounded-xl opacity-0 group-focus-within:opacity-20 blur transition duration-500"></div>
              
              <div className="relative flex gap-2 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-xl p-2 shadow-sm group-focus-within:border-slate-300 transition-all">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  <input
                    type="text"
                    value={codigoBusqueda}
                    onChange={(e) => setCodigoBusqueda(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                    placeholder="Ej: CERT-2024-001-ALPHA"
                    className="w-full pl-11 pr-4 py-3 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none disabled:opacity-50"
                    disabled={buscando}
                  />
                </div>
                <button
                  onClick={handleBuscar}
                  disabled={buscando || !codigoBusqueda.trim()}
                  className="relative px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-slate-900/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                  <span className="relative z-10 flex items-center gap-2">
                    {buscando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Validando...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        <span>Validar</span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>

            {/* Códigos de ejemplo */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Prueba con:</span>
              <button
                onClick={() => setCodigoBusqueda('CERT-2024-001-ALPHA')}
                className="px-3 py-1.5 text-xs font-mono text-slate-600 bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-lg hover:bg-white hover:border-slate-300 hover:text-slate-900 transition-all"
              >
                CERT-2024-001-ALPHA
              </button>
              <button
                onClick={() => setCodigoBusqueda('CERT-2024-002-ALPHA')}
                className="px-3 py-1.5 text-xs font-mono text-slate-600 bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-lg hover:bg-white hover:border-slate-300 hover:text-slate-900 transition-all"
              >
                CERT-2024-002-ALPHA
              </button>
            </div>
          </div>
        </div>

        {/* Resultado: No encontrado */}
        {noEncontrado && (
          <div ref={resultadoRef} className="max-w-2xl mx-auto animate-slide-up">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/50 p-6 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/10 rounded-full blur-3xl"></div>
              <div className="relative flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-red-900 mb-1">
                    Certificado no encontrado
                  </h3>
                  <p className="text-sm text-red-700 leading-relaxed">
                    El código <span className="font-mono font-semibold px-2 py-0.5 bg-red-200/50 rounded">"{codigoBusqueda}"</span> no corresponde a ningún certificado válido en nuestro sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultado: Certificado válido */}
        {certificado && (
          <div ref={resultadoRef} className="max-w-3xl mx-auto space-y-6 animate-slide-up">
            {/* Success Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100/50 border border-emerald-200/50 p-6 backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-semibold text-emerald-900">
                    ¡Certificado Válido y Verificado!
                  </h3>
                </div>
                <p className="text-sm text-emerald-700 mb-4 leading-relaxed">
                  Este certificado es auténtico y ha sido verificado exitosamente en el sistema {VAXA_CONFIG.NAME}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-xl shadow-sm">
                  <Shield className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-mono font-semibold text-slate-900">
                    {certificado.codigo}
                  </span>
                </div>
              </div>
            </div>

            {/* Empresa Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl border border-slate-200/50 p-6 hover:bg-white/80 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/20 to-purple-200/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <h4 className="text-sm font-semibold text-slate-900">Institución Emisora</h4>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {certificado.empresa.logo && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-orange-400/20 blur-lg rounded-xl"></div>
                        <Image
                          src={certificado.empresa.logo}
                          alt={certificado.empresa.nombre}
                          width={56}
                          height={56}
                          className="rounded-xl border border-slate-200 relative z-10"
                        />
                      </div>
                    )}
                    <div>
                      <h5 className="text-base font-semibold text-slate-900 mb-0.5">
                        {certificado.empresa.nombre}
                      </h5>
                      <p className="text-sm text-slate-500">{certificado.empresa.tipo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200/50 rounded-xl">
                    <Verified className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-emerald-700">Verificado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl border border-slate-200/50 p-6 hover:bg-white/80 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                <h4 className="text-base font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-slate-600" />
                  Detalles del Certificado
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Participante */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                      <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Participante</h5>
                    </div>
                    <div className="pl-10">
                      <p className="text-sm font-semibold text-slate-900 mb-1">
                        {certificado.participante.nombre} {certificado.participante.apellido}
                      </p>
                      <p className="text-xs text-slate-500">DNI: {certificado.participante.dni}</p>
                      {certificado.participante.email && (
                        <p className="text-xs text-slate-500">{certificado.participante.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Curso */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Award className="w-4 h-4 text-slate-600" />
                      </div>
                      <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Programa</h5>
                    </div>
                    <div className="pl-10">
                      <p className="text-sm font-semibold text-slate-900 mb-1">
                        {certificado.curso.nombre}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {certificado.curso.duracion}
                      </p>
                      {certificado.instructor && (
                        <p className="text-xs text-slate-500">Instructor: {certificado.instructor}</p>
                      )}
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-slate-600" />
                      </div>
                      <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</h5>
                    </div>
                    <div className="pl-10 space-y-1">
                      <p className="text-xs text-slate-500">
                        Inicio: <span className="text-slate-900 font-medium">
                          {new Date(certificado.curso.fechaInicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Fin: <span className="text-slate-900 font-medium">
                          {new Date(certificado.curso.fechaFin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Emisión: <span className="text-slate-900 font-medium">
                          {new Date(certificado.fechaEmision).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Calificación */}
                  {certificado.calificacion && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-slate-600" />
                        </div>
                        <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calificación</h5>
                      </div>
                      <div className="pl-10">
                        <p className="text-lg font-bold text-slate-900">
                          {certificado.calificacion}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón descarga */}
                <div className="mt-8 pt-6 border-t border-slate-200/50">
                  <button
                    onClick={handleDescargar}
                    className="group/download relative w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white text-sm font-semibold rounded-xl overflow-hidden hover:shadow-xl hover:shadow-slate-900/20 transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-500 opacity-0 group-hover/download:opacity-100 transition-opacity duration-500"></div>
                    <Download className="w-5 h-5 relative z-10 group-hover/download:animate-bounce" />
                    <span className="relative z-10">Descargar Certificado PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative border-t border-slate-200/50 bg-white/70 backdrop-blur-xl py-8 mt-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-500">
            Sistema de validación de certificados · Powered by{' '}
            <span className="font-semibold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              {VAXA_CONFIG.NAME}
            </span>
          </p>
        </div>
      </div>

      {/* Estilos */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes spin-very-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 15s infinite ease-in-out;
        }

        .animate-spin-very-slow {
          animation: spin-very-slow 60s linear infinite;
        }

        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 50s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
      </div>
    </PageTransition>
  );
}