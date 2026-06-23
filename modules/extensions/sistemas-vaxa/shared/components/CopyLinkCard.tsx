'use client';

import { useState } from 'react';
import { Copy, Check } from '@/components/ui/icon';

interface Props {
  label: string;
  value: string;
}

export default function CopyLinkCard({ label, value }: Props) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(value);
    setCopiado(true);

    setTimeout(() => {
      setCopiado(false);
    }, 1500);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold" style={{ color: '#64748B' }}>
        {label}
      </p>

      <div
        className="flex gap-2 items-center rounded-xl p-2"
        style={{
          background: '#FAFAF8',
          border: '1px solid #EEECE6',
        }}
      >
        <code className="flex-1 text-xs break-all text-slate-700">
          {value}
        </code>

        <button
          onClick={copiar}
          className="
            flex items-center gap-1
            px-3 py-1.5
            rounded-lg
            text-xs font-semibold
            transition-all duration-200
            hover:scale-105
            active:scale-95
          "
          style={{
            background: copiado ? '#ECFDF5' : '#FFFFFF',
            border: '1px solid #EEECE6',
            color: copiado ? '#059669' : '#64748B',
          }}
        >
          {copiado ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copiar
            </>
          )}
        </button>
      </div>
    </div>
  );
}