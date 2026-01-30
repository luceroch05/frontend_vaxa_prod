'use client';

import { useState } from 'react';
import { Upload, X, Lock, Unlock, Plus, Trash2, FileImage } from '@/components/ui/icon';
import type { Empresa } from '../../shared/types';

interface TabLogosProps {
  empresa: Empresa;
  tenantId: string;
}

export default function TabLogos({ empresa, tenantId }: TabLogosProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showAddFirma, setShowAddFirma] = useState(false);
  const [newFirma, setNewFirma] = useState({
    nombre: '',
    cargo: '',
    file: null as File | null,
    preview: null as string | null,
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFirmaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewFirma({ ...newFirma, file, preview: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddFirma = () => {
    // Aquí iría la lógica para agregar la firma
    console.log('Nueva firma:', newFirma);
    setShowAddFirma(false);
    setNewFirma({ nombre: '', cargo: '', file: null, preview: null });
  };

  return (
    <div className="space-y-8">
      {/* Logo de la Empresa */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Logo de la Empresa</h3>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {empresa.logoUrl || logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview || empresa.logoUrl}
                  alt="Logo"
                  className="w-32 h-32 rounded-xl object-contain border-2 border-gray-200 bg-white"
                />
                {empresa.logoBloqueado && (
                  <div className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg">
                    <Lock className="w-4 h-4" />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                <FileImage className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1">
            {!empresa.logoBloqueado ? (
              <div>
                <label className="block">
                  <div className="px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Upload className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Subir Logo</p>
                        <p className="text-sm text-gray-500">PNG, JPG hasta 5MB</p>
                      </div>
                    </div>
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>

                <div className="mt-4 flex items-center gap-3">
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-sm">
                    Guardar Logo
                  </button>
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Bloquear Logo
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-red-600" />
                  <p className="font-semibold text-red-900">Logo Bloqueado</p>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  El logo está bloqueado y no puede ser modificado. Contacta al administrador para desbloquearlo.
                </p>
                {empresa.logoSubidoPor && (
                  <p className="text-xs text-red-600">
                    Subido por: {empresa.logoSubidoPor} el {empresa.logoFechaSubida}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Firmas Digitales */}
      <div className="pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Firmas Digitales</h3>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona las firmas que aparecerán en los certificados
            </p>
          </div>
          <button
            onClick={() => setShowAddFirma(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Agregar Firma
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {empresa.firmas.map((firma) => (
            <div key={firma.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={firma.url}
                    alt={firma.nombre}
                    className="w-24 h-16 object-contain border border-gray-200 rounded-lg bg-white"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{firma.nombre}</h4>
                      <p className="text-sm text-gray-600">{firma.cargo}</p>
                    </div>
                    {firma.bloqueado && (
                      <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Lock className="w-3 h-3" />
                      </div>
                    )}
                  </div>

                  {firma.subidoPor && (
                    <p className="text-xs text-gray-500 mb-3">
                      Subido por {firma.subidoPor} el {firma.fechaSubida}
                    </p>
                  )}

                  {!firma.bloqueado && (
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1 text-xs font-semibold text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Bloquear
                      </button>
                      <button className="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                  )}

                  {firma.bloqueado && (
                    <div className="bg-red-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Firma bloqueada
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {empresa.firmas.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FileImage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">No hay firmas registradas</p>
              <p className="text-gray-500 mb-4">Agrega la primera firma digital</p>
              <button
                onClick={() => setShowAddFirma(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
              >
                <Plus className="w-5 h-5" />
                Agregar Primera Firma
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Agregar Firma */}
      {showAddFirma && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Agregar Nueva Firma</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={newFirma.nombre}
                  onChange={(e) => setNewFirma({ ...newFirma, nombre: e.target.value })}
                  placeholder="Dr. Carlos Ruiz Méndez"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo</label>
                <input
                  type="text"
                  value={newFirma.cargo}
                  onChange={(e) => setNewFirma({ ...newFirma, cargo: e.target.value })}
                  placeholder="Director General"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Imagen de la Firma
                </label>
                {newFirma.preview ? (
                  <div className="relative">
                    <img
                      src={newFirma.preview}
                      alt="Preview"
                      className="w-full h-32 object-contain border-2 border-gray-200 rounded-lg bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setNewFirma({ ...newFirma, file: null, preview: null })}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <div className="px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer">
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="font-semibold text-gray-900">Subir Firma</p>
                        <p className="text-sm text-gray-500">PNG, JPG hasta 2MB</p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFirmaFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddFirma(false);
                  setNewFirma({ nombre: '', cargo: '', file: null, preview: null });
                }}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddFirma}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
              >
                Agregar Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
