-- Migration: create_submissions_table
-- Source: 03_create_submissions_table.sql
-- Timestamp: 20240102000500

-- =====================================================
-- SUBMISSIONS TABLE - Complete Schema for Form Data
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This creates the submissions table for storing monthly employee form submissions

-- Drop existing table if you need to recreate it
-- DROP TABLE IF EXISTS public.submissions CASCADE;

-- Check if submissions table exists and add missing columns if needed
-- First, try to create the table (will be skipped if exists)
CREATE TABLE IF NOT EXISTS public.submissions (
  id BIGSERIAL PRIMARY KEY,
  
  -- Employee Information
  employee_name TEXT NOT NULL,
  employee_phone TEXT,
  department TEXT,
  role TEXT[], -- Array of employee roles
  
  -- Submission Metadata
  month_key TEXT NOT NULL, -- Format: "YYYY-MM" (e.g., "2024-01")
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  user_phone TEXT, -- Phone number used for submission
  
  -- Attendance Data
  attendance_wfo INTEGER DEFAULT 0, -- Work From Office days
  attendance_wfh INTEGER DEFAULT 0, -- Work From Home days
  
  -- KPI Data
  tasks_completed INTEGER DEFAULT 0,
  ai_table_link TEXT, -- Link to AI productivity table/dashboard
  clients JSONB DEFAULT '[]'::jsonb, -- Array of client work data
  
  -- Learning Data
  learning_activities JSONB DEFAULT '[]'::jsonb, -- Array of learning activities
  ai_usage_notes TEXT, -- Notes about AI tool usage
  
  -- Feedback Data
  feedback_company TEXT,
  feedback_hr TEXT,
  feedback_management TEXT,
  
  -- Scoring Data (calculated)
  scores JSONB DEFAULT '{}'::jsonb, -- Individual section scores
  discipline JSONB DEFAULT '{}'::jsonb, -- Discipline-related scores
  kpi_score DECIMAL(4,2) DEFAULT 0,
  learning_score DECIMAL(4,2) DEFAULT 0,
  relationship_score DECIMAL(4,2) DEFAULT 0,
  overall_score DECIMAL(4,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_employee_month UNIQUE (employee_name, month_key)
);

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add all potentially missing columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'employee_name') THEN
    ALTER TABLE public.submissions ADD COLUMN employee_name TEXT NOT NULL DEFAULT 'Unknown';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'employee_phone') THEN
    ALTER TABLE public.submissions ADD COLUMN employee_phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'department') THEN
    ALTER TABLE public.submissions ADD COLUMN department TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'role') THEN
    ALTER TABLE public.submissions ADD COLUMN role TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'month_key') THEN
    ALTER TABLE public.submissions ADD COLUMN month_key TEXT NOT NULL DEFAULT '2024-01';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'submitted_at') THEN
    ALTER TABLE public.submissions ADD COLUMN submitted_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'user_phone') THEN
    ALTER TABLE public.submissions ADD COLUMN user_phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'attendance_wfo') THEN
    ALTER TABLE public.submissions ADD COLUMN attendance_wfo INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'attendance_wfh') THEN
    ALTER TABLE public.submissions ADD COLUMN attendance_wfh INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'tasks_completed') THEN
    ALTER TABLE public.submissions ADD COLUMN tasks_completed INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'ai_table_link') THEN
    ALTER TABLE public.submissions ADD COLUMN ai_table_link TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'clients') THEN
    ALTER TABLE public.submissions ADD COLUMN clients JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'learning_activities') THEN
    ALTER TABLE public.submissions ADD COLUMN learning_activities JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'ai_usage_notes') THEN
    ALTER TABLE public.submissions ADD COLUMN ai_usage_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'feedback_company') THEN
    ALTER TABLE public.submissions ADD COLUMN feedback_company TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'feedback_hr') THEN
    ALTER TABLE public.submissions ADD COLUMN feedback_hr TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'feedback_management') THEN
    ALTER TABLE public.submissions ADD COLUMN feedback_management TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'scores') THEN
    ALTER TABLE public.submissions ADD COLUMN scores JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'discipline') THEN
    ALTER TABLE public.submissions ADD COLUMN discipline JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'kpi_score') THEN
    ALTER TABLE public.submissions ADD COLUMN kpi_score DECIMAL(4,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'learning_score') THEN
    ALTER TABLE public.submissions ADD COLUMN learning_score DECIMAL(4,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'relationship_score') THEN
    ALTER TABLE public.submissions ADD COLUMN relationship_score DECIMAL(4,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'overall_score') THEN
    ALTER TABLE public.submissions ADD COLUMN overall_score DECIMAL(4,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'created_at') THEN
    ALTER TABLE public.submissions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'updated_at') THEN
    ALTER TABLE public.submissions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for better performance - commented out problematic ones
-- CREATE INDEX IF NOT EXISTS idx_submissions_employee_name ON public.submissions(employee_name);
CREATE INDEX IF NOT EXISTS idx_submissions_month_key ON public.submissions(month_key);
CREATE INDEX IF NOT EXISTS idx_submissions_department ON public.submissions(department);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions(submitted_at);
-- CREATE INDEX IF NOT EXISTS idx_submissions_employee_month ON public.submissions(employee_name, month_key);
CREATE INDEX IF NOT EXISTS idx_submissions_overall_score ON public.submissions(overall_score);

-- Enable RLS (Row Level Security)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.submissions;
CREATE POLICY "Allow all operations for authenticated users" ON public.submissions
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO anon;
GRANT USAGE, SELECT ON SEQUENCE submissions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE submissions_id_seq TO anon;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_submissions_updated_at();

-- Insert sample submission data for testing
INSERT INTO public.submissions (
  employee_name, employee_phone, department, role, month_key,
  attendance_wfo, attendance_wfh, tasks_completed, ai_table_link,
  clients, learning_activities, ai_usage_notes,
  feedback_company, feedback_hr, feedback_management,
  kpi_score, learning_score, relationship_score, overall_score
) VALUES 

('Manish Kushwaha', '9565416467', 'Web', '{"Full Stack Developer", "Team Lead"}', '2024-01',
 22, 3, 45, 'https://docs.google.com/spreadsheets/d/sample-ai-table',
 '[{"name": "TechCorp Solutions", "tasks": 15, "hours": 40}, {"name": "E-Commerce Plus", "tasks": 8, "hours": 20}]'::jsonb,
 '[{"activity": "React Advanced Patterns Course", "hours": 4, "platform": "Udemy"}, {"activity": "Node.js Performance Optimization", "hours": 3, "platform": "YouTube"}]'::jsonb,
 'Used ChatGPT for code review and documentation. Copilot for faster development.',
 'Great team collaboration and project delivery.',
 'Excellent support from HR team.',
 'Management provided clear direction and feedback.',
 85.5, 92.0, 88.0, 88.5),

('Sarah Johnson', '9876543210', 'Marketing', '{"Marketing Manager"}', '2024-01',
 20, 5, 38, 'https://docs.google.com/spreadsheets/d/sample-marketing-metrics',
 '[{"name": "Digital Marketing Pro", "tasks": 12, "hours": 35}, {"name": "Local Restaurant Chain", "tasks": 10, "hours": 25}]'::jsonb,
 '[{"activity": "Google Analytics 4 Certification", "hours": 6, "platform": "Google Skillshop"}, {"activity": "Social Media Strategy Workshop", "hours": 2, "platform": "LinkedIn Learning"}]'::jsonb,
 'Used AI tools for content creation and campaign optimization.',
 'Company culture is very supportive.',
 'HR processes are efficient and helpful.',
 'Management trusts our marketing decisions.',
 90.0, 95.0, 92.0, 92.3),

('David Chen', '8765432109', 'Sales', '{"Sales Executive"}', '2024-01',
 25, 0, 42, 'https://docs.google.com/spreadsheets/d/sample-sales-pipeline',
 '[{"name": "B2B Software Solutions", "tasks": 20, "hours": 50}]'::jsonb,
 '[{"activity": "Advanced Sales Techniques", "hours": 3, "platform": "Coursera"}, {"activity": "CRM Best Practices", "hours": 2, "platform": "Salesforce Trailhead"}]'::jsonb,
 'AI helps with lead qualification and email templates.',
 'Excellent growth opportunities.',
 'HR is always available for support.',
 'Sales targets are realistic and achievable.',
 87.0, 83.0, 90.0, 86.7)

ON CONFLICT (employee_name, month_key) DO NOTHING;

-- Create a view for easy reporting
CREATE OR REPLACE VIEW submission_summary AS
SELECT 
  s.employee_name,
  s.department,
  s.month_key,
  s.attendance_wfo + s.attendance_wfh as total_attendance,
  s.tasks_completed,
  jsonb_array_length(s.clients) as client_count,
  jsonb_array_length(s.learning_activities) as learning_activity_count,
  s.overall_score,
  s.submitted_at,
  CASE 
    WHEN s.overall_score >= 90 THEN 'Excellent'
    WHEN s.overall_score >= 80 THEN 'Good'
    WHEN s.overall_score >= 70 THEN 'Satisfactory'
    ELSE 'Needs Improvement'
  END as performance_rating
FROM public.submissions s
ORDER BY s.submitted_at DESC;

-- Grant access to the view
GRANT SELECT ON submission_summary TO authenticated;
GRANT SELECT ON submission_summary TO anon;

-- Data verification and summary queries commented out for clean migration
-- Uncomment these after successful migration if needed for testing:

-- SELECT employee_name, department, month_key, attendance_wfo + attendance_wfh as total_days,
--        tasks_completed, overall_score, submitted_at
-- FROM public.submissions ORDER BY submitted_at DESC;

-- SELECT 'Submissions table created successfully with ' || COUNT(*) || ' sample submissions' as result
-- FROM public.submissions;

-- SELECT 'Summary: ' || COUNT(*) || ' submissions, ' || COUNT(DISTINCT employee_name) || ' employees, ' ||
--        COUNT(DISTINCT month_key) || ' months, ' || ROUND(AVG(overall_score), 2) || ' avg score' as statistics
-- FROM public.submissions;