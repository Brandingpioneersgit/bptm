-- Step 2: Create missing tables
-- Run this after step1_create_function.sql

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