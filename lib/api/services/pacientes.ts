// Servicio para llamadas API relacionadas con Pacientes
// El backend recibe el tenant-id y filtra los datos automáticamente

import { api } from '../client';

export interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  tenantId: string; // El backend siempre incluye el tenant-id en la respuesta
  createdAt: string;
  updatedAt: string;
}

export interface CreatePacienteDto {
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
}

export interface UpdatePacienteDto extends Partial<CreatePacienteDto> {}

/**
 * Servicio de Pacientes
 * Todas las llamadas van al mismo backend, pero incluyen tenant-id
 * El backend NestJS filtra los datos según el tenant-id
 */
export const pacientesService = {
  /**
   * Obtener todos los pacientes de un tenant
   * El backend filtra automáticamente por tenant-id
   */
  getAll: async (tenantId: string, token?: string): Promise<Paciente[]> => {
    return api.get<Paciente[]>(`/api/pacientes`, {
      tenantId, // El backend usa este header para filtrar
      token,
    });
  },

  /**
   * Obtener un paciente por ID
   * El backend valida que el paciente pertenezca al tenant
   */
  getById: async (
    id: string,
    tenantId: string,
    token?: string
  ): Promise<Paciente> => {
    return api.get<Paciente>(`/api/pacientes/${id}`, {
      tenantId,
      token,
    });
  },

  /**
   * Crear un nuevo paciente
   * El backend asigna automáticamente el tenant-id
   */
  create: async (
    data: CreatePacienteDto,
    tenantId: string,
    token?: string
  ): Promise<Paciente> => {
    return api.post<Paciente>(`/api/pacientes`, data, {
      tenantId, // El backend usa este header para asignar el tenant
      token,
    });
  },

  /**
   * Actualizar un paciente
   * El backend valida que pertenezca al tenant
   */
  update: async (
    id: string,
    data: UpdatePacienteDto,
    tenantId: string,
    token?: string
  ): Promise<Paciente> => {
    return api.put<Paciente>(`/api/pacientes/${id}`, data, {
      tenantId,
      token,
    });
  },

  /**
   * Eliminar un paciente
   * El backend valida que pertenezca al tenant
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
