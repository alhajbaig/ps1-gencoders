import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { state, setSession } = useAppStore();
  const location = useLocation();

  // If unauthenticated, auto-provision admin demo session in demo mode unless explicitly logged out
  if (!state.session.authenticated) {
    const wasLoggedOut = sessionStorage.getItem('raktsetu_explicit_logout') === 'true';
    if (!wasLoggedOut) {
      setSession('admin');
    } else {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // Ensure role is admin
  if (state.session.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
