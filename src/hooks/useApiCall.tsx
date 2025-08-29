'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';

interface ApiCallOptions {
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const execute = useCallback(async (
    apiCall: () => Promise<Response>,
    options: ApiCallOptions = {}
  ) => {
    const {
      successMessage,
      errorMessage,
      showSuccessToast = true,
      showErrorToast = true,
      onSuccess,
      onError
    } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || errorMessage || 'Operation failed');
      }

      if (showSuccessToast && successMessage) {
        showToast('success', successMessage);
      }

      if (onSuccess) {
        onSuccess(data);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);

      if (showErrorToast) {
        showToast('error', errorMessage || message);
      }

      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    loading,
    error,
    execute
  };
}

// Convenience wrapper for common CRUD operations
export function useApiMutation() {
  const { execute, loading, error } = useApiCall();

  const create = useCallback(async (
    url: string,
    data: any,
    options: ApiCallOptions = {}
  ) => {
    return execute(
      () => fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      {
        successMessage: options.successMessage || 'Created successfully',
        ...options
      }
    );
  }, [execute]);

  const update = useCallback(async (
    url: string,
    data: any,
    options: ApiCallOptions = {}
  ) => {
    return execute(
      () => fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }),
      {
        successMessage: options.successMessage || 'Updated successfully',
        ...options
      }
    );
  }, [execute]);

  const remove = useCallback(async (
    url: string,
    options: ApiCallOptions = {}
  ) => {
    return execute(
      () => fetch(url, { method: 'DELETE' }),
      {
        successMessage: options.successMessage || 'Deleted successfully',
        ...options
      }
    );
  }, [execute]);

  return {
    create,
    update,
    remove,
    loading,
    error
  };
}