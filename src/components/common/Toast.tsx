import React from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3 rounded-lg shadow-lg border text-xs flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150 ${
            t.type === 'success'
              ? 'bg-[#0f1f17] border-emerald-800 text-emerald-200'
              : t.type === 'error'
              ? 'bg-[#241212] border-red-800 text-red-200'
              : 'bg-[#141b29] border-blue-800 text-blue-200'
          }`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-zinc-400 hover:text-white font-mono cursor-pointer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
