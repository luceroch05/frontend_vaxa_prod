// Hook personalizado para el Dashboard de empresa-techpro
'use client';

import { useState, useEffect } from 'react';
import { dashboardService } from '../services';
import type { DashboardMetrics, ActivityItem, SystemStatus } from '../types';

interface UseDashboardOptions {
  tenantId: string;
  token?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useDashboard({
  tenantId,
  token,
  autoRefresh = false,
  refreshInterval = 30000,
}: UseDashboardOptions) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, activityData, statusData] = await Promise.all([
        dashboardService.getMetrics(tenantId, token),
        dashboardService.getActivity(tenantId, 10, token),
        dashboardService.getSystemStatus(tenantId, token),
      ]);

      setMetrics(metricsData);
      setActivity(activityData);
      setSystemStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar datos'));
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [tenantId, token, autoRefresh, refreshInterval]);

  return {
    metrics,
    activity,
    systemStatus,
    loading,
    error,
    refetch: fetchData,
  };
}
