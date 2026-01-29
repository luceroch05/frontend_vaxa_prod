'use client';

import { useState } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Type,
  PenTool,
  Eye,
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle,
  ImageIcon,
  X
} from '@/components/ui/icon';
import { TENANT_CONFIG } from '../../shared/constants';

type PasoType = 1 | 2 | 3 | 4 | 5 | 6;

export default function GeneradorCertificados() {
  const [pasoActual, setPasoActual] = useState<PasoType>(1);

  // Estados de progreso
  const [plantillaDescargada, setPlantillaDescargada] = useState(false);
  const [plantillaSubida, setPlantillaSubida] = useState(false);
  const [datosSubidos, setDatosSubidos] = useState(false);
  const [textoConfigurado, setTextoConfigurado] = useState(false);
  const [logosSubidos, setLogosSubidos] = useState(false);
  const [firmasSeleccionadas, setFirmasSeleccionadas] = useState(false);

  // Datos del formulario
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [nombreCurso, setNombreCurso] = useState('');
  const [textoEstatico, setTextoEstatico] = useState('');
  const [generando, setGenerando] = useState(false);

  // Estado para logos institucionales
  const [logos, setLogos] = useState<Array<{
    id: number;
    nombre: string;
    archivo: File | null;
    preview: string | null;
  }>>([
    { id: 1, nombre: '', archivo: null, preview: null },
    { id: 2, nombre: '', archivo: null, preview: null },
    { id: 3, nombre: '', archivo: null, preview: null }
  ]);

  // Estado para firmas
  const [firmas, setFirmas] = useState<Array<{
    id: number;
    nombre: string;
    cargo: string;
    archivo: File | null;
    preview: string | null;
  }>>([
    { id: 1, nombre: '', cargo: '', archivo: null, preview: null },
    { id: 2, nombre: '', cargo: '', archivo: null, preview: null },
    { id: 3, nombre: '', cargo: '', archivo: null, preview: null }
  ]);

  const puedeAvanzarA = (paso: PasoType): boolean => {
    switch (paso) {
      case 1: return true;
      case 2: return plantillaDescargada && tipoDocumento !== '' && nombreCurso !== '';
      case 3: return plantillaSubida;
      case 4: return datosSubidos;
      case 5: return textoConfigurado;
      case 6: return firmasSeleccionadas;
      default: return false;
    }
  };

  const handleGenerarCertificados = () => {
    setGenerando(true);
    setTimeout(() => {
      setGenerando(false);
      alert('¡Certificados generados exitosamente! 🎉');
    }, 2000);
  };

  // Funciones para manejar logos
  const handleSubirLogo = (logoId: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const nuevosLogos = logos.map(l =>
        l.id === logoId
          ? { ...l, archivo: file, preview: reader.result as string }
          : l
      );
      setLogos(nuevosLogos);
      if (nuevosLogos.some(l => l.archivo !== null)) {
        setLogosSubidos(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleActualizarLogo = (logoId: number, nombre: string) => {
    setLogos(prev => prev.map(l =>
      l.id === logoId ? { ...l, nombre } : l
    ));
  };

  const handleEliminarLogo = (logoId: number) => {
    const nuevosLogos = logos.map(l =>
      l.id === logoId
        ? { ...l, archivo: null, preview: null, nombre: '' }
        : l
    );
    setLogos(nuevosLogos);
    if (!nuevosLogos.some(l => l.archivo !== null)) {
      setLogosSubidos(false);
    }
  };

  // Funciones para manejar firmas
  const handleSubirFirma = (firmaId: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFirmas(prev => prev.map(f =>
        f.id === firmaId
          ? { ...f, archivo: file, preview: reader.result as string }
          : f
      ));
    };
    reader.readAsDataURL(file);
  };

  const handleActualizarFirma = (firmaId: number, campo: 'nombre' | 'cargo', valor: string) => {
    setFirmas(prev => prev.map(f =>
      f.id === firmaId ? { ...f, [campo]: valor } : f
    ));
  };

  const handleEliminarFirma = (firmaId: number) => {
    setFirmas(prev => prev.map(f =>
      f.id === firmaId
        ? { ...f, archivo: null, preview: null, nombre: '', cargo: '' }
        : f
    ));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            Crear Nuevo Lote de Certificados
          </h3>
          <p className="text-gray-600 text-sm">
            Proceso guiado para generar certificados profesionales
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium w-fit">
          Paso {pasoActual} de 6
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <StepIndicator
            numero={1}
            titulo="Configurar"
            icono={<Download className="w-4 h-4" />}
            activo={pasoActual === 1}
            completado={plantillaDescargada}
            onClick={() => setPasoActual(1)}
            habilitado={true}
          />
          <StepIndicator
            numero={2}
            titulo="Plantilla"
            icono={<ImageIcon className="w-4 h-4" />}
            activo={pasoActual === 2}
            completado={plantillaSubida}
            onClick={() => puedeAvanzarA(2) && setPasoActual(2)}
            habilitado={puedeAvanzarA(2)}
          />
          <StepIndicator
            numero={3}
            titulo="Datos"
            icono={<FileSpreadsheet className="w-4 h-4" />}
            activo={pasoActual === 3}
            completado={datosSubidos}
            onClick={() => puedeAvanzarA(3) && setPasoActual(3)}
            habilitado={puedeAvanzarA(3)}
          />
          <StepIndicator
            numero={4}
            titulo="Texto"
            icono={<Type className="w-4 h-4" />}
            activo={pasoActual === 4}
            completado={textoConfigurado}
            onClick={() => puedeAvanzarA(4) && setPasoActual(4)}
            habilitado={puedeAvanzarA(4)}
          />
          <StepIndicator
            numero={5}
            titulo="Firmas"
            icono={<PenTool className="w-4 h-4" />}
            activo={pasoActual === 5}
            completado={firmasSeleccionadas}
            onClick={() => puedeAvanzarA(5) && setPasoActual(5)}
            habilitado={puedeAvanzarA(5)}
          />
          <StepIndicator
            numero={6}
            titulo="Generar"
            icono={<Eye className="w-4 h-4" />}
            activo={pasoActual === 6}
            completado={false}
            onClick={() => puedeAvanzarA(6) && setPasoActual(6)}
            habilitado={puedeAvanzarA(6)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {/* PASO 1: Configuración */}
        {pasoActual === 1 && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">
                  Paso 1: Configuración inicial
                </p>
                <p className="text-xs text-gray-600">
                  Define el tipo de documento y el nombre del curso. Estos datos se aplicarán a todos los certificados.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Configuración del Lote</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Certificado">Certificado</option>
                    <option value="Certificado de Participación">Certificado de Participación</option>
                    <option value="Certificado de Asistencia">Certificado de Asistencia</option>
                    <option value="Constancia">Constancia</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Curso <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombreCurso}
                    onChange={(e) => setNombreCurso(e.target.value)}
                    placeholder="Ej: Marketing Digital Avanzado"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setPlantillaDescargada(true);
                    alert('Plantilla Excel descargada ✓');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium"
                  style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
                >
                  <Download className="w-4 h-4" />
                  Descargar Plantilla Excel
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (!tipoDocumento || !nombreCurso) {
                    alert('Por favor complete todos los campos obligatorios');
                    return;
                  }
                  setPasoActual(2);
                }}
                disabled={!tipoDocumento || !nombreCurso || !plantillaDescargada}
                className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ 
                  backgroundColor: (!tipoDocumento || !nombreCurso || !plantillaDescargada) ? '#9ca3af' : TENANT_CONFIG.PRIMARY_COLOR 
                }}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Subir Plantilla y Logos */}
        {pasoActual === 2 && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">
                  Paso 2: Plantilla de diseño y logos
                </p>
                <p className="text-xs text-gray-600">
                  Sube la imagen de fondo que se usará para todos los certificados (PNG o JPG recomendado). 
                  Además, puedes agregar hasta 3 logos institucionales (opcional).
                </p>
              </div>
            </div>

            {/* Plantilla */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Subir Plantilla de Certificado</h4>
              <p className="text-xs text-gray-600 mb-4">
                Medidas recomendadas: 1900 x 1345 píxeles (A4 horizontal)
              </p>
              <button
                onClick={() => {
                  setPlantillaSubida(true);
                  alert('Plantilla subida exitosamente ✓');
                }}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium"
                style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
              >
                Seleccionar Plantilla
              </button>
              {plantillaSubida && (
                <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Plantilla cargada correctamente</span>
                </div>
              )}
            </div>

            {/* Logos */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Logos Institucionales (Opcional)</h4>
              <p className="text-xs text-gray-600 mb-4">
                Puedes subir hasta 3 logos. Recomendado formato PNG con fondo transparente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {logos.map((logo) => (
                  <div key={logo.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-700 mb-3">Logo {logo.id}</p>

                    <div className="aspect-square bg-white rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-gray-200">
                      {logo.preview ? (
                        <img 
                          src={logo.preview} 
                          alt={`Logo ${logo.id}`} 
                          className="max-w-full max-h-full object-contain p-3" 
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      )}
                    </div>

                    <div className="flex gap-2 mb-3">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSubirLogo(logo.id, file);
                          }}
                        />
                        <span
                          className="flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg cursor-pointer hover:opacity-90 transition-all text-xs font-medium w-full"
                          style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {logo.archivo ? 'Cambiar' : 'Subir'}
                        </span>
                      </label>
                      {logo.archivo && (
                        <button
                          onClick={() => handleEliminarLogo(logo.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>


                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPasoActual(1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Atrás
              </button>
              <button
                onClick={() => setPasoActual(3)}
                disabled={!plantillaSubida}
                className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ backgroundColor: !plantillaSubida ? '#9ca3af' : TENANT_CONFIG.PRIMARY_COLOR }}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: Subir Datos */}
        {pasoActual === 3 && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">
                  Paso 3: Datos de participantes
                </p>
                <p className="text-xs text-gray-600">
                  Sube el archivo Excel con los datos de los participantes (usa la plantilla descargada en el Paso 1).
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-gray-900 mb-1">Subir Archivo Excel</h4>
              <p className="text-xs text-gray-600 mb-4">
                Formato .xlsx o .xls con los datos de los participantes
              </p>
              <button
                onClick={() => {
                  setDatosSubidos(true);
                  alert('Datos cargados: 25 participantes ✓');
                }}
                className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium"
                style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
              >
                Seleccionar Excel
              </button>
              {datosSubidos && (
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">25 participantes cargados</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Juan Pérez, María García, Carlos López...
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPasoActual(2)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Atrás
              </button>
              <button
                onClick={() => setPasoActual(4)}
                disabled={!datosSubidos}
                className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ backgroundColor: !datosSubidos ? '#9ca3af' : TENANT_CONFIG.PRIMARY_COLOR }}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: Texto Estático */}
        {pasoActual === 4 && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">
                  Paso 4: Texto personalizado (opcional)
                </p>
                <p className="text-xs text-gray-600">
                  Agrega un texto que aparecerá en todos los certificados.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Texto Estático (Opcional)
              </label>
              <textarea
                value={textoEstatico}
                onChange={(e) => setTextoEstatico(e.target.value)}
                rows={4}
                placeholder="Por haber participado exitosamente en el curso..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Este texto aparecerá en todos los certificados generados
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPasoActual(3)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Atrás
              </button>
              <button
                onClick={() => {
                  setTextoConfigurado(true);
                  setPasoActual(5);
                }}
                className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 5: Firmas */}
        {pasoActual === 5 && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">
                  Paso 5: Firmas
                </p>
                <p className="text-xs text-gray-600">
                  Sube las firmas de las personas que firmarán los certificados (formato PNG con fondo transparente recomendado).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {firmas.map((firma) => (
                <div key={firma.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-700 mb-3">Firma {firma.id}</p>

                  <div className="aspect-video bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-gray-200">
                    {firma.preview ? (
                      <img src={firma.preview} alt={`Firma ${firma.id}`} className="max-w-full max-h-full object-contain p-2" />
                    ) : (
                      <PenTool className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  <div className="flex gap-2 mb-3">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleSubirFirma(firma.id, file);
                        }}
                      />
                      <span
                        className="flex items-center justify-center gap-2 px-3 py-2 text-white rounded-lg cursor-pointer hover:opacity-90 transition-all text-xs font-medium w-full"
                        style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {firma.archivo ? 'Cambiar' : 'Subir'}
                      </span>
                    </label>
                    {firma.archivo && (
                      <button
                        onClick={() => handleEliminarFirma(firma.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={firma.nombre}
                      onChange={(e) => handleActualizarFirma(firma.id, 'nombre', e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={firma.cargo}
                      onChange={(e) => handleActualizarFirma(firma.id, 'cargo', e.target.value)}
                      placeholder="Cargo/Título"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setPasoActual(4)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Atrás
              </button>
              <button
                onClick={() => {
                  const tieneAlMenosUnaFirma = firmas.some(f => f.archivo !== null);
                  if (!tieneAlMenosUnaFirma) {
                    alert('Debes subir al menos una firma para continuar');
                    return;
                  }
                  setFirmasSeleccionadas(true);
                  setPasoActual(6);
                }}
                className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
              >
                Ver Resumen
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 6: Resumen y Generar */}
        {pasoActual === 6 && (
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-900 mb-0.5">
                  ¡Todo listo para generar!
                </p>
                <p className="text-xs text-emerald-700">
                  Revisa el resumen y genera los certificados cuando estés listo.
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Resumen del Lote</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Tipo de documento</p>
                  <p className="text-sm font-medium text-gray-900">{tipoDocumento || 'No configurado'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Nombre del curso</p>
                  <p className="text-sm font-medium text-gray-900">{nombreCurso || 'No configurado'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Total de certificados</p>
                  <p className="text-2xl font-bold text-gray-900">25</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Firmas cargadas</p>
                  <p className="text-sm font-medium text-gray-900">
                    {firmas.filter(f => f.archivo !== null).length} {firmas.filter(f => f.archivo !== null).length === 1 ? 'firma' : 'firmas'}
                  </p>
                </div>
              </div>


            </div>

            <div className="text-center py-8">
              <button
                onClick={handleGenerarCertificados}
                disabled={generando}
                className="px-12 py-3 text-white rounded-lg hover:opacity-90 text-sm font-medium transition-all inline-flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: TENANT_CONFIG.PRIMARY_COLOR }}
              >
                {generando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generando certificados...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Generar 25 Certificados
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-3">
                {generando
                  ? 'Por favor espera, esto puede tomar unos minutos...'
                  : 'Se generarán PDFs individuales con QR único para cada participante'
                }
              </p>
            </div>

            <div className="flex justify-start">
              <button
                onClick={() => setPasoActual(5)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                Atrás
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({
  numero,
  titulo,
  icono,
  activo,
  completado,
  onClick,
  habilitado,
}: {
  numero: number;
  titulo: string;
  icono: React.ReactNode;
  activo: boolean;
  completado: boolean;
  onClick: () => void;
  habilitado: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!habilitado}
      className={`relative rounded-xl p-4 transition-all ${
        activo
          ? 'shadow-lg'
          : completado
            ? 'bg-emerald-50 border border-emerald-200/60'
            : habilitado
              ? 'bg-gray-50 border border-gray-200/60 hover:bg-gray-100 hover:border-gray-300/60'
              : 'bg-gray-50 border border-gray-100 opacity-40 cursor-not-allowed'
      }`}
      style={
        activo
          ? {
              backgroundColor: TENANT_CONFIG.PRIMARY_COLOR,
              border: 'none'
            }
          : undefined
      }
    >
      <div className="flex flex-col items-center gap-2.5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            completado
              ? 'bg-emerald-100 text-emerald-600'
              : activo
                ? 'bg-white/20 text-white'
                : habilitado
                  ? 'bg-white text-gray-600'
                  : 'bg-gray-100 text-gray-400'
          }`}
        >
          {completado ? <CheckCircle2 className="w-5 h-5" /> : icono}
        </div>
        <p
          className={`text-xs font-medium ${
            activo ? 'text-white' : completado ? 'text-emerald-700' : habilitado ? 'text-gray-700' : 'text-gray-400'
          }`}
        >
          {titulo}
        </p>
      </div>
    </button>
  );
}