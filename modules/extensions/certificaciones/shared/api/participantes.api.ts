import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';
import type { Participante, CreateParticipanteDto } from '../types';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export const participantesApi = {
  list: (empresa: string, incluirInactivos = false) =>
    api.get<Participante[]>(`/api/certificados/participantes${incluirInactivos ? '?todos=1' : ''}`, opts(empresa)),

  /** Archiva (false) o reactiva (true) un estudiante. */
  setActivo: (empresa: string, id: number, activo: boolean) =>
    api.patch<Participante>(`/api/certificados/participantes/${id}/activo`, { activo }, opts(empresa)),

  /** Borra el estudiante y sus inscripciones (falla 409 si tiene certificados emitidos). */
  eliminar: (empresa: string, id: number) =>
    api.delete<void>(`/api/certificados/participantes/${id}`, opts(empresa)),

  get: (empresa: string, id: number) =>
    api.get<Participante>(`/api/certificados/participantes/${id}`, opts(empresa)),

  /** Busca por documento para autocompletar. Lanza error si no existe (404). */
  buscar: (empresa: string, documento: string, tipoDocumentoId?: number) =>
    api.get<Participante>(
      `/api/certificados/participantes/buscar?documento=${encodeURIComponent(documento)}${tipoDocumentoId ? `&tipo_documento_id=${tipoDocumentoId}` : ''}`,
      opts(empresa),
    ),

  create: (empresa: string, data: CreateParticipanteDto) =>
    api.post<Participante>('/api/certificados/participantes', data, opts(empresa)),

  /** Edita los datos de un estudiante. */
  update: (empresa: string, id: number, data: Partial<CreateParticipanteDto>) =>
    api.patch<Participante>(`/api/certificados/participantes/${id}`, data, opts(empresa)),
};
