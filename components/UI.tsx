import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative w-full max-w-md bg-[#FFF8E1] border-4 border-[#8D6E63] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-[#8D6E63] text-white">
          <h2 className="text-xl font-black tracking-wide uppercase shadow-sm">{title}</h2>
          <button 
            onClick={onClose}
            className="bg-white/20 p-1 rounded-full hover:bg-white/40 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[70vh] overflow-y-auto scrollbar-hide text-[#3E2723]">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ChunkyButton: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'cyan' | 'green' | 'red' | 'yellow' | 'wood';
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'green', className = '', disabled = false }) => {
  
  const styles = {
    cyan: 'bg-cyan-500 border-cyan-700 text-white',
    green: 'bg-green-500 border-green-700 text-white',
    red: 'bg-red-500 border-red-700 text-white',
    yellow: 'bg-yellow-400 border-yellow-600 text-yellow-900',
    wood: 'bg-[#8D6E63] border-[#5D4037] text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-3 rounded-xl font-bold uppercase tracking-wider
        border-b-[6px] active:border-b-0 active:translate-y-[6px]
        transition-all shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        ${styles[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

// --- Toast System ---
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
}

export const ToastContainer: React.FC<{ toasts: Toast[] }> = ({ toasts }) => {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-xs pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            animate-in slide-in-from-top-4 fade-in duration-300
            flex items-center justify-center py-2 px-4 rounded-full shadow-xl
            border-2
            ${t.type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-blue-100 border-blue-500 text-blue-700'}
          `}
        >
          <span className="font-bold text-sm">{t.message}</span>
        </div>
      ))}
    </div>
  );
};

// --- Confirmation Modal ---
export interface ConfirmDialogData {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  variant?: 'warning' | 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogData> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon,
  variant = 'warning',
  onConfirm,
  onCancel,
  children
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    warning: {
      bg: 'bg-amber-50 border-amber-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-500',
      confirmBtn: 'bg-amber-500 border-amber-700 hover:bg-amber-600'
    },
    danger: {
      bg: 'bg-red-50 border-red-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      confirmBtn: 'bg-red-500 border-red-700 hover:bg-red-600'
    },
    info: {
      bg: 'bg-blue-50 border-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-500',
      confirmBtn: 'bg-blue-500 border-blue-700 hover:bg-blue-600'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className={`relative w-full max-w-sm ${styles.bg} border-4 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        <div className="p-6 text-center">
          {icon && (
            <div className={`w-16 h-16 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {icon}
            </div>
          )}
          <h3 className="text-xl font-black uppercase text-gray-800 mb-2">{title}</h3>
          {message && <p className="text-gray-600 font-medium mb-4">{message}</p>}
          {children}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl font-bold uppercase tracking-wider border-b-4 border-gray-300 bg-gray-200 text-gray-600 hover:bg-gray-300 active:border-b-0 active:translate-y-1 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-wider text-white border-b-4 active:border-b-0 active:translate-y-1 transition-all ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};