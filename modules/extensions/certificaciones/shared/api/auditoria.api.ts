import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export type AuditAccion = 'crear' | 'editar' | 'eliminar' | 'emitir' | 'anular' | 'importar' | 'login';
export type AuditEntidad =
  | 'programa' | 'aula' | 'inscripcion' | 'participante' | 'nota'
  | 'certificado' | 'config' | 'logo' | 'firma' | 'unidad' | 'sesion';

/** Un evento de la bitácora de auditoría. */
export interface AuditEvento {
  id: number;
  usuario_id: number | null;
  usuario_nombre: string | null;
  usuario_rol: string | null;
  accion: AuditAccion;
  entidad: AuditEntidad;
  entidad_id: number | null;
  entidad_nombre: string | null;
  descripcion: string;
  detalle: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

export interface AuditFiltro {
  accion?: AuditAccion | '';
  entidad?: AuditEntidad | '';
  limit?: number;
  offset?: number;
}

export interface AuditPagina {
  items: AuditEvento[];
  total: number;
}

export const auditoriaApi = {
  /** Lista la auditoría de la empresa (solo Admin; planes Profesional+). */
  list: (empresa: string, filtro: AuditFiltro = {}) => {
    const qs = new URLSearchParams();
    if (filtro.accion)  qs.set('accion', filtro.accion);
    if (filtro.entidad) qs.set('entidad', filtro.entidad);
    if (filtro.limit  != null) qs.set('limit', String(filtro.limit));
    if (filtro.offset != null) qs.set('offset', String(filtro.offset));
    const q = qs.toString();
    return api.get<AuditPagina>(`/api/certificados/auditoria${q ? `?${q}` : ''}`, opts(empresa));
  },
};
