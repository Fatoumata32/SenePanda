import { useState, useCallback } from 'react';

interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'success' | 'info';
  destructive?: boolean;
}

interface UseConfirmationReturn {
  visible: boolean;
  config: ConfirmationConfig;
  loading: boolean;
  confirm: (config: ConfirmationConfig) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
  setLoading: (loading: boolean) => void;
}

export function useConfirmation(): UseConfirmationReturn {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ConfirmationConfig>({
    title: '',
    message: '',
  });
  const [resolveRef, setResolveRef] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((newConfig: ConfirmationConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig(newConfig);
      setVisible(true);
      setResolveRef({ resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef) {
      resolveRef.resolve(true);
      setResolveRef(null);
    }
    setVisible(false);
    setLoading(false);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    if (resolveRef) {
      resolveRef.resolve(false);
      setResolveRef(null);
    }
    setVisible(false);
    setLoading(false);
  }, [resolveRef]);

  return {
    visible,
    config,
    loading,
    confirm,
    handleConfirm,
    handleCancel,
    setLoading,
  };
}

export default useConfirmation;
