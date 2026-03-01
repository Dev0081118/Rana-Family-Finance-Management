/**
 * Error Handling Test Suite
 *
 * This file demonstrates and tests the comprehensive error handling
 * implemented in the API service, including:
 * - Custom error types (404, 500, CORS, Network, Timeout, etc.)
 * - Retry logic with exponential backoff
 * - Error boundary integration
 * - useErrorHandler hook usage
 */

import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiError, ErrorType } from '../services/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ErrorBoundary from '../components/common/ErrorBoundary/ErrorBoundary';

// Mock the API service
jest.mock('../services/api', () => ({
  ...jest.requireActual('../services/api'),
  incomeService: {
    getAll: jest.fn(),
  },
}));

// Helper to create mock API errors
const createMockError = (
  type: ErrorType,
  statusCode?: number,
  message?: string
): ApiError => {
  const error = new Error(message || 'Test error') as ApiError;
  error.type = type;
  error.statusCode = statusCode;
  error.message = message || `Mock ${type} error`;
  return error;
};

// Test Component using useErrorHandler
const TestComponent = () => {
  const { error, handleError, clearError, isRetryable, getRetryMessage } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(false);

  const simulateError = (type: ErrorType) => {
    setIsLoading(true);
    const mockError = createMockError(type, type === ErrorType.NOT_FOUND ? 404 : 500);
    setTimeout(() => {
      handleError(mockError);
      setIsLoading(false);
    }, 100);
  };

  return (
    <div>
      <h1>Error Handling Test</h1>
      <div data-testid="error-message">{error?.message || 'No error'}</div>
      <div data-testid="error-type">{error?.type || 'none'}</div>
      <div data-testid="is-retryable">{isRetryable(error || createMockError(ErrorType.UNKNOWN)) ? 'true' : 'false'}</div>
      <div data-testid="retry-message">{error ? getRetryMessage(error) : ''}</div>
      <div data-testid="is-loading">{isLoading ? 'loading' : 'idle'}</div>

      <button onClick={() => simulateError(ErrorType.NETWORK)}>Simulate Network Error</button>
      <button onClick={() => simulateError(ErrorType.TIMEOUT)}>Simulate Timeout</button>
      <button onClick={() => simulateError(ErrorType.NOT_FOUND)}>Simulate 404</button>
      <button onClick={() => simulateError(ErrorType.SERVER_ERROR)}>Simulate 500</button>
      <button onClick={() => simulateError(ErrorType.CORS)}>Simulate CORS</button>
      <button onClick={() => simulateError(ErrorType.UNAUTHORIZED)}>Simulate 401</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
};

// Test Component with ErrorBoundary
const TestComponentWithBoundary = () => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw createMockError(ErrorType.SERVER_ERROR, 500, 'Server error occurred');
  }

  return (
    <div>
      <h1>Error Boundary Test</h1>
      <button onClick={() => setShouldError(true)}>Trigger Error</button>
    </div>
  );
};

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useErrorHandler Hook', () => {
    it('should handle network errors', async () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByText('Simulate Network Error'));

      await waitFor(() => {
        expect(screen.getByTestId('error-type')).toHaveTextContent('NETWORK');
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
      });
    });

    it('should handle timeout errors', async () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByText('Simulate Timeout'));

      await waitFor(() => {
        expect(screen.getByTestId('error-type')).toHaveTextContent('TIMEOUT');
      });
    });

    it('should handle 404 errors', async () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByText('Simulate 404'));

      await waitFor(() => {
        expect(screen.getByTestId('error-type')).toHaveTextContent('NOT_FOUND');
        expect(screen.getByTestId('error-message')).toHaveTextContent('not found');
      });
    });

    it('should handle 500 errors', async () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByText('Simulate 500'));

      await waitFor(() => {
        expect(screen.getByTestId('error-type')).toHaveTextContent('SERVER_ERROR');
      });
    });

    it('should identify retryable errors correctly', async () => {
      render(<TestComponent />);

      // Network error should be retryable
      fireEvent.click(screen.getByText('Simulate Network Error'));
      await waitFor(() => {
        expect(screen.getByTestId('is-retryable')).toHaveTextContent('true');
      });

      // Clear and test 404 (not retryable)
      fireEvent.click(screen.getByText('Clear Error'));
      fireEvent.click(screen.getByText('Simulate 404'));
      await waitFor(() => {
        expect(screen.getByTestId('is-retryable')).toHaveTextContent('false');
      });
    });

    it('should clear error when clearError is called', async () => {
      render(<TestComponent />);

      fireEvent.click(screen.getByText('Simulate Network Error'));

      await waitFor(() => {
        expect(screen.getByTestId('error-type')).toHaveTextContent('NETWORK');
      });

      fireEvent.click(screen.getByText('Clear Error'));

      await waitFor(() => {
        expect(screen.getByTestId('error-type')).toHaveTextContent('none');
      });
    });
  });

  describe('ErrorBoundary', () => {
    it('should catch errors and display fallback UI', async () => {
      render(
        <ErrorBoundary>
          <TestComponentWithBoundary />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
        expect(screen.getByTestId('error-type')).toHaveTextContent('SERVER_ERROR');
      });
    });

    it('should show retry button', async () => {
      render(
        <ErrorBoundary>
          <TestComponentWithBoundary />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should show reload button for retryable errors', async () => {
      render(
        <ErrorBoundary>
          <TestComponentWithBoundary />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Reload Page')).toBeInTheDocument();
      });
    });

    it('should show login button for unauthorized errors', async () => {
      const UnauthorizedComponent = () => {
        throw createMockError(ErrorType.UNAUTHORIZED, 401, 'Unauthorized');
      };

      render(
        <ErrorBoundary>
          <UnauthorizedComponent />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Go to Login')).toBeInTheDocument();
      });
    });

    it('should reset state when retry is clicked', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <TestComponentWithBoundary />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText('Trigger Error'));

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Try Again'));

      // After retry, the component should be back to normal
      await waitFor(() => {
        expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Error Types', () => {
    it('should correctly identify each error type', () => {
      expect(createMockError(ErrorType.NETWORK).type).toBe(ErrorType.NETWORK);
      expect(createMockError(ErrorType.TIMEOUT).type).toBe(ErrorType.TIMEOUT);
      expect(createMockError(ErrorType.CORS).type).toBe(ErrorType.CORS);
      expect(createMockError(ErrorType.NOT_FOUND).type).toBe(ErrorType.NOT_FOUND);
      expect(createMockError(ErrorType.SERVER_ERROR).type).toBe(ErrorType.SERVER_ERROR);
      expect(createMockError(ErrorType.UNAUTHORIZED).type).toBe(ErrorType.UNAUTHORIZED);
      expect(createMockError(ErrorType.FORBIDDEN).type).toBe(ErrorType.FORBIDDEN);
      expect(createMockError(ErrorType.VALIDATION).type).toBe(ErrorType.VALIDATION);
      expect(createMockError(ErrorType.UNKNOWN).type).toBe(ErrorType.UNKNOWN);
    });

    it('should preserve status code and details', () => {
      const error = createMockError(ErrorType.SERVER_ERROR, 500, { detail: 'Server exploded' });
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({ detail: 'Server exploded' });
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network errors', async () => {
      const mockGetAll = jest.fn()
        .mockRejectedValueOnce(createMockError(ErrorType.NETWORK))
        .mockResolvedValueOnce({ data: [] });

      const { incomeService } = await import('../services/api');
      incomeService.getAll = mockGetAll;

      // The retry logic should automatically retry
      await expect(incomeService.getAll()).resolves.toBeDefined();

      expect(mockGetAll).toHaveBeenCalledTimes(2); // Original + 1 retry
    });

    it('should not retry on 404 errors', async () => {
      const mockGetAll = jest.fn()
        .mockRejectedValueOnce(createMockError(ErrorType.NOT_FOUND, 404));

      const { incomeService } = await import('../services/api');
      incomeService.getAll = mockGetAll;

      await expect(incomeService.getAll()).rejects.toBeDefined();
      expect(mockGetAll).toHaveBeenCalledTimes(1); // No retry
    });

    it('should respect max retries', async () => {
      const mockGetAll = jest.fn()
        .mockRejectedValueOnce(createMockError(ErrorType.SERVER_ERROR, 503));

      const { incomeService } = await import('../services/api');
      incomeService.getAll = mockGetAll;

      await expect(incomeService.getAll()).rejects.toBeDefined();
      expect(mockGetAll).toHaveBeenCalledTimes(4); // Original + 3 retries (maxRetries)
    });
  });
});

export { TestComponent, TestComponentWithBoundary };
