// Constantes compartidas para el tenant empresa-techpro
// Estas constantes pueden ser usadas por todos los módulos del tenant

export const TENANT_CONFIG = {
  NAME: 'Empresa TechPro',
  ID: 'empresa-techpro',
  PRIMARY_COLOR: 'purple',
  REFRESH_INTERVAL: 30000, // 30 segundos
} as const;

export const API_ENDPOINTS = {
  DASHBOARD: {
    METRICS: '/api/dashboard/metrics',
    ACTIVITY: '/api/dashboard/activity',
    STATS: '/api/dashboard/stats',
  },
  // Aquí puedes agregar más endpoints específicos del tenant
} as const;

export const CHART_COLORS = {
  primary: '#9333ea', // purple-600
  secondary: '#6366f1', // indigo-600
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  info: '#3b82f6', // blue-500
} as const;

export const METRIC_TYPES = {
  USERS: 'users',
  SESSIONS: 'sessions',
  REVENUE: 'revenue',
  EFFICIENCY: 'efficiency',
} as const;
