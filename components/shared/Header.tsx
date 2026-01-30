'use client';

import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { LogOut, Building2, History, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  tenantId: string;
  usuario: {
    nombre: string;
    email: string;
    role: string;
  };
  config?: {
    logo?: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

export default function Header({ tenantId, usuario, config }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Valores por defecto si no se pasa config
  const tenantConfig = config || {
    name: tenantId,
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6'
  };

  const handleLogout = () => {
    localStorage.removeItem(`auth_${tenantId}`);
    localStorage.removeItem(`auth_user_${tenantId}`);
    router.push(`/${tenantId}/login`);
  };

  const handleNavigation = (path: string) => {
    router.push(`/${tenantId}${path}`);
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const isActive = (path: string) => {
    return pathname?.includes(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y nombre */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavigation('/')}>
              {tenantConfig.logo ? (
                <Image
                  src={tenantConfig.logo}
                  alt={tenantConfig.name}
                  width={32}
                  height={32}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: tenantConfig.primaryColor }}
                >
                  <Building2 className="w-4 h-4" />
                </div>
              )}
              <h1 className="text-base font-semibold text-gray-900">
                {tenantConfig.name}
              </h1>
            </div>

            {/* Centro - Navegación minimalista */}
            <nav className="hidden md:flex items-center gap-2">
              <button
                onClick={() => handleNavigation('/historial')}
                className={`min-w-[120px] px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                  isActive('/historial')
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={
                  isActive('/historial')
                    ? { backgroundColor: tenantConfig.primaryColor }
                    : undefined
                }
              >
                <History className="w-4 h-4" />
                <span>Historial</span>
              </button>
              <button
                onClick={() => handleNavigation('/participantes')}
                className={`min-w-[140px] px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                  isActive('/participantes')
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={
                  isActive('/participantes')
                    ? { backgroundColor: tenantConfig.primaryColor }
                    : undefined
                }
              >
                <Users className="w-4 h-4" />
                <span>Participantes</span>
              </button>
            </nav>

            {/* Derecha - Usuario */}
            <div className="flex items-center gap-3">
              {/* Desktop */}
              <div className="hidden md:block">
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {usuario.nombre}
                      </p>
                      <p className="text-xs text-gray-500">{usuario.role}</p>
                    </div>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: tenantConfig.primaryColor }}
                    >
                      {usuario.nombre.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  {showUserMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 animate-fade-in">
                        <div className="p-4 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{usuario.nombre}</p>
                          <p className="text-xs text-gray-500 mt-1">{usuario.email}</p>
                          <span 
                            className="inline-block mt-3 px-2.5 py-1 rounded-md text-xs font-medium text-white"
                            style={{ backgroundColor: tenantConfig.primaryColor }}
                          >
                            {usuario.role}
                          </span>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-50"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div
            className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-7xl mx-auto px-6 py-6">
              {/* Usuario info */}
              <div className="flex items-center gap-3 pb-6 border-b border-gray-100 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: tenantConfig.primaryColor }}
                >
                  {usuario.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{usuario.nombre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{usuario.email}</p>
                  <span 
                    className="inline-block mt-2 px-2.5 py-1 rounded-md text-xs font-medium text-white"
                    style={{ backgroundColor: tenantConfig.primaryColor }}
                  >
                    {usuario.role}
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <div className="space-y-2">
                <button
                  onClick={() => handleNavigation('/historial')}
                  className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium flex items-center gap-3 ${
                    isActive('/historial')
                      ? 'text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={
                    isActive('/historial')
                      ? { backgroundColor: tenantConfig.primaryColor }
                      : undefined
                  }
                >
                  <History className="w-5 h-5" />
                  <span>Historial</span>
                </button>
                <button
                  onClick={() => handleNavigation('/participantes')}
                  className={`w-full px-4 py-3 rounded-lg text-left text-sm font-medium flex items-center gap-3 ${
                    isActive('/participantes')
                      ? 'text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={
                    isActive('/participantes')
                      ? { backgroundColor: tenantConfig.primaryColor }
                      : undefined
                  }
                >
                  <Users className="w-5 h-5" />
                  <span>Participantes</span>
                </button>
              </div>

              {/* Logout */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-lg text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}