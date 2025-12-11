// Servicio para llamadas API relacionadas con Terapeutas

import { api } from '../client';

export interface Terapeuta {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidad: string;
  activo: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTerapeutaDto {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  especialidad: string;
}

export interface UpdateTerapeutaDto extends Partial<CreateTerapeutaDto> {
  activo?: boolean;
}

/**
 * Servicio de Terapeutas
 */
export const terapeutasService = {
  /**
   * Obtener todos los terapeutas de un tenant
   */
  getAll: async (tenantId: string, token?: string): Promise<Terapeuta[]> => {
    return api.get<Terapeuta[]>(`/api/terapeutas`, {
      tenantId,
      token,
    });
  },

  /**
   * Obtener terapeutas activos
   */
  getActivos: async (
    tenantId: string,
    token?: string
  ): Promise<Terapeuta[]> => {
    return api.get<Terapeuta[]>(`/api/terapeutas?activo=true`, {
      tenantId,
      token,
    });
  },

  /**
   * Obtener un terapeuta por ID
   */
  getById: async (
    id: string,
    tenantId: string,
    token?: string
  ): Promise<Terapeuta> => {
    return api.get<Terapeuta>(`/api/terapeutas/${id}`, {
      tenantId,
      token,
    });
  },

  /**
   * Crear un nuevo terapeuta
   */
  create: async (
    data: CreateTerapeutaDto,
    tenantId: string,
    token?: string
  ): Promise<Terapeuta> => {
    return api.post<Terapeuta>(`/api/terapeutas`, data, {
      tenantId,
      token,
    });
  },

  /**
   * Actualizar un terapeuta
   */
  update: async (
    id: string,
    data: UpdateTerapeutaDto,
    tenantId: string,
    token?: string
  ): Promise<Terapeuta> => {
    return api.put<Terapeuta>(`/api/terapeutas/${id}`, data, {
      tenantId,
      token,
    });
  },

  /**
   * Eliminar un terapeuta
   */
  delete: async (
    id: string,
    tenantId: string,
    token?: string
  ): Promise<void> => {
    return api.delete<void>(`/api/terapeutas/${id}`, {
      tenantId,
      token,
    });
  },
};

