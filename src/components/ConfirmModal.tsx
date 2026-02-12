import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'danger' | 'primary';
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmClass =
    confirmVariant === 'danger'
      ? 'bg-red-500/85 text-white hover:bg-red-500'
      : 'bg-accent-green text-bg-primary hover:brightness-110';

  return (
    <div className="fixed inset-0 z-[10030] bg-black/75 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="w-[min(420px,calc(100vw-24px))] rounded-[20px] border border-border-primary bg-bg-primary shadow-[0_20px_60px_rgba(0,0,0,0.5)] px-6 py-6">
        <h3 className="m-0 font-primary text-[22px] font-bold text-text-primary">{title}</h3>
        <p className="mt-3 mb-0 font-primary text-[13px] text-text-secondary">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-[48px] rounded-xl border border-border-secondary bg-bg-card text-text-primary font-primary text-[14px] font-semibold hover:bg-bg-card-alt"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 h-[48px] rounded-xl border-none font-primary text-[14px] font-semibold transition-all duration-200 ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
