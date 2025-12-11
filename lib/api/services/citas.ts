// Servicio para llamadas API relacionadas con Citas

import { api } from '../client';

export interface Cita {
  id: string;
  pacienteId: string;
  terapeutaId: string;
  fecha: string;
  hora: string;
  duracion: number; // en minutos
  estado: 'programada' | 'completada' | 'cancelada';
  notas?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCitaDto {
  pacienteId: string;
  terapeutaId: string;
  fecha: string;
  hora: string;
  duracion: number;
  notas?: string;
}

export interface UpdateCitaDto extends Partial<CreateCitaDto> {
  estado?: 'programada' | 'completada' | 'cancelada';
}

/**
 * Servicio de Citas
 */
export const citasService = {
  /**
   * Obtener todas las citas de un tenant
   */
  getAll: async (tenantId: string, token?: string): Promise<Cita[]> => {
    return api.get<Cita[]>(`/api/citas`, {
      tenantId,
      token,
    });
  },

  /**
   * Obtener citas por fecha
   */
  getByDate: async (
    date: string,
    tenantId: string,
    token?: string
  ): Promise<Cita[]> => {
    return api.get<Cita[]>(`/api/citas?fecha=${date}`, {
      tenantId,
      token,
    });
  },

  /**
   * Obtener una cita por ID
   */
  getById: async (
    id: string,
    tenantId: string,
    token?: string
  ): Promise<Cita> => {
    return api.get<Cita>(`/api/citas/${id}`, {
      tenantId,
      token,
    });
  },

  /**
   * Crear una nueva cita
   */
  create: async (
    data: CreateCitaDto,
    tenantId: string,
    token?: string
  ): Promise<Cita> => {
    return api.post<Cita>(`/api/citas`, data, {
      tenantId,
      token,
    });
  },

  /**
   * Actualizar una cita
   */
  update: async (
    id: string,
    data: UpdateCitaDto,
    tenantId: string,
    token?: string
  ): Promise<Cita> => {
    return api.patch<Cita>(`/api/citas/${id}`, data, {
      tenantId,
      token,
    });
  },

  /**
   * Eliminar una cita
   */
  delete: async (
    id: string,
    tenantId: string,
    token?: string
  ): Promise<void> => {
    return api.delete<void>(`/api/citas/${id}`, {
      tenantId,
      token,
    });
  },
};

