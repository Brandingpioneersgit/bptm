-- Migration: employee_incentives_schema
-- Source: 14_employee_incentives_schema.sql
-- Timestamp: 20240102001700

-- =====================================================
-- EMPLOYEE INCENTIVES SCHEMA
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This creates the employee incentive system for hiring recommendations, testimonials, and promotional videos

-- Create incentive_types table for predefined incentive categories
CREATE TABLE IF NOT EXISTS public.incentive_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  amount_inr INTEGER NOT NULL,
  eligibility_months INTEGER DEFAULT 0, -- Months of employment required
  proof_requirements JSONB DEFAULT '[]'::jsonb, -- Array of required proof fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create incentive_applications table for employee applications
CREATE TABLE IF NOT EXISTS public.incentive_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Employee Information
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_phone TEXT,
  employee_email TEXT,
  department TEXT,
  
  -- Incentive Details
  incentive_type_id UUID REFERENCES public.incentive_types(id) ON DELETE CASCADE,
  incentive_type TEXT NOT NULL, -- 'hiring_recommendation', 'client_testimonial', 'promotional_video'
  amount_inr INTEGER NOT NULL,
  
  -- Hiring Recommendation Specific Fields
  candidate_name TEXT, -- For hiring recommendations
  appointment_letter_url TEXT, -- Google Drive link to appointment letter screenshot
  
  -- Client Testimonial Specific Fields
  testimonial_youtube_url TEXT, -- YouTube URL for client testimonial
  client_name TEXT, -- Name of the client who gave testimonial
  
  -- Promotional Video Specific Fields
  promotional_video_url TEXT, -- Google Drive link to promotional video
  video_description TEXT, -- Description of the promotional content
  target_department TEXT, -- Department the video promotes
  
  -- Application Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'disbursed')),
  
  -- HR Review
  hr_reviewer_id UUID REFERENCES public.employees(id),
  hr_review_notes TEXT,
  hr_reviewed_at TIMESTAMPTZ,
  
  -- Disbursement Tracking
  razorpay_form_submitted BOOLEAN DEFAULT FALSE,
  razorpay_submission_date TIMESTAMPTZ,
  disbursement_date TIMESTAMPTZ,
  disbursement_reference TEXT,
  
  -- Eligibility Verification
  employee_join_date DATE,
  eligible_date DATE, -- Date when employee becomes eligible (join_date + eligibility_months)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert predefined incentive types
INSERT INTO public.incentive_types (name, description, amount_inr, eligibility_months, proof_requirements) VALUES
('hiring_recommendation', 'Recommending a full-time hire', 3000, 3, '["candidate_name", "appointment_letter_screenshot"]'),
('client_testimonial', 'Getting video testimonial from client', 1000, 0, '["youtube_url", "client_name"]'),
('promotional_video', 'Creating ad/promotional video for department', 500, 0, '["video_file", "description", "target_department"]')
ON CONFLICT (name) DO NOTHING;

-- Create function to automatically set incentive amount and eligibility
CREATE OR REPLACE FUNCTION set_incentive_details()
RETURNS TRIGGER AS $$
BEGIN
  -- Get incentive type details
  SELECT amount_inr, eligibility_months 
  INTO NEW.amount_inr, NEW.eligible_date
  FROM incentive_types 
  WHERE name = NEW.incentive_type;
  
  -- Calculate eligible date based on employee join date
  IF NEW.employee_join_date IS NOT NULL THEN
    NEW.eligible_date := NEW.employee_join_date + (SELECT eligibility_months FROM incentive_types WHERE name = NEW.incentive_type) * INTERVAL '1 month';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set incentive details
CREATE TRIGGER trigger_set_incentive_details
  BEFORE INSERT OR UPDATE ON incentive_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_incentive_details();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_incentive_types_updated_at
  BEFORE UPDATE ON incentive_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_incentive_applications_updated_at
  BEFORE UPDATE ON incentive_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for manager reporting (incentives disbursed report)
CREATE OR REPLACE VIEW incentives_disbursed_report AS
SELECT 
  ia.id,
  ia.employee_name,
  ia.employee_phone,
  ia.department,
  it.name as incentive_type_name,
  it.description as incentive_description,
  ia.amount_inr,
  ia.status,
  ia.disbursement_date,
  ia.disbursement_reference,
  ia.created_at as application_date,
  ia.hr_reviewed_at,
  hr.name as hr_reviewer_name
FROM incentive_applications ia
JOIN incentive_types it ON ia.incentive_type_id = it.id
LEFT JOIN employees hr ON ia.hr_reviewer_id = hr.id
WHERE ia.status = 'disbursed'
ORDER BY ia.disbursement_date DESC;

-- Create view for HR approval workflow
CREATE OR REPLACE VIEW hr_incentive_approvals AS
SELECT 
  ia.id,
  ia.employee_name,
  ia.employee_phone,
  ia.employee_email,
  ia.department,
  it.name as incentive_type_name,
  it.description as incentive_description,
  ia.amount_inr,
  ia.candidate_name,
  ia.appointment_letter_url,
  ia.testimonial_youtube_url,
  ia.client_name,
  ia.promotional_video_url,
  ia.video_description,
  ia.target_department,
  ia.status,
  ia.eligible_date,
  ia.created_at as application_date,
  CASE 
    WHEN ia.eligible_date > CURRENT_DATE THEN FALSE
    ELSE TRUE
  END as is_eligible
FROM incentive_applications ia
JOIN incentive_types it ON ia.incentive_type_id = it.id
WHERE ia.status IN ('pending', 'under_review')
ORDER BY ia.created_at ASC;

-- Create function for HR to approve/reject applications
CREATE OR REPLACE FUNCTION hr_review_incentive_application(
  application_id UUID,
  reviewer_id UUID,
  new_status TEXT,
  review_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate status
  IF new_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status. Must be approved or rejected.';
  END IF;
  
  -- Update application
  UPDATE incentive_applications 
  SET 
    status = new_status,
    hr_reviewer_id = reviewer_id,
    hr_review_notes = review_notes,
    hr_reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = application_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark incentive as disbursed
CREATE OR REPLACE FUNCTION mark_incentive_disbursed(
  application_id UUID,
  disbursement_ref TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE incentive_applications 
  SET 
    status = 'disbursed',
    disbursement_date = NOW(),
    disbursement_reference = disbursement_ref,
    updated_at = NOW()
  WHERE id = application_id AND status = 'approved';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE incentive_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Incentive types: readable by all authenticated users
CREATE POLICY "Incentive types are viewable by authenticated users" ON incentive_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- Incentive applications: employees can view their own, managers can view all
CREATE POLICY "Employees can view own incentive applications" ON incentive_applications
  FOR SELECT USING (
    auth.uid()::text = employee_id::text OR 
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND role ? 'manager')
  );

-- Incentive applications: employees can insert their own
CREATE POLICY "Employees can create incentive applications" ON incentive_applications
  FOR INSERT WITH CHECK (auth.uid()::text = employee_id::text);

-- Incentive applications: employees can update their own pending applications
CREATE POLICY "Employees can update own pending applications" ON incentive_applications
  FOR UPDATE USING (
    auth.uid()::text = employee_id::text AND status = 'pending'
  );

-- Incentive applications: managers/HR can update any application
CREATE POLICY "Managers can update any incentive application" ON incentive_applications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM employees WHERE id = auth.uid() AND (role ? 'manager' OR role ? 'hr'))
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.incentive_types TO authenticated;
GRANT ALL ON public.incentive_applications TO authenticated;
GRANT SELECT ON public.incentives_disbursed_report TO authenticated;
GRANT SELECT ON public.hr_incentive_approvals TO authenticated;
GRANT EXECUTE ON FUNCTION hr_review_incentive_application TO authenticated;
GRANT EXECUTE ON FUNCTION mark_incentive_disbursed TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_incentive_applications_employee_id ON incentive_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_incentive_applications_status ON incentive_applications(status);
CREATE INDEX IF NOT EXISTS idx_incentive_applications_type ON incentive_applications(incentive_type);
CREATE INDEX IF NOT EXISTS idx_incentive_applications_created_at ON incentive_applications(created_at);

-- Verification query
SELECT 'Employee Incentives Schema Created Successfully' as status;
SELECT COUNT(*) as incentive_types_count FROM incentive_types;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%incentive%';