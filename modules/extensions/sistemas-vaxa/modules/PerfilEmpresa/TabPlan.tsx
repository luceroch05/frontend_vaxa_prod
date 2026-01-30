'use client';

import { useState } from 'react';
import { CreditCard, Users, FileText, DollarSign, TrendingUp, Edit } from '@/components/ui/icon';
import type { Empresa } from '../../shared/types';
import { PLANES } from '../../shared/constants';

interface TabPlanProps {
  empresa: Empresa;
  tenantId: string;
}

export default function TabPlan({ empresa, tenantId }: TabPlanProps) {
  const plan = Object.values(PLANES).find((p) => p.id === empresa.planId);

  if (!plan) return null;

  const costoMensual = plan.precioPorUsuario * empresa.usuariosActivos;
  const costoAnual = costoMensual * 12;

  const certificadosRestantes =
    plan.certificadosMax === -1
      ? 'Ilimitados'
      : plan.certificadosMax - empresa.certificadosGenerados;

  const porcentajeUso =
    plan.certificadosMax === -1
      ? 0
      : (empresa.certificadosGenerados / plan.certificadosMax) * 100;

  return (
    <div className="space-y-6">
      {/* Plan Actual */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Plan Actual</h3>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
            <Edit className="w-4 h-4" />
            Cambiar Plan
          </button>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-emerald-100 text-sm mb-1">Plan</p>
              <h2 className="text-3xl font-bold">{plan.nombre}</h2>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm mb-1">Precio por usuario</p>
              <p className="text-3xl font-bold">${plan.precioPorUsuario}</p>
              <p className="text-sm text-emerald-100">/mes</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-emerald-100 text-sm mb-1">Límite de Certificados</p>
              <p className="text-2xl font-bold">
                {plan.certificadosMax === -1 ? '∞' : plan.certificadosMax}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <p className="text-emerald-100 text-sm mb-1">Características</p>
              <p className="text-2xl font-bold">{plan.features.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Facturación */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Facturación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-blue-900">Usuarios Activos</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">{empresa.usuariosActivos}</p>
            <p className="text-sm text-blue-700 mt-1">
              ${plan.precioPorUsuario} x {empresa.usuariosActivos} usuarios
            </p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-emerald-900">Costo Mensual</p>
            </div>
            <p className="text-3xl font-bold text-emerald-900">${costoMensual}</p>
            <p className="text-sm text-emerald-700 mt-1">USD por mes</p>
          </div>

          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-purple-900">Costo Anual</p>
            </div>
            <p className="text-3xl font-bold text-purple-900">${costoAnual}</p>
            <p className="text-sm text-purple-700 mt-1">USD por año</p>
          </div>
        </div>
      </div>

      {/* Uso de Certificados */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Uso de Certificados</h3>
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Certificados Generados</p>
              <p className="text-2xl font-bold text-gray-900">{empresa.certificadosGenerados}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-emerald-600">{certificadosRestantes}</p>
            </div>
          </div>

          {plan.certificadosMax !== -1 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progreso</span>
                <span className="text-sm font-semibold text-gray-900">
                  {porcentajeUso.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    porcentajeUso >= 90
                      ? 'bg-red-500'
                      : porcentajeUso >= 70
                      ? 'bg-orange-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(porcentajeUso, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Características del Plan */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Características del Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {plan.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 font-bold">✓</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{feature}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
