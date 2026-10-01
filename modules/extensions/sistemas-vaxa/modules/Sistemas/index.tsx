'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import {
  Package,
  Users,
  ChevronRight,
  Globe,
  FileText,
  Activity,
  Plus,
  Building2,
  DollarSign,
  ClipboardList,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';

/** Productos (sistemas) de Vaxa. Escalable: agrega uno y aparece como ítem en el panel. */
const PRODUCTOS_HUB = [
  { to: '/certificaciones',    nombre: 'Certificados',       desc: 'Empresas, planes, cobros y facturación', Icon: FileText, color: '#059669' },
  { to: '/historias-clinicas', nombre: 'Historias Clínicas', desc: 'Centros terapéuticos y sus módulos',      Icon: Activity, color: '#0F766E' },
];

interface SistemasProps {
  tenantId: string;
  tenant: TenantConfig;
}

interface Usuario {
  email: string;
  nombre: string;
  role: string;
}

export default function Sistemas({ tenantId, tenant }: SistemasProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    // Verificar que tenantId existe
    if (!tenantId) {
      console.error('TenantId is undefined');
      return;
    }

    const authData = localStorage.getItem(`auth_${tenantId}`);
    const userData = localStorage.getItem(`auth_user_${tenantId}`);

    if (!authData || authData !== 'true') {
      navigate(tenantPath(tenantId, '/login'));
      return;
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUsuario(user);
      } catch (error) {
        navigate(tenantPath(tenantId, '/login'));
        return;
      }
    }

    setLoading(false);
  }, [tenantId, navigate]);

  if (loading || !usuario) {
    return null;
  }

  // Verificar que tenantId está disponible antes de renderizar
  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F4F0' }}>
        <p className="text-[15px] font-semibold" style={{ color: '#DC2626' }}>Error: Tenant ID no disponible</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F4F0' }}>
      <HeaderSistemasVaxa
        tenantId={tenantId}
        usuario={usuario}
        config={{
          name: VAXA_CONFIG.NAME,
          primaryColor: VAXA_CONFIG.PRIMARY_COLOR,
          secondaryColor: VAXA_CONFIG.SECONDARY_COLOR,
        }}
      />

      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-7">
        {/* Header */}
        <div className="mb-6 page-enter">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Sistemas Vaxa</p>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>Panel de administración</h1>
          <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Gestiona los sistemas y usuarios de Vaxa.</p>
        </div>

        {/* Registro CENTRALIZADO de clientes: un solo lugar para dar de alta cualquier
            cliente (SaaS y/o servicios a medida con su dominio/hosting). */}
        <button
          onClick={() => navigate(tenantPath(tenantId, '/registrar-empresa'))}
          className="w-full mb-4 flex items-center justify-between p-4 rounded-2xl transition-all group text-white page-enter"
          style={{ background: 'linear-gradient(135deg, #059669, #0F766E)', boxShadow: '0 12px 28px -14px rgba(5,150,105,0.6)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-[15px] font-bold flex items-center gap-1.5"><Plus className="w-4 h-4" /> Registrar cliente / empresa</p>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.85)' }}>SaaS, web, catálogo, dominios y hosting — todo en un solo registro</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 transition-all group-hover:translate-x-1" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sistemas / Productos de Vaxa — un ítem por producto (escalable) */}
          <div className="sv-card p-5 page-enter stagger-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Sistemas</h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Elige el producto que quieres administrar</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#059669' }}>
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              {PRODUCTOS_HUB.map((p) => (
                <button
                  key={p.to}
                  onClick={() => navigate(tenantPath(tenantId, p.to))}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all group"
                  style={{ border: '1px solid #EEECE6' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAF8'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#EEECE6'; }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `linear-gradient(135deg, ${p.color}, #0F766E)` }}>
                      <p.Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[14px] font-bold" style={{ color: '#0D0E12' }}>{p.nombre}</p>
                      <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>{p.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Gestión de Usuarios */}
          <div className="sv-card p-5 page-enter stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Gestión de usuarios</h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Usuarios de sistemas-vaxa</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0D0E12' }}>
                <Users className="w-5 h-5" style={{ color: '#059669' }} />
              </div>
            </div>

            <button
              onClick={() => navigate(tenantPath(tenantId, '/usuarios'))}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all group"
              style={{ border: '1px solid #EEECE6' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAF8'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#EEECE6'; }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <Users className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
                </div>
                <div className="text-left">
                  <p className="text-[13.5px] font-semibold" style={{ color: '#0D0E12' }}>Ver usuarios</p>
                  <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>Gestiona accesos a sistemas-vaxa</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
            </button>
          </div>

          {/* Infraestructura (VPS / dominios / hosting) */}
          <div className="sv-card p-5 page-enter stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Infraestructura</h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>VPS, dominios y hosting</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0D0E12' }}>
                <Package className="w-5 h-5" style={{ color: '#059669' }} />
              </div>
            </div>

            <button
              onClick={() => navigate(tenantPath(tenantId, '/infraestructura'))}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all group"
              style={{ border: '1px solid #EEECE6' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAF8'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#EEECE6'; }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <Package className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
                </div>
                <div className="text-left">
                  <p className="text-[13.5px] font-semibold" style={{ color: '#0D0E12' }}>Ver infraestructura</p>
                  <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>Pagos, cobros y vencimientos</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
            </button>
          </div>

          {/* Facturación y cobros — transversal a TODOS los sistemas (no solo Certificados) */}
          <div className="sv-card p-5 page-enter stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Facturación y cobros</h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Para todos los sistemas y servicios</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0D0E12' }}>
                <DollarSign className="w-5 h-5" style={{ color: '#059669' }} />
              </div>
            </div>
            <div className="space-y-2">
              {[
                { to: '/tarifario',    Icon: Package,       t: 'Tarifario',    d: 'Planes, paquetes y servicios (precios)' },
                { to: '/cotizaciones', Icon: ClipboardList, t: 'Cotizaciones', d: 'Propuestas; al aceptar se convierten en venta' },
                { to: '/facturacion',  Icon: DollarSign,    t: 'Facturación',  d: 'Emitir boletas/facturas a cualquier cliente' },
              ].map((it) => (
                <button key={it.to}
                  onClick={() => navigate(tenantPath(tenantId, it.to))}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-all group"
                  style={{ border: '1px solid #EEECE6' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAF8'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#EEECE6'; }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                      <it.Icon className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
                    </div>
                    <div className="text-left">
                      <p className="text-[13.5px] font-semibold" style={{ color: '#0D0E12' }}>{it.t}</p>
                      <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>{it.d}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Redes de la landing */}
          <div className="sv-card p-5 page-enter stagger-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>Landing de Vaxa</h2>
                <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>Redes y contacto de la web</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#0D0E12' }}>
                <Globe className="w-5 h-5" style={{ color: '#059669' }} />
              </div>
            </div>

            <button
              onClick={() => navigate(tenantPath(tenantId, '/landing'))}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all group"
              style={{ border: '1px solid #EEECE6' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAF8'; e.currentTarget.style.borderColor = '#A7F3D0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#EEECE6'; }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <Globe className="w-[18px] h-[18px]" style={{ color: '#059669' }} />
                </div>
                <div className="text-left">
                  <p className="text-[13.5px] font-semibold" style={{ color: '#0D0E12' }}>Editar redes</p>
                  <p className="text-[11.5px]" style={{ color: '#9CA3AF' }}>Facebook, Instagram, WhatsApp…</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
