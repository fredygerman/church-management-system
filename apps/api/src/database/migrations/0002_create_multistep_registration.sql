-- Migration: Multi-step Customer Registration System
-- Description: Updates users table and creates customer_profiles and documents tables
-- Date: 2024

-- =====================================================
-- STEP 1: Create Enums
-- =====================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'DRIVER', 'ADMIN', 'SUPER_ADMIN');

-- User status enum
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- Document type enum
CREATE TYPE document_type AS ENUM (
  'NATIONAL_ID',
  'DRIVERS_LICENSE',
  'VEHICLE_PAPERS',
  'LOCAL_GOV_LETTER',
  'BUSINESS_LICENSE',
  'BUSINESS_REGISTRATION'
);

-- Verification status enum
CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- =====================================================
-- STEP 2: Update Users Table
-- =====================================================

-- Add new columns to users table
ALTER TABLE users
  -- Make email nullable (user can register with phone)
  ALTER COLUMN email DROP NOT NULL,

  -- Make firstName and lastName nullable (will use fullName instead)
  ALTER COLUMN first_name DROP NOT NULL,
  ALTER COLUMN last_name DROP NOT NULL,

  -- Add unique constraint to phone if not exists
  ADD CONSTRAINT users_phone_unique UNIQUE (phone);

-- Add new columns for multi-step registration
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS tin_number VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS nida_number VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'CUSTOMER' NOT NULL,
  ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'PENDING' NOT NULL,
  ADD COLUMN IF NOT EXISTS registration_step INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false NOT NULL;

-- Update is_active to default false for new users
ALTER TABLE users
  ALTER COLUMN is_active SET DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tin_number ON users(tin_number) WHERE tin_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_nida_number ON users(nida_number) WHERE nida_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_registration_step ON users(registration_step);

-- =====================================================
-- STEP 3: Create Customer Profiles Table
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Business information
  business_name VARCHAR(255) NOT NULL,
  business_registration_number VARCHAR(100) NOT NULL UNIQUE,

  -- Address information
  country VARCHAR(100),
  region VARCHAR(100),
  district VARCHAR(100),
  street VARCHAR(255),
  house_number VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for customer_profiles
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON customer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_business_reg_number ON customer_profiles(business_registration_number);

-- =====================================================
-- STEP 4: Create Documents Table
-- =====================================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Document details
  document_type document_type NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL, -- in bytes
  mime_type VARCHAR(100) NOT NULL,

  -- Verification details
  verification_status verification_status DEFAULT 'PENDING' NOT NULL,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  rejection_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_verification_status ON documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_documents_verified_by ON documents(verified_by) WHERE verified_by IS NOT NULL;

-- =====================================================
-- STEP 5: Create Triggers for Updated_at
-- =====================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to customer_profiles
DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to documents
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 6: Data Migration (if needed)
-- =====================================================

-- Update existing users to have full_name from first_name and last_name
UPDATE users
SET full_name = CONCAT(first_name, ' ', last_name)
WHERE full_name IS NULL AND first_name IS NOT NULL AND last_name IS NOT NULL;

-- Set default role for existing users without role
-- This is handled by the column default, but we ensure existing nulls are set
UPDATE users
SET role = 'CUSTOMER'
WHERE role IS NULL;

-- Set default status for existing users
UPDATE users
SET status = CASE
  WHEN is_active = true THEN 'ACTIVE'::user_status
  ELSE 'PENDING'::user_status
END
WHERE status IS NULL;

-- Set registration_completed for existing active users
UPDATE users
SET registration_completed = true,
    registration_step = 5
WHERE is_active = true AND registration_completed = false;

-- =====================================================
-- STEP 7: Add Constraints and Comments
-- =====================================================

-- Add check constraint to ensure at least one contact method
ALTER TABLE users
ADD CONSTRAINT users_contact_check CHECK (
  email IS NOT NULL OR phone IS NOT NULL
);

-- Add check constraint for registration step (1-5)
ALTER TABLE users
ADD CONSTRAINT users_registration_step_check CHECK (
  registration_step >= 1 AND registration_step <= 5
);

-- Add check constraint for age validation (18+)
-- This is a database-level check, but main validation happens in application
ALTER TABLE users
ADD CONSTRAINT users_age_check CHECK (
  date_of_birth IS NULL OR
  date_of_birth <= CURRENT_DATE - INTERVAL '18 years'
);

-- Add check constraint for TIN format (alphanumeric, 9-12 chars)
ALTER TABLE users
ADD CONSTRAINT users_tin_format_check CHECK (
  tin_number IS NULL OR
  (LENGTH(tin_number) >= 9 AND LENGTH(tin_number) <= 12 AND tin_number ~ '^[A-Z0-9]+$')
);

-- Add check constraint for NIDA format (20 digits)
ALTER TABLE users
ADD CONSTRAINT users_nida_format_check CHECK (
  nida_number IS NULL OR
  (LENGTH(nida_number) = 20 AND nida_number ~ '^\d{20}$')
);

-- Add check constraint for business registration number format
ALTER TABLE customer_profiles
ADD CONSTRAINT customer_profiles_business_reg_format_check CHECK (
  LENGTH(business_registration_number) >= 6 AND
  LENGTH(business_registration_number) <= 20 AND
  business_registration_number ~ '^[A-Z0-9-]+$'
);

-- Add check constraint for file size (max 5MB = 5242880 bytes)
ALTER TABLE documents
ADD CONSTRAINT documents_file_size_check CHECK (
  file_size > 0 AND file_size <= 5242880
);

-- =====================================================
-- STEP 8: Add Table Comments
-- =====================================================

COMMENT ON TABLE users IS 'Stores user account information with multi-step registration tracking';
COMMENT ON TABLE customer_profiles IS 'Stores business profile information for customers in freight marketplace';
COMMENT ON TABLE documents IS 'Stores user document uploads with verification status';

COMMENT ON COLUMN users.registration_step IS 'Tracks current registration progress (1-5)';
COMMENT ON COLUMN users.registration_completed IS 'Indicates if user completed all registration steps';
COMMENT ON COLUMN users.tin_number IS 'Tax Identification Number - alphanumeric, 9-12 characters';
COMMENT ON COLUMN users.nida_number IS 'National ID (NIDA) - 20 digits for Tanzania';
COMMENT ON COLUMN users.role IS 'User role in the system';
COMMENT ON COLUMN users.status IS 'Account status';

COMMENT ON COLUMN customer_profiles.business_registration_number IS 'Unique business registration number';
COMMENT ON COLUMN documents.verification_status IS 'Document verification status by admin';
COMMENT ON COLUMN documents.file_size IS 'File size in bytes (max 5MB)';

-- =====================================================
-- Migration Complete
-- =====================================================
