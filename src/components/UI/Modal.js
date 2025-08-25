import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnOverlay = true 
}) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

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
    <div className="modal">
      {/* Overlay */}
      <div 
        className="overlay backdrop-blur-sm"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className={`modal-content ${sizeClasses[size]} animate-fade-in`}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmation', 
  message = 'Êtes-vous sûr de vouloir continuer ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'primary'
}) {
  const variantClasses = {
    primary: 'btn-primary',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white font-medium py-2 px-4 rounded-lg transition-colors',
    warning: 'bg-warning-600 hover:bg-warning-700 text-white font-medium py-2 px-4 rounded-lg transition-colors'
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size="sm"
    >
      <div className="text-center">
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {message}
        </p>
        
        <div className="flex justify-center space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={variantClasses[variant]}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function NotificationModal({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title, 
  message,
  autoClose = false,
  autoCloseDelay = 5000 
}) {
  const typeConfig = {
    success: {
      icon: '✅',
      bgColor: 'bg-success-50 dark:bg-success-900/20',
      textColor: 'text-success-800 dark:text-success-300',
      borderColor: 'border-success-200 dark:border-success-800'
    },
    error: {
      icon: '❌',
      bgColor: 'bg-danger-50 dark:bg-danger-900/20',
      textColor: 'text-danger-800 dark:text-danger-300',
      borderColor: 'border-danger-200 dark:border-danger-800'
    },
    warning: {
      icon: '⚠️',
      bgColor: 'bg-warning-50 dark:bg-warning-900/20',
      textColor: 'text-warning-800 dark:text-warning-300',
      borderColor: 'border-warning-200 dark:border-warning-800'
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
      textColor: 'text-primary-800 dark:text-primary-300',
      borderColor: 'border-primary-200 dark:border-primary-800'
    }
  };

  const config = typeConfig[type];

  useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, isOpen, onClose]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="sm"
      showCloseButton={false}
    >
      <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 text-center`}>
        <div className="text-4xl mb-3">{config.icon}</div>
        
        {title && (
          <h3 className={`text-lg font-semibold ${config.textColor} mb-2`}>
            {title}
          </h3>
        )}
        
        <p className={config.textColor}>
          {message}
        </p>
        
        <button
          onClick={onClose}
          className="mt-4 btn-primary"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}

export default { Modal, ConfirmModal, NotificationModal };