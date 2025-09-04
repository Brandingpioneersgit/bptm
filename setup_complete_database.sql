-- Complete Database Setup for BPTM Application
-- This script creates all required tables for the application to work properly
-- Run this in your Supabase SQL Editor

BEGIN;

-- Create update function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 1. EMPLOYEES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  role TEXT[] DEFAULT '{}',
  employee_type VARCHAR(50) DEFAULT 'Full-time',
  work_location VARCHAR(50) DEFAULT 'Office',
  status VARCHAR(20) DEFAULT 'Active',
  hire_date DATE,
  date_of_birth DATE,
  direct_manager VARCHAR(255),
  performance_rating DECIMAL(3,1),
  appraisal_date DATE,
  profile_image_url TEXT,
  address JSONB DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}',
  onboarding_data JSONB DEFAULT '{}',
  personal_info JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  professional_info JSONB DEFAULT '{}',
  financial_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, phone)
);

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 2. CLIENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  team VARCHAR(50) DEFAULT 'Web',
  client_type VARCHAR(50) DEFAULT 'Standard',
  status VARCHAR(20) DEFAULT 'Active',
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  company_size VARCHAR(50),
  industry VARCHAR(100),
  website_url TEXT,
  services JSONB DEFAULT '[]',
  assigned_employee UUID REFERENCES employees(id),
  project_start_date DATE,
  project_end_date DATE,
  monthly_retainer DECIMAL(10,2),
  total_project_value DECIMAL(10,2),
  payment_terms VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 3. USER ACCOUNTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  user_type VARCHAR(50) DEFAULT 'employee',
  employee_id UUID REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. SUBMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name VARCHAR(255) NOT NULL,
  employee_phone VARCHAR(20) NOT NULL,
  department VARCHAR(100) NOT NULL,
  role TEXT[],
  month_key VARCHAR(20) NOT NULL,
  attendance_wfo INTEGER DEFAULT 0,
  attendance_wfh INTEGER DEFAULT 0,
  tasks_completed TEXT,
  ai_table_link TEXT,
  clients JSONB DEFAULT '[]',
  learning_activities JSONB DEFAULT '[]',
  ai_usage_notes TEXT,
  feedback_company TEXT,
  feedback_hr TEXT,
  feedback_management TEXT,
  kpi_score DECIMAL(3,1),
  overall_score DECIMAL(3,1),
  status VARCHAR(20) DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  manager_remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. MONTHLY KPI REPORTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.monthly_kpi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  
  -- Client Management KPIs
  meetings_with_clients INTEGER DEFAULT 0,
  client_satisfaction_score DECIMAL(3,1) DEFAULT 0,
  client_retention_rate DECIMAL(5,2) DEFAULT 0,
  new_clients_acquired INTEGER DEFAULT 0,
  
  -- Work Performance KPIs
  tasks_completed INTEGER DEFAULT 0,
  tasks_on_time INTEGER DEFAULT 0,
  quality_score DECIMAL(3,1) DEFAULT 0,
  productivity_score DECIMAL(3,1) DEFAULT 0,
  
  -- Learning & Growth KPIs
  learning_hours DECIMAL(5,2) DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  certifications_earned INTEGER DEFAULT 0,
  skills_developed TEXT[],
  
  -- Attendance & Engagement KPIs
  attendance_rate DECIMAL(5,2) DEFAULT 0,
  punctuality_score DECIMAL(3,1) DEFAULT 0,
  team_collaboration_score DECIMAL(3,1) DEFAULT 0,
  initiative_score DECIMAL(3,1) DEFAULT 0,
  
  -- Additional Information
  achievements TEXT,
  challenges_faced TEXT,
  next_month_goals TEXT,
  
  -- Calculated Scores
  overall_score DECIMAL(3,1) DEFAULT 0,
  growth_percentage DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, month, year)
);

CREATE TRIGGER update_monthly_kpi_reports_updated_at
  BEFORE UPDATE ON public.monthly_kpi_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. EMPLOYEE PERFORMANCE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.employee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) NOT NULL,
  performance_period VARCHAR(20) NOT NULL,
  overall_score DECIMAL(3,1) NOT NULL,
  productivity_score DECIMAL(3,1),
  quality_score DECIMAL(3,1),
  communication_score DECIMAL(3,1),
  teamwork_score DECIMAL(3,1),
  attendance_score DECIMAL(3,1),
  performance_status VARCHAR(50) DEFAULT 'satisfactory',
  is_low_performer BOOLEAN DEFAULT false,
  evaluated_by UUID REFERENCES employees(id),
  evaluation_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_employee_performance_updated_at
  BEFORE UPDATE ON public.employee_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. CLIENT ONBOARDING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  company_size VARCHAR(50),
  industry VARCHAR(100),
  website_url TEXT,
  service_scope TEXT[],
  budget_range VARCHAR(100),
  timeline VARCHAR(100),
  target_audience TEXT,
  target_occupation VARCHAR(100),
  top_services TEXT[],
  customer_learning_points TEXT[],
  customer_questions TEXT[],
  education_topics TEXT[],
  keywords TEXT[],
  customer_fears TEXT[],
  customer_pain_points TEXT[],
  customer_problems TEXT[],
  customer_desires TEXT[],
  review_meeting_date DATE,
  submission_status VARCHAR(50) DEFAULT 'submitted',
  assigned_team VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_client_onboarding_updated_at
  BEFORE UPDATE ON public.client_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_kpi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 9. CREATE RLS POLICIES (Allow all for now)
-- =============================================
CREATE POLICY "Allow all operations" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.clients FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.user_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.submissions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.monthly_kpi_reports FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.employee_performance FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.client_onboarding FOR ALL USING (true);

-- =============================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_employees_phone ON public.employees(phone);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_team ON public.clients(team);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);

CREATE INDEX IF NOT EXISTS idx_submissions_employee_phone ON public.submissions(employee_phone);
CREATE INDEX IF NOT EXISTS idx_submissions_month_key ON public.submissions(month_key);

CREATE INDEX IF NOT EXISTS idx_monthly_kpi_employee_month ON public.monthly_kpi_reports(employee_id, month, year);

CREATE INDEX IF NOT EXISTS idx_employee_performance_employee_id ON public.employee_performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_period ON public.employee_performance(performance_period);

-- =============================================
-- 11. INSERT SAMPLE DATA
-- =============================================

-- Insert sample employees
INSERT INTO public.employees (name, phone, email, department, role, employee_type, status, hire_date) VALUES
('John Smith', '+91-9876543210', 'john.smith@company.com', 'Web', ARRAY['Developer'], 'Full-time', 'Active', '2024-01-15'),
('Sarah Johnson', '+91-9876543211', 'sarah.johnson@company.com', 'Marketing', ARRAY['SEO Specialist'], 'Full-time', 'Active', '2024-02-01'),
('Mike Chen', '+91-9876543212', 'mike.chen@company.com', 'Web', ARRAY['Designer'], 'Full-time', 'Active', '2024-01-20'),
('Emily Davis', '+91-9876543213', 'emily.davis@company.com', 'Marketing', ARRAY['Content Writer'], 'Part-time', 'Active', '2024-02-15'),
('Alex Rodriguez', '+91-9876543214', 'alex.rodriguez@company.com', 'Performance Ads', ARRAY['Ads Manager'], 'Full-time', 'Active', '2024-01-10')
ON CONFLICT (phone) DO NOTHING;

-- Insert sample clients
INSERT INTO public.clients (name, team, client_type, status, contact_person, email, phone, industry) VALUES
('TechCorp Solutions', 'Web', 'Premium', 'Active', 'Robert Wilson', 'robert@techcorp.com', '+91-9876543220', 'Technology'),
('Green Energy Ltd', 'Marketing', 'Standard', 'Active', 'Lisa Green', 'lisa@greenenergy.com', '+91-9876543221', 'Energy'),
('Fashion Forward', 'Web', 'Enterprise', 'Active', 'Maria Garcia', 'maria@fashionforward.com', '+91-9876543222', 'Fashion'),
('Local Restaurant', 'Marketing', 'Standard', 'Active', 'Tony Pasta', 'tony@localrestaurant.com', '+91-9876543223', 'Food & Beverage'),
('Fitness Plus', 'Performance Ads', 'Premium', 'Active', 'Jake Strong', 'jake@fitnessplus.com', '+91-9876543224', 'Health & Fitness')
ON CONFLICT (name) DO NOTHING;

-- Insert sample KPI data
INSERT INTO public.monthly_kpi_reports (
  employee_id, month, year, meetings_with_clients, client_satisfaction_score, 
  tasks_completed, quality_score, learning_hours, attendance_rate, overall_score
) 
SELECT 
  e.id, 
  EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  FLOOR(RANDOM() * 10 + 5)::INTEGER,
  ROUND((RANDOM() * 2 + 8)::NUMERIC, 1),
  FLOOR(RANDOM() * 20 + 15)::INTEGER,
  ROUND((RANDOM() * 2 + 8)::NUMERIC, 1),
  ROUND((RANDOM() * 10 + 20)::NUMERIC, 2),
  ROUND((RANDOM() * 10 + 90)::NUMERIC, 2),
  ROUND((RANDOM() * 2 + 8)::NUMERIC, 1)
FROM public.employees e
WHERE e.status = 'Active'
ON CONFLICT (employee_id, month, year) DO NOTHING;

COMMIT;

-- Success message
SELECT 'Complete database setup completed successfully! All tables created with sample data.' as message;