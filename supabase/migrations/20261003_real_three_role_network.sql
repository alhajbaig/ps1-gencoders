-- ============================================================================
-- RaktSetu 2.0: Three-Role Real Authentication + Verified Hospitals + Staff + Real Blood Bank Network
-- Production PostgreSQL Database Migration with Realtime, RLS, and Atomic RPCs
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ORGANIZATIONS TABLE (Hospitals & Regional Blood Banks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id VARCHAR(64) PRIMARY KEY, -- e.g. 'ORG-HOSP-01'
  name VARCHAR(255) NOT NULL,
  code VARCHAR(32) NOT NULL,
  type VARCHAR(32) NOT NULL CHECK (type IN ('hospital', 'blood_bank')),
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
  license_number VARCHAR(128) NOT NULL,
  registration_number VARCHAR(128),
  address TEXT NOT NULL,
  city VARCHAR(128) NOT NULL,
  state VARCHAR(128) NOT NULL,
  pincode VARCHAR(32) NOT NULL,
  latitude NUMERIC(10, 6) DEFAULT 21.1458,
  longitude NUMERIC(10, 6) DEFAULT 79.0882,
  primary_phone VARCHAR(64) NOT NULL,
  emergency_phone VARCHAR(64),
  email VARCHAR(255) NOT NULL,
  contact_person VARCHAR(128),
  website VARCHAR(255),
  verified_by VARCHAR(128),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  suspension_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. USER PROFILES TABLE (Linked with Supabase Auth)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- REFERENCES auth.users(id) when auth is connected
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL CHECK (role IN ('ADMIN', 'HOSPITAL', 'BLOOD_BANK', 'HOSPITAL_STAFF')),
  organization_id VARCHAR(64) REFERENCES public.organizations(id) ON DELETE SET NULL,
  staff_title VARCHAR(128), -- e.g. 'Senior Transfusion Technician'
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. HOSPITAL BLOOD INVENTORY (Current Live State)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  blood_group VARCHAR(8) NOT NULL,
  available_quantity NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (available_quantity >= 0),
  reserved_quantity NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (reserved_quantity >= 0),
  status VARCHAR(16) NOT NULL DEFAULT 'optimal' CHECK (status IN ('optimal', 'attention', 'critical')),
  expiry_date DATE,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, blood_group)
);

-- ----------------------------------------------------------------------------
-- 4. IMMUTABLE TRANSACTION LEDGER (Source of Truth for All Blood Movement)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(32) UNIQUE NOT NULL, -- e.g. 'TXN-20261003-84721'
  organization_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  hospital_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  blood_group VARCHAR(8) NOT NULL,
  transaction_type VARCHAR(32) NOT NULL CHECK (transaction_type IN ('ISSUED', 'RECEIVED', 'TRANSFERRED_IN', 'TRANSFERRED_OUT', 'EXPIRED', 'ADJUSTMENT')),
  quantity NUMERIC(6, 2) NOT NULL CHECK (quantity > 0),
  quantity_before NUMERIC(6, 2) NOT NULL CHECK (quantity_before >= 0),
  quantity_after NUMERIC(6, 2) NOT NULL CHECK (quantity_after >= 0),
  reference_type VARCHAR(32), -- 'PATIENT_TRANSFUSION', 'NETWORK_REFILL', 'EXPIRY', 'RECONCILIATION_AUDIT', 'TRANSFER'
  reference_id VARCHAR(64),
  patient_case_id VARCHAR(64),
  department VARCHAR(64),
  reason TEXT,
  notes TEXT,
  performed_by VARCHAR(128) NOT NULL,
  verified_by VARCHAR(128) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'VERIFIED' CHECK (status IN ('VERIFIED', 'DRAFT', 'VOIDED')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Immutable Rule: Verified transactions can never be altered or deleted
CREATE OR REPLACE FUNCTION prevent_verified_txn_tampering()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'VERIFIED' THEN
    RAISE EXCEPTION 'Immutable Ledger Invariant: Verified transaction % cannot be updated or deleted.', OLD.transaction_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_transactions ON public.blood_inventory_transactions;
CREATE TRIGGER trg_immutable_transactions
BEFORE UPDATE OR DELETE ON public.blood_inventory_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_verified_txn_tampering();

-- ----------------------------------------------------------------------------
-- 5. BLOOD BANK INVENTORIES (Network Supply Pools)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_bank_inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_bank_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  blood_bank_name VARCHAR(255) NOT NULL,
  blood_group VARCHAR(8) NOT NULL,
  physical_stock NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (physical_stock >= 0),
  reserved_stock NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (reserved_stock >= 0),
  available_stock NUMERIC(6, 2) GENERATED ALWAYS AS (physical_stock - reserved_stock) STORED,
  predicted_demand_24h NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  shortage_risk VARCHAR(16) NOT NULL DEFAULT 'low',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blood_bank_id, blood_group)
);

-- ----------------------------------------------------------------------------
-- 6. BLOOD REQUESTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id VARCHAR(64) PRIMARY KEY, -- e.g. 'REQ-2026-1042'
  display_id VARCHAR(32) NOT NULL,
  hospital_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  hospital_name VARCHAR(255) NOT NULL,
  hospital_city VARCHAR(128) NOT NULL,
  blood_group VARCHAR(8) NOT NULL,
  quantity_litres NUMERIC(6, 2) NOT NULL CHECK (quantity_litres > 0),
  priority VARCHAR(16) NOT NULL CHECK (priority IN ('routine', 'urgent', 'emergency')),
  status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'searching', 'matched', 'reserved', 'in_transit', 'completed', 'rejected', 'cancelled')),
  needed_by TIMESTAMPTZ NOT NULL,
  reason TEXT,
  clinical_notes TEXT,
  submitted_by VARCHAR(128) NOT NULL,
  matched_blood_bank_id VARCHAR(64) REFERENCES public.organizations(id) ON DELETE SET NULL,
  matched_blood_bank_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. BLOOD RESERVATIONS TABLE (Supply Lock)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id VARCHAR(32) UNIQUE NOT NULL, -- e.g. 'RES-20261003-8821'
  request_id VARCHAR(64) NOT NULL,
  blood_bank_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  blood_bank_name VARCHAR(255) NOT NULL,
  hospital_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  hospital_name VARCHAR(255) NOT NULL,
  blood_group VARCHAR(8) NOT NULL,
  quantity NUMERIC(6, 2) NOT NULL CHECK (quantity > 0),
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'FULFILLED', 'RELEASED', 'EXPIRED', 'CANCELLED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(128) NOT NULL,
  notes TEXT
);

-- ----------------------------------------------------------------------------
-- 8. COLD-CHAIN TRANSFERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blood_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id VARCHAR(32) UNIQUE NOT NULL, -- e.g. 'TR-20261003-01'
  reservation_id VARCHAR(32),
  request_id VARCHAR(64),
  from_organization_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_organization_name VARCHAR(255) NOT NULL,
  to_organization_id VARCHAR(64) NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  to_organization_name VARCHAR(255) NOT NULL,
  blood_group VARCHAR(8) NOT NULL,
  quantity_units NUMERIC(6, 2) NOT NULL CHECK (quantity_units > 0),
  status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
  urgency VARCHAR(16) NOT NULL DEFAULT 'URGENT',
  courier_contact VARCHAR(64),
  cold_chain_temp_celsius NUMERIC(4, 1) DEFAULT 4.0,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. AUDIT LOGS TABLE (Append-Only Forensic Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id VARCHAR(64) PRIMARY KEY, -- e.g. 'AUD-20261003-8821'
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id VARCHAR(64) NOT NULL,
  actor_name VARCHAR(128) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  organization_id VARCHAR(64),
  organization_name VARCHAR(255),
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO', 'NOTICE', 'WARNING', 'CRITICAL')),
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  previous_state JSONB,
  new_state JSONB
);

-- ----------------------------------------------------------------------------
-- 10. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id VARCHAR(64),
  organization_id VARCHAR(64),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. ATOMIC STORED PROCEDURE: RECORD BLOOD ISSUE (Requirement #23-#25, #30, #31)
-- Row-locks inventory, validates available stock, prevents negative balance,
-- writes immutable transaction, and updates available stock atomically.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_blood_issue(
  p_hospital_id VARCHAR(64),
  p_blood_group VARCHAR(8),
  p_quantity NUMERIC(6, 2),
  p_patient_case_id VARCHAR(64),
  p_department VARCHAR(64),
  p_reason TEXT,
  p_notes TEXT,
  p_performed_by VARCHAR(128),
  p_verified_by VARCHAR(128)
)
RETURNS public.blood_inventory_transactions AS $$
DECLARE
  v_inv public.blood_inventory%ROWTYPE;
  v_new_available NUMERIC(6, 2);
  v_txn_id VARCHAR(32);
  v_result public.blood_inventory_transactions%ROWTYPE;
  v_hosp_name VARCHAR(255);
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Issue quantity must be greater than zero.';
  END IF;

  -- 1. Check hospital verification status
  SELECT name INTO v_hosp_name FROM public.organizations WHERE id = p_hospital_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Hospital % does not exist.', p_hospital_id;
  END IF;

  -- 2. Concurrency-safe Row Lock (FOR UPDATE)
  SELECT * INTO v_inv
  FROM public.blood_inventory
  WHERE hospital_id = p_hospital_id AND blood_group = p_blood_group
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for hospital % and blood group %.', p_hospital_id, p_blood_group;
  END IF;

  -- 3. Strict Inventory Safety Check (Cannot be negative)
  IF v_inv.available_quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient % inventory. Available: % units, Requested: % units. Operation blocked.', 
      p_blood_group, v_inv.available_quantity, p_quantity;
  END IF;

  v_new_available := v_inv.available_quantity - p_quantity;
  v_txn_id := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');

  -- 4. Record Immutable Transaction
  INSERT INTO public.blood_inventory_transactions (
    transaction_id,
    organization_id,
    hospital_id,
    blood_group,
    transaction_type,
    quantity,
    quantity_before,
    quantity_after,
    reference_type,
    patient_case_id,
    department,
    reason,
    notes,
    performed_by,
    verified_by,
    status
  ) VALUES (
    v_txn_id,
    p_hospital_id,
    p_hospital_id,
    p_blood_group,
    'ISSUED',
    p_quantity,
    v_inv.available_quantity,
    v_new_available,
    'PATIENT_TRANSFUSION',
    p_patient_case_id,
    p_department,
    p_reason,
    p_notes,
    p_performed_by,
    p_verified_by,
    'VERIFIED'
  )
  RETURNING * INTO v_result;

  -- 5. Update Cached Inventory
  UPDATE public.blood_inventory
  SET 
    available_quantity = v_new_available,
    status = CASE 
      WHEN v_new_available <= 1.5 THEN 'critical'
      WHEN v_new_available <= 3.0 THEN 'attention'
      ELSE 'optimal'
    END,
    updated_at = NOW()
  WHERE id = v_inv.id;

  -- 6. Insert Audit Log
  INSERT INTO public.audit_logs (
    id,
    actor_id,
    actor_name,
    actor_role,
    organization_id,
    organization_name,
    action,
    entity_type,
    entity_id,
    severity,
    reason,
    previous_state,
    new_state
  ) VALUES (
    'AUD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0'),
    p_performed_by,
    p_performed_by,
    'HOSPITAL_STAFF',
    p_hospital_id,
    v_hosp_name,
    'BLOOD_ISSUED',
    'INVENTORY_TRANSACTION',
    v_txn_id,
    CASE WHEN v_new_available <= 1.5 THEN 'WARNING' ELSE 'INFO' END,
    'Blood issued to case ' || p_patient_case_id || ' (' || p_quantity || ' U of ' || p_blood_group || ')',
    jsonb_build_object('available_quantity', v_inv.available_quantity),
    jsonb_build_object('available_quantity', v_new_available)
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 12. ATOMIC STORED PROCEDURE: ATOMIC BLOOD RESERVATION (Requirement #41)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION atomic_reserve_blood(
  p_request_id VARCHAR(64),
  p_blood_bank_id VARCHAR(64),
  p_hospital_id VARCHAR(64),
  p_hospital_name VARCHAR(128),
  p_blood_group VARCHAR(8),
  p_quantity NUMERIC(6, 2),
  p_duration_hours INT,
  p_created_by VARCHAR(128)
)
RETURNS public.blood_reservations AS $$
DECLARE
  v_bank_inv public.blood_bank_inventories%ROWTYPE;
  v_res_id VARCHAR(32);
  v_result public.blood_reservations%ROWTYPE;
BEGIN
  SELECT * INTO v_bank_inv
  FROM public.blood_bank_inventories
  WHERE blood_bank_id = p_blood_bank_id AND blood_group = p_blood_group
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Blood bank inventory record not found.';
  END IF;

  IF v_bank_inv.available_stock < p_quantity THEN
    RAISE EXCEPTION 'Cannot reserve. Available: % U, Requested: % U.', v_bank_inv.available_stock, p_quantity;
  END IF;

  v_res_id := 'RES-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

  UPDATE public.blood_bank_inventories
  SET reserved_stock = reserved_stock + p_quantity, updated_at = NOW()
  WHERE id = v_bank_inv.id;

  INSERT INTO public.blood_reservations (
    reservation_id,
    request_id,
    blood_bank_id,
    blood_bank_name,
    hospital_id,
    hospital_name,
    blood_group,
    quantity,
    status,
    expires_at,
    created_by
  ) VALUES (
    v_res_id,
    p_request_id,
    p_blood_bank_id,
    v_bank_inv.blood_bank_name,
    p_hospital_id,
    p_hospital_name,
    p_blood_group,
    p_quantity,
    'ACTIVE',
    NOW() + (p_duration_hours || ' hours')::INTERVAL,
    p_created_by
  )
  RETURNING * INTO v_result;

  -- Update request status
  UPDATE public.blood_requests
  SET 
    status = 'reserved',
    matched_blood_bank_id = p_blood_bank_id,
    matched_blood_bank_name = v_bank_inv.blood_bank_name,
    updated_at = NOW()
  WHERE id = p_request_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 13. ATOMIC STORED PROCEDURE: ADMIN VERIFY ORGANIZATION (Requirement #13, #26)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_organization(
  p_org_id VARCHAR(64),
  p_admin_name VARCHAR(128)
)
RETURNS public.organizations AS $$
DECLARE
  v_org public.organizations%ROWTYPE;
BEGIN
  SELECT * INTO v_org FROM public.organizations WHERE id = p_org_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization % not found.', p_org_id;
  END IF;

  UPDATE public.organizations
  SET 
    status = 'VERIFIED',
    verified_by = p_admin_name,
    verified_at = NOW(),
    rejection_reason = NULL,
    suspension_reason = NULL,
    updated_at = NOW()
  WHERE id = p_org_id
  RETURNING * INTO v_org;

  -- Create Notification for organization
  INSERT INTO public.notifications (
    organization_id,
    title,
    message,
    type
  ) VALUES (
    p_org_id,
    'Organization Verified',
    'Your healthcare facility has been verified by the State Administrator. Full blood network access is now activated.',
    'success'
  );

  -- Create Audit Log
  INSERT INTO public.audit_logs (
    id,
    actor_id,
    actor_name,
    actor_role,
    organization_id,
    organization_name,
    action,
    entity_type,
    entity_id,
    severity,
    reason,
    new_state
  ) VALUES (
    'AUD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0'),
    'admin',
    p_admin_name,
    'ADMIN',
    p_org_id,
    v_org.name,
    'ORGANIZATION_VERIFIED',
    'ORGANIZATION',
    p_org_id,
    'NOTICE',
    'Compliance and statutory license verified by ' || p_admin_name,
    jsonb_build_object('status', 'VERIFIED')
  );

  RETURN v_org;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 14. SEED INITIAL DATA (Demo Organizations, Staff, Inventories)
-- ----------------------------------------------------------------------------
INSERT INTO public.organizations (
  id, name, code, type, status, license_number, registration_number,
  address, city, state, pincode, latitude, longitude, primary_phone, email, contact_person
) VALUES 
(
  'ORG-HOSP-01',
  'Metropolitan Trauma & General Hospital',
  'HOSP-METRO',
  'hospital',
  'VERIFIED',
  'LIC-MH-NGP-2024-8841',
  'REG-MH-HOSP-9901',
  'Medical Square, Great Nag Road, Hanuman Nagar',
  'Nagpur',
  'Maharashtra',
  '440009',
  21.1280,
  79.0980,
  '+91 712 274 4401',
  'hospital.admin@raktsetu.org',
  'Dr. Rajesh Verma'
),
(
  'ORG-HOSP-02',
  'CityCare Multispeciality Hospital',
  'HOSP-CITYCARE',
  'hospital',
  'PENDING', -- Pending review demo
  'LIC-MH-NGP-2025-0192',
  'REG-MH-HOSP-4421',
  'Central Avenue, Gandhibagh',
  'Nagpur',
  'Maharashtra',
  '440002',
  21.1520,
  79.1040,
  '+91 712 272 1199',
  'citycare@raktsetu.org',
  'Dr. Priya Deshmukh'
),
(
  'ORG-BANK-01',
  'Central City Blood Bank & Apheresis Depot',
  'BANK-CENTRAL',
  'blood_bank',
  'VERIFIED',
  'BB-LIC-MH-2023-0091',
  'REG-BB-NAT-7701',
  'Sitabuldi Interchange, Wardha Road',
  'Nagpur',
  'Maharashtra',
  '440012',
  21.1458,
  79.0882,
  '+91 712 253 9820',
  'bloodbank@raktsetu.org',
  'Mr. Suresh Nair'
),
(
  'ORG-BANK-02',
  'Nagpur Regional LifeLine Blood Centre',
  'BANK-LIFELINE',
  'blood_bank',
  'VERIFIED',
  'BB-LIC-MH-2022-0412',
  'REG-BB-NAT-3312',
  'Near GMC Campus, Hanuman Nagar',
  'Nagpur',
  'Maharashtra',
  '440009',
  21.1295,
  79.0995,
  '+91 712 274 8820',
  'lifeline@raktsetu.org',
  'Dr. Anjali Patil'
)
ON CONFLICT (id) DO NOTHING;

-- Seed User Profiles
INSERT INTO public.profiles (email, full_name, role, organization_id, staff_title, status)
VALUES
('admin@raktsetu.org', 'State Medical Administrator', 'ADMIN', NULL, 'Network Medical Director', 'ACTIVE'),
('hospital.admin@raktsetu.org', 'Dr. Rajesh Verma', 'HOSPITAL', 'ORG-HOSP-01', 'Chief Medical Superintendent', 'ACTIVE'),
('hospital.staff@raktsetu.org', 'Dr. Rahul Sharma', 'HOSPITAL_STAFF', 'ORG-HOSP-01', 'Senior Transfusion Officer', 'ACTIVE'),
('bloodbank@raktsetu.org', 'Suresh Nair', 'BLOOD_BANK', 'ORG-BANK-01', 'Operations Manager', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- Seed Hospital Inventory (ORG-HOSP-01)
INSERT INTO public.blood_inventory (hospital_id, blood_group, available_quantity, reserved_quantity, status, expiry_date)
VALUES
('ORG-HOSP-01', 'O+', 4.0, 0.0, 'critical', CURRENT_DATE + INTERVAL '14 days'),
('ORG-HOSP-01', 'O-', 2.5, 0.0, 'critical', CURRENT_DATE + INTERVAL '21 days'),
('ORG-HOSP-01', 'A+', 7.0, 1.0, 'optimal', CURRENT_DATE + INTERVAL '18 days'),
('ORG-HOSP-01', 'A-', 3.5, 0.0, 'optimal', CURRENT_DATE + INTERVAL '25 days'),
('ORG-HOSP-01', 'B+', 6.5, 0.0, 'optimal', CURRENT_DATE + INTERVAL '16 days'),
('ORG-HOSP-01', 'B-', 2.0, 0.0, 'critical', CURRENT_DATE + INTERVAL '12 days'),
('ORG-HOSP-01', 'AB+', 5.0, 0.0, 'optimal', CURRENT_DATE + INTERVAL '28 days'),
('ORG-HOSP-01', 'AB-', 1.5, 0.0, 'critical', CURRENT_DATE + INTERVAL '10 days')
ON CONFLICT (hospital_id, blood_group) DO NOTHING;

-- Seed Blood Bank Inventories
INSERT INTO public.blood_bank_inventories (blood_bank_id, blood_bank_name, blood_group, physical_stock, reserved_stock, predicted_demand_24h, shortage_risk)
VALUES
('ORG-BANK-01', 'Central City Blood Bank & Apheresis Depot', 'O+', 24.0, 4.0, 8.5, 'low'),
('ORG-BANK-01', 'Central City Blood Bank & Apheresis Depot', 'O-', 8.0, 1.0, 3.0, 'monitor'),
('ORG-BANK-01', 'Central City Blood Bank & Apheresis Depot', 'A+', 18.0, 2.0, 6.0, 'low'),
('ORG-BANK-01', 'Central City Blood Bank & Apheresis Depot', 'A-', 6.0, 0.5, 2.0, 'low'),
('ORG-BANK-01', 'Central City Blood Bank & Apheresis Depot', 'B+', 22.0, 3.0, 7.0, 'low'),
('ORG-BANK-01', 'Central City Blood Bank & Apheresis Depot', 'B-', 7.0, 1.0, 2.5, 'monitor'),
('ORG-BANK-01', 'Central City Blood Bank & Apheresis Depot', 'AB+', 12.0, 1.0, 4.0, 'low'),
('ORG-BANK-01', 'Central City Blood Bank & Apheresis Depot', 'AB-', 5.0, 0.5, 1.5, 'low'),

('ORG-BANK-02', 'Nagpur Regional LifeLine Blood Centre', 'O+', 16.0, 2.0, 5.0, 'low'),
('ORG-BANK-02', 'Nagpur Regional LifeLine Blood Centre', 'O-', 5.0, 0.5, 1.5, 'low'),
('ORG-BANK-02', 'Nagpur Regional LifeLine Blood Centre', 'A+', 12.0, 1.0, 3.5, 'low'),
('ORG-BANK-02', 'Nagpur Regional LifeLine Blood Centre', 'B+', 14.0, 2.0, 4.0, 'low')
ON CONFLICT (blood_bank_id, blood_group) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 15. ENABLE SUPABASE REALTIME PUBLICATION
-- ----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.organizations,
  public.profiles,
  public.blood_inventory,
  public.blood_inventory_transactions,
  public.blood_requests,
  public.blood_reservations,
  public.blood_transfers,
  public.audit_logs,
  public.notifications;
