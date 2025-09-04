-- Essential Missing Tables Creation Script
-- Run this in Supabase SQL Editor to create the most critical missing tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 1. MONTHLY KPI REPORTS TABLE (Critical)
-- =============================================
CREATE TABLE IF NOT EXISTS public.monthly_kpi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  employee_name VARCHAR(255) NOT NULL,
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
-- 2. EMPLOYEE PERFORMANCE TABLE (Critical)
-- =============================================
CREATE TABLE IF NOT EXISTS public.employee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  employee_name VARCHAR(255) NOT NULL,
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
-- 3. MONTHLY FORM SUBMISSIONS TABLE (Critical)
-- =============================================
CREATE TABLE IF NOT EXISTS public.monthly_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  employee_name VARCHAR(255) NOT NULL,
  employee_phone VARCHAR(20),
  department VARCHAR(100),
  month_key VARCHAR(20) NOT NULL,
  submission_data JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month_key)
);

CREATE TRIGGER update_monthly_form_submissions_updated_at
  BEFORE UPDATE ON public.monthly_form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. EMPLOYEE KPIs TABLE (High Priority)
-- =============================================
CREATE TABLE IF NOT EXISTS public.employee_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  employee_name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  month_key VARCHAR(20) NOT NULL,
  kpi_type VARCHAR(100) NOT NULL,
  kpi_value DECIMAL(10,2),
  target_value DECIMAL(10,2),
  achievement_percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_employee_kpis_updated_at
  BEFORE UPDATE ON public.employee_kpis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 5. EMPLOYEE ATTENDANCE TABLE (High Priority)
-- =============================================
CREATE TABLE IF NOT EXISTS public.employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  employee_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'present', -- present, absent, wfh, half_day
  check_in_time TIME,
  check_out_time TIME,
  hours_worked DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

CREATE TRIGGER update_employee_attendance_updated_at
  BEFORE UPDATE ON public.employee_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. NOTIFICATIONS TABLE (Medium Priority)
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES employees(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, warning, error, success
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 7. USER ACCOUNTS TABLE (Authentication)
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  employee_id UUID REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. SYSTEM NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  target_roles TEXT[], -- Array of roles to show notification to
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_system_notifications_updated_at
  BEFORE UPDATE ON public.system_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. DASHBOARD CONFIGURATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.dashboard_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES unified_users(id),
  role VARCHAR(100) NOT NULL,
  config_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_dashboard_configurations_updated_at
  BEFORE UPDATE ON public.dashboard_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. TOOLS TABLE (For ProfileSummary)
-- =============================================
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON public.tools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_monthly_kpi_reports_employee_id ON monthly_kpi_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_kpi_reports_month_year ON monthly_kpi_reports(month, year);
CREATE INDEX IF NOT EXISTS idx_employee_performance_employee_id ON employee_performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_period ON employee_performance(performance_period);
CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_employee_id ON monthly_form_submissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_month_key ON monthly_form_submissions(month_key);
CREATE INDEX IF NOT EXISTS idx_employee_kpis_employee_id ON employee_kpis(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpis_month_key ON employee_kpis(month_key);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee_id ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON employee_attendance(date);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_employee_id ON user_accounts(employee_id);

-- =============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE monthly_kpi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INSERT SAMPLE DATA
-- =============================================

-- Insert sample tools
INSERT INTO tools (name, description, category) VALUES
('Slack', 'Team communication platform', 'Communication'),
('Jira', 'Project management and issue tracking', 'Project Management'),
('GitHub', 'Version control and code collaboration', 'Development'),
('Figma', 'Design and prototyping tool', 'Design'),
('Google Analytics', 'Web analytics service', 'Analytics')
ON CONFLICT DO NOTHING;

-- Insert sample system notifications
INSERT INTO system_notifications (title, message, type, target_roles) VALUES
('Welcome to BPTM Dashboard', 'Welcome to the Business Performance Tracking and Management system!', 'info', ARRAY['Employee', 'Manager', 'HR', 'Super Admin']),
('Monthly KPI Submission Reminder', 'Please submit your monthly KPI reports by the end of the month.', 'warning', ARRAY['Employee', 'Manager'])
ON CONFLICT DO NOTHING;

COMMIT;

-- Success message
SELECT 'Essential missing tables created successfully!' as status;