import React from 'react';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
}

const Modal: React.FC<ModalProps> = ({ children, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/75 backdrop-blur-lg">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(280px,calc(100vw-32px))] h-[min(280px,calc(100vh-32px))] bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-2xl animate-fade-in flex flex-col rounded-[20px] border border-white/10 text-center">
        {children}
      </div>
    </div>
  );
};

export default Modal; 