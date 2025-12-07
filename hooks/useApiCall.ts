import { useState, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface UseApiCallOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

/**
 * Hook pour gérer les appels API avec gestion d'erreurs automatique
 * Affiche des toasts pour les succès/erreurs
 * Gère les états loading/error automatiquement
 *
 * @example
 * const { execute, loading, error } = useApiCall({
 *   successMessage: 'Produit ajouté!',
 *   errorMessage: 'Impossible d\'ajouter le produit',
 * });
 *
 * const handleAddToCart = async () => {
 *   await execute(async () => {
 *     const { data } = await supabase.from('cart').insert({ ... });
 *     return data;
 *   });
 * };
 */
export const useApiCall = <T = any>(options: UseApiCallOptions = {}) => {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = 'Une erreur est survenue',
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (apiCall: () => Promise<T>): Promise<{ data: T | null; error: Error | null }> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        setData(result);

        // Show success toast
        if (showSuccessToast && successMessage) {
          toast.showSuccess(successMessage);
        }

        // Call onSuccess callback
        if (onSuccess) {
          onSuccess(result);
        }

        setLoading(false);
        return { data: result, error: null };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        // Show error toast
        if (showErrorToast) {
          toast.showError(errorMessage);
        }

        // Call onError callback
        if (onError) {
          onError(error);
        }

        console.error('API Call Error:', error);
        setLoading(false);
        return { data: null, error };
      }
    },
    [onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast, toast]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    reset,
  };
};

/**
 * Hook simplifié pour les mutations (POST, PUT, DELETE)
 */
export const useMutation = <T = any>(options: UseApiCallOptions = {}) => {
  return useApiCall<T>({ showSuccessToast: true, ...options });
};

/**
 * Hook simplifié pour les queries (GET)
 */
export const useQuery = <T = any>(options: UseApiCallOptions = {}) => {
  return useApiCall<T>({ showSuccessToast: false, showErrorToast: true, ...options });
};
