'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, duration = 4000) => {
    const id = Date.now().toString();
    const toast: Toast = { id, type, message, duration };
    
    setToasts((prev) => [...prev, toast]);

    // Auto-remove for success and info toasts
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    // Error and warning toasts must be manually dismissed
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 200);
  };

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => {
      const element = document.getElementById(`toast-${toast.id}`);
      if (element) {
        element.classList.remove('translate-y-[-100%]', 'opacity-0');
        element.classList.add('translate-y-0', 'opacity-100');
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [toast.id]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500/90 backdrop-blur-md';
      case 'error':
        return 'bg-red-500/90 backdrop-blur-md';
      case 'warning':
        return 'bg-yellow-500/90 backdrop-blur-md';
      case 'info':
        return 'bg-blue-500/90 backdrop-blur-md';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-white" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-white" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-white" />;
      case 'info':
        return <Info className="w-6 h-6 text-white" />;
    }
  };

  return (
    <div
      id={`toast-${toast.id}`}
      className={`
        ${getToastStyles()}
        ${isExiting ? 'animate-out fade-out slide-out-to-top' : 'animate-in fade-in slide-in-from-top'}
        rounded-lg shadow-lg p-4 flex items-center gap-3 pointer-events-auto
        transition-all duration-200 transform translate-y-[-100%] opacity-0
        min-w-[300px] max-w-[500px]
      `}
    >
      {getIcon()}
      <span className="text-white font-medium flex-1">{toast.message}</span>
      {(toast.type === 'error' || toast.type === 'warning') && (
        <button
          onClick={handleRemove}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// Convenience functions for common toast types
export function showSuccessToast(message: string) {
  // This will be called from components that have access to the context
  // Usage: const { showToast } = useToast(); showToast('success', message);
}

export function showErrorToast(message: string) {
  // This will be called from components that have access to the context
  // Usage: const { showToast } = useToast(); showToast('error', message);
}

export function showWarningToast(message: string) {
  // This will be called from components that have access to the context
  // Usage: const { showToast } = useToast(); showToast('warning', message);
}

export function showInfoToast(message: string) {
  // This will be called from components that have access to the context
  // Usage: const { showToast } = useToast(); showToast('info', message);
}