import axios, { AxiosError, AxiosResponse } from 'axios';

// Custom error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  CORS = 'CORS',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiError extends Error {
  type: ErrorType;
  statusCode?: number;
  message: string;
  details?: any;
  originalError?: Error;
}

export interface RetryConfig {
  maxRetries: number;
  backoffFactor: number;
  retryOnStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffFactor: 2,
  retryOnStatusCodes: [408, 429, 500, 502, 503, 504],
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds - increased for slower backends
});

// Utility function to create custom error
const createApiError = (
  error: Error,
  type: ErrorType,
  statusCode?: number,
  details?: any
): ApiError => {
  const apiError = error as ApiError;
  apiError.type = type;
  apiError.statusCode = statusCode;
  apiError.message = getErrorMessage(type, statusCode, error.message);
  apiError.details = details;
  apiError.originalError = error;
  return apiError;
};

// Get user-friendly error messages
const getErrorMessage = (
  type: ErrorType,
  statusCode?: number,
  originalMessage?: string
): string => {
  switch (type) {
    case ErrorType.NETWORK:
      return 'Network error. Please check your internet connection.';
    case ErrorType.TIMEOUT:
      return 'Request timeout. The server took too long to respond.';
    case ErrorType.CORS:
      return 'CORS error. The server blocked the request. Please contact support.';
    case ErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    case ErrorType.SERVER_ERROR:
      return 'Server error. Please try again later.';
    case ErrorType.UNAUTHORIZED:
      return 'Session expired. Please log in again.';
    case ErrorType.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case ErrorType.VALIDATION:
      return 'Invalid data provided. Please check your input.';
    default:
      return originalMessage || 'An unexpected error occurred.';
  }
};

// Check if error is a network error
const isNetworkError = (error: Error): boolean => {
  return (
    !error.message ||
    error.message.includes('Network Error') ||
    error.message.includes('Failed to fetch') ||
    !navigator.onLine
  );
};

// Check if error is a CORS error
const isCorsError = (error: Error): boolean => {
  return (
    error.message.includes('CORS') ||
    error.message.includes('Access Control') ||
    (error.message.includes('status 0') && !navigator.onLine)
  );
};

// Check if error is a timeout
const isTimeoutError = (error: Error): boolean => {
  return error.message.includes('timeout') || error.message.includes('Timeout');
};

// Exponential backoff delay
const getRetryDelay = (retryCount: number, backoffFactor: number): number => {
  return Math.min(1000 * Math.pow(backoffFactor, retryCount), 30000);
};

// Retry logic with exponential backoff
const retryRequest = async <T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  retryCount: number = 0
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    const axiosError = error as AxiosError;
    
    console.log(`[API Retry] Attempt ${retryCount + 1} failed:`, {
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      retryCount,
      maxRetries: config.maxRetries
    });

    // Don't retry if request was aborted (AbortError)
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[API Retry] AbortError detected - not retrying');
      throw error;
    }

    // Check if we should retry
    const shouldRetry =
      retryCount < config.maxRetries &&
      (isNetworkError(error as Error) ||
        isTimeoutError(error as Error) ||
        (axiosError.response?.status &&
          config.retryOnStatusCodes.includes(axiosError.response.status)));

    console.log('[API Retry] Should retry:', shouldRetry, {
      retryCount,
      isNetworkError: isNetworkError(error as Error),
      isTimeoutError: isTimeoutError(error as Error),
      status: axiosError.response?.status,
      retryOnStatusCodes: config.retryOnStatusCodes
    });

    if (!shouldRetry) {
      throw error;
    }

    const delay = getRetryDelay(retryCount, config.backoffFactor);
    console.log(`[API Retry] Waiting ${delay}ms before retry ${retryCount + 2}`);
    await new Promise(resolve => setTimeout(resolve, delay));

    return retryRequest(fn, config, retryCount + 1);
  }
};

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for comprehensive error handling
api.interceptors.response.use(
  (response) => response,
  (error: Error) => {
    const axiosError = error as AxiosError;

    // Handle CORS errors
    if (isCorsError(error)) {
      return Promise.reject(createApiError(error, ErrorType.CORS));
    }

    // Handle network errors
    if (isNetworkError(error)) {
      return Promise.reject(createApiError(error, ErrorType.NETWORK));
    }

    // Handle timeout errors
    if (isTimeoutError(error)) {
      return Promise.reject(createApiError(error, ErrorType.TIMEOUT));
    }

    // Handle HTTP response errors
    if (axiosError.response) {
      const { status, data } = axiosError.response;

      let errorType = ErrorType.UNKNOWN;
      switch (status) {
        case 404:
          errorType = ErrorType.NOT_FOUND;
          break;
        case 401:
          errorType = ErrorType.UNAUTHORIZED;
          // Enhanced 401 handling: clear auth and notify
          console.warn('[API] Authentication failed, clearing session');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Notify application of auth failure (for context updates)
          window.dispatchEvent(new CustomEvent('auth:logout', { 
            detail: { reason: 'token_expired' } 
          }));
          
          // Redirect to login if not already there
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          errorType = ErrorType.FORBIDDEN;
          break;
        case 400:
          errorType = ErrorType.VALIDATION;
          break;
        case 500:
        case 502:
        case 503:
          errorType = ErrorType.SERVER_ERROR;
          break;
      }

      const apiError = createApiError(
        error,
        errorType,
        status,
        data
      );

      return Promise.reject(apiError);
    }

    // Unknown error
    return Promise.reject(createApiError(error, ErrorType.UNKNOWN));
  }
);

// Wrapped request methods with retry logic
const requestWithRetry = async <T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  retryConfig?: RetryConfig
): Promise<AxiosResponse<T>> => {
  return retryRequest(requestFn, retryConfig);
};

// Auth services
export const authService = {
  login: (email: string, password: string) =>
    requestWithRetry(() => api.post('/auth/login', { email, password })),
  register: (name: string, email: string, password: string, role?: 'admin' | 'member') =>
    requestWithRetry(() => api.post('/auth/register', { name, email, password, role })),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  updateProfile: (data: { name?: string; email?: string; avatar?: string }) =>
    requestWithRetry(() => api.put('/auth/profile', data)),
  getAllUsers: () =>
    requestWithRetry(() => api.get('/auth/users')),
  updateUser: (userId: string, data: { name?: string; email?: string; role?: 'admin' | 'member' }) =>
    requestWithRetry(() => api.put(`/auth/users/${userId}`, data)),
};

// Income services
export const incomeService = {
  getAll: (params?: { page?: number; limit?: number; category?: string; startDate?: string; endDate?: string; sortBy?: string; sortOrder?: string }) =>
    requestWithRetry(() => api.get('/income', { params })),
  getById: (id: string) => requestWithRetry(() => api.get(`/income/${id}`)),
  create: (data: {
    amount: number;
    category: string;
    date?: string;
    description?: string;
  }) => requestWithRetry(() => api.post('/income', data)),
  update: (id: string, data: {
    amount: number;
    category: string;
    date?: string;
    description?: string;
  }) => requestWithRetry(() => api.put(`/income/${id}`, data)),
  delete: (id: string) => requestWithRetry(() => api.delete(`/income/${id}`)),
  getSummary: () => requestWithRetry(() => api.get('/income/summary')),
};

// Expense services
export const expenseService = {
  getAll: (params?: { page?: number; limit?: number; category?: string; startDate?: string; endDate?: string; sortBy?: string; sortOrder?: string }) =>
    requestWithRetry(() => api.get('/expenses', { params })),
  getById: (id: string) => requestWithRetry(() => api.get(`/expenses/${id}`)),
  create: (data: {
    amount: number;
    category: string;
    date?: string;
    description?: string;
  }) => requestWithRetry(() => api.post('/expenses', data)),
  update: (id: string, data: {
    amount: number;
    category: string;
    date?: string;
    description?: string;
  }) => requestWithRetry(() => api.put(`/expenses/${id}`, data)),
  delete: (id: string) => requestWithRetry(() => api.delete(`/expenses/${id}`)),
  getSummary: () => requestWithRetry(() => api.get('/expenses/summary')),
};

// Savings services
export const savingsService = {
  getAll: (params?: { page?: number; limit?: number; type?: string; startDate?: string; endDate?: string; sortBy?: string; sortOrder?: string }) =>
    requestWithRetry(() => api.get('/savings', { params })),
  getById: (id: string) => requestWithRetry(() => api.get(`/savings/${id}`)),
  create: (data: {
    type: 'deposit' | 'withdraw';
    amount: number;
    date?: string;
    note?: string;
  }) => requestWithRetry(() => api.post('/savings', data)),
  update: (id: string, data: {
    type: 'deposit' | 'withdraw';
    amount: number;
    date?: string;
    note?: string;
  }) => requestWithRetry(() => api.put(`/savings/${id}`, data)),
  delete: (id: string) => requestWithRetry(() => api.delete(`/savings/${id}`)),
  getSummary: () => requestWithRetry(() => api.get('/savings/summary')),
};

// Investment services
export const investmentService = {
  getAll: (params?: { page?: number; limit?: number; assetType?: string; minValue?: number; maxValue?: number; sortBy?: string; sortOrder?: string }) =>
    requestWithRetry(() => api.get('/investments', { params })),
  getById: (id: string) => requestWithRetry(() => api.get(`/investments/${id}`)),
  create: (data: {
    assetName: string;
    assetType: string;
    investedAmount: number;
    currentValue: number;
    purchaseDate?: string;
  }) => requestWithRetry(() => api.post('/investments', data)),
  update: (id: string, data: {
    assetName: string;
    assetType: string;
    investedAmount: number;
    currentValue: number;
    purchaseDate?: string;
  }) => requestWithRetry(() => api.put(`/investments/${id}`, data)),
  delete: (id: string) => requestWithRetry(() => api.delete(`/investments/${id}`)),
  getSummary: () => requestWithRetry(() => api.get('/investments/summary')),
};

export default api;
