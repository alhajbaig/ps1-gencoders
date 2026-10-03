import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  Boxes,
  UserCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithDemo } = useAuth();

  // Selected role context (Requirement #3 & #50)
  const [selectedRole, setSelectedRole] = useState<'hospital' | 'blood_bank' | 'admin'>('hospital');
  const [isStaffLogin, setIsStaffLogin] = useState(false);

  const [email, setEmail] = useState('hospital.admin@raktsetu.org');
  const [password, setPassword] = useState('demoHospitalPass2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const handleRoleChange = (newRole: 'hospital' | 'blood_bank' | 'admin') => {
    setSelectedRole(newRole);
    setIsStaffLogin(false);
    setError('');
    setPendingNotice(null);

    if (newRole === 'hospital') {
      setEmail('hospital.admin@raktsetu.org');
      setPassword('demoHospitalPass2026!');
    } else if (newRole === 'blood_bank') {
      setEmail('bloodbank@raktsetu.org');
      setPassword('demoBloodBankPass2026!');
    } else {
      setEmail('admin@raktsetu.org');
      setPassword('demoAdminPass2026!');
    }
  };

  const handleStaffToggle = () => {
    const nextStaff = !isStaffLogin;
    setIsStaffLogin(nextStaff);
    setError('');
    if (nextStaff) {
      setEmail('hospital.staff@raktsetu.org');
      setPassword('demoStaffPass2026!');
    } else {
      setEmail('hospital.admin@raktsetu.org');
      setPassword('demoHospitalPass2026!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your registered email and password.');
      return;
    }
    setError('');
    setPendingNotice(null);
    setIsLoading(true);

    const targetRole: UserRole = isStaffLogin ? 'hospital_staff' : selectedRole;

    try {
      const session = await login(email, password, targetRole);
      setIsLoading(false);

      // Check organization status (Requirement #10 & #15)
      if (session.verificationStatus === 'PENDING') {
        setPendingNotice(
          'Your hospital profile is currently UNDER VERIFICATION by state administrators. Full blood network requisition is restricted until approved.'
        );
      }

      // Role-based navigation (Requirement #53)
      if (session.role === 'admin') {
        navigate('/admin/command-center');
      } else if (session.role === 'blood_bank') {
        navigate('/blood-bank/dashboard');
      } else if (session.role === 'hospital_staff') {
        navigate('/hospital/staff/dashboard');
      } else {
        navigate('/hospital/dashboard');
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setError(msg);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setIsLoading(true);
    setError('');
    setPendingNotice(null);

    try {
      const session = await loginWithDemo(role);
      setIsLoading(false);

      if (session.role === 'admin') {
        navigate('/admin/command-center');
      } else if (session.role === 'blood_bank') {
        navigate('/blood-bank/dashboard');
      } else if (session.role === 'hospital_staff') {
        navigate('/hospital/staff/dashboard');
      } else {
        navigate('/hospital/dashboard');
      }
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Demo login failed.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-inter">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Branding Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 group mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#C1272D] flex items-center justify-center text-white shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path
                  d="M12 2.5C12 2.5 5 10.5 5 15.5C5 19.366 8.134 22.5 12 22.5C15.866 22.5 19 19.366 19 15.5C19 10.5 12 2.5 12 2.5Z"
                  fill="currentColor"
                />
                <circle cx="12" cy="14" r="2" fill="#FFFFFF" />
              </svg>
            </div>
            <span className="font-poppins font-bold text-2xl text-slate-900 tracking-tight">
              RaktSetu
            </span>
          </Link>

          <h1 className="font-poppins font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
            Healthcare Network Access
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized emergency blood orchestration and clinical supply network.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          {/* Section 3 & 50: Three Role Selector Buttons */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 mb-2">
              Select Login Role:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange('hospital')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  selectedRole === 'hospital'
                    ? 'bg-rose-50 border-[#C1272D] text-[#C1272D] shadow-2xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Hospital</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('blood_bank')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  selectedRole === 'blood_bank'
                    ? 'bg-blue-50 border-[#0F2E5A] text-[#0F2E5A] shadow-2xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Blood Bank</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xs font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Hospital Staff Sub-toggle when Hospital selected */}
          {selectedRole === 'hospital' && (
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="font-semibold text-slate-800">Hospital Staff Account</span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    For clinical transfusion officers & ward technicians
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStaffToggle}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  isStaffLogin
                    ? 'bg-[#C1272D] text-white border-[#C1272D]'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {isStaffLogin ? 'Staff Active' : 'Switch to Staff'}
              </button>
            </div>
          )}

          {/* Error Banner with Strict Role Mismatch Explanation (Requirement #4) */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block">Access Denied:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Pending Verification Notice */}
          {pendingNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block">Pending Verification Notice:</span>
                <span>{pendingNotice}</span>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                {isStaffLogin
                  ? 'Staff Member Official Email'
                  : selectedRole === 'hospital'
                  ? 'Hospital Administrator Email'
                  : selectedRole === 'blood_bank'
                  ? 'Blood Bank Officer Email'
                  : 'State Administrator Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-slate-900 font-mono"
                  placeholder="name@organization.org"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-slate-900 font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${
                selectedRole === 'admin'
                  ? 'bg-slate-900 hover:bg-slate-800'
                  : selectedRole === 'blood_bank'
                  ? 'bg-[#0F2E5A] hover:bg-[#1E4C8A]'
                  : 'bg-[#C1272D] hover:bg-[#A61E24]'
              }`}
            >
              <span>{isLoading ? 'Verifying Credentials...' : `Sign In as ${isStaffLogin ? 'Hospital Staff' : selectedRole.replace('_', ' ').toUpperCase()}`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Section 51: Continue with Demo Account */}
          <div className="pt-4 border-t border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
                One-Click Demo Access
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Live State Persistence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('hospital')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-rose-50 hover:border-rose-200 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 group-hover:text-rose-700">
                    Hospital Admin
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">HOSP</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Dr. Rajesh Verma</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('hospital_staff')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-rose-50 hover:border-rose-200 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 group-hover:text-rose-700">
                    Hospital Staff
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">STAFF</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Dr. Rahul Sharma</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('blood_bank')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-200 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 group-hover:text-blue-800">
                    Blood Bank
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">DEPOT</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Central City Depot</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 group-hover:text-slate-900">
                    State Admin
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">COMMAND</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Full Oversight</p>
              </button>
            </div>
          </div>
        </div>

        {/* Registration Link */}
        <div className="text-center text-xs text-slate-500">
          New hospital facility?{' '}
          <Link
            to="/register/hospital"
            className="font-semibold text-[#1E4C8A] hover:underline"
          >
            Register Facility Application
          </Link>
        </div>
      </div>
    </div>
  );
};
