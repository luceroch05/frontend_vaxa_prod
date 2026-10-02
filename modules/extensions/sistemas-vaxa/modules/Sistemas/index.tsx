'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TenantConfig } from '@/lib/tenants';
import { tenantPath } from '@/lib/paths';
import {
  ChevronRight, FileText, Activity, Plus, Building2,
} from '@/components/ui/icon';
import HeaderSistemasVaxa from '../../shared/components/HeaderSistemasVaxa';
import { VAXA_CONFIG } from '../../shared/constants';

/** Productos (sistemas) de Vaxa. Escalable: agrega uno y aparece como tarjeta. */
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

export default function Sistemas({ tenantId }: SistemasProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const authData = localStorage.getItem(`auth_${tenantId}`);
    const userData = localStorage.getItem(`auth_user_${tenantId}`);

    if (!authData || authData !== 'true') {
      navigate(tenantPath(tenantId, '/login'));
      return;
    }

    if (userData) {
      try { setUsuario(JSON.parse(userData)); }
      catch { navigate(tenantPath(tenantId, '/login')); return; }
    }

    setLoading(false);
  }, [tenantId, navigate]);

  if (loading || !usuario) return null;

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

      <main className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        {/* Bienvenida */}
        <div className="mb-6 page-enter">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] mb-1" style={{ color: '#059669' }}>Panel de administración</p>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: '#0D0E12' }}>
            Hola, {usuario.nombre.split(' ')[0]} 👋
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#9CA3AF' }}>Elige un sistema para administrar o registra un nuevo cliente. Todo lo de finanzas y cobros está en el menú de la izquierda.</p>
        </div>

        {/* Registrar cliente (acción central) */}
        <button
          onClick={() => navigate(tenantPath(tenantId, '/registrar-empresa'))}
          className="w-full mb-5 flex items-center justify-between p-4 rounded-2xl transition-all group text-white page-enter"
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

        {/* Productos */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2.5 page-enter stagger-1" style={{ color: '#B0A898' }}>Sistemas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 page-enter stagger-1">
          {PRODUCTOS_HUB.map((p) => (
            <button
              key={p.to}
              onClick={() => navigate(tenantPath(tenantId, p.to))}
              className="sv-card p-5 text-left transition-all hover:-translate-y-0.5 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${p.color}, #0F766E)` }}>
                  <p.Icon className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 transition-all group-hover:translate-x-1" style={{ color: '#C8C3BB' }} />
              </div>
              <p className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>{p.nombre}</p>
              <p className="text-[12.5px] mt-0.5" style={{ color: '#9CA3AF' }}>{p.desc}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
