-- Migration: employee_onboarding_schema
-- Source: 13_employee_onboarding_schema.sql
-- Timestamp: 20240102001600

-- =====================================================
-- EMPLOYEE ONBOARDING SCHEMA ENHANCEMENT
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This enhances the employees table for comprehensive onboarding data
-- and creates user_accounts table for login functionality

-- Add onboarding-specific columns to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_tools JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS distance_from_office TEXT,
ADD COLUMN IF NOT EXISTS living_situation TEXT,
ADD COLUMN IF NOT EXISTS linkedin_profile TEXT,
ADD COLUMN IF NOT EXISTS favorite_food TEXT,
ADD COLUMN IF NOT EXISTS health_conditions TEXT,
ADD COLUMN IF NOT EXISTS documents_url TEXT,
ADD COLUMN IF NOT EXISTS education_certificates_url TEXT,
ADD COLUMN IF NOT EXISTS induction_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create user_accounts table for login functionality
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text UNIQUE NOT NULL,
  password text NOT NULL, -- Will store phone number as password as requested
  department text NOT NULL,
  role jsonb DEFAULT '[]'::jsonb,
  employee_type text DEFAULT 'Full-time' CHECK (employee_type IN (
    'Full-time', 'Part-time', 'Remote', 'Intern', 'Consultant', 'Freelancer'
  )),
  is_active boolean DEFAULT true,
  last_login timestamptz,
  login_attempts integer DEFAULT 0,
  account_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique combination of email and phone
  CONSTRAINT unique_user_credentials UNIQUE (email, phone)
);

-- Create indexes for user_accounts table
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON public.user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_phone ON public.user_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_user_accounts_employee_id ON public.user_accounts(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_department ON public.user_accounts(department);
CREATE INDEX IF NOT EXISTS idx_user_accounts_employee_type ON public.user_accounts(employee_type);
CREATE INDEX IF NOT EXISTS idx_user_accounts_is_active ON public.user_accounts(is_active);

-- Create updated_at trigger for user_accounts
CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to sync employee data with user accounts
CREATE OR REPLACE FUNCTION sync_employee_to_user_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Update corresponding user account when employee data changes
  UPDATE public.user_accounts 
  SET 
    name = NEW.name,
    email = NEW.email,
    phone = NEW.phone,
    department = NEW.department,
    role = NEW.role,
    employee_type = NEW.employee_type,
    updated_at = NOW()
  WHERE employee_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync employee changes to user accounts
CREATE TRIGGER sync_employee_data_trigger
  AFTER UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION sync_employee_to_user_account();

-- Create function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(
  login_identifier text, -- Can be email or phone
  user_password text
)
RETURNS TABLE (
  user_id uuid,
  employee_id uuid,
  name text,
  email text,
  phone text,
  department text,
  role jsonb,
  employee_type text,
  is_active boolean,
  authentication_success boolean
) AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find user by email or phone
  SELECT * INTO user_record
  FROM public.user_accounts
  WHERE (email = login_identifier OR phone = login_identifier)
    AND is_active = true
    AND account_locked = false;
  
  -- Check if user exists and password matches
  IF user_record.id IS NOT NULL AND user_record.password = user_password THEN
    -- Update last login and reset login attempts
    UPDATE public.user_accounts 
    SET 
      last_login = NOW(),
      login_attempts = 0,
      updated_at = NOW()
    WHERE id = user_record.id;
    
    -- Return successful authentication
    RETURN QUERY SELECT 
      user_record.id,
      user_record.employee_id,
      user_record.name,
      user_record.email,
      user_record.phone,
      user_record.department,
      user_record.role,
      user_record.employee_type,
      user_record.is_active,
      true as authentication_success;
  ELSE
    -- Increment login attempts if user exists
    IF user_record.id IS NOT NULL THEN
      UPDATE public.user_accounts 
      SET 
        login_attempts = login_attempts + 1,
        account_locked = CASE WHEN login_attempts >= 4 THEN true ELSE false END,
        updated_at = NOW()
      WHERE id = user_record.id;
    END IF;
    
    -- Return failed authentication
    RETURN QUERY SELECT 
      NULL::uuid,
      NULL::uuid,
      NULL::text,
      NULL::text,
      NULL::text,
      NULL::text,
      NULL::jsonb,
      NULL::text,
      false,
      false as authentication_success;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get employee onboarding status
CREATE OR REPLACE FUNCTION get_employee_onboarding_status(emp_id uuid)
RETURNS TABLE (
  employee_name text,
  department text,
  employee_type text,
  onboarding_completed boolean,
  induction_completed boolean,
  missing_fields text[],
  completion_percentage integer
) AS $$
DECLARE
  emp_record RECORD;
  missing_fields_array text[] := '{}';
  total_fields integer := 15;
  completed_fields integer := 0;
BEGIN
  -- Get employee record
  SELECT * INTO emp_record
  FROM public.employees
  WHERE id = emp_id;
  
  IF emp_record.id IS NULL THEN
    RETURN;
  END IF;
  
  -- Check required fields and count completed ones
  IF emp_record.name IS NOT NULL AND emp_record.name != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'name');
  END IF;
  
  IF emp_record.email IS NOT NULL AND emp_record.email != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'email');
  END IF;
  
  IF emp_record.phone IS NOT NULL AND emp_record.phone != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'phone');
  END IF;
  
  IF emp_record.department IS NOT NULL AND emp_record.department != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'department');
  END IF;
  
  IF emp_record.role IS NOT NULL AND jsonb_array_length(emp_record.role) > 0 THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'role');
  END IF;
  
  IF emp_record.employee_type IS NOT NULL AND emp_record.employee_type != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'employee_type');
  END IF;
  
  IF emp_record.date_of_birth IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'date_of_birth');
  END IF;
  
  IF emp_record.hire_date IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'hire_date');
  END IF;
  
  IF emp_record.address IS NOT NULL AND emp_record.address->>'current' IS NOT NULL THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'current_address');
  END IF;
  
  IF emp_record.languages IS NOT NULL AND jsonb_array_length(emp_record.languages) > 0 THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'languages');
  END IF;
  
  IF emp_record.ai_tools IS NOT NULL AND jsonb_array_length(emp_record.ai_tools) > 0 THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'ai_tools');
  END IF;
  
  IF emp_record.blood_group IS NOT NULL AND emp_record.blood_group != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'blood_group');
  END IF;
  
  IF emp_record.linkedin_profile IS NOT NULL AND emp_record.linkedin_profile != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'linkedin_profile');
  END IF;
  
  IF emp_record.favorite_food IS NOT NULL AND emp_record.favorite_food != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'favorite_food');
  END IF;
  
  IF emp_record.health_conditions IS NOT NULL AND emp_record.health_conditions != '' THEN
    completed_fields := completed_fields + 1;
  ELSE
    missing_fields_array := array_append(missing_fields_array, 'health_conditions');
  END IF;
  
  -- Return results
  RETURN QUERY SELECT 
    emp_record.name,
    emp_record.department,
    emp_record.employee_type,
    (completed_fields = total_fields) as onboarding_completed,
    COALESCE(emp_record.induction_completed, false),
    missing_fields_array,
    (completed_fields * 100 / total_fields)::integer as completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark induction as completed
CREATE OR REPLACE FUNCTION complete_employee_induction(
  emp_id uuid,
  induction_data jsonb
)
RETURNS boolean AS $$
BEGIN
  UPDATE public.employees 
  SET 
    induction_completed = true,
    onboarding_data = onboarding_data || jsonb_build_object('induction_checklist', induction_data),
    updated_at = NOW()
  WHERE id = emp_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Insert sample user accounts for existing employees
INSERT INTO public.user_accounts (
  employee_id, name, email, phone, password, department, role, employee_type
)
SELECT 
  e.id,
  e.name,
  COALESCE(e.email, LOWER(REPLACE(e.name, ' ', '.')) || '@company.com'),
  e.phone,
  e.phone, -- Phone as password as requested
  e.department,
  e.role,
  COALESCE(e.employee_type, 'Full-time')
FROM public.employees e
WHERE e.status = 'Active'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_accounts ua WHERE ua.employee_id = e.id
  )
ON CONFLICT (email, phone) DO NOTHING;

-- Create view for employee onboarding dashboard
CREATE OR REPLACE VIEW employee_onboarding_dashboard AS
SELECT 
  e.id,
  e.name,
  e.department,
  e.employee_type,
  e.hire_date,
  e.status,
  COALESCE(e.induction_completed, false) as induction_completed,
  CASE 
    WHEN e.name IS NOT NULL 
      AND e.email IS NOT NULL 
      AND e.phone IS NOT NULL 
      AND e.department IS NOT NULL 
      AND e.role IS NOT NULL 
      AND jsonb_array_length(e.role) > 0
      AND e.date_of_birth IS NOT NULL 
      AND e.hire_date IS NOT NULL 
      AND e.address IS NOT NULL 
      AND e.address->>'current' IS NOT NULL
    THEN true 
    ELSE false 
  END as basic_info_completed,
  CASE 
    WHEN ua.id IS NOT NULL THEN true 
    ELSE false 
  END as account_created,
  ua.last_login,
  e.created_at as onboarding_started,
  e.onboarding_completed_at
FROM public.employees e
LEFT JOIN public.user_accounts ua ON e.id = ua.employee_id
WHERE e.status = 'Active'
ORDER BY e.created_at DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.user_accounts TO authenticated;
GRANT SELECT ON employee_onboarding_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION authenticate_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_onboarding_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_employee_induction(uuid, jsonb) TO authenticated;

-- Verify the schema enhancements
SELECT 
  'onboarding_schema_enhanced' as status,
  COUNT(*) as total_employees,
  COUNT(CASE WHEN induction_completed = true THEN 1 END) as employees_with_induction,
  COUNT(ua.id) as employees_with_accounts
FROM public.employees e
LEFT JOIN public.user_accounts ua ON e.id = ua.employee_id
WHERE e.status = 'Active';

-- Success message
SELECT 'Employee onboarding schema enhanced successfully!' as result;