import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { Button } from '../components/common/Button';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState<UserRole>('hospital');
  const [email, setEmail] = useState('director@metrotrauma.org');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotMsg, setForgotMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your organization email and password.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await login(email, role);
      sessionStorage.removeItem('raktsetu_explicit_logout');
      setIsLoading(false);
      if (role === 'hospital') {
        navigate('/hospital/dashboard');
      } else {
        navigate('/dashboard-preview');
      }
    } catch {
      setIsLoading(false);
      setError('Authentication failed. Please verify credentials.');
    }
  };

  const handleDemoPreset = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'hospital') {
      setEmail('director@metrotrauma.org');
    } else if (selectedRole === 'blood_bank') {
      setEmail('operations@redcrossregional.org');
    } else {
      setEmail('coordinator@raktsetu.network');
    }
    setPassword('demoSecurePass2026!');
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto">
        {/* Card Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#C1272D] flex items-center justify-center text-white shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5">
                <path
                  d="M12 2.5C12 2.5 5 10.5 5 15.5C5 19.366 8.134 22.5 12 22.5C15.866 22.5 19 19.366 19 15.5C19 10.5 12 2.5 12 2.5Z"
                  fill="currentColor"
                />
                <circle cx="12" cy="14" r="2" fill="#FFFFFF" />
              </svg>
            </div>
            <span className="font-poppins font-bold text-xl text-[#0F172A] tracking-tight">
              RaktSetu
            </span>
          </Link>

          <h1 className="font-poppins font-semibold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
            Welcome to RaktSetu
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Access your secure predictive inventory node
          </p>
        </div>

        {/* Minimal Auth Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-subtle">
          {/* Subtle Role Selector */}
          <div className="mb-6">
            <label className="block text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">
              Select Organization Role
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-50 border border-slate-200/80 rounded-lg">
              <button
                type="button"
                onClick={() => handleDemoPreset('hospital')}
                className={`py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                  role === 'hospital'
                    ? 'bg-white text-[#0F172A] shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hospital
              </button>
              <button
                type="button"
                onClick={() => handleDemoPreset('blood_bank')}
                className={`py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                  role === 'blood_bank'
                    ? 'bg-white text-[#0F172A] shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Blood Bank
              </button>
              <button
                type="button"
                onClick={() => handleDemoPreset('admin')}
                className={`py-1.5 text-xs font-medium rounded transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white text-[#0F172A] shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          {forgotMsg && (
            <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-xs text-blue-700">
              In Phase 1 demo mode, use any password or click below to proceed with demo credentials.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-[#0F172A] mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-[#0F172A]"
                  placeholder="admin@hospital.org"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-medium text-[#0F172A]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotMsg(!forgotMsg)}
                  className="text-[11px] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E4C8A] text-[#0F172A]"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Login to Node
              </Button>
            </div>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block text-center mb-2">
              QUICK TEST CREDENTIALS
            </span>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleDemoPreset('hospital')}
                className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded transition-colors font-mono cursor-pointer"
              >
                Hospital Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoPreset('blood_bank')}
                className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2 py-1 rounded transition-colors font-mono cursor-pointer"
              >
                Blood Bank Demo
              </button>
            </div>
          </div>
        </div>

        {/* Footer Registration Link */}
        <div className="text-center mt-6">
          <p className="text-xs text-[#64748B]">
            Don't have an organization?{' '}
            <Link
              to="/register"
              className="font-semibold text-[#C1272D] hover:underline"
            >
              Register your organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
