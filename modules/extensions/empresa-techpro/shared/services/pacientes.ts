// Servicio API específico para Pacientes de empresa-techpro
// Puede tener lógica diferente al servicio core de pacientes

import { api } from '@/lib/api/client';

export interface PacienteTechPro {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  // Campos específicos de TechPro si los hay
  codigoTechPro?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePacienteTechProDto {
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  codigoTechPro?: string;
}

export const pacientesService = {
  /**
   * Obtener todos los pacientes del tenant
   */
  getAll: async (tenantId: string, token?: string): Promise<PacienteTechPro[]> => {
    return api.get<PacienteTechPro[]>(`/api/pacientes`, {
      tenantId,
      token,
    });
  },

  /**
   * Obtener un paciente por ID
   */
  getById: async (
    id: string,
    tenantId: string,
    token?: string
  ): Promise<PacienteTechPro> => {
    return api.get<PacienteTechPro>(`/api/pacientes/${id}`, {
      tenantId,
      token,
    });
  },

  /**
   * Crear un nuevo paciente
   */
  create: async (
    data: CreatePacienteTechProDto,
    tenantId: string,
    token?: string
  ): Promise<PacienteTechPro> => {
    return api.post<PacienteTechPro>(`/api/pacientes`, data, {
      tenantId,
      token,
    });
  },

  /**
   * Actualizar un paciente
   */
  update: async (
    id: string,
    data: Partial<CreatePacienteTechProDto>,
    tenantId: string,
    token?: string
  ): Promise<PacienteTechPro> => {
    return api.put<PacienteTechPro>(`/api/pacientes/${id}`, data, {
      tenantId,
      token,
    });
  },

  /**
   * Eliminar un paciente
   */
  delete: async (
    id: string,
    tenantId: string,
    token?: string
  ): Promise<void> => {
    return api.delete<void>(`/api/pacientes/${id}`, {
      tenantId,
      token,
    });
  },
};
