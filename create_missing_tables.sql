-- Create Missing Tables for BPTM Dashboard
-- Execute this script in Supabase SQL Editor

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create employees table
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
  direct_manager VARCHAR(255),
  performance_rating DECIMAL(3,1),
  appraisal_date DATE,
  personal_info JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  professional_info JSONB DEFAULT '{}',
  financial_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, phone)
);

-- Create trigger for employees updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name VARCHAR(255) NOT NULL,
  employee_phone VARCHAR(20) NOT NULL,
  department VARCHAR(100) NOT NULL,
  role VARCHAR(100),
  month_key VARCHAR(20) NOT NULL,
  attendance_wfo INTEGER DEFAULT 0,
  attendance_wfh INTEGER DEFAULT 0,
  tasks_completed TEXT,
  ai_table_link TEXT,
  clients TEXT,
  learning_activities TEXT,
  ai_usage_notes TEXT,
  feedback_company TEXT,
  feedback_hr TEXT,
  feedback_management TEXT,
  kpi_score DECIMAL(3,1),
  learning_score DECIMAL(3,1),
  relationship_score DECIMAL(3,1),
  overall_score DECIMAL(3,1),
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_phone, month_key)
);

-- Create trigger for submissions updated_at
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name VARCHAR(255) NOT NULL,
  employee_phone VARCHAR(20) NOT NULL,
  department VARCHAR(100) NOT NULL,
  month_key VARCHAR(20) NOT NULL,
  kpi_score DECIMAL(3,1),
  learning_score DECIMAL(3,1),
  relationship_score DECIMAL(3,1),
  overall_score DECIMAL(3,1),
  attendance_percentage DECIMAL(5,2),
  tasks_completed INTEGER DEFAULT 0,
  client_satisfaction DECIMAL(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_phone, month_key)
);

-- Create trigger for performance_metrics updated_at
CREATE TRIGGER update_performance_metrics_updated_at
  BEFORE UPDATE ON public.performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create monthly_rows table
CREATE TABLE IF NOT EXISTS public.monthly_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name VARCHAR(255) NOT NULL,
  employee_phone VARCHAR(20) NOT NULL,
  department VARCHAR(100) NOT NULL,
  month_key VARCHAR(20) NOT NULL,
  submission_data JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_phone, month_key)
);

-- Create trigger for monthly_rows updated_at
CREATE TRIGGER update_monthly_rows_updated_at
  BEFORE UPDATE ON public.monthly_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create users table (legacy support)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  role VARCHAR(100),
  department VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for users updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create entities table
CREATE TABLE IF NOT EXISTS public.entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger for entities updated_at
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create user_entity_mappings table
CREATE TABLE IF NOT EXISTS public.user_entity_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  relationship_type VARCHAR(100),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_id)
);

-- Create trigger for user_entity_mappings updated_at
CREATE TRIGGER update_user_entity_mappings_updated_at
  BEFORE UPDATE ON public.user_entity_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create attendance_daily table
CREATE TABLE IF NOT EXISTS public.attendance_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name VARCHAR(255) NOT NULL,
  employee_phone VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'present',
  work_type VARCHAR(20) DEFAULT 'wfo',
  check_in_time TIME,
  check_out_time TIME,
  hours_worked DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_phone, date)
);

-- Create trigger for attendance_daily updated_at
CREATE TRIGGER update_attendance_daily_updated_at
  BEFORE UPDATE ON public.attendance_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create login_tracking table
CREATE TABLE IF NOT EXISTS public.login_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email VARCHAR(255),
  phone VARCHAR(20),
  login_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  login_method VARCHAR(50) DEFAULT 'email',
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  session_duration INTERVAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.submissions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.performance_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.monthly_rows FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.entities FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_entity_mappings FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.attendance_daily FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.login_tracking FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.employees TO anon;
GRANT ALL ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO anon;
GRANT ALL ON public.performance_metrics TO authenticated;
GRANT ALL ON public.performance_metrics TO anon;
GRANT ALL ON public.monthly_rows TO authenticated;
GRANT ALL ON public.monthly_rows TO anon;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;
GRANT ALL ON public.entities TO authenticated;
GRANT ALL ON public.entities TO anon;
GRANT ALL ON public.user_entity_mappings TO authenticated;
GRANT ALL ON public.user_entity_mappings TO anon;
GRANT ALL ON public.attendance_daily TO authenticated;
GRANT ALL ON public.attendance_daily TO anon;
GRANT ALL ON public.login_tracking TO authenticated;
GRANT ALL ON public.login_tracking TO anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_phone ON public.employees(phone);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_submissions_employee_phone ON public.submissions(employee_phone);
CREATE INDEX IF NOT EXISTS idx_submissions_month_key ON public.submissions(month_key);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_employee_phone ON public.performance_metrics(employee_phone);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_month_key ON public.performance_metrics(month_key);
CREATE INDEX IF NOT EXISTS idx_monthly_rows_employee_phone ON public.monthly_rows(employee_phone);
CREATE INDEX IF NOT EXISTS idx_monthly_rows_month_key ON public.monthly_rows(month_key);
CREATE INDEX IF NOT EXISTS idx_attendance_daily_employee_phone ON public.attendance_daily(employee_phone);
CREATE INDEX IF NOT EXISTS idx_attendance_daily_date ON public.attendance_daily(date);
CREATE INDEX IF NOT EXISTS idx_login_tracking_email ON public.login_tracking(email);
CREATE INDEX IF NOT EXISTS idx_login_tracking_timestamp ON public.login_tracking(login_timestamp);

-- Success message
SELECT 'All missing tables created successfully! You can now run upload_test_data.js to insert test data.' as message;