import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock } from 'lucide-react';

interface HospitalRouteGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

/**
 * Role-aware route guard for Hospital Portal routes
 * Protects hospital command center pages for Hospital Admin and Hospital Staff.
 */
export const HospitalRouteGuard: React.FC<HospitalRouteGuardProps> = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated, loginWithDemo } = useAuth();
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const wasLoggedOut = sessionStorage.getItem('raktsetu_explicit_logout') === 'true';

    if (!isAuthenticated && !wasLoggedOut) {
      // Auto-provision demo hospital session
      loginWithDemo('hospital').then(() => {
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
          <span className="w-2 h-2 rounded-full bg-[#C1272D] animate-ping" />
          <span>Verifying hospital credentials...</span>
        </div>
      </div>
    );
  }

  // If not authenticated or not a hospital user/staff
  const isHospitalRole = user?.role === 'hospital' || user?.role === 'hospital_staff';
  if (!isAuthenticated || !isHospitalRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Staff restriction: staff cannot access /hospital/staff (Requirement #22)
  if (adminOnly && user?.role !== 'hospital') {
    return <Navigate to="/hospital/staff/dashboard" replace />;
  }

  // Unverified hospital restriction: cannot create network blood requests (Requirement #10 & #77)
  if (location.pathname === '/hospital/requests/new' && user?.verificationStatus === 'PENDING') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-inter">
        <div className="max-w-md w-full bg-white border border-amber-200 rounded-2xl p-6 shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="font-poppins font-bold text-lg text-slate-900">
            Network Blood Requisitions Restricted
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your hospital facility is currently <strong>PENDING ADMINISTRATIVE VERIFICATION</strong>.
            State network administrators must verify your statutory license before you can place external blood requisitions.
          </p>
          <a
            href="/hospital/dashboard"
            className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Return to Hospital Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
