import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import App from '../App';

// Mock the API service
jest.mock('../services/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('redirects to login when not authenticated', async () => {
    // Mock no user in localStorage
    require('../services/api').authService.getCurrentUser.mockReturnValue(null);

    renderWithProviders(<App />);

    // Should redirect to login page
    await waitFor(() => {
      expect(window.location.pathname).toBe('/login');
    });
  });

  test('shows dashboard when authenticated', async () => {
    // Mock user in localStorage
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'member'
    };
    
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    require('../services/api').authService.getCurrentUser.mockReturnValue(mockUser);

    renderWithProviders(<App />);

    // Should show dashboard content
    await waitFor(() => {
      expect(screen.getByText('Welcome to Family Finance')).toBeInTheDocument();
    });
  });

  test('logout clears session and redirects to login', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'member'
    };
    
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    renderWithProviders(<App />);

    // Find and click logout button
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    // Should clear localStorage and redirect
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(window.location.pathname).toBe('/login');
    });
  });

  test('401 errors trigger logout', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'member'
    };
    
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    renderWithProviders(<App />);

    // Simulate 401 error
    window.dispatchEvent(new CustomEvent('auth:logout', {
      detail: { reason: 'token_expired' }
    }));

    // Should clear session
    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});