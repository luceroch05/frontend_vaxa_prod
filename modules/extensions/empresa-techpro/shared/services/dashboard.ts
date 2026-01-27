// Servicio API específico para Dashboard de empresa-techpro
// Usa el cliente API base pero con endpoints y lógica específica del tenant

import { api } from '@/lib/api/client';
import type { DashboardMetrics, ActivityItem, SystemStatus } from '../types';

export const dashboardService = {
  /**
   * Obtener métricas del dashboard
   */
  getMetrics: async (tenantId: string, token?: string): Promise<DashboardMetrics> => {
    return api.get<DashboardMetrics>('/api/dashboard/metrics', {
      tenantId,
      token,
    });
  },

  /**
   * Obtener actividad reciente
   */
  getActivity: async (
    tenantId: string,
    limit: number = 10,
    token?: string
  ): Promise<ActivityItem[]> => {
    return api.get<ActivityItem[]>(`/api/dashboard/activity?limit=${limit}`, {
      tenantId,
      token,
    });
  },

  /**
   * Obtener estado del sistema
   */
  getSystemStatus: async (tenantId: string, token?: string): Promise<SystemStatus> => {
    return api.get<SystemStatus>('/api/dashboard/system-status', {
      tenantId,
      token,
    });
  },

  /**
   * Obtener estadísticas generales
   */
  getStats: async (tenantId: string, token?: string): Promise<any> => {
    return api.get('/api/dashboard/stats', {
      tenantId,
      token,
    });
  },
};
