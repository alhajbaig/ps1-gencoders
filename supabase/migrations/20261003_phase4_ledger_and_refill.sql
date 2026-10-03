-- ============================================================================
-- RaktSetu 2.0: Steps 8–20 Database Schema Migration
-- Immutable Transaction Ledger, Atomic Concurrency, Smart Matching & Reservations
-- ============================================================================

-- 1. BLOOD INVENTORY (Current Cached State)
CREATE TABLE IF NOT EXISTS public.blood_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id VARCHAR(64) NOT NULL,
  blood_group VARCHAR(8) NOT NULL,
  available_quantity NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (available_quantity >= 0),
  reserved_quantity NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (reserved_quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hospital_id, blood_group)
);

-- 2. IMMUTABLE BLOOD INVENTORY TRANSACTIONS (Financial-Grade Ledger)
CREATE TABLE IF NOT EXISTS public.blood_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(32) UNIQUE NOT NULL, -- e.g. TXN-10241
  organization_id VARCHAR(64) NOT NULL,
  hospital_id VARCHAR(64) NOT NULL,
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

-- Immutable Rule: Verified transactions can never be updated or deleted
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

-- 3. BLOOD BANK INVENTORIES (Network Supply Pools)
CREATE TABLE IF NOT EXISTS public.blood_bank_inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blood_bank_id VARCHAR(64) NOT NULL,
  blood_bank_name VARCHAR(128) NOT NULL,
  blood_group VARCHAR(8) NOT NULL,
  physical_stock NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (physical_stock >= 0),
  reserved_stock NUMERIC(6, 2) NOT NULL DEFAULT 0.0 CHECK (reserved_stock >= 0),
  available_stock NUMERIC(6, 2) GENERATED ALWAYS AS (physical_stock - reserved_stock) STORED,
  predicted_demand_24h NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  shortage_risk VARCHAR(16) NOT NULL DEFAULT 'low',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blood_bank_id, blood_group)
);

-- 4. ATOMIC BLOOD RESERVATIONS (Locks Supply for Fulfilling Requests)
CREATE TABLE IF NOT EXISTS public.blood_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id VARCHAR(32) UNIQUE NOT NULL, -- e.g. RES-2026-0891
  request_id VARCHAR(64) NOT NULL,
  blood_bank_id VARCHAR(64) NOT NULL,
  blood_bank_name VARCHAR(128) NOT NULL,
  hospital_id VARCHAR(64) NOT NULL,
  hospital_name VARCHAR(128) NOT NULL,
  blood_group VARCHAR(8) NOT NULL,
  quantity NUMERIC(6, 2) NOT NULL CHECK (quantity > 0),
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'FULFILLED', 'RELEASED', 'EXPIRED', 'CANCELLED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(128) NOT NULL,
  notes TEXT
);

-- 5. ATOMIC STORED PROCEDURE: RECORD BLOOD ISSUE (Step 8 & 9)
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
BEGIN
  -- Strict input validation
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Issue quantity must be greater than zero.';
  END IF;

  -- 1. Row Lock inventory for concurrency safety (Section 9 & 10)
  SELECT * INTO v_inv
  FROM public.blood_inventory
  WHERE hospital_id = p_hospital_id AND blood_group = p_blood_group
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory record not found for blood group %', p_blood_group;
  END IF;

  -- 2. Verify sufficient stock (Cannot become negative)
  IF v_inv.available_quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Requested: % U, Available: % U.', p_quantity, v_inv.available_quantity;
  END IF;

  v_new_available := v_inv.available_quantity - p_quantity;
  v_txn_id := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');

  -- 3. Insert immutable transaction
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

  -- 4. Update cached available stock atomically
  UPDATE public.blood_inventory
  SET available_quantity = v_new_available, updated_at = NOW()
  WHERE id = v_inv.id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 6. ATOMIC STORED PROCEDURE: ATOMIC BLOOD RESERVATION (Step 20)
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
  -- Row Lock bank inventory
  SELECT * INTO v_bank_inv
  FROM public.blood_bank_inventories
  WHERE blood_bank_id = p_blood_bank_id AND blood_group = p_blood_group
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Blood bank inventory record not found.';
  END IF;

  -- Prevent double allocation
  IF v_bank_inv.available_stock < p_quantity THEN
    RAISE EXCEPTION 'Cannot reserve. Available: % U, Requested: % U.', v_bank_inv.available_stock, p_quantity;
  END IF;

  v_res_id := 'RES-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');

  -- Update reserved quantity
  UPDATE public.blood_bank_inventories
  SET reserved_stock = reserved_stock + p_quantity, updated_at = NOW()
  WHERE id = v_bank_inv.id;

  -- Create reservation record
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

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Composite Indexes for High Performance Queries (Section 59)
CREATE INDEX IF NOT EXISTS idx_txn_hosp_bg ON public.blood_inventory_transactions (hospital_id, blood_group, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_txn_status ON public.blood_inventory_transactions (status);
CREATE INDEX IF NOT EXISTS idx_res_status ON public.blood_reservations (status, expires_at);
