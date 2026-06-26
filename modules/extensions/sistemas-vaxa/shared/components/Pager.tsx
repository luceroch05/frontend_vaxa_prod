'use client';

import { ChevronLeft, ChevronRight } from '@/components/ui/icon';

interface PagerProps {
  /** Página actual (1-based). */
  page: number;
  /** Total de páginas. */
  pages: number;
  /** Total de filas (para el contador "N en total"). */
  total: number;
  /** Cambia de página. */
  onPage: (p: number) => void;
}

/** Pie de paginación reutilizable de sistemas-vaxa (anterior · página X de Y · siguiente). */
export default function Pager({ page, pages, total, onPage }: PagerProps) {
  if (pages <= 1) return null;
  const btn = (disabled: boolean): React.CSSProperties => ({
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'default' : 'pointer',
    border: '1px solid #EEECE6',
    borderRadius: 8,
    padding: '4px 8px',
    background: '#fff',
    color: '#374151',
  });
  return (
    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid #F2F0EA' }}>
      <span className="text-[11.5px]" style={{ color: '#9CA3AF' }}>
        {total} en total · página {page} de {pages}
      </span>
      <div className="flex items-center gap-1.5">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} style={btn(page <= 1)} title="Anterior">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} style={btn(page >= pages)} title="Siguiente">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
