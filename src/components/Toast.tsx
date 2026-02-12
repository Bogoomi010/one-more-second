import React from 'react';

type ToastVariant = 'info' | 'success' | 'error';

interface ToastProps {
  message: string | null;
  visible: boolean;
  variant?: ToastVariant;
}

const VARIANT_CLASS_MAP: Record<ToastVariant, string> = {
  info: 'border-border-secondary bg-bg-card text-text-primary',
  success: 'border-green-500/40 bg-green-500/10 text-green-100',
  error: 'border-red-500/40 bg-red-500/10 text-red-100',
};

function Toast({ message, visible, variant = 'info' }: ToastProps) {
  if (!visible || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed right-5 bottom-5 z-[10020] px-4 py-2 rounded-xl border text-[12px] font-primary shadow-lg ${VARIANT_CLASS_MAP[variant]}`}
    >
      {message}
    </div>
  );
}

export default Toast;
