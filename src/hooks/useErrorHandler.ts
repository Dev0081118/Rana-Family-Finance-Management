import { useState, useCallback, useEffect } from 'react';
import { ApiError, ErrorType } from '../services/api';

interface UseErrorHandlerReturn {
  error: ApiError | null;
  isLoading: boolean;
  handleError: (error: Error) => void;
  clearError: () => void;
  isRetryable: (error: Error) => boolean;
  getRetryMessage: (error: Error) => string;
}

/**
 * Custom hook for handling API errors with user-friendly messages
 */
export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((err: Error) => {
    const apiError = err as ApiError;

    // Log error for debugging
    console.error('Error caught by useErrorHandler:', {
      type: apiError.type,
      statusCode: apiError.statusCode,
      message: apiError.message,
      details: apiError.details,
      originalError: apiError.originalError,
    });

    setError(apiError);
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  const isRetryable = useCallback((err: Error): boolean => {
    const apiError = err as ApiError;
    const retryableTypes = [
      ErrorType.NETWORK,
      ErrorType.TIMEOUT,
      ErrorType.SERVER_ERROR,
    ];
    return retryableTypes.includes(apiError.type);
  }, []);

  const getRetryMessage = useCallback((err: Error): string => {
    const apiError = err as ApiError;
    if (apiError.type === ErrorType.NETWORK) {
      return 'Check your internet connection and try again.';
    }
    if (apiError.type === ErrorType.TIMEOUT) {
      return 'The server is taking too long. Try again in a moment.';
    }
    if (apiError.type === ErrorType.SERVER_ERROR) {
      return 'Server is temporarily unavailable. Retrying...';
    }
    return 'Please try again.';
  }, []);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return {
    error,
    isLoading,
    handleError,
    clearError,
    isRetryable,
    getRetryMessage,
  };
};
