import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { authStorage } from '@/lib/auth';
import { ApiError } from '@/lib/api/client';
import { certPath } from '@/lib/paths';

export function useAuth(empresa: string) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (correo: string, contrasena: string) => {
    setLoading(true);
    setError(null);
    console.log('[useAuth] login llamado con empresa=', empresa, 'correo=', correo);
    try {
      const { token, usuario } = await authApi.login(empresa, correo, contrasena);
      authStorage.setSession(empresa, token, usuario);
      navigate(certPath(empresa, '/panel'));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 401 ? 'Credenciales incorrectas' : err.message);
      } else {
        setError('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authStorage.clearSession(empresa);
    navigate(certPath(empresa, '/login'));
  };

  return {
    login,
    logout,
    loading,
    error,
    isAuthenticated: authStorage.isAuthenticated(empresa),
    user: authStorage.getUser(empresa),
  };
}
