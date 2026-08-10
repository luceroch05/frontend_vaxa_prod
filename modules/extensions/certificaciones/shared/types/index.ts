// ── Legacy types (usados por módulos anteriores — no usar en código nuevo) ──
/** @deprecated usar CertificadoPublico del nuevo módulo */
export interface DashboardMetrics {
  users: { total: number; active: number; new: number };
  sessions: { today: number; scheduled: number; completed: number };
  revenue: { currentMonth: number; previousMonth: number; growth: number };
  efficiency: { rate: number; trend: 'up' | 'down' | 'stable' };
}
/** @deprecated */
export interface ActivityItem { id: string; type: string; message: string; timestamp: string; metadata?: Record<string, unknown> }
/** @deprecated */
export interface SystemStatus { operational: boolean; database: boolean; api: boolean; lastCheck: string }
/** @deprecated */
export interface Empresa { id: string; nombre: string; tipo: string; logo?: string }

// ── Catálogos ──────────────────────────────────────────────────────────────
export interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
}

export interface TipoPrograma {
  id: number;
  nombre: string;
}

export interface Modalidad {
  id: number;
  codigo: string;
  nombre: string;
}

/** Coincide con la respuesta de GET /api/certificados/catalogos */
export interface Catalogos {
  tipos_documento: TipoDocumento[];
  tipos_programa: TipoPrograma[];
  modalidades: Modalidad[];
}

// ── Programa ────────────────────────────────────────────────────────────────
export interface Programa {
  id: number;
  empresa_id: number;
  tipo_programa_id: number;
  tipo_programa_nombre: string;
  nombre: string;
  descripcion: string | null;
  horas_academicas: number;
  creditos: number;
  unidad_label: string;
  nota_minima: number;
  activo: number;
}

export interface CreateProgramaDto {
  tipo_programa_id: number;
  nombre: string;
  descripcion?: string;
  horas_academicas: number;
  creditos?: number;
  unidad_label?: string;
  nota_minima?: number;
}

// ── Unidades y Notas ─────────────────────────────────────────────────────────
export interface Unidad {
  id: number;
  empresa_id: number;
  programa_id: number;
  nombre: string;
  orden: number;
  /** Créditos que otorga la unidad (solo modo "Crédito"). */
  creditos: number;
  activo: number;
}

export interface CreateUnidadDto {
  programa_id: number;
  nombre: string;
  orden?: number;
  creditos?: number;
}

/** Una fila (alumno) dentro de la matriz de notas de un grupo. */
export interface NotasFila {
  inscripcion_id: number;
  participante_nombre: string;
  numero_documento: string;
  estado_id: number;
  estado_nombre: string;
  notas: Record<number, number>;   // { unidad_id: nota }
  promedio: number | null;
  completo: boolean;
  aprobado: boolean | null;
}

export interface NotasMatriz {
  grupo_id: number;
  nombre_grupo: string;
  programa_id: number;
  programa_nombre: string;
  unidad_label: string;
  /** true si la evaluación es por créditos (sin notas). */
  es_creditos?: boolean;
  nota_minima: number;
  unidades: { id: number; nombre: string; orden: number; creditos: number }[];
  filas: NotasFila[];
}

// ── Grupo ───────────────────────────────────────────────────────────────────
export interface Grupo {
  id: number;
  empresa_id: number;
  programa_id: number;
  programa_nombre: string;
  nombre_grupo: string;
  fecha_inicio: string;          // Día 1
  fecha_fin?: string | null;     // legado (rango); aulas nuevas usan los días puntuales
  fecha_dia2?: string | null;    // Día 2 puntual (opcional)
  fecha_dia3?: string | null;    // Día 3 puntual (opcional)
  dias_semana?: string | null;   // ISO 1=Lun..7=Dom, separados por coma. Ej: "1,3,5"
  hora_inicio?: string | null;   // "HH:MM"
  hora_fin?: string | null;      // "HH:MM"
  modalidad_id: number;
  modalidad_nombre: string;
  activo: number;
}

export interface CreateGrupoDto {
  programa_id: number;
  nombre_grupo: string;
  fecha_inicio: string;          // Día 1
  fecha_fin?: string | null;     // legado (rango)
  fecha_dia2?: string | null;    // Día 2 puntual (opcional)
  fecha_dia3?: string | null;    // Día 3 puntual (opcional)
  dias_semana?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  modalidad_id: number;
}

// ── Participante ─────────────────────────────────────────────────────────────
export interface Participante {
  id: number;
  empresa_id: number;
  tipo_documento_id: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  activo: number;
}

export interface CreateParticipanteDto {
  tipo_documento_id: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
}

// ── Inscripción ──────────────────────────────────────────────────────────────
export interface Inscripcion {
  id: number;
  empresa_id: number;
  participante_id: number;
  participante_nombre: string;
  numero_documento: string;
  grupo_id: number;
  nombre_grupo: string;
  estado_id: number;
  estado_nombre: string;
  /** Calidad de participación (Participante, Ponente, Organizador, Colaborador…). */
  calidad?: string;
  fecha_inscripcion: string;
}

export interface CreateInscripcionDto {
  participante_id: number;
  grupo_id: number;
}

export interface RegistroPublicoDto {
  tipo_documento_id: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  telefono_pais?: string | null;  // ISO-2 del país del teléfono (ej. 'PE') para reportes
  grupo_id: number;
}

// ── Certificado ──────────────────────────────────────────────────────────────
export interface Certificado {
  id: number;
  empresa_id: number;
  inscripcion_id: number;
  programa_id?: number;
  codigo_unico: string;
  url: string | null;
  fecha_emision: string;
  /** Fecha-hora exacta de emisión (para el candado de 24h). */
  created_at?: string;
  estado_id: number;
  estado_nombre: string;
  participante_nombre: string;
  numero_documento: string;
  programa_nombre: string;
  tipo_programa_nombre?: string;
  horas_academicas?: number;
  creditos?: number;
  grupo_id?: number;
  nombre_grupo: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_dia2?: string | null;
  fecha_dia3?: string | null;
  modalidad_nombre?: string;
}

export interface CertificadoPublico {
  codigo_unico: string;
  fecha_emision: string;
  url: string | null;
  participante_nombre: string;
  numero_documento: string;
  tipo_doc: string;
  programa_nombre: string;
  tipo_programa: string;
  horas_academicas: number;
  nombre_grupo: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  fecha_dia2?: string | null;
  fecha_dia3?: string | null;
  modalidad: string;
  estado: string;
  empresa_nombre: string;
  empresa_logo: string | null;
}

// ── Logo y Firma ─────────────────────────────────────────────────────────────
export interface Logo {
  id: number;
  empresa_id: number;
  nombre: string | null;
  imagen_logo: string;
  es_default?: number | boolean;   // logo obligatorio de la empresa (no se elimina ni deselecciona)
  activo: number;
}

export interface Firma {
  id: number;
  empresa_id: number;
  nombre_autoridad: string;
  cargo: string;
  imagen_firma: string;
  activo: number;
}

// ── Config certificado ────────────────────────────────────────────────────────
export interface ConfigLogoItem {
  id:          number;
  imagen_logo: string;
  nombre:      string | null;
  orden:       number;
}

export interface ConfigFirmaItem {
  id:               number;
  nombre_autoridad: string;
  cargo:            string;
  imagen_firma:     string;
  orden:            number;
}

export interface ConfigCertificado {
  empresa_id:          number;
  programa_id:         number;
  plantilla_url:       string | null;
  texto_personalizado: string | null;
  /** JSON del modo "Diseño Personalizado (Lienzo)". null = diseño por defecto. */
  layout_personalizado?: string | null;
  logos:               ConfigLogoItem[];
  firmas:              ConfigFirmaItem[];
}

export interface UpsertConfigDto {
  plantilla_url?:       string | null;
  texto_personalizado?: string | null;
  /** JSON (string) del modo "Diseño Personalizado (Lienzo)". */
  layout_personalizado?: string | null;
  logo_ids?:  number[];
  firma_ids?: number[];
  /** 0 = config del programa (default). >0 = config específica de un grupo */
  grupo_id?: number;
}
