import React, { createContext, useContext, useState, useEffect } from 'react';
import type { BloodGroup, OrganizationRegistrationData } from '../types';
import { DEFAULT_INVENTORY_PRESET } from '../data/mockData';

interface RegistrationContextType {
  data: OrganizationRegistrationData;
  updateOrganizationData: (data: Partial<OrganizationRegistrationData>) => void;
  updateInventory: (group: BloodGroup, units: number) => void;
  setAllInventory: (inventory: Record<BloodGroup, number>) => void;
  resetRegistration: () => void;
  isRegistered: boolean;
  completeRegistration: () => void;
}

const INITIAL_STATE: OrganizationRegistrationData = {
  organizationType: 'hospital',
  organizationName: '',
  organizationId: '',
  address: '',
  city: '',
  contactNumber: '',
  adminName: '',
  email: '',
  password: '',
  inventory: { ...DEFAULT_INVENTORY_PRESET },
};

const STORAGE_KEY = 'raktsetu_registered_org_v1';

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<OrganizationRegistrationData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_STATE;
    } catch {
      return INITIAL_STATE;
    }
  });

  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEY + '_completed');
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to sync registration state', e);
    }
  }, [data]);

  const updateOrganizationData = (partial: Partial<OrganizationRegistrationData>) => {
    setData((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const updateInventory = (group: BloodGroup, units: number) => {
    setData((prev) => ({
      ...prev,
      inventory: {
        ...(prev.inventory || DEFAULT_INVENTORY_PRESET),
        [group]: Math.max(0, units),
      },
    }));
  };

  const setAllInventory = (inventory: Record<BloodGroup, number>) => {
    setData((prev) => ({
      ...prev,
      inventory,
    }));
  };

  const completeRegistration = () => {
    setIsRegistered(true);
    localStorage.setItem(STORAGE_KEY + '_completed', 'true');
  };

  const resetRegistration = () => {
    setData(INITIAL_STATE);
    setIsRegistered(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + '_completed');
  };

  return (
    <RegistrationContext.Provider
      value={{
        data,
        updateOrganizationData,
        updateInventory,
        setAllInventory,
        resetRegistration,
        isRegistered,
        completeRegistration,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};
