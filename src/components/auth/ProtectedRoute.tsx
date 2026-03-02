import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'member';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('[ProtectedRoute] Checking authentication:', {
      isAuthenticated,
      isLoading,
      userRole: user?.role,
      requiredRole,
      pathname: location.pathname
    });
  }, [isAuthenticated, isLoading, user, requiredRole, location.pathname]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'var(--bg-body)'
      }}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements if specified
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    console.log('[ProtectedRoute] Insufficient permissions, redirecting to dashboard');
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;