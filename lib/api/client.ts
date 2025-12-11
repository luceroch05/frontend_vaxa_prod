// Cliente HTTP base para llamadas a la API
// Todas las llamadas van al mismo backend, pero incluyen tenant-id

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  tenantId?: string; // REQUERIDO: El backend necesita saber de qué tenant es la petición
  token?: string;
}

/**
 * Cliente HTTP base con interceptores y manejo de errores
 * Siempre envía el tenant-id al backend para que sepa de qué empresa son los datos
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { tenantId, token, ...fetchOptions } = options;

  // Construir URL completa (mismo backend para todos)
  const url = `${API_URL}${endpoint}`;

  // Headers por defecto
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  // CRÍTICO: Agregar tenant-id siempre (el backend lo necesita para filtrar datos)
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  } else {
    console.warn('⚠️ Llamada API sin tenantId - el backend necesita este header');
  }

  // Agregar token de autenticación si está disponible
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Manejar errores HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new ApiError(
        errorData.message || 'Error en la petición',
        response.status,
        errorData
      );
    }

    // Retornar datos parseados
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Error de conexión', 0, { originalError: error });
  }
}

/**
 * Clase de error personalizada para la API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Métodos HTTP helpers
 */
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

