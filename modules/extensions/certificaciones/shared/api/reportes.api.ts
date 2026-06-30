import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export interface RangoFechas { desde: string; hasta: string; }

export interface ReporteResumen {
  certificados_emitidos: number;
  certificados_vigentes: number;
  certificados_anulados: number;
  inscripciones_nuevas: number;
  estudiantes_nuevos: number;
  aprobados: number;
  desaprobados: number;
  tasa_aprobacion: number;     // 0-100
  creditos_consumidos: number;
  programas_activos: number;
  aulas_activas: number;
}

export interface FilaPorPrograma { programa: string; emitidos: number; }
export interface FilaPorMes { mes: string; emitidos: number; }   // 'YYYY-MM'

export interface Embudo { inscritos: number; aprobados: number; emitidos: number; }
export interface Comparativo {
  rango_anterior: RangoFechas;
  certificados:  { actual: number; anterior: number; pct: number };
  inscripciones: { actual: number; anterior: number; pct: number };
}
export interface AprobacionPrograma { programa: string; inscritos: number; aprobados: number; tasa: number; }
export interface Productividad { operador: string; emitidos: number; }

export interface FilaCertificado {
  codigo: string;
  alumno: string;
  documento: string;
  programa: string;
  aula: string;
  fecha_emision: string;
  estado: string;
}

export interface ReporteData {
  rango: RangoFechas;
  resumen: ReporteResumen;
  porPrograma: FilaPorPrograma[];
  tendencia: FilaPorMes[];
  embudo: Embudo;
  comparativo: Comparativo;
  aprobacionPorPrograma: AprobacionPrograma[];
  productividad: Productividad[];
}

const qs = (r: RangoFechas) => `?desde=${encodeURIComponent(r.desde)}&hasta=${encodeURIComponent(r.hasta)}`;

export const reportesApi = {
  /** Resumen + por programa + tendencia mensual del periodo. */
  data: (empresa: string, r: RangoFechas) =>
    api.get<ReporteData>(`/api/certificados/reportes${qs(r)}`, opts(empresa)),

  /** Detalle de certificados del periodo (para la tabla y el Excel). */
  certificados: (empresa: string, r: RangoFechas) =>
    api.get<FilaCertificado[]>(`/api/certificados/reportes/certificados${qs(r)}`, opts(empresa)),
};
