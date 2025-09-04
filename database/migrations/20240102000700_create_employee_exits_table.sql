-- Migration: create_employee_exits_table
-- Source: 05_create_employee_exits_table.sql
-- Timestamp: 20240102000700

-- =====================================================
-- EMPLOYEE EXITS TABLE - Employee Departure Tracking
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This creates the employee_exits table for managing employee departures and exit interviews

-- Drop existing table if you need to recreate it
-- DROP TABLE IF EXISTS public.employee_exits CASCADE;

-- Create employee_exits table
CREATE TABLE IF NOT EXISTS public.employee_exits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Employee Information
  employee_id TEXT, -- Reference to employees table
  employee_name TEXT NOT NULL,
  employee_phone TEXT,
  department TEXT CHECK (department IN (
    'Web', 'Marketing', 'Operations Head', 'Web Head', 
    'HR', 'Sales', 'Accounts', 'Blended (HR + Sales)'
  )),
  role TEXT[], -- Array of employee roles
  
  -- Exit Information
  exit_reason TEXT NOT NULL CHECK (exit_reason IN (
    'Resignation', 'Termination', 'Retirement', 'Contract End', 
    'Performance Issues', 'Restructuring', 'Personal Reasons', 
    'Better Opportunity', 'Relocation', 'Health Issues', 'Other'
  )),
  custom_reason TEXT, -- Additional details if exit_reason is 'Other'
  last_working_day DATE NOT NULL,
  notice_period INTEGER DEFAULT 30, -- Notice period in days
  immediate_exit BOOLEAN DEFAULT FALSE,
  
  -- Exit Interview Feedback
  overall_experience TEXT CHECK (overall_experience IN (
    'Excellent', 'Good', 'Satisfactory', 'Poor', 'Very Poor'
  )),
  reason_for_leaving TEXT,
  work_environment_feedback TEXT,
  management_feedback TEXT,
  improvement_suggestions TEXT,
  would_recommend_company TEXT CHECK (would_recommend_company IN (
    'Definitely', 'Probably', 'Maybe', 'Probably Not', 'Definitely Not'
  )),
  
  -- Asset Return Tracking
  assets_to_return TEXT[], -- Array of assets: ['Laptop', 'Access Card', 'Documents']
  laptop_returned BOOLEAN DEFAULT FALSE,
  access_cards_returned BOOLEAN DEFAULT FALSE,
  documents_returned BOOLEAN DEFAULT FALSE,
  other_assets TEXT,
  
  -- Handover Information
  handover_notes TEXT,
  handover_to TEXT, -- Name of person receiving handover
  pending_tasks TEXT,
  client_handover TEXT, -- Details about client work handover
  
  -- Financial Settlement
  final_settlement TEXT,
  settlement_amount DECIMAL(10,2),
  settlement_date DATE,
  
  -- HR Workflow
  hr_notes TEXT,
  manager_approval BOOLEAN DEFAULT FALSE,
  hr_approval BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'manager_approved', 'hr_approved', 'completed', 'cancelled'
  )),
  
  -- Additional Information
  rehire_eligible BOOLEAN DEFAULT TRUE,
  exit_interview_completed BOOLEAN DEFAULT FALSE,
  exit_interview_date DATE,
  exit_interview_conducted_by TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_exits_employee_name ON public.employee_exits(employee_name);
CREATE INDEX IF NOT EXISTS idx_employee_exits_status ON public.employee_exits(status);
CREATE INDEX IF NOT EXISTS idx_employee_exits_created_at ON public.employee_exits(created_at);
CREATE INDEX IF NOT EXISTS idx_employee_exits_last_working_day ON public.employee_exits(last_working_day);
CREATE INDEX IF NOT EXISTS idx_employee_exits_department ON public.employee_exits(department);
CREATE INDEX IF NOT EXISTS idx_employee_exits_exit_reason ON public.employee_exits(exit_reason);

-- Enable Row Level Security
ALTER TABLE public.employee_exits ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.employee_exits;
CREATE POLICY "Allow all operations for authenticated users" ON public.employee_exits
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.employee_exits TO authenticated;
GRANT ALL ON public.employee_exits TO anon;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_employee_exits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_exits_updated_at
  BEFORE UPDATE ON public.employee_exits
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_exits_updated_at();

-- Insert sample employee exit data for testing
INSERT INTO public.employee_exits (
  employee_name, employee_phone, department, role, exit_reason, custom_reason,
  last_working_day, notice_period, immediate_exit, overall_experience,
  reason_for_leaving, work_environment_feedback, management_feedback,
  improvement_suggestions, would_recommend_company, assets_to_return,
  laptop_returned, access_cards_returned, documents_returned,
  handover_notes, handover_to, pending_tasks, client_handover,
  final_settlement, hr_notes, manager_approval, hr_approval, status,
  rehire_eligible, exit_interview_completed
) VALUES 

('John Smith', '9876543220', 'Marketing', '{"Digital Marketing Specialist"}', 'Better Opportunity', 
 'Received offer from a Fortune 500 company with better growth prospects',
 '2024-02-15', 30, FALSE, 'Good',
 'Found a better opportunity with higher compensation and growth potential',
 'Great team collaboration, could improve on work-life balance',
 'Supportive management, clear communication of expectations',
 'More flexible work arrangements and professional development opportunities',
 'Probably', '{"Laptop", "Access Card", "Marketing Materials"}',
 TRUE, TRUE, TRUE,
 'All ongoing campaigns handed over to Sarah Johnson. Client contact lists updated.',
 'Sarah Johnson', 'Complete Q1 campaign analysis report',
 'All client accounts properly transitioned. No pending issues.',
 'Final settlement of ₹45,000 processed', 'Professional exit, good employee', TRUE, TRUE, 'completed',
 TRUE, TRUE),

('Lisa Chen', '9876543221', 'Web', '{"Frontend Developer"}', 'Relocation', 
 'Moving to Canada for family reasons',
 '2024-01-31', 45, FALSE, 'Excellent',
 'Relocating to Canada due to family circumstances',
 'Excellent work environment, great learning opportunities',
 'Very supportive management, always available for guidance',
 'Continue the great work culture and technical mentorship programs',
 'Definitely', '{"Laptop", "Access Card", "Development Tools"}',
 TRUE, TRUE, FALSE,
 'All projects documented and handed over to development team. Code repositories updated.',
 'Robert Brown', 'Complete documentation for React component library',
 'All client projects properly documented and transitioned.',
 'Final settlement of ₹38,000 processed', 'Excellent developer, sad to see her go', TRUE, TRUE, 'completed',
 TRUE, TRUE),

('Mike Johnson', '9876543222', 'Sales', '{"Sales Executive"}', 'Performance Issues', 
 'Consistently missing sales targets despite coaching and support',
 '2024-01-15', 0, TRUE, 'Satisfactory',
 'Performance did not meet company standards',
 'Good team environment but high pressure',
 'Management provided support but expectations were challenging',
 'Better training programs for new sales staff',
 'Maybe', '{"Laptop", "Access Card", "Sales Materials"}',
 TRUE, TRUE, TRUE,
 'Client accounts redistributed among team members. CRM updated.',
 'David Chen', 'Transfer all active leads to team',
 'All client relationships properly transitioned.',
 'Settlement as per company policy', 'Performance-related exit, followed proper procedures', TRUE, TRUE, 'completed',
 FALSE, TRUE),

('Anna Patel', '9876543223', 'HR', '{"HR Specialist"}', 'Personal Reasons', 
 'Taking care of elderly parents, need more flexible schedule',
 '2024-03-01', 30, FALSE, 'Good',
 'Need to take care of family, current role does not allow required flexibility',
 'Supportive colleagues, good HR policies',
 'Understanding management, tried to accommodate needs',
 'More remote work options and flexible scheduling',
 'Probably', '{"Laptop", "Access Card", "HR Files"}',
 FALSE, FALSE, FALSE,
 'All HR processes documented. Recruitment pipeline handed over.',
 'Emily Johnson', 'Complete onboarding for 3 new hires',
 'All confidential HR matters properly transitioned.',
 'Pending final settlement calculation', 'Good employee, unfortunate circumstances', TRUE, FALSE, 'pending',
 TRUE, FALSE)

ON CONFLICT (employee_name, last_working_day) DO NOTHING;

-- Create a view for exit analytics
CREATE OR REPLACE VIEW employee_exits_summary AS
SELECT 
  ee.employee_name,
  ee.department,
  array_to_string(ee.role, ', ') as roles,
  ee.exit_reason,
  ee.last_working_day,
  ee.notice_period,
  ee.overall_experience,
  ee.would_recommend_company,
  ee.status,
  ee.rehire_eligible,
  ee.created_at,
  CASE 
    WHEN ee.status = 'completed' THEN 'Exit Completed'
    WHEN ee.status = 'pending' THEN 'Awaiting Approval'
    WHEN ee.status = 'manager_approved' THEN 'Awaiting HR Approval'
    WHEN ee.status = 'hr_approved' THEN 'Ready for Final Settlement'
    WHEN ee.status = 'cancelled' THEN 'Exit Cancelled'
  END as status_description,
  DATE_PART('day', ee.last_working_day - ee.created_at::date) as notice_period_actual
FROM public.employee_exits ee
ORDER BY ee.created_at DESC;

-- Grant access to the view
GRANT SELECT ON employee_exits_summary TO authenticated;
GRANT SELECT ON employee_exits_summary TO anon;

-- Create function to approve exit
CREATE OR REPLACE FUNCTION approve_employee_exit(
  exit_id UUID,
  approver_type TEXT, -- 'manager' or 'hr'
  approver_name TEXT,
  notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  IF approver_type = 'manager' THEN
    UPDATE public.employee_exits 
    SET 
      manager_approval = TRUE,
      status = CASE WHEN hr_approval THEN 'completed' ELSE 'manager_approved' END,
      hr_notes = COALESCE(notes, hr_notes),
      updated_at = NOW()
    WHERE id = exit_id;
  ELSIF approver_type = 'hr' THEN
    UPDATE public.employee_exits 
    SET 
      hr_approval = TRUE,
      status = CASE WHEN manager_approval THEN 'completed' ELSE 'hr_approved' END,
      hr_notes = COALESCE(notes, hr_notes),
      updated_at = NOW()
    WHERE id = exit_id;
  END IF;
  
  RETURN FOUND;
END;
$$;

-- Verify the data was inserted
SELECT 
  employee_name,
  department,
  exit_reason,
  last_working_day,
  status,
  overall_experience,
  created_at
FROM public.employee_exits 
ORDER BY created_at DESC;

-- Success message
SELECT 'Employee exits table created successfully with ' || COUNT(*) || ' sample exit records' as result
FROM public.employee_exits;

-- Show exit reason distribution
SELECT 
  exit_reason,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.employee_exits
GROUP BY exit_reason
ORDER BY count DESC;

-- Show status distribution
SELECT 
  status,
  COUNT(*) as count
FROM public.employee_exits
GROUP BY status
ORDER BY count DESC;