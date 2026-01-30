'use client';

import { useState } from 'react';
import { Plus, User, Mail, Calendar, DollarSign, Trash2, Edit } from '@/components/ui/icon';
import type { Empresa } from '../../shared/types';
import { USUARIOS_EMPRESAS_MOCK } from '../../shared/data/mockData';
import { PLANES } from '../../shared/constants';

interface TabUsuariosProps {
  empresa: Empresa;
  tenantId: string;
}

export default function TabUsuarios({ empresa, tenantId }: TabUsuariosProps) {
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rol: 'operador' as 'admin' | 'operador' | 'usuario',
  });

  const usuariosEmpresa = USUARIOS_EMPRESAS_MOCK.filter((u) => u.empresaId === empresa.id);
  const plan = Object.values(PLANES).find((p) => p.id === empresa.planId);
  const costoMensualPorUsuario = plan?.precioPorUsuario || 0;

  const handleAddUser = () => {
    // Aquí iría la lógica para agregar el usuario
    console.log('Nuevo usuario:', newUser);
    setShowModal(false);
    setNewUser({ nombre: '', apellido: '', email: '', rol: 'operador' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Usuarios de la Empresa</h3>
          <p className="text-sm text-gray-600 mt-1">
            Cada usuario cuesta{' '}
            <span className="font-semibold text-emerald-600">${costoMensualPorUsuario}/mes</span>
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Agregar Usuario
        </button>
      </div>

      {/* Resumen de Costos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">Total Usuarios</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{usuariosEmpresa.length}</p>
        </div>

        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-900">Costo por Usuario</p>
          </div>
          <p className="text-2xl font-bold text-emerald-900">${costoMensualPorUsuario}</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <p className="text-sm font-semibold text-purple-900">Costo Total Mensual</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            ${costoMensualPorUsuario * usuariosEmpresa.length}
          </p>
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Usuario</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Rol</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Último Acceso
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Costo Mensual
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usuariosEmpresa.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {usuario.nombre} {usuario.apellido}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {usuario.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      usuario.rol === 'admin'
                        ? 'bg-purple-50 text-purple-700'
                        : usuario.rol === 'operador'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      usuario.estado === 'activo'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{usuario.ultimoAcceso || 'Nunca'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-emerald-600">
                    ${costoMensualPorUsuario}/mes
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {usuariosEmpresa.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">No hay usuarios registrados</p>
            <p className="text-gray-500 mb-4">Agrega el primer usuario a esta empresa</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Agregar Primer Usuario
            </button>
          </div>
        )}
      </div>

      {/* Modal de Agregar Usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Agregar Nuevo Usuario</h3>
            <p className="text-sm text-gray-600 mb-6">
              Se cobrará <span className="font-semibold text-emerald-600">${costoMensualPorUsuario}/mes</span> adicional por este usuario
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  placeholder="Juan"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
                <input
                  type="text"
                  value={newUser.apellido}
                  onChange={(e) => setNewUser({ ...newUser, apellido: e.target.value })}
                  placeholder="Pérez"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="juan.perez@empresa.com"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
                <select
                  value={newUser.rol}
                  onChange={(e) => setNewUser({ ...newUser, rol: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                  <option value="usuario">Usuario</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
              >
                Agregar Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
