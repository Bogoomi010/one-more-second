import React from 'react';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
}

const Modal: React.FC<ModalProps> = ({ children, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[9999]"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className="rounded-lg p-6 flex items-center justify-center"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '280px',
          height: '280px',
          background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 5px 10px rgba(0, 0, 0, 0.2)',
          animation: 'modal-slide-up 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}
      >
        {children}
      </div>
      <style>
        {`
          @keyframes modal-slide-up {
            from {
              opacity: 0;
              transform: translate(-50%, calc(-50% + 20px));
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Modal; 