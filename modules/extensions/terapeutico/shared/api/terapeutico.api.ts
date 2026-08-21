import { api, API_URL, ApiError } from '@/lib/api/client';
import { authStorage, type AuthUser } from '@/lib/auth';

/** Slug del producto (multi-producto: ver tabla `productos`). */
export const PRODUCTO_TERAPEUTICO = 'historias-clinicas';

// ── Tipos ────────────────────────────────────────────────────────────────────
export interface Catalogo { id: number; codigo: string; nombre: string; }
export interface NivelLogro { id: number; codigo: string; nombre: string; orden: number; }
export interface Catalogos {
  sexos: Catalogo[];
  estados_historia: Catalogo[];
  tipos_diagnostico: Catalogo[];
  estados_cita: Catalogo[];
  estados_objetivo?: Catalogo[];
  estados_tratamiento?: Catalogo[];
  niveles_logro?: NivelLogro[];      // escala de logro de objetivos (maestro hc_nivel_logro)
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
  apoderados?: Apoderado[];        // tabla intermedia hc_apoderados (hasta 2)
}
export interface Apoderado {
  id?: number;
  nombre: string;
  relacion?: string | null;
  telefono?: string | null;
  tipo_doc?: string | null;
  num_doc?: string | null;
}
export type PacienteDto = Partial<Omit<Paciente, 'id' | 'sexo_nombre' | 'activo' | 'historia_id' | 'historia_numero' | 'apoderados'>> & {
  nombres: string; apellidos: string;
  apoderados?: Apoderado[];
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
  servicio_id?: number | null;
  servicio_nombre?: string | null;
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
  servicio_id?: number | null;
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

// ── Tratamientos (etapas de atención; varios servicios a la vez) ──────────────
export interface TratamientoServicio {
  servicio_id: number;
  servicio_nombre: string;
  terapeuta_id: number | null;
  terapeuta_nombre: string | null;
}
export interface Tratamiento {
  id: number;
  historia_id: number;
  motivo: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado_id: number;
  estado_codigo: string | null;
  estado_nombre: string | null;
  nota_cierre: string | null;
  servicios: TratamientoServicio[];
}
export interface TratamientoDto {
  motivo?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado_id?: number;
  nota_cierre?: string | null;
  servicios?: { servicio_id: number; terapeuta_id?: number | null }[];
}

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

export interface Objetivo {
  id: number;
  historia_id: number;
  servicio_id?: number | null;
  servicio_nombre?: string | null;
  descripcion: string;
  unidad: string;
  meta: number;
  estado_id: number;
  estado_codigo?: string | null;
  estado_nombre?: string | null;
  fecha_inicio: string;
  fecha_logro: string | null;
  ultimo_valor: number | null;
  hoy_valor: number | null;      // nivel registrado HOY (null si aún no se evaluó hoy)
  avances: number;
}
export interface ObjetivoDto {
  descripcion?: string;
  unidad?: string | null;
  meta?: number | null;
  estado_id?: number;
  servicio_id?: number | null;
}
export interface ObjetivoAvance {
  id: number;
  objetivo_id: number;
  sesion_id: number | null;
  valor: number;
  fecha: string;
  nota: string | null;
}
export interface AvanceDto {
  valor: number;
  fecha?: string | null;
  sesion_id?: number | null;
  nota?: string | null;
}

export interface Tarea {
  id: number;
  historia_id: number;
  sesion_id: number | null;
  descripcion: string;
  detalle: string | null;
  adjunto_ruta: string | null;
  adjunto_nombre: string | null;
  adjunto_mime: string | null;
  video_url: string | null;      // enlace de YouTube (el video propio va como adjunto)
  fecha_limite: string | null;
  cumplida: number;
  cumplida_at: string | null;
  activo: number;
  created_at: string;
}
export interface TareaDto {
  descripcion?: string;
  detalle?: string | null;
  fecha_limite?: string | null;
  cumplida?: boolean;
  activo?: boolean;
  video_url?: string | null;
}

export interface AccesoApoderado { id: number; paciente_id: number; token: string; activo: number; }

export interface PortalObjetivo {
  id: number;
  descripcion: string;
  unidad: string;
  meta: number;
  estado_codigo: string | null;
  estado_nombre: string | null;
  ultimo_valor: number | null;
  avances: { valor: number; fecha: string }[];
}
export interface PortalCita {
  inicio: string;
  estado_id: number;
  estado_nombre: string | null;
  servicio_nombre: string | null;
  terapeuta_nombre: string | null;
}
export interface PortalTarea {
  id: number;
  descripcion: string;
  detalle: string | null;
  adjunto_ruta: string | null;
  adjunto_nombre: string | null;
  adjunto_mime: string | null;
  video_url: string | null;      // enlace de YouTube de apoyo
  fecha_limite: string | null;
  cumplida: number;
  cumplida_at: string | null;
}
export interface PortalData {
  centro: { razon_social: string | null; logo_url: string | null };
  paciente: { nombres: string; apellidos: string };
  objetivos: PortalObjetivo[];
  citas_proximas: PortalCita[];
  tareas: PortalTarea[];
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
  /** ¿Ya hay un paciente con ese documento? (para avisar al llenar el input). */
  existePaciente: (empresa: string, tipoDoc: string, numDoc: string, excluirId?: number) =>
    api.get<{ existe: boolean; paciente: { id: number; nombre: string } | null }>(
      `${B}/pacientes/existe?tipo_doc=${encodeURIComponent(tipoDoc)}&num_doc=${encodeURIComponent(numDoc)}${excluirId ? `&excluir_id=${excluirId}` : ''}`,
      opts(empresa),
    ),
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

  // Tratamientos (etapas de atención por historia)
  listTratamientos: (empresa: string, historiaId: number) =>
    api.get<Tratamiento[]>(`${B}/historias/${historiaId}/tratamientos`, opts(empresa)),
  createTratamiento: (empresa: string, historiaId: number, data: TratamientoDto) =>
    api.post<Tratamiento>(`${B}/historias/${historiaId}/tratamientos`, data, opts(empresa)),
  updateTratamiento: (empresa: string, id: number, data: TratamientoDto) =>
    api.patch<Tratamiento>(`${B}/tratamientos/${id}`, data, opts(empresa)),
  deleteTratamiento: (empresa: string, id: number) =>
    api.delete<{ ok: boolean }>(`${B}/tratamientos/${id}`, opts(empresa)),

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

  // Objetivos terapéuticos + progreso
  listObjetivos: (empresa: string, historiaId: number) =>
    api.get<Objetivo[]>(`${B}/historias/${historiaId}/objetivos`, opts(empresa)),
  createObjetivo: (empresa: string, historiaId: number, data: ObjetivoDto) =>
    api.post<Objetivo>(`${B}/historias/${historiaId}/objetivos`, data, opts(empresa)),
  updateObjetivo: (empresa: string, objetivoId: number, data: ObjetivoDto) =>
    api.patch<Objetivo>(`${B}/objetivos/${objetivoId}`, data, opts(empresa)),
  deleteObjetivo: (empresa: string, objetivoId: number) =>
    api.delete<void>(`${B}/objetivos/${objetivoId}`, opts(empresa)),
  listAvance: (empresa: string, objetivoId: number) =>
    api.get<ObjetivoAvance[]>(`${B}/objetivos/${objetivoId}/avance`, opts(empresa)),
  addAvance: (empresa: string, objetivoId: number, data: AvanceDto) =>
    api.post<{ objetivo: Objetivo; avance: ObjetivoAvance[] }>(`${B}/objetivos/${objetivoId}/avance`, data, opts(empresa)),

  // Acceso del apoderado al portal (enlace mágico)
  getAcceso: (empresa: string, pacienteId: number) =>
    api.get<AccesoApoderado | null>(`${B}/pacientes/${pacienteId}/acceso`, opts(empresa)),
  crearAcceso: (empresa: string, pacienteId: number) =>
    api.post<AccesoApoderado>(`${B}/pacientes/${pacienteId}/acceso`, {}, opts(empresa)),
  regenerarAcceso: (empresa: string, pacienteId: number) =>
    api.post<AccesoApoderado>(`${B}/pacientes/${pacienteId}/acceso/regenerar`, {}, opts(empresa)),
  revocarAcceso: (empresa: string, pacienteId: number) =>
    api.delete<void>(`${B}/pacientes/${pacienteId}/acceso`, opts(empresa)),

  // Tareas para casa
  listTareas: (empresa: string, historiaId: number) =>
    api.get<Tarea[]>(`${B}/historias/${historiaId}/tareas`, opts(empresa)),
  createTarea: (empresa: string, historiaId: number, data: TareaDto) =>
    api.post<Tarea>(`${B}/historias/${historiaId}/tareas`, data, opts(empresa)),
  updateTarea: (empresa: string, tareaId: number, data: TareaDto) =>
    api.patch<Tarea>(`${B}/tareas/${tareaId}`, data, opts(empresa)),
  deleteTarea: (empresa: string, tareaId: number) =>
    api.delete<void>(`${B}/tareas/${tareaId}`, opts(empresa)),
  /** Adjunta un audio (mp3) o imagen a la tarea (binario crudo). */
  uploadTareaAudio: async (empresa: string, tareaId: number, file: File): Promise<Tarea> => {
    const res = await fetch(`${API_URL}${B}/tareas/${tareaId}/adjunto`, {
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
      throw new ApiError(data.error ?? data.message ?? 'No se pudo subir el audio', res.status, data);
    }
    return res.json() as Promise<Tarea>;
  },
  deleteTareaAudio: (empresa: string, tareaId: number) =>
    api.delete<Tarea>(`${B}/tareas/${tareaId}/adjunto`, opts(empresa)),

  /** Portal público del apoderado (sin login): datos por token del enlace. */
  portalData: (token: string) =>
    api.get<PortalData>(`/public/portal/${token}`),
  /** Portal público: el apoderado marca/desmarca una tarea. */
  portalMarcarTarea: (token: string, tareaId: number, cumplida: boolean) =>
    api.post<{ id: number; cumplida: boolean }>(`/public/portal/${token}/tareas/${tareaId}/cumplir`, { cumplida }),

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

  // Auditoría (bitácora de acciones sobre datos clínicos; solo ADMINISTRADOR)
  auditoria: (empresa: string, params?: { accion?: string; entidad?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.accion)  q.set('accion', params.accion);
    if (params?.entidad) q.set('entidad', params.entidad);
    if (params?.limit != null)  q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    const qs = q.toString();
    return api.get<{ items: HcAuditoriaEvento[]; total: number }>(`${B}/auditoria${qs ? `?${qs}` : ''}`, opts(empresa));
  },
};

export interface HcAuditoriaEvento {
  id: number;
  usuario_id: number | null;
  usuario_nombre: string | null;
  usuario_rol: string | null;
  accion: string;
  entidad: string;
  entidad_id: number | null;
  descripcion: string;
  ip: string | null;
  created_at: string;
}
