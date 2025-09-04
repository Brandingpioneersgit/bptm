-- Migration: create_employee_signups_table
-- Source: 04_create_employee_signups_table.sql
-- Timestamp: 20240102000600

-- =====================================================
-- EMPLOYEE SIGNUPS TABLE - New Employee Registration
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This creates the employee_signups table for managing new employee applications

-- Drop existing table if you need to recreate it
-- DROP TABLE IF EXISTS public.employee_signups CASCADE;

-- Create employee_signups table
CREATE TABLE IF NOT EXISTS public.employee_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Personal Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  
  -- Address Information (stored as JSONB for flexibility)
  address JSONB DEFAULT '{}', -- {"street": "123 Main St", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}
  
  -- Emergency Contact (stored as JSONB)
  emergency_contact JSONB DEFAULT '{}', -- {"name": "John Doe", "phone": "9876543210", "relationship": "Father"}
  
  -- Professional Information
  department TEXT NOT NULL CHECK (department IN (
    'Web', 'Marketing', 'Operations Head', 'Web Head', 
    'HR', 'Sales', 'Accounts', 'Blended (HR + Sales)'
  )),
  role TEXT[] NOT NULL, -- Array of roles: ['Developer', 'Designer', etc.]
  expected_join_date DATE NOT NULL,
  expected_salary TEXT,
  
  -- Education & Experience
  education TEXT NOT NULL,
  experience TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}', -- Array of skills: ['JavaScript', 'React', 'Node.js']
  certifications TEXT,
  
  -- Additional Information
  portfolio_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  cover_letter TEXT,
  
  -- Document Uploads (URLs to uploaded files)
  resume_url TEXT,
  id_proof_url TEXT,
  address_proof_url TEXT,
  education_certificates_url TEXT,
  
  -- HR Workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'hired')),
  hr_notes TEXT,
  interview_scheduled_at TIMESTAMPTZ,
  interview_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  rejection_reason TEXT,
  
  -- Onboarding Information (filled after approval)
  employee_id TEXT, -- Generated after hiring
  actual_join_date DATE,
  actual_salary TEXT,
  reporting_manager TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_signups_status ON public.employee_signups(status);
CREATE INDEX IF NOT EXISTS idx_employee_signups_department ON public.employee_signups(department);
CREATE INDEX IF NOT EXISTS idx_employee_signups_submitted_at ON public.employee_signups(submitted_at);
CREATE INDEX IF NOT EXISTS idx_employee_signups_email ON public.employee_signups(email);
CREATE INDEX IF NOT EXISTS idx_employee_signups_phone ON public.employee_signups(phone);
CREATE INDEX IF NOT EXISTS idx_employee_signups_expected_join_date ON public.employee_signups(expected_join_date);

-- Enable RLS (Row Level Security)
ALTER TABLE public.employee_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.employee_signups;
CREATE POLICY "Allow all operations for authenticated users" ON public.employee_signups
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.employee_signups TO authenticated;
GRANT ALL ON public.employee_signups TO anon;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_employee_signups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_signups_updated_at
  BEFORE UPDATE ON public.employee_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_signups_updated_at();

-- Insert sample employee signup data for testing
INSERT INTO public.employee_signups (
  name, email, phone, date_of_birth, address, emergency_contact,
  department, role, expected_join_date, expected_salary,
  education, experience, skills, certifications,
  portfolio_url, linkedin_url, github_url, cover_letter,
  status, hr_notes
) VALUES 

('Priya Sharma', 'priya.sharma@email.com', '9876543211', '1995-03-15',
 '{"street": "456 Tech Park", "city": "Bangalore", "state": "Karnataka", "pincode": "560001"}'::jsonb,
 '{"name": "Raj Sharma", "phone": "9876543200", "relationship": "Father"}'::jsonb,
 'Web', '{"Frontend Developer", "UI/UX Designer"}', '2024-02-15', '₹8,00,000 - ₹10,00,000',
 'B.Tech in Computer Science from VIT University',
 '2 years experience in React.js and Node.js development',
 '{"JavaScript", "React", "Node.js", "MongoDB", "CSS", "HTML"}', 'AWS Certified Developer',
 'https://priyasharma.dev', 'https://linkedin.com/in/priyasharma', 'https://github.com/priyasharma',
 'I am passionate about creating user-friendly web applications and have experience in full-stack development.',
 'under_review', 'Strong technical background, good portfolio'),

('Arjun Patel', 'arjun.patel@email.com', '9876543212', '1992-07-22',
 '{"street": "789 Business District", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}'::jsonb,
 '{"name": "Meera Patel", "phone": "9876543201", "relationship": "Mother"}'::jsonb,
 'Marketing', '{"Digital Marketing Manager", "SEO Specialist"}', '2024-03-01', '₹12,00,000 - ₹15,00,000',
 'MBA in Marketing from IIM Ahmedabad',
 '5 years experience in digital marketing and SEO',
 '{"SEO", "Google Ads", "Social Media Marketing", "Analytics", "Content Strategy"}', 'Google Ads Certified, HubSpot Certified',
 'https://arjunmarketing.com', 'https://linkedin.com/in/arjunpatel', '',
 'Experienced digital marketer with proven track record of increasing organic traffic by 300% in previous roles.',
 'pending', 'Impressive experience, scheduling interview'),

('Sneha Reddy', 'sneha.reddy@email.com', '9876543213', '1996-11-08',
 '{"street": "321 IT Corridor", "city": "Hyderabad", "state": "Telangana", "pincode": "500001"}'::jsonb,
 '{"name": "Venkat Reddy", "phone": "9876543202", "relationship": "Father"}'::jsonb,
 'Sales', '{"Sales Executive", "Business Development"}', '2024-02-20', '₹6,00,000 - ₹8,00,000',
 'B.Com from Osmania University',
 '3 years experience in B2B sales and client relationship management',
 '{"Sales", "CRM", "Lead Generation", "Client Relations", "Negotiation"}', 'Salesforce Certified',
 '', 'https://linkedin.com/in/snehareddy', '',
 'Results-driven sales professional with consistent track record of exceeding targets.',
 'approved', 'Excellent interview performance, ready for hiring'),

('Rahul Kumar', 'rahul.kumar@email.com', '9876543214', '1994-01-12',
 '{"street": "654 Corporate Hub", "city": "Pune", "state": "Maharashtra", "pincode": "411001"}'::jsonb,
 '{"name": "Sunita Kumar", "phone": "9876543203", "relationship": "Mother"}'::jsonb,
 'HR', '{"HR Generalist", "Recruitment Specialist"}', '2024-03-15', '₹7,00,000 - ₹9,00,000',
 'MBA in HR from Symbiosis International University',
 '4 years experience in recruitment and employee relations',
 '{"Recruitment", "Employee Relations", "Performance Management", "HR Policies", "Training"}', 'SHRM Certified',
 '', 'https://linkedin.com/in/rahulkumar', '',
 'Dedicated HR professional with expertise in talent acquisition and employee engagement.',
 'rejected', 'Overqualified for the current position, may consider for senior role later')

ON CONFLICT (email) DO NOTHING;

-- Create a view for HR dashboard
CREATE OR REPLACE VIEW employee_signups_summary AS
SELECT 
  es.name,
  es.email,
  es.phone,
  es.department,
  array_to_string(es.role, ', ') as roles,
  es.expected_join_date,
  es.expected_salary,
  es.status,
  es.submitted_at,
  es.reviewed_at,
  es.reviewed_by,
  CASE 
    WHEN es.status = 'pending' THEN 'Awaiting Review'
    WHEN es.status = 'under_review' THEN 'Under Review'
    WHEN es.status = 'approved' THEN 'Approved - Ready to Hire'
    WHEN es.status = 'rejected' THEN 'Rejected'
    WHEN es.status = 'hired' THEN 'Successfully Hired'
  END as status_description,
  DATE_PART('day', NOW() - es.submitted_at) as days_since_application
FROM public.employee_signups es
ORDER BY es.submitted_at DESC;

-- Grant access to the view
GRANT SELECT ON employee_signups_summary TO authenticated;
GRANT SELECT ON employee_signups_summary TO anon;

-- Create function to update status with timestamp
CREATE OR REPLACE FUNCTION update_signup_status(
  signup_id UUID,
  new_status TEXT,
  reviewer_name TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.employee_signups 
  SET 
    status = new_status,
    reviewed_at = NOW(),
    reviewed_by = COALESCE(reviewer_name, reviewed_by),
    hr_notes = COALESCE(notes, hr_notes),
    updated_at = NOW()
  WHERE id = signup_id;
  
  RETURN FOUND;
END;
$$;

-- Verify the data was inserted
SELECT 
  name,
  department,
  array_to_string(role, ', ') as roles,
  expected_join_date,
  status,
  submitted_at
FROM public.employee_signups 
ORDER BY submitted_at DESC;

-- Success message
SELECT 'Employee signups table created successfully with ' || COUNT(*) || ' sample applications' as result
FROM public.employee_signups;

-- Show status distribution
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.employee_signups
GROUP BY status
ORDER BY count DESC;