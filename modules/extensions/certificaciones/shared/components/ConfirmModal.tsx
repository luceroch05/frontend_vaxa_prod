import { useEffect } from 'react';
import { AlertTriangle, X } from '@/components/ui/icon';

export interface ConfirmModalProps {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal de confirmación con estilo del sistema "Credencial".
 * Presentacional: no maneja su propia visibilidad (la controla useConfirm/ConfirmProvider).
 * Cierra con ESC y confirma con Enter.
 */
export default function ConfirmModal({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      else if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onConfirm, onCancel]);

  const danger = variant === 'danger';
  const accent = danger ? '#DC2626' : '#0D0E12';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(13,14,18,0.45)', backdropFilter: 'blur(4px)' }}
      onMouseDown={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-[400px] bg-white rounded-2xl overflow-hidden"
        style={{
          border: '1px solid rgba(15,24,41,0.08)',
          boxShadow: '0 20px 60px -12px rgba(13,14,18,0.35)',
          animation: 'vxConfirmIn 200ms cubic-bezier(0.22,1,0.36,1)',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: danger ? '#FEF2F2' : '#F5F4F0', color: accent }}
            >
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[15px] font-bold" style={{ color: '#0D0E12' }}>
                {title}
              </p>
              {message && (
                <p className="text-[13px] mt-1 whitespace-pre-line" style={{ color: '#6B7280', lineHeight: 1.5 }}>
                  {message}
                </p>
              )}
            </div>
            <button
              onClick={onCancel}
              className="p-1 rounded-lg transition-colors hover:bg-[#F5F4F0] flex-shrink-0"
              style={{ color: '#B0A898' }}
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-5">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-[13px] font-semibold rounded-xl transition-colors"
              style={{ color: '#4B5563', border: '1px solid rgba(15,24,41,0.12)' }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className="px-4 py-2 text-[13px] font-semibold rounded-xl text-white transition-opacity hover:opacity-90"
              style={{ background: accent }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vxConfirmIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
