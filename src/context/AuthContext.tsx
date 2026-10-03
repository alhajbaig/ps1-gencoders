import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, UserSession } from '../types';

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (email: string, role: UserRole, orgName?: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'raktsetu_session_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync auth state', e);
    }
  }, [user]);

  const login = async (email: string, role: UserRole, orgName?: string) => {
    // Simulate brief network latency
    await new Promise((resolve) => setTimeout(resolve, 350));
    
    let defaultOrgName = orgName;
    if (!defaultOrgName) {
      if (role === 'hospital') defaultOrgName = 'Metropolitan General Hospital';
      else if (role === 'blood_bank') defaultOrgName = 'National Blood Transfusion Center';
      else defaultOrgName = 'RaktSetu Regional Command';
    }

    const session: UserSession = {
      email,
      role,
      orgName: defaultOrgName,
      orgId: role === 'hospital' ? 'HOSP-METRO-09' : role === 'blood_bank' ? 'BANK-NAT-04' : 'ADM-CMD-01',
      token: 'demo_token_' + Math.random().toString(36).substring(2),
    };

    setUser(session);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
