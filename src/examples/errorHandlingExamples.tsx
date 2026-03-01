/**
 * Error Handling Examples and Patterns
 *
 * This file demonstrates how to use the comprehensive error handling
 * features implemented in the API service.
 *
 * Features covered:
 * - Custom error types (404, 500, CORS, Network, Timeout, etc.)
 * - Retry logic with exponential backoff
 * - Error boundary for UI errors
 * - useErrorHandler hook for component-level error handling
 */

import React, { useState, useEffect } from 'react';
import { ApiError, ErrorType, incomeService, expenseService } from '../services';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorBoundary from '../components/common/ErrorBoundary/ErrorBoundary';

// ============================================================================
// Example 1: Using useErrorHandler Hook in a Component
// ============================================================================

export const IncomeListWithErrorHandling: React.FC = () => {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { error, handleError, clearError, isRetryable, getRetryMessage } = useErrorHandler();

  const fetchIncomes = async () => {
    setIsLoading(true);
    clearError();

    try {
      const response = await incomeService.getAll();
      setIncomes(response.data);
    } catch (err) {
      handleError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  if (error) {
    return (
      <div className="error-state">
        <h3>Error Loading Incomes</h3>
        <p>{error.message}</p>
        <p>Type: {error.type}</p>
        {error.statusCode && <p>Status: {error.statusCode}</p>}

        {isRetryable(error) && (
          <button onClick={fetchIncomes} disabled={isLoading}>
            {isLoading ? 'Retrying...' : 'Retry'}
          </button>
        )}

        <p className="retry-hint">{getRetryMessage(error)}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Incomes</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {incomes.map(income => (
            <li key={income.id}>{income.category}: ${income.amount}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ============================================================================
// Example 2: Using ErrorBoundary for Component-Level Error Handling
// ============================================================================

const ProblematicComponent: React.FC = () => {
  // This component might throw an error
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    // Simulate an API error being thrown
    const error = new Error('Something went wrong') as ApiError;
    error.type = ErrorType.SERVER_ERROR;
    error.statusCode = 500;
    throw error;
  }

  return (
    <div>
      <h3>Normal Component</h3>
      <button onClick={() => setShouldThrow(true)}>Simulate Error</button>
    </div>
  );
};

export const ComponentWithErrorBoundary: React.FC = () => {
  const [key, setKey] = useState(0);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service like Sentry
  };

  return (
    <ErrorBoundary
      key={key}
      onError={handleError}
      showDetails={true}
      fallback={
        <div className="custom-fallback">
          <h2>Custom Error UI</h2>
          <p>Something went wrong. Our team has been notified.</p>
          <button onClick={() => setKey(prev => prev + 1)}>Reset Component</button>
        </div>
      }
    >
      <ProblematicComponent />
    </ErrorBoundary>
  );
};

// ============================================================================
// Example 3: Handling Specific Error Types
// ============================================================================

export const ErrorAwareComponent: React.FC = () => {
  const { handleError } = useErrorHandler();

  const handleApiCall = async () => {
    try {
      await expenseService.create({
        amount: 100,
        category: 'Food',
      });
    } catch (err) {
      const apiError = err as ApiError;

      // Handle specific error types differently
      switch (apiError.type) {
        case ErrorType.UNAUTHORIZED:
          // Redirect to login
          window.location.href = '/login';
          break;

        case ErrorType.VALIDATION:
          // Show validation errors to user
          alert(`Validation error: ${JSON.stringify(apiError.details)}`);
          break;

        case ErrorType.NOT_FOUND:
          // Show not found message
          alert('The requested resource was not found');
          break;

        case ErrorType.NETWORK:
        case ErrorType.TIMEOUT:
        case ErrorType.SERVER_ERROR:
          // These are retryable, show retry UI
          handleError(apiError);
          break;

        case ErrorType.CORS:
          // CORS errors need server-side fixes
          alert('A CORS error occurred. Please contact support.');
          break;

        default:
          handleError(apiError);
      }
    }
  };

  return (
    <button onClick={handleApiCall}>Create Expense</button>
  );
};

// ============================================================================
// Example 4: Automatic Retry with Exponential Backoff
// ============================================================================

// The API service already includes automatic retry logic:
// - Retries up to 3 times by default
// - Exponential backoff: 1s, 2s, 4s delays
// - Retries on: network errors, timeouts, 5xx errors

// To customize retry behavior, you can pass a custom config:

const customRetryConfig = {
  maxRetries: 5,
  backoffFactor: 3,
  retryOnStatusCodes: [408, 429, 500, 502, 503, 504],
};

// Then use it with requestWithRetry (internal) or create a custom service method

// ============================================================================
// Example 5: Error Recovery Pattern
// ============================================================================

export const ResilientDataFetcher: React.FC<{ resourceId: string }> = ({ resourceId }) => {
  const [data, setData] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { error, handleError, clearError } = useErrorHandler();

  const fetchWithRetry = async (attempt: number = 1) => {
    clearError();

    try {
      const response = await incomeService.getById(resourceId);
      setData(response.data);
      setRetryCount(0);
    } catch (err) {
      const apiError = err as ApiError;

      // Check if we should retry (max 3 attempts)
      if (attempt < 3 && (apiError.type === ErrorType.NETWORK || apiError.type === ErrorType.SERVER_ERROR)) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }

      setRetryCount(attempt);
      handleError(apiError);
    }
  };

  useEffect(() => {
    fetchWithRetry();
  }, [resourceId]);

  if (error) {
    return (
      <div className="error-state">
        <p>Failed to load data after {retryCount} attempt(s)</p>
        <button onClick={() => fetchWithRetry()}>Try Again</button>
      </div>
    );
  }

  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
};

// ============================================================================
// Example 6: Global Error Handling with ErrorBoundary
// ============================================================================

export const AppWithErrorBoundary: React.FC = () => {
  const isDevelopment = import.meta.env.DEV;

  return (
    <ErrorBoundary
      showDetails={isDevelopment}
      onError={(error, errorInfo) => {
        // Log to external service in production
        if (import.meta.env.PROD) {
          // logToSentry(error, errorInfo);
        }
      }}
    >
      {/* Your entire app or critical sections */}
      <IncomeListWithErrorHandling />
    </ErrorBoundary>
  );
};

// ============================================================================
// Example 7: Handling Offline/Online Status
// ============================================================================

export const OfflineAwareComponent: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { handleError } = useErrorHandler();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      handleError(new Error('You are offline') as ApiError);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleError]);

  if (!isOnline) {
    return (
      <div className="offline-warning">
        <h3>You are offline</h3>
        <p>Please check your internet connection.</p>
      </div>
    );
  }

  return <div>Online content...</div>;
};

// ============================================================================
// Summary of Error Types and Their Meanings
// ============================================================================

/*
ErrorType.NETWORK:     Network connectivity issues, CORS failures
ErrorType.TIMEOUT:     Request timeout (30s default)
ErrorType.CORS:        CORS policy violations
ErrorType.NOT_FOUND:   404 - Resource not found
ErrorType.SERVER_ERROR: 500, 502, 503 - Server errors (retryable)
ErrorType.UNAUTHORIZED: 401 - Authentication required/session expired
ErrorType.FORBIDDEN:   403 - Permission denied
ErrorType.VALIDATION:  400 - Invalid request data
ErrorType.UNKNOWN:     Any other unexpected error
*/

// ============================================================================
// Best Practices
// ============================================================================

/*
1. Always wrap API calls in try-catch blocks
2. Use the useErrorHandler hook for consistent error handling
3. Wrap critical UI sections with ErrorBoundary
4. Show user-friendly messages, not raw error details
5. Implement retry logic for transient failures
6. Log errors in production for monitoring
7. Handle specific error types appropriately:
   - UNAUTHORIZED: redirect to login
   - VALIDATION: show field errors
   - NETWORK/TIMEOUT: offer retry
   - NOT_FOUND: show 404 page
8. Clear errors after successful operations
9. Consider offline/online status for network errors
10. Use the built-in retry mechanism (automatic with exponential backoff)
*/

export default {
  IncomeListWithErrorHandling,
  ComponentWithErrorBoundary,
  ErrorAwareComponent,
  ResilientDataFetcher,
  AppWithErrorBoundary,
  OfflineAwareComponent,
};
