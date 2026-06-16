import { api } from '@/lib/api/client';
import { authStorage } from '@/lib/auth';
import type { Certificado, CertificadoPublico } from '../types';

const opts = (empresa: string) => ({
  tenantId: empresa,
  token: authStorage.getToken(empresa) ?? undefined,
});

export const certificadosApi = {
  list: (empresa: string) =>
    api.get<Certificado[]>('/api/certificados/emision', opts(empresa)),

  generar: (empresa: string, inscripcionId: number) =>
    api.post<Certificado>(
      `/api/certificados/emision/generar/${inscripcionId}`,
      undefined,
      opts(empresa)
    ),

  anular: (empresa: string, id: number) =>
    api.patch<Certificado>(
      `/api/certificados/emision/${id}/anular`,
      undefined,
      opts(empresa)
    ),

  /** Elimina el certificado por completo y DEVUELVE el crédito. */
  eliminar: (empresa: string, id: number) =>
    api.delete<void>(`/api/certificados/emision/${id}`, opts(empresa)),

  regenerarPDF: (empresa: string, id: number) =>
    api.post<{ url: string }>(
      `/api/certificados/emision/${id}/regenerar-pdf`,
      undefined,
      opts(empresa),
    ),

  /** Vista previa del certificado de una inscripción (PDF). No emite ni gasta crédito.
   *  Devuelve un Blob del PDF para mostrarlo en un iframe antes de confirmar la emisión. */
  preview: async (empresa: string, inscripcionId: number): Promise<Blob> => {
    const base  = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
    const token = authStorage.getToken(empresa) ?? '';
    const res = await fetch(`${base}/api/certificados/emision/preview/${inscripcionId}`, {
      headers: { 'x-tenant-id': empresa, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({} as { error?: string }));
      const err = new Error(data.error ?? 'No se pudo generar la vista previa') as Error & { code?: string };
      if ((data as { code?: string }).code) err.code = (data as { code?: string }).code;
      throw err;
    }
    return res.blob();
  },

  /** Endpoint público — no requiere token */
  validar: (codigo: string) =>
    api.get<CertificadoPublico>(`/public/certificado/${codigo}`),
};
