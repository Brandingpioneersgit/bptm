-- Migration: enhance_employees_table_profile_fields
-- Source: 12_enhance_employees_table_profile_fields.sql
-- Timestamp: 20240102001500

-- =====================================================
-- EMPLOYEES TABLE ENHANCEMENT - Additional Profile Fields
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This adds missing employee profile fields to the existing employees table

-- Add new columns to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS appraisal_date DATE,
ADD COLUMN IF NOT EXISTS next_appraisal_date DATE,
ADD COLUMN IF NOT EXISTS tools_assigned JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS achievement_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS salary_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS direct_manager TEXT,
ADD COLUMN IF NOT EXISTS employee_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS joining_bonus DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS probation_end_date DATE,
ADD COLUMN IF NOT EXISTS work_location TEXT DEFAULT 'Office' CHECK (work_location IN ('Office', 'Remote', 'Hybrid')),
ADD COLUMN IF NOT EXISTS employee_type TEXT DEFAULT 'Full-time' CHECK (employee_type IN ('Full-time', 'Part-time', 'Contract', 'Intern')),
ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb;

-- Create additional indexes for new fields
CREATE INDEX IF NOT EXISTS idx_employees_date_of_birth ON public.employees(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_employees_appraisal_date ON public.employees(appraisal_date);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON public.employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_direct_manager ON public.employees(direct_manager);
CREATE INDEX IF NOT EXISTS idx_employees_work_location ON public.employees(work_location);
CREATE INDEX IF NOT EXISTS idx_employees_employee_type ON public.employees(employee_type);

-- Update existing employees with sample enhanced profile data
UPDATE public.employees 
SET 
  date_of_birth = CASE 
    WHEN name = 'John Smith' THEN '1995-03-15'
    WHEN name = 'Emily Johnson' THEN '1992-07-22'
    WHEN name = 'Alex Williams' THEN '1994-11-08'
    WHEN name = 'Lisa Anderson' THEN '1988-05-30'
    WHEN name = 'James Wilson' THEN '1991-09-12'
    WHEN name = 'Maria Garcia' THEN '1993-12-03'
    ELSE NULL
  END,
  appraisal_date = CASE 
    WHEN name = 'John Smith' THEN '2024-05-12'
    WHEN name = 'Emily Johnson' THEN '2024-05-12'
    WHEN name = 'Alex Williams' THEN '2024-06-18'
    WHEN name = 'Lisa Anderson' THEN '2024-07-22'
    WHEN name = 'James Wilson' THEN '2024-08-15'
    WHEN name = 'Maria Garcia' THEN '2024-09-10'
    ELSE NULL
  END,
  next_appraisal_date = CASE 
    WHEN name = 'John Smith' THEN '2025-05-12'
    WHEN name = 'Emily Johnson' THEN '2025-05-12'
    WHEN name = 'Alex Williams' THEN '2025-06-18'
    WHEN name = 'Lisa Anderson' THEN '2025-07-22'
    WHEN name = 'James Wilson' THEN '2025-08-15'
    WHEN name = 'Maria Garcia' THEN '2025-09-10'
    ELSE NULL
  END,
  tools_assigned = CASE 
    WHEN department = 'Web' THEN '[
      {"name": "VS Code", "type": "IDE", "license": "Free", "assigned_date": "2023-05-12"},
      {"name": "Figma", "type": "Design", "license": "Pro", "assigned_date": "2023-05-12"},
      {"name": "GitHub", "type": "Version Control", "license": "Pro", "assigned_date": "2023-05-12"},
      {"name": "Slack", "type": "Communication", "license": "Business", "assigned_date": "2023-05-12"}
    ]'::jsonb
    WHEN department = 'Marketing' THEN '[
      {"name": "Adobe Creative Suite", "type": "Design", "license": "Business", "assigned_date": "2023-06-18"},
      {"name": "Canva Pro", "type": "Design", "license": "Pro", "assigned_date": "2023-06-18"},
      {"name": "Google Analytics", "type": "Analytics", "license": "Free", "assigned_date": "2023-06-18"},
      {"name": "Hootsuite", "type": "Social Media", "license": "Professional", "assigned_date": "2023-06-18"}
    ]'::jsonb
    WHEN department = 'HR' THEN '[
      {"name": "BambooHR", "type": "HRMS", "license": "Professional", "assigned_date": "2023-05-12"},
      {"name": "Zoom", "type": "Video Conferencing", "license": "Business", "assigned_date": "2023-05-12"},
      {"name": "Microsoft Office 365", "type": "Productivity", "license": "Business", "assigned_date": "2023-05-12"}
    ]'::jsonb
    WHEN department = 'Accounts' THEN '[
      {"name": "QuickBooks", "type": "Accounting", "license": "Plus", "assigned_date": "2023-08-15"},
      {"name": "Excel", "type": "Spreadsheet", "license": "Business", "assigned_date": "2023-08-15"},
      {"name": "Tally", "type": "Accounting", "license": "Silver", "assigned_date": "2023-08-15"}
    ]'::jsonb
    ELSE '[]'::jsonb
  END,
  testimonials = CASE 
    WHEN name = 'John Smith' THEN '[
      {
        "client_name": "TechCorp Solutions",
        "project": "E-commerce Platform",
        "testimonial": "John delivered exceptional work on our e-commerce platform. His attention to detail and technical expertise exceeded our expectations.",
        "rating": 5,
        "date": "2024-01-15",
        "client_email": "ceo@techcorp.com"
      },
      {
        "client_name": "Digital Innovations",
        "project": "Mobile App Development",
        "testimonial": "Outstanding developer with great communication skills. The mobile app was delivered on time and works flawlessly.",
        "rating": 5,
        "date": "2023-11-20",
        "client_email": "pm@digitalinnovations.com"
      }
    ]'::jsonb
    WHEN name = 'Alex Williams' THEN '[
      {
        "client_name": "Brand Masters",
        "project": "Digital Marketing Campaign",
        "testimonial": "Alex created an amazing marketing campaign that increased our online presence by 300%. Highly recommended!",
        "rating": 5,
        "date": "2024-02-10",
        "client_email": "marketing@brandmasters.com"
      }
    ]'::jsonb
    ELSE '[]'::jsonb
  END,
  achievement_urls = CASE 
    WHEN name = 'John Smith' THEN '[
      {
        "title": "Best Developer Award 2024",
        "url": "https://company.com/awards/john-smith-2024",
        "type": "Company Award",
        "date": "2024-01-15",
        "description": "Recognized for outstanding contribution to web development projects"
      },
      {
        "title": "Client Appreciation Certificate",
        "url": "https://drive.google.com/certificates/john-smith-client-appreciation",
        "type": "Client Recognition",
        "date": "2023-12-20",
        "description": "Certificate from TechCorp Solutions for exceptional project delivery"
      }
    ]'::jsonb
    WHEN name = 'Alex Williams' THEN '[
      {
        "title": "Marketing Excellence Award",
        "url": "https://company.com/awards/alex-williams-marketing-2024",
        "type": "Company Award",
        "date": "2024-02-15",
        "description": "Outstanding performance in digital marketing campaigns"
      }
    ]'::jsonb
    ELSE '[]'::jsonb
  END,
  certifications = CASE 
    WHEN department = 'Web' THEN '[
      {"name": "AWS Certified Developer", "issuer": "Amazon", "date": "2023-08-15", "expiry": "2026-08-15", "url": "https://aws.amazon.com/certification/"},
      {"name": "React Developer Certification", "issuer": "Meta", "date": "2023-06-10", "expiry": "2025-06-10", "url": "https://developers.facebook.com/certification/"}
    ]'::jsonb
    WHEN department = 'Marketing' THEN '[
      {"name": "Google Ads Certification", "issuer": "Google", "date": "2023-09-20", "expiry": "2024-09-20", "url": "https://skillshop.exceedlms.com/student/catalog"},
      {"name": "HubSpot Content Marketing", "issuer": "HubSpot", "date": "2023-07-15", "expiry": "2025-07-15", "url": "https://academy.hubspot.com/"}
    ]'::jsonb
    WHEN department = 'HR' THEN '[
      {"name": "SHRM-CP Certification", "issuer": "SHRM", "date": "2023-05-20", "expiry": "2026-05-20", "url": "https://www.shrm.org/certification/"},
      {"name": "PHR Certification", "issuer": "HRCI", "date": "2023-04-10", "expiry": "2026-04-10", "url": "https://www.hrci.org/"}
    ]'::jsonb
    ELSE '[]'::jsonb
  END,
  skills = CASE 
    WHEN department = 'Web' THEN '[
      {"category": "Frontend", "skills": ["React", "JavaScript", "TypeScript", "HTML5", "CSS3", "Tailwind CSS"]},
      {"category": "Backend", "skills": ["Node.js", "Express", "PostgreSQL", "MongoDB", "REST APIs"]},
      {"category": "Tools", "skills": ["Git", "Docker", "AWS", "Figma", "VS Code"]}
    ]'::jsonb
    WHEN department = 'Marketing' THEN '[
      {"category": "Digital Marketing", "skills": ["SEO", "SEM", "Social Media Marketing", "Content Marketing", "Email Marketing"]},
      {"category": "Analytics", "skills": ["Google Analytics", "Google Ads", "Facebook Ads", "Data Analysis"]},
      {"category": "Design", "skills": ["Adobe Creative Suite", "Canva", "Figma", "Video Editing"]}
    ]'::jsonb
    WHEN department = 'HR' THEN '[
      {"category": "HR Management", "skills": ["Recruitment", "Employee Relations", "Performance Management", "Training & Development"]},
      {"category": "Compliance", "skills": ["Labor Law", "HR Policies", "Payroll Management", "Benefits Administration"]},
      {"category": "Software", "skills": ["HRMS", "ATS", "Payroll Software", "MS Office"]}
    ]'::jsonb
    ELSE '[]'::jsonb
  END,
  education = CASE 
    WHEN name = 'John Smith' THEN '{
      "degree": "Bachelor of Technology",
      "field": "Computer Science",
      "university": "Mumbai University",
      "graduation_year": 2017,
      "grade": "First Class",
      "additional_courses": ["Full Stack Web Development", "AWS Cloud Practitioner"]
    }'::jsonb
    WHEN name = 'Emily Johnson' THEN '{
      "degree": "Master of Business Administration",
      "field": "Human Resources",
      "university": "Delhi University",
      "graduation_year": 2015,
      "grade": "Distinction",
      "additional_courses": ["SHRM Certification", "Leadership Development"]
    }'::jsonb
    WHEN name = 'Alex Williams' THEN '{
      "degree": "Bachelor of Commerce",
      "field": "Marketing",
      "university": "Pune University",
      "graduation_year": 2016,
      "grade": "First Class",
      "additional_courses": ["Digital Marketing", "Google Ads Certification"]
    }'::jsonb
    ELSE '{}'::jsonb
  END,
  performance_rating = CASE 
    WHEN name = 'John Smith' THEN 4.8
    WHEN name = 'Emily Johnson' THEN 4.6
    WHEN name = 'Alex Williams' THEN 4.7
    WHEN name = 'Lisa Anderson' THEN 4.9
    WHEN name = 'James Wilson' THEN 4.5
    WHEN name = 'Maria Garcia' THEN 4.4
    ELSE NULL
  END,
  direct_manager = CASE 
    WHEN department = 'Web' THEN 'Lisa Anderson'
    WHEN department = 'Marketing' THEN 'John Smith'
    WHEN department = 'HR' THEN 'Lisa Anderson'
    WHEN department = 'Accounts' THEN 'Emily Johnson'
    WHEN department = 'Sales' THEN 'Alex Williams'
    ELSE NULL
  END,
  employee_id = CASE 
    WHEN name = 'John Smith' THEN 'EMP001'
    WHEN name = 'Emily Johnson' THEN 'EMP002'
    WHEN name = 'Alex Williams' THEN 'EMP003'
    WHEN name = 'Lisa Anderson' THEN 'EMP004'
    WHEN name = 'James Wilson' THEN 'EMP005'
    WHEN name = 'Maria Garcia' THEN 'EMP006'
    ELSE NULL
  END,
  probation_end_date = CASE 
    WHEN hire_date IS NOT NULL THEN hire_date + INTERVAL '6 months'
    ELSE NULL
  END,
  work_location = 'Hybrid',
  employee_type = 'Full-time'
WHERE name IN ('John Smith', 'Emily Johnson', 'Alex Williams', 'Lisa Anderson', 'James Wilson', 'Maria Garcia');

-- Create helpful views for enhanced employee data
CREATE OR REPLACE VIEW employee_profile_summary AS
SELECT 
  e.id,
  e.name,
  e.employee_id,
  e.department,
  e.role,
  e.hire_date,
  e.date_of_birth,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.date_of_birth)) as age,
  e.appraisal_date,
  e.next_appraisal_date,
  e.performance_rating,
  e.direct_manager,
  e.work_location,
  e.employee_type,
  jsonb_array_length(e.tools_assigned) as tools_count,
  jsonb_array_length(e.testimonials) as testimonials_count,
  jsonb_array_length(e.achievement_urls) as achievements_count,
  jsonb_array_length(e.certifications) as certifications_count,
  e.status
FROM public.employees e
ORDER BY e.name;

-- Create function to get employee tools
CREATE OR REPLACE FUNCTION get_employee_tools(emp_id UUID)
RETURNS TABLE (
  tool_name TEXT,
  tool_type TEXT,
  license_type TEXT,
  assigned_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (tool->>'name')::TEXT,
    (tool->>'type')::TEXT,
    (tool->>'license')::TEXT,
    (tool->>'assigned_date')::DATE
  FROM public.employees e,
       jsonb_array_elements(e.tools_assigned) as tool
  WHERE e.id = emp_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get employee testimonials
CREATE OR REPLACE FUNCTION get_employee_testimonials(emp_id UUID)
RETURNS TABLE (
  client_name TEXT,
  project TEXT,
  testimonial TEXT,
  rating INTEGER,
  testimonial_date DATE,
  client_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (testimonial->>'client_name')::TEXT,
    (testimonial->>'project')::TEXT,
    (testimonial->>'testimonial')::TEXT,
    (testimonial->>'rating')::INTEGER,
    (testimonial->>'date')::DATE,
    (testimonial->>'client_email')::TEXT
  FROM public.employees e,
       jsonb_array_elements(e.testimonials) as testimonial
  WHERE e.id = emp_id
  ORDER BY (testimonial->>'date')::DATE DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get upcoming appraisals
CREATE OR REPLACE FUNCTION get_upcoming_appraisals(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  employee_id TEXT,
  employee_name TEXT,
  department TEXT,
  next_appraisal_date DATE,
  days_until_appraisal INTEGER,
  current_rating DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.employee_id,
    e.name,
    e.department,
    e.next_appraisal_date,
    (e.next_appraisal_date - CURRENT_DATE)::INTEGER,
    e.performance_rating
  FROM public.employees e
  WHERE e.next_appraisal_date IS NOT NULL
    AND e.next_appraisal_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    AND e.status = 'Active'
  ORDER BY e.next_appraisal_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Verify the enhancements
SELECT 
  'employees_enhanced' as table_name,
  COUNT(*) as total_employees,
  COUNT(date_of_birth) as employees_with_dob,
  COUNT(appraisal_date) as employees_with_appraisal_date,
  COUNT(CASE WHEN jsonb_array_length(tools_assigned) > 0 THEN 1 END) as employees_with_tools,
  COUNT(CASE WHEN jsonb_array_length(testimonials) > 0 THEN 1 END) as employees_with_testimonials,
  COUNT(CASE WHEN jsonb_array_length(achievement_urls) > 0 THEN 1 END) as employees_with_achievements
FROM public.employees;

SELECT 'Employee profile enhancement completed successfully!' as status;