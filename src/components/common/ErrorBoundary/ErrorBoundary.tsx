import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ApiError, ErrorType } from '../../../services/api';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: ApiError;
  errorInfo?: ErrorInfo;
}

/**
 * Production-grade Error Boundary with comprehensive error handling
 * Handles both React errors and API errors with user-friendly messages
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const apiError = error as ApiError;
    return {
      hasError: true,
      error: {
        ...apiError,
        message: apiError.message || 'An unexpected error occurred',
      } as ApiError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Enhanced logging for production monitoring
    const apiError = error as ApiError;
    console.error('ErrorBoundary caught an error:', {
      type: apiError.type,
      statusCode: apiError.statusCode,
      message: apiError.message,
      details: apiError.details,
      errorInfo,
      stack: error.stack,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  getErrorMessage = (error: ApiError): string => {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Network connection lost. Please check your internet and try again.';
      case ErrorType.TIMEOUT:
        return 'The request timed out. Please try again.';
      case ErrorType.CORS:
        return 'A CORS error occurred. This is a server configuration issue. Please contact support.';
      case ErrorType.NOT_FOUND:
        return 'The requested page or resource was not found.';
      case ErrorType.SERVER_ERROR:
        return 'The server encountered an error. Please try again later.';
      case ErrorType.UNAUTHORIZED:
        return 'Your session has expired. Please log in again.';
      case ErrorType.FORBIDDEN:
        return 'You do not have permission to access this resource.';
      case ErrorType.VALIDATION:
        return 'There was a problem with the data provided. Please check your input.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  };

  getRetryable = (error: ApiError): boolean => {
    const retryableTypes = [
      ErrorType.NETWORK,
      ErrorType.TIMEOUT,
      ErrorType.SERVER_ERROR,
    ];
    return retryableTypes.includes(error.type);
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const isRetryable = this.getRetryable(error);
      const errorMessage = this.getErrorMessage(error);

      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>
              {this.getErrorIcon(error.type)}
            </div>
            <h2 className={styles.errorTitle}>Oops! Something went wrong</h2>
            <p className={styles.errorMessage}>{errorMessage}</p>

            {this.props.showDetails && (
              <div className={styles.errorDetails}>
                <p><strong>Error Type:</strong> {error.type}</p>
                {error.statusCode && <p><strong>Status Code:</strong> {error.statusCode}</p>}
                {error.details && (
                  <details>
                    <summary>Technical Details</summary>
                    <pre>{JSON.stringify(error.details, null, 2)}</pre>
                  </details>
                )}
              </div>
            )}

            <div className={styles.errorActions}>
              <button
                className={styles.retryButton}
                onClick={this.handleReset}
                type="button"
              >
                Try Again
              </button>

              {isRetryable && (
                <button
                  className={styles.refreshButton}
                  onClick={() => {
                    this.handleReset();
                    window.location.reload();
                  }}
                  type="button"
                >
                  Reload Page
                </button>
              )}

              {error.type === ErrorType.UNAUTHORIZED && (
                <button
                  className={styles.loginButton}
                  onClick={() => {
                    window.location.href = '/login';
                  }}
                  type="button"
                >
                  Go to Login
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private getErrorIcon(type: ErrorType): ReactNode {
    // Simple error icons based on type
    const icons: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: '🌐',
      [ErrorType.TIMEOUT]: '⏱️',
      [ErrorType.CORS]: '🚫',
      [ErrorType.NOT_FOUND]: '🔍',
      [ErrorType.SERVER_ERROR]: '🔧',
      [ErrorType.UNAUTHORIZED]: '🔒',
      [ErrorType.FORBIDDEN]: '⛔',
      [ErrorType.VALIDATION]: '⚠️',
      [ErrorType.UNKNOWN]: '❓',
    };
    return <span className={styles.icon}>{icons[type] || icons[ErrorType.UNKNOWN]}</span>;
  }
}

export default ErrorBoundary;
