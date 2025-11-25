import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from '@/components/Toast';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (config: ToastConfig | string) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const [duration, setDuration] = useState(3000);

  const showToast = useCallback((config: ToastConfig | string) => {
    if (typeof config === 'string') {
      setMessage(config);
      setType('success');
      setDuration(3000);
    } else {
      setMessage(config.message);
      setType(config.type || 'success');
      setDuration(config.duration || 3000);
    }
    setVisible(true);
  }, []);

  const showSuccess = useCallback((message: string, customDuration?: number) => {
    showToast({ message, type: 'success', duration: customDuration });
  }, [showToast]);

  const showError = useCallback((message: string, customDuration?: number) => {
    showToast({ message, type: 'error', duration: customDuration || 4000 });
  }, [showToast]);

  const showWarning = useCallback((message: string, customDuration?: number) => {
    showToast({ message, type: 'warning', duration: customDuration });
  }, [showToast]);

  const showInfo = useCallback((message: string, customDuration?: number) => {
    showToast({ message, type: 'info', duration: customDuration });
  }, [showToast]);

  const hideToast = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideToast,
      }}
    >
      {children}
      <Toast
        visible={visible}
        message={message}
        type={type}
        duration={duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}
