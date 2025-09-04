-- Migration: create_leave_applications_table
-- Source: 11_create_leave_applications_table.sql
-- Timestamp: 20240102001300

-- =====================================================
-- LEAVE APPLICATIONS TABLE - Employee Leave/WFH Management
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This creates the leave_applications table for managing employee leave and WFH requests

-- Drop existing table if you need to recreate it
-- DROP TABLE IF EXISTS public.leave_applications CASCADE;

-- Create leave_applications table
CREATE TABLE IF NOT EXISTS public.leave_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Employee Information
  employee_id TEXT, -- Reference to employees table
  employee_name TEXT NOT NULL,
  official_email TEXT,
  department TEXT CHECK (department IN (
    'Web', 'Marketing', 'Operations Head', 'Web Head', 
    'HR', 'Sales', 'Accounts', 'Blended (HR + Sales)'
  )),
  
  -- Leave Details
  leave_type TEXT NOT NULL CHECK (leave_type IN (
    'Half-Day Leave', 'Half-Day Work from Home', 'Client Meeting',
    'Sick Leave', 'Unpaid Leave', 'Casual/ Privilege (Paid Leave)',
    'Missed Punch Biometric', 'Period WFH( Females Only)'
  )),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Permission and Compensation
  will_compensate TEXT CHECK (will_compensate IN ('Yes', 'No')),
  has_prior_permission TEXT NOT NULL CHECK (has_prior_permission IN ('Yes', 'No')),
  permission_from TEXT CHECK (permission_from IN (
    'Direct Manager', 'Department Head', 'HR Manager', 'Team Lead', 'Project Manager'
  )),
  
  -- Additional Information
  client_informed TEXT,
  reason TEXT NOT NULL,
  
  -- Approval Workflow
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'manager_approved', 'hr_approved', 'approved', 'rejected', 'cancelled'
  )),
  manager_approval BOOLEAN DEFAULT FALSE,
  manager_approved_by TEXT,
  manager_approved_at TIMESTAMP WITH TIME ZONE,
  manager_comments TEXT,
  
  hr_approval BOOLEAN DEFAULT FALSE,
  hr_approved_by TEXT,
  hr_approved_at TIMESTAMP WITH TIME ZONE,
  hr_comments TEXT,
  
  -- Final Decision
  final_decision TEXT CHECK (final_decision IN ('approved', 'rejected')),
  rejection_reason TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_leave_applications_employee_name ON public.leave_applications(employee_name);
CREATE INDEX IF NOT EXISTS idx_leave_applications_department ON public.leave_applications(department);
CREATE INDEX IF NOT EXISTS idx_leave_applications_status ON public.leave_applications(status);
CREATE INDEX IF NOT EXISTS idx_leave_applications_leave_type ON public.leave_applications(leave_type);
CREATE INDEX IF NOT EXISTS idx_leave_applications_dates ON public.leave_applications(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_applications_submitted_at ON public.leave_applications(submitted_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.leave_applications;
CREATE POLICY "Allow all operations for authenticated users" ON public.leave_applications
  FOR ALL USING (true);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_leave_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leave_applications_updated_at ON public.leave_applications;
CREATE TRIGGER trigger_update_leave_applications_updated_at
  BEFORE UPDATE ON public.leave_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_applications_updated_at();

-- Insert sample data
INSERT INTO public.leave_applications (
  employee_name, official_email, department, leave_type, start_date, end_date,
  will_compensate, has_prior_permission, permission_from, client_informed, reason,
  status, manager_approval, hr_approval
) VALUES 

('John Smith', 'john.smith@company.com', 'Web', 'Casual/ Privilege (Paid Leave)', 
 '2024-01-15', '2024-01-17', 'No', 'Yes', 'Direct Manager', 
 'Yes, informed client about planned absence', 'Family wedding celebration',
 'approved', TRUE, TRUE),

('Sarah Johnson', 'sarah.johnson@company.com', 'Marketing', 'Half-Day Work from Home', 
 '2024-01-20', '2024-01-20', 'Yes', 'Yes', 'Team Lead', 
 'Not applicable for WFH', 'Doctor appointment in the morning',
 'approved', TRUE, TRUE),

('Alex Williams', 'alex.williams@company.com', 'HR', 'Sick Leave', 
 '2024-01-25', '2024-01-26', 'No', 'No', NULL, 
 'N/A', 'Fever and flu symptoms',
 'pending', FALSE, FALSE),

('Lisa Anderson', 'lisa.anderson@company.com', 'Operations Head', 'Client Meeting', 
 '2024-01-30', '2024-01-30', 'No', 'Yes', 'Department Head', 
 'Client meeting scheduled', 'Important client presentation and strategy discussion',
 'manager_approved', TRUE, FALSE),

('James Wilson', 'james.wilson@company.com', 'Accounts', 'Half-Day Leave', 
 '2024-02-05', '2024-02-05', 'Yes', 'Yes', 'Direct Manager', 
 'Informed accounting clients', 'Personal urgent work',
 'approved', TRUE, TRUE),

('Maria Garcia', 'maria.garcia@company.com', 'Sales', 'Period WFH( Females Only)', 
 '2024-02-10', '2024-02-12', 'No', 'Yes', 'HR Manager', 
 'Clients informed about remote work', 'Health reasons - period discomfort',
 'approved', TRUE, TRUE)

ON CONFLICT DO NOTHING;

-- Create helpful views for reporting
CREATE OR REPLACE VIEW leave_applications_summary AS
SELECT 
  department,
  leave_type,
  status,
  COUNT(*) as application_count,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM public.leave_applications
GROUP BY department, leave_type, status
ORDER BY department, leave_type;

-- Create function to get employee leave history
CREATE OR REPLACE FUNCTION get_employee_leave_history(emp_name TEXT)
RETURNS TABLE (
  application_id UUID,
  leave_type TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT,
  reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.id,
    la.leave_type,
    la.start_date,
    la.end_date,
    la.status,
    la.reason,
    la.submitted_at
  FROM public.leave_applications la
  WHERE la.employee_name = emp_name
  ORDER BY la.submitted_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pending approvals for managers
CREATE OR REPLACE FUNCTION get_pending_leave_approvals(dept TEXT DEFAULT NULL)
RETURNS TABLE (
  application_id UUID,
  employee_name TEXT,
  department TEXT,
  leave_type TEXT,
  start_date DATE,
  end_date DATE,
  reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  approval_stage TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.id,
    la.employee_name,
    la.department,
    la.leave_type,
    la.start_date,
    la.end_date,
    la.reason,
    la.submitted_at,
    CASE 
      WHEN la.manager_approval = FALSE THEN 'manager_approval'
      WHEN la.manager_approval = TRUE AND la.hr_approval = FALSE THEN 'hr_approval'
      ELSE 'completed'
    END as approval_stage
  FROM public.leave_applications la
  WHERE la.status IN ('pending', 'manager_approved')
    AND (dept IS NULL OR la.department = dept)
  ORDER BY la.submitted_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON public.leave_applications TO authenticated;
GRANT ALL ON public.leave_applications TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify the table was created successfully
SELECT 
  'leave_applications' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_applications,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_applications
FROM public.leave_applications;

SELECT 'Leave Applications table created successfully!' as status;