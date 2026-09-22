import React, { useEffect, useRef } from 'react';

function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal panel */}
      <div 
        ref={modalRef}
        className={`relative w-full ${maxWidth} transform overflow-hidden rounded-2xl p-6 text-left shadow-xl transition-all animate-scale-in`}
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--line)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            style={{ color: 'var(--muted)' }}
          >
            ✕
          </button>
        </div>
        
        <div className="max-h-[75vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
