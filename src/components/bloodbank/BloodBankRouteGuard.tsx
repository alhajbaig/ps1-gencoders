import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface BloodBankRouteGuardProps {
  children: React.ReactNode;
}

export const BloodBankRouteGuard: React.FC<BloodBankRouteGuardProps> = ({ children }) => {
  const { user, isAuthenticated, loginWithDemo } = useAuth();
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const wasLoggedOut = sessionStorage.getItem('raktsetu_explicit_logout') === 'true';

    if (!isAuthenticated && !wasLoggedOut) {
      loginWithDemo('blood_bank').then(() => {
        setIsInitializing(false);
      });
    } else {
      setIsInitializing(false);
    }
  }, [isAuthenticated, loginWithDemo]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-mono text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#0F2E5A] animate-ping" />
          <span>Verifying regional blood depot authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'blood_bank') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
