import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const ROOT_TENANT = 'vaxa';
const opts = () => ({ tenantId: ROOT_TENANT, token: authStorage.getToken(ROOT_TENANT) ?? undefined });

/** Recurso propio de Vaxa (VPS/dominio/hosting): lo que TÚ pagas al proveedor. */
export interface InfraRecurso {
  id: number;
  tipo: string;                 // VPS | Dominio | Hosting | SSL | Correo | Otro
  nombre: string;
  proveedor?: string | null;
  costo: number;                // lo que TÚ pagas
  moneda: string;               // PEN | USD
  ciclo: string;                // mensual | anual | unico
  fecha_renovacion?: string | null; // cuándo pagas al proveedor
  proyectos?: string | null;    // proyectos/sitios alojados (uno por línea)
  credenciales?: string | null;
  notas?: string | null;
  activo?: number;
}

/** Alquiler/servicio que le cobras a un cliente. */
export interface InfraAlquiler {
  id: number;
  cliente?: string | null;      // nombre libre
  email?: string | null;        // correo del cliente (para el recordatorio)
  empresa_id?: number | null;   // o empresa del sistema
  recurso_id?: number | null;   // recurso enlazado (para el margen)
  descripcion?: string | null;
  precio: number;               // lo que le COBRAS
  moneda: string;
  ciclo: string;
  fecha_inicio?: string | null;
  proximo_cobro?: string | null; // cuándo le cobras
  ultimo_cobro?: string | null;  // último cobro registrado
  estado_pago: string;          // pagado | pendiente | vencido
  notas?: string | null;
  activo?: number;
  // resueltos por el backend (solo lectura)
  empresa_nombre?: string | null;
  recurso_nombre?: string | null;
  recurso_tipo?: string | null;
  recurso_costo?: number | null;
}

export const infraRecursosApi = {
  list:   () => api.get<InfraRecurso[]>('/api/admin/infra-recursos', opts()),
  create: (d: Partial<InfraRecurso>) => api.post<InfraRecurso>('/api/admin/infra-recursos', d, opts()),
  update: (id: number, d: Partial<InfraRecurso>) => api.patch<InfraRecurso>(`/api/admin/infra-recursos/${id}`, d, opts()),
  remove: (id: number) => api.delete<void>(`/api/admin/infra-recursos/${id}`, opts()),
};

export const infraAlquileresApi = {
  list:   () => api.get<InfraAlquiler[]>('/api/admin/infra-alquileres', opts()),
  create: (d: Partial<InfraAlquiler>) => api.post<InfraAlquiler>('/api/admin/infra-alquileres', d, opts()),
  update: (id: number, d: Partial<InfraAlquiler>) => api.patch<InfraAlquiler>(`/api/admin/infra-alquileres/${id}`, d, opts()),
  remove: (id: number) => api.delete<void>(`/api/admin/infra-alquileres/${id}`, opts()),
  /** Registra el cobro y corre el próximo cobro al siguiente ciclo. */
  cobrar: (id: number) => api.post<InfraAlquiler>(`/api/admin/infra-alquileres/${id}/cobrar`, {}, opts()),
  /** Envía al cliente (por su email) un recordatorio de pago. */
  recordar: (id: number) => api.post<{ enviado: boolean; motivo?: string }>(`/api/admin/infra-alquileres/${id}/recordar`, {}, opts()),
};

/** Una fila del historial de cobros (no se borra nunca). */
export interface InfraCobro {
  id: number;
  alquiler_id: number;
  empresa_id?: number | null;
  cliente?: string | null;
  descripcion?: string | null;
  monto: number;
  moneda: string;
  ciclo?: string | null;
  fecha_cobro: string;
  cubierto_hasta?: string | null;
  user_id?: number | null;
  created_at?: string | null;
}

export const infraCobrosApi = {
  /** Historial completo o filtrado por alquiler. */
  list: (alquilerId?: number) =>
    api.get<InfraCobro[]>(`/api/admin/infra-cobros${alquilerId ? `?alquiler_id=${alquilerId}` : ''}`, opts()),
};

/** Empresa del sistema (para el combobox de cliente). */
export interface InfraEmpresaLite { id: number; razon_social: string; }
export const listInfraEmpresas = () => api.get<InfraEmpresaLite[]>('/api/admin/empresas', opts());

/** Alerta de cobro (para la campana de notificaciones). */
export interface InfraAlerta {
  id: number; empresa_id?: number | null; cliente: string; descripcion?: string | null;
  precio: number; moneda: string; proximo_cobro: string; estado_pago: string; dias: number;
}

/** Datos para pre-llenar una cotización desde un cobro (se pasan por navigation state). */
export interface PrefillCobro {
  empresa_id: number | null;
  cliente: string;
  lineas: Array<{ descripcion: string; cantidad: number; precioUnitario: number }>;
}
export const listInfraAlertas = () => api.get<InfraAlerta[]>('/api/admin/infra-alertas', opts());
/** Fuerza el envío del correo-resumen de cobros a info@vaxa.com.pe. */
export const enviarAvisosCobro = () => api.post<{ enviado: boolean; motivo?: string; cantidad?: number }>('/api/admin/infra-avisos/enviar', {}, opts());

/* ── Helpers ─────────────────────────────────────────────── */

/** Normaliza cualquier fecha (DATE, ISO datetime, etc.) a 'YYYY-MM-DD'. */
export function fechaCorta(fecha?: string | null): string {
  return fecha ? String(fecha).slice(0, 10) : '';
}

/** Días hasta la fecha (negativo = ya venció). null si no hay fecha. */
export function diasHasta(fecha?: string | null): number | null {
  const ymd = fechaCorta(fecha);
  if (!ymd) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const f = new Date(ymd + 'T00:00:00');
  if (isNaN(f.getTime())) return null;
  return Math.round((f.getTime() - hoy.getTime()) / 86400000);
}

/** Estado del vencimiento por semáforo. */
export function estadoVencimiento(fecha?: string | null): 'sin_fecha' | 'vencido' | 'por_vencer' | 'vigente' {
  const d = diasHasta(fecha);
  if (d === null) return 'sin_fecha';
  if (d < 0) return 'vencido';
  if (d <= 7) return 'por_vencer';
  return 'vigente';
}

/** Lista de proyectos alojados (una por línea o separados por coma). */
export function parseProyectos(txt?: string | null): string[] {
  if (!txt) return [];
  return txt.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
}

/** Costo/precio normalizado a mensual (para sumar totales). */
export function aMensual(monto: number, ciclo: string): number {
  if (ciclo === 'anual') return monto / 12;
  if (ciclo === 'semestral') return monto / 6;
  if (ciclo === 'trimestral') return monto / 3;
  if (ciclo === 'unico') return 0;
  return monto;
}

/**
 * Estado EFECTIVO del cobro combinando la fecha (proximo_cobro) con el pago.
 * Resuelve la contradicción entre el badge manual y el semáforo:
 *  - 'pagado' (pago único ya cobrado) → Pagado.
 *  - próximo cobro en el futuro y ya hubo un cobro → Al día (cubierto este ciclo).
 *  - vencido / por vencer según la fecha; si no, Pendiente.
 */
export function estadoEfectivo(a: {
  estado_pago?: string; proximo_cobro?: string | null; ultimo_cobro?: string | null;
}): { key: 'pagado' | 'al_dia' | 'vencido' | 'por_vencer' | 'pendiente'; label: string; c: string; bg: string } {
  if (a.estado_pago === 'pagado' && !a.proximo_cobro)
    return { key: 'pagado', label: 'Pagado', c: '#059669', bg: '#ECFDF5' };
  const est = estadoVencimiento(a.proximo_cobro);
  if (est === 'vencido')     return { key: 'vencido', label: 'Vencido', c: '#DC2626', bg: '#FEF2F2' };
  if (est === 'por_vencer')  return { key: 'por_vencer', label: 'Por vencer', c: '#B45309', bg: '#FEF3C7' };
  if (est === 'vigente' && a.ultimo_cobro)
    return { key: 'al_dia', label: 'Al día', c: '#059669', bg: '#ECFDF5' };
  return { key: 'pendiente', label: 'Pendiente', c: '#6B7280', bg: '#F1F4F3' };
}
