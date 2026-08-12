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
  /** Calidad de participación (Participante, Organizador, Ponente…). Default Participante. */
  calidad?: string;
  /** Grados académicos de la persona (solo se aplican al CREAR el participante). */
  grados?: string[];
}

/** Una fila de participante para la carga masiva. */
export interface ImportarFila {
  tipo_documento_id: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  /** Calidad de participación (Organizador, Colaborador, Participante, Ponente u otro). Default Participante. */
  calidad?: string;
}

export interface ImportarResultadoFila {
  fila: number;
  documento: string;
  nombre: string;
  estado: 'inscrito' | 'ya_inscrito' | 'emitido' | 'ya_emitido' | 'error';
  motivo?: string;
}

export interface ImportarResultado {
  resumen: {
    total: number; inscritos: number; ya_inscritos: number;
    emitidos: number; ya_emitidos: number; errores: number;
  };
  resultados: ImportarResultadoFila[];
}

export const inscripcionesApi = {
  list: (empresa: string, grupoId?: number, participanteId?: number) => {
    const params = new URLSearchParams();
    if (grupoId) params.set('grupo_id', String(grupoId));
    if (participanteId) params.set('participante_id', String(participanteId));
    const qs = params.toString() ? `?${params.toString()}` : '';
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

  /** Corrige la calidad de participación de una inscripción (Ponente, Participante…). */
  cambiarCalidad: (empresa: string, id: number, calidad: string) =>
    api.patch<Inscripcion>(
      `/api/certificados/inscripciones/${id}/calidad`,
      { calidad },
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

  /** Carga masiva: inscribe (y opcionalmente emite el certificado de) una lista de participantes a un grupo. */
  importarMasivo: (empresa: string, data: { grupo_id: number; emitir: boolean; participantes: ImportarFila[] }) =>
    api.post<ImportarResultado>('/api/certificados/inscripciones/importar', data, opts(empresa)),

  /** Registro público: crea participante + inscripción en una sola operación */
  registroPublico: (empresa: string, data: RegistroPublicoDto) =>
    api.post<{ participante_id: number; inscripcion_id: number }>(
      '/api/certificados/inscripciones/registro-publico',
      data,
      { tenantId: empresa }
    ),
};
