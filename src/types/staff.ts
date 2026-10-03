export type StaffStatus = 'ACTIVE' | 'DEACTIVATED';

export type StaffRole = 'HOSPITAL_STAFF' | 'BLOOD_ISSUE_STAFF' | 'INVENTORY_STAFF' | 'HOSPITAL_MANAGER';

export interface HospitalStaff {
  id: string; // User ID / Staff ID
  email: string;
  fullName: string;
  role: StaffRole;
  hospitalId: string;
  hospitalName?: string;
  department?: string;
  staffTitle: string; // e.g. 'Senior Transfusion Technician'
  status: StaffStatus;
  createdAt: string;
  lastActiveAt?: string;
}

export interface CreateStaffInput {
  fullName: string;
  email: string;
  password?: string;
  staffTitle: string;
  department: string;
}
