import { api, API_URL, ApiError } from '@/lib/api/client';
import { authStorage, type AuthUser } from '@/lib/auth';

/** Slug del producto (multi-producto: ver tabla `productos`). */
export const PRODUCTO_TERAPEUTICO = 'historias-clinicas';

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface Catalogo { id: number; codigo: string; nombre: string; }
export interface Catalogos {
  sexos: Catalogo[];
  estados_historia: Catalogo[];
  tipos_diagnostico: Catalogo[];
  estados_cita: Catalogo[];
}

export interface Paciente {
  id: number;
  tipo_doc: string;
  num_doc: string | null;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  sexo_id: number | null;
  sexo_nombre: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  apoderado_nombre: string | null;
  apoderado_telefono: string | null;
  apoderado_relacion: string | null;
  observaciones: string | null;
  activo: number;
  historia_id?: number | null;
  historia_numero?: string | null;
}
export type PacienteDto = Partial<Omit<Paciente, 'id' | 'sexo_nombre' | 'activo' | 'historia_id' | 'historia_numero'>> & {
  nombres: string; apellidos: string;
};

export interface Historia {
  id: number;
  paciente_id: number;
  numero: string | null;
  fecha_apertura: string;
  motivo_consulta: string | null;
  antecedentes: string | null;
  estado_id: number;
  estado_nombre?: string | null;
}
export interface HistoriaDto {
  motivo_consulta?: string | null;
  antecedentes?: string | null;
  estado_id?: number;
}

export interface Sesion {
  id: number;
  historia_id: number;
  terapeuta_id: number;
  terapeuta_nombre?: string | null;
  fecha: string;
  numero_sesion: number | null;
  subjetivo: string | null;
  objetivo: string | null;
  analisis: string | null;
  plan: string | null;
  evolucion: string | null;
  firmada: number;
}
export interface SesionDto {
  fecha?: string;
  subjetivo?: string | null;
  objetivo?: string | null;
  analisis?: string | null;
  plan?: string | null;
  evolucion?: string | null;
  firmada?: boolean;
}

export interface Diagnostico {
  id: number;
  historia_id: number;
  codigo_cie10: string | null;
  descripcion: string;
  tipo_id: number;
  tipo_nombre?: string | null;
  fecha: string;
}
export interface DiagnosticoDto {
  codigo_cie10?: string | null;
  descripcion: string;
  tipo_id?: number;
  fecha?: string;
}

export interface Terapeuta { id: number; nombre: string; }

export interface Servicio { id: number; nombre: string; descripcion: string | null; activo: number; }
export interface ServicioDto { nombre: string; descripcion?: string | null; activo?: boolean; }

export interface Asignacion {
  id: number; paciente_id: number; terapeuta_id: number; terapeuta_nombre: string;
  servicio_id: number | null; servicio_nombre: string | null;
}

export interface Cita {
  id: number;
  paciente_id: number;
  terapeuta_id: number;
  servicio_id: number | null;
  paciente_nombre: string;
  terapeuta_nombre: string;
  servicio_nombre: string | null;
  inicio: string;
  fin: string | null;
  estado_id: number;
  estado_nombre: string | null;
  motivo: string | null;
}
export interface CitaDto {
  paciente_id: number;
  terapeuta_id: number;
  servicio_id?: number | null;
  inicio: string;
  fin?: string | null;
  motivo?: string | null;
  estado_id?: number;
}
export interface CitaUpdateDto {
  inicio?: string;
  fin?: string | null;
  motivo?: string | null;
  estado_id?: number;
  terapeuta_id?: number;
  servicio_id?: number | null;
}

export interface Adjunto {
  id: number;
  historia_id: number;
  sesion_id: number | null;
  nombre: string;
  ruta: string;
  mime: string | null;
  created_at: string;
  subido_por: string | null;
}

export interface LoginResponse { token: string; usuario: AuthUser; }

// Opciones de auth (tenant header + token) por empresa.
const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

const B = '/api/historias';

export const terapAuthApi = {
  login: (empresa: string, correo: string, contrasena: string) =>
    api.post<LoginResponse>('/api/auth/login', {
      correo, contrasena, empresa, producto: PRODUCTO_TERAPEUTICO,
    }),

  /** Branding público del tenant (logo + razón social + activo). Endpoint compartido. */
  existeEmpresa: (empresa: string) =>
    api.get<{ exists: boolean; activo?: boolean; razon_social?: string | null; logo_url?: string | null }>(
      `/public/certificados/${empresa}/existe`,
    ),
};

export const terapApi = {
  catalogos: (empresa: string) => api.get<Catalogos>(`${B}/catalogos`, opts(empresa)),

  // Pacientes
  listPacientes: (empresa: string, incluirInactivos = false) =>
    api.get<Paciente[]>(`${B}/pacientes${incluirInactivos ? '?todos=1' : ''}`, opts(empresa)),
  getPaciente: (empresa: string, id: number) =>
    api.get<Paciente>(`${B}/pacientes/${id}`, opts(empresa)),
  createPaciente: (empresa: string, data: PacienteDto) =>
    api.post<Paciente>(`${B}/pacientes`, data, opts(empresa)),
  updatePaciente: (empresa: string, id: number, data: Partial<PacienteDto>) =>
    api.patch<Paciente>(`${B}/pacientes/${id}`, data, opts(empresa)),
  setActivoPaciente: (empresa: string, id: number, activo: boolean) =>
    api.patch<void>(`${B}/pacientes/${id}/activo`, { activo }, opts(empresa)),

  // Historia
  getHistoria: (empresa: string, pacienteId: number) =>
    api.get<Historia>(`${B}/pacientes/${pacienteId}/historia`, opts(empresa)),
  abrirHistoria: (empresa: string, pacienteId: number, data: HistoriaDto) =>
    api.post<Historia>(`${B}/pacientes/${pacienteId}/historia`, data, opts(empresa)),
  updateHistoria: (empresa: string, historiaId: number, data: HistoriaDto) =>
    api.patch<Historia>(`${B}/historias/${historiaId}`, data, opts(empresa)),

  // Diagnósticos
  listDiagnosticos: (empresa: string, historiaId: number) =>
    api.get<Diagnostico[]>(`${B}/historias/${historiaId}/diagnosticos`, opts(empresa)),
  addDiagnostico: (empresa: string, historiaId: number, data: DiagnosticoDto) =>
    api.post<Diagnostico>(`${B}/historias/${historiaId}/diagnosticos`, data, opts(empresa)),

  // Sesiones / evoluciones
  listSesiones: (empresa: string, historiaId: number) =>
    api.get<Sesion[]>(`${B}/historias/${historiaId}/sesiones`, opts(empresa)),
  createSesion: (empresa: string, historiaId: number, data: SesionDto) =>
    api.post<Sesion>(`${B}/historias/${historiaId}/sesiones`, data, opts(empresa)),
  updateSesion: (empresa: string, sesionId: number, data: SesionDto) =>
    api.patch<Sesion>(`${B}/sesiones/${sesionId}`, data, opts(empresa)),

  // Servicios del centro
  listServicios: (empresa: string, todos = false) =>
    api.get<Servicio[]>(`${B}/servicios${todos ? '?todos=1' : ''}`, opts(empresa)),
  createServicio: (empresa: string, data: ServicioDto) =>
    api.post<Servicio>(`${B}/servicios`, data, opts(empresa)),
  updateServicio: (empresa: string, id: number, data: Partial<ServicioDto>) =>
    api.patch<Servicio>(`${B}/servicios/${id}`, data, opts(empresa)),

  // Servicios que brinda cada terapeuta
  getServiciosDeTerapeuta: (empresa: string, terapeutaId: number) =>
    api.get<Terapeuta[]>(`${B}/terapeutas/${terapeutaId}/servicios`, opts(empresa)),
  setServiciosTerapeuta: (empresa: string, terapeutaId: number, servicioIds: number[]) =>
    api.put<{ id: number; nombre: string }[]>(`${B}/terapeutas/${terapeutaId}/servicios`, { servicio_ids: servicioIds }, opts(empresa)),

  // Terapeutas (filtro opcional por servicio)
  listTerapeutas: (empresa: string, servicioId?: number) =>
    api.get<Terapeuta[]>(`${B}/terapeutas${servicioId ? `?servicio_id=${servicioId}` : ''}`, opts(empresa)),

  // Asignación paciente ↔ terapeuta (por servicio)
  listAsignaciones: (empresa: string, pacienteId: number) =>
    api.get<Asignacion[]>(`${B}/pacientes/${pacienteId}/terapeutas`, opts(empresa)),
  asignarTerapeuta: (empresa: string, pacienteId: number, terapeutaId: number, servicioId?: number | null) =>
    api.post<Asignacion[]>(`${B}/pacientes/${pacienteId}/terapeutas`, { terapeuta_id: terapeutaId, servicio_id: servicioId ?? null }, opts(empresa)),
  quitarAsignacion: (empresa: string, asignacionId: number) =>
    api.delete<void>(`${B}/asignaciones/${asignacionId}`, opts(empresa)),

  // Citas / agenda
  listCitas: (empresa: string, params?: { desde?: string; hasta?: string; terapeuta_id?: number; paciente_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.desde) q.set('desde', params.desde);
    if (params?.hasta) q.set('hasta', params.hasta);
    if (params?.terapeuta_id) q.set('terapeuta_id', String(params.terapeuta_id));
    if (params?.paciente_id) q.set('paciente_id', String(params.paciente_id));
    const qs = q.toString();
    return api.get<Cita[]>(`${B}/citas${qs ? `?${qs}` : ''}`, opts(empresa));
  },
  createCita: (empresa: string, data: CitaDto) =>
    api.post<Cita>(`${B}/citas`, data, opts(empresa)),
  updateCita: (empresa: string, id: number, data: CitaUpdateDto) =>
    api.patch<Cita>(`${B}/citas/${id}`, data, opts(empresa)),

  // Adjuntos de la historia
  listAdjuntos: (empresa: string, historiaId: number) =>
    api.get<Adjunto[]>(`${B}/historias/${historiaId}/adjuntos`, opts(empresa)),
  deleteAdjunto: (empresa: string, adjuntoId: number) =>
    api.delete<void>(`${B}/adjuntos/${adjuntoId}`, opts(empresa)),

  /** Sube un archivo (binario crudo) a la historia. El api client solo maneja JSON,
   *  así que aquí usamos fetch directo con el MIME real + nombre en headers. */
  uploadAdjunto: async (empresa: string, historiaId: number, file: File): Promise<Adjunto> => {
    const res = await fetch(`${API_URL}${B}/historias/${historiaId}/adjuntos`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'x-file-name': encodeURIComponent(file.name),
        'x-tenant-id': empresa,
        ...(authStorage.getToken(empresa) ? { Authorization: `Bearer ${authStorage.getToken(empresa)}` } : {}),
      },
      body: file,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string; message?: string };
      throw new ApiError(data.error ?? data.message ?? 'No se pudo subir el archivo', res.status, data);
    }
    return res.json() as Promise<Adjunto>;
  },
};
