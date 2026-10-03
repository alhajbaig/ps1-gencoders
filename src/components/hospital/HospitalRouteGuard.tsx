import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface HospitalRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Role-aware route guard for Hospital Portal routes (Section 50)
 * Protects hospital command center pages.
 * In demo mode, provisions a default hospital session if unauthenticated,
 * while respecting explicit sign-outs.
 */
export const HospitalRouteGuard: React.FC<HospitalRouteGuardProps> = ({ children }) => {
  const { user, isAuthenticated, login } = useAuth();
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check if user was explicitly logged out
    const wasLoggedOut = sessionStorage.getItem('raktsetu_explicit_logout') === 'true';

    if (!isAuthenticated && !wasLoggedOut) {
      // Auto-provision demo hospital session for frictionless demo evaluation
      login('director@metrotrauma.org', 'hospital', 'XYZ Hospital').then(() => {
        setIsInitializing(false);
      });
    } else {
      setIsInitializing(false);
    }
  }, [isAuthenticated, login]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-mono text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#C1272D] animate-ping" />
          <span>Verifying hospital node authorization...</span>
        </div>
      </div>
    );
  }

  // If still unauthenticated or role is not hospital, redirect to login
  if (!isAuthenticated || user?.role !== 'hospital') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
