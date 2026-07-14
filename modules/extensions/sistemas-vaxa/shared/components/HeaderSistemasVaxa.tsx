import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Package, Users, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { tenantPath } from '@/lib/paths';

interface HeaderSistemasVaxaProps {
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

/* Identidad esmeralda de Sistemas Vaxa, con refinamiento premium */
const INK          = '#0D0E12';
const EMERALD      = '#059669';
const EMERALD_SOFT = '#ECFDF5';
const EMERALD_BD   = '#A7F3D0';

export default function HeaderSistemasVaxa({ tenantId, usuario, config }: HeaderSistemasVaxaProps) {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const marca = config?.name ?? 'Sistemas Vaxa';

  const handleLogout = () => {
    localStorage.removeItem(`auth_${tenantId}`);
    localStorage.removeItem(`auth_user_${tenantId}`);
    navigate(tenantPath(tenantId, '/login'));
  };

  const handleNavigation = (path: string) => {
    navigate(tenantPath(tenantId, path));
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const isActive = (path: string) => pathname?.includes(path);

  const NAV = [
    { path: '/sistemas', label: 'Sistemas', Icon: Package, active: isActive('/sistemas') && !isActive('/usuarios') },
    { path: '/usuarios', label: 'Usuarios', Icon: Users,   active: isActive('/usuarios') },
  ];

  const initial = usuario.nombre.charAt(0).toUpperCase();

  return (
    <>
      <header
        className="sticky top-0 z-50"
        style={{ background: '#FFFFFF', borderBottom: '1px solid #EEECE6' }}
      >
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="flex justify-between items-center h-14">

            {/* Marca */}
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => handleNavigation('/sistemas')}>
              <img
                src={config?.logo ?? '/vaxa.png'}
                alt={marca}
                className="h-11 w-auto object-contain"
                style={{ maxWidth: 130 }}
              />
              <span className="hidden sm:inline-block w-px h-5" style={{ background: '#E5E1D8' }} />
              <span className="hidden sm:inline text-[10px] font-semibold uppercase" style={{ color: EMERALD, letterSpacing: '0.2em' }}>
                Administración
              </span>
            </div>

            {/* Nav central */}
            <nav className="hidden md:flex items-center gap-1.5">
              {NAV.map(({ path, label, Icon, active }) => (
                <button
                  key={path}
                  onClick={() => handleNavigation(path)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150"
                  style={active
                    ? { background: EMERALD, color: '#fff' }
                    : { color: '#64748B' }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = EMERALD_SOFT; e.currentTarget.style.color = '#065F46'; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}
                >
                  <Icon className="w-[15px] h-[15px]" style={{ color: active ? '#fff' : '#94A3B8' }} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            {/* Usuario */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 pl-3 pr-1.5 py-1.5 rounded-xl transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3EE'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="text-right leading-tight">
                    <p className="text-[12.5px] font-semibold" style={{ color: INK }}>{usuario.nombre}</p>
                    <p className="text-[10.5px]" style={{ color: '#B0A898' }}>{usuario.role}</p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold"
                    style={{ background: EMERALD_SOFT, color: EMERALD, border: `1px solid ${EMERALD_BD}` }}
                  >
                    {initial}
                  </div>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden z-50 page-fade"
                      style={{ background: '#fff', border: '1px solid #EEECE6', boxShadow: '0 18px 50px rgba(13,14,18,0.12)' }}
                    >
                      <div className="p-4" style={{ borderBottom: '1px solid #F2F0EA' }}>
                        <p className="text-[13px] font-bold" style={{ color: INK }}>{usuario.nombre}</p>
                        <p className="text-[11.5px] mt-0.5" style={{ color: '#9CA3AF' }}>{usuario.email}</p>
                        <span
                          className="inline-block mt-2.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide"
                          style={{ background: EMERALD_SOFT, color: EMERALD, border: `1px solid ${EMERALD_BD}` }}
                        >
                          {usuario.role}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-[13px] font-semibold flex items-center gap-2.5 transition-colors hover:bg-red-50"
                        style={{ color: '#DC2626' }}
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Botón menú móvil */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                style={{ color: '#64748B' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F3EE'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menú móvil */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(13,14,18,0.35)', backdropFilter: 'blur(4px)' }} onClick={() => setShowMobileMenu(false)}>
          <div
            className="absolute top-14 left-0 right-0"
            style={{ background: '#fff', borderBottom: '1px solid #EEECE6', boxShadow: '0 18px 50px rgba(13,14,18,0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-6xl mx-auto px-5 py-5">
              {/* Usuario */}
              <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: '1px solid #F2F0EA' }}>
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold"
                  style={{ background: EMERALD_SOFT, color: EMERALD, border: `1px solid ${EMERALD_BD}` }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold truncate" style={{ color: INK }}>{usuario.nombre}</p>
                  <p className="text-[11.5px] mt-0.5 truncate" style={{ color: '#9CA3AF' }}>{usuario.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                {NAV.map(({ path, label, Icon, active }) => (
                  <button
                    key={path}
                    onClick={() => handleNavigation(path)}
                    className="w-full px-3.5 py-3 rounded-xl text-left text-[13.5px] font-medium flex items-center gap-3 transition-all"
                    style={active ? { background: EMERALD, color: '#fff' } : { color: '#64748B' }}
                  >
                    <Icon className="w-[18px] h-[18px]" style={{ color: active ? '#fff' : '#94A3B8' }} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #F2F0EA' }}>
                <button
                  onClick={handleLogout}
                  className="w-full px-3.5 py-3 rounded-xl text-left text-[13.5px] font-semibold flex items-center gap-3 transition-all hover:bg-red-50"
                  style={{ color: '#DC2626' }}
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
