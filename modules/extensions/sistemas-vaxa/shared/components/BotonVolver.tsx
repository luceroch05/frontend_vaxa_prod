'use client';

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@/components/ui/icon';

interface BotonVolverProps {
  /** Ruta a la que navega. Si se pasa `onClick`, este tiene prioridad. */
  to?: string;
  /** Acción personalizada (ej. navigate(-1)). Si se omite, usa `to`. */
  onClick?: () => void;
  /** Texto del botón. */
  children?: React.ReactNode;
  className?: string;
}

/** Botón "volver" reutilizable (flecha + texto), mismo estilo en todas las pantallas de sistemas-vaxa. */
export default function BotonVolver({ to, onClick, children = 'Volver al panel', className = '' }: BotonVolverProps) {
  const navigate = useNavigate();
  const handle = onClick ?? (() => to && navigate(to));
  return (
    <button
      onClick={handle}
      className={`flex items-center gap-1.5 mb-5 text-[13px] font-medium transition-colors group ${className}`}
      style={{ color: '#64748B' }}
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      {children}
    </button>
  );
}
