import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';
import type { Inscripcion, CreateInscripcionDto, RegistroPublicoDto, Participante } from '../types';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export interface InscribirDto {
  tipo_documento_id: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  grupo_id: number;
}

export const inscripcionesApi = {
  list: (empresa: string, grupoId?: number) => {
    const qs = grupoId ? `?grupo_id=${grupoId}` : '';
    return api.get<Inscripcion[]>(`/api/certificados/inscripciones${qs}`, opts(empresa));
  },

  /** Inscribe un alumno: reutiliza por documento o lo crea; valida duplicado en el programa. */
  inscribir: (empresa: string, data: InscribirDto) =>
    api.post<{ participante: Participante; inscripcion: Inscripcion }>(
      '/api/certificados/inscripciones/inscribir', data, opts(empresa),
    ),

  create: (empresa: string, data: CreateInscripcionDto) =>
    api.post<Inscripcion>('/api/certificados/inscripciones', data, opts(empresa)),

  cambiarEstado: (empresa: string, id: number, estado_id: number) =>
    api.patch<Inscripcion>(
      `/api/certificados/inscripciones/${id}/estado`,
      { estado_id },
      opts(empresa)
    ),

  /** Borra una inscripción (falla 409 si ya tiene certificado emitido). */
  eliminar: (empresa: string, id: number) =>
    api.delete<void>(`/api/certificados/inscripciones/${id}`, opts(empresa)),

  /** Cambia el estado de varias inscripciones a la vez (ej. aprobar todo un grupo sin notas). */
  cambiarEstadoMasivo: (empresa: string, ids: number[], estado_id: number) =>
    api.patch<{ actualizadas: number }>(
      '/api/certificados/inscripciones/estado-masivo',
      { ids, estado_id },
      opts(empresa)
    ),

  /** Registro público: crea participante + inscripción en una sola operación */
  registroPublico: (empresa: string, data: RegistroPublicoDto) =>
    api.post<{ participante_id: number; inscripcion_id: number }>(
      '/api/certificados/inscripciones/registro-publico',
      data,
      { tenantId: empresa }
    ),
};
