// Tipos TypeScript específicos para empresa-techpro
// Tipos compartidos entre módulos del tenant

export interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    new: number;
  };
  sessions: {
    today: number;
    scheduled: number;
    completed: number;
  };
  revenue: {
    currentMonth: number;
    previousMonth: number;
    growth: number;
  };
  efficiency: {
    rate: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface ActivityItem {
  id: string;
  type: 'system' | 'user' | 'action';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SystemStatus {
  operational: boolean;
  database: boolean;
  api: boolean;
  lastCheck: string;
}

// Tipos para formularios específicos del tenant
export interface TechProFormData {
  // Agregar campos específicos según necesidades
  [key: string]: any;
}
