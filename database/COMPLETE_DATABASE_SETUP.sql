-- COMPLETE DATABASE SETUP SCRIPT
-- This script contains all database migrations in the correct order
-- Execute this script manually in your Supabase SQL editor

-- =============================================================================
-- 1. LOGIN TRACKING
-- =============================================================================

-- Create login_tracking table
CREATE TABLE IF NOT EXISTS public.login_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.login_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own login tracking" ON public.login_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage login tracking" ON public.login_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- 2. UNIFIED USERS (OPTIMIZED EMPLOYEES SCHEMA)
-- =============================================================================

-- Create unified_users table (replaces employees table)
CREATE TABLE IF NOT EXISTS public.unified_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN (
        'seo_employee', 'ads_employee', 'social_media_employee', 
        'youtube_seo_employee', 'web_developer', 'graphic_designer',
        'freelancer', 'intern', 'manager', 'accounts', 'sales', 'hr',
        'operations_head', 'super_admin'
    )),
    user_category TEXT NOT NULL CHECK (user_category IN (
        'employee', 'freelancer', 'intern', 'management', 'admin'
    )),
    department TEXT,
    dashboard_access TEXT[] DEFAULT '{}',
    profile_picture_url TEXT,
    phone TEXT,
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    date_of_birth DATE,
    hire_date DATE DEFAULT CURRENT_DATE,
    salary DECIMAL(10,2),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.unified_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.unified_users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Managers can view team members" ON public.unified_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category IN ('management', 'admin')
        )
    );

CREATE POLICY "Users can update own profile" ON public.unified_users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can manage all users" ON public.unified_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category = 'admin'
        )
    );

-- =============================================================================
-- 3. CLIENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    industry TEXT,
    website TEXT,
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
    assigned_employee_id UUID REFERENCES public.unified_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Employees can view assigned clients" ON public.clients
    FOR SELECT USING (
        assigned_employee_id IN (
            SELECT id FROM public.unified_users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can view all clients" ON public.clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category IN ('management', 'admin')
        )
    );

-- =============================================================================
-- 4. MONTHLY ROWS FOUNDATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.monthly_rows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.unified_users(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    month_key TEXT NOT NULL, -- Format: YYYY-MM
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    work_summary TEXT,
    kpi_data JSONB DEFAULT '{}',
    meetings_data JSONB DEFAULT '{}',
    feedback_data JSONB DEFAULT '{}',
    evidence_data JSONB DEFAULT '{}',
    learning_data JSONB DEFAULT '{}',
    accountability_score DECIMAL(5,2),
    output_score DECIMAL(5,2),
    learning_score DECIMAL(5,2),
    discipline_score DECIMAL(5,2),
    total_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, entity_id, month_key)
);

-- Enable RLS
ALTER TABLE public.monthly_rows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own monthly rows" ON public.monthly_rows
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.unified_users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own draft monthly rows" ON public.monthly_rows
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.unified_users WHERE auth_user_id = auth.uid()
        ) AND status = 'draft'
    );

CREATE POLICY "Users can insert own monthly rows" ON public.monthly_rows
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.unified_users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can view team monthly rows" ON public.monthly_rows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category IN ('management', 'admin')
        )
    );

-- =============================================================================
-- 5. DEFAULT USERS AND PERMISSIONS
-- =============================================================================

-- Insert default test users
INSERT INTO public.unified_users (email, full_name, role, user_category, department, dashboard_access) VALUES
('seo@test.com', 'SEO Employee', 'seo_employee', 'employee', 'Marketing', ARRAY['seo_dashboard']),
('ads@test.com', 'Ads Employee', 'ads_employee', 'employee', 'Marketing', ARRAY['ads_dashboard']),
('social@test.com', 'Social Media Employee', 'social_media_employee', 'employee', 'Marketing', ARRAY['social_dashboard']),
('youtube@test.com', 'YouTube SEO Employee', 'youtube_seo_employee', 'employee', 'Marketing', ARRAY['youtube_dashboard']),
('web@test.com', 'Web Developer', 'web_developer', 'employee', 'Development', ARRAY['web_dashboard']),
('design@test.com', 'Graphic Designer', 'graphic_designer', 'employee', 'Design', ARRAY['design_dashboard']),
('freelancer@test.com', 'Freelancer User', 'freelancer', 'freelancer', 'External', ARRAY['freelancer_dashboard']),
('intern@test.com', 'Intern User', 'intern', 'intern', 'Various', ARRAY['intern_dashboard']),
('manager@test.com', 'Manager User', 'manager', 'management', 'Management', ARRAY['manager_dashboard']),
('accounts@test.com', 'Accounts User', 'accounts', 'management', 'Finance', ARRAY['accounts_dashboard']),
('sales@test.com', 'Sales User', 'sales', 'management', 'Sales', ARRAY['sales_dashboard']),
('hr@test.com', 'HR User', 'hr', 'management', 'Human Resources', ARRAY['hr_dashboard']),
('operations@test.com', 'Operations Head', 'operations_head', 'admin', 'Operations', ARRAY['operations_dashboard']),
('admin@test.com', 'Super Admin', 'super_admin', 'admin', 'Administration', ARRAY['admin_dashboard'])
ON CONFLICT (email) DO NOTHING;

-- Insert sample clients
INSERT INTO public.clients (name, email, company, industry, status) VALUES
('John Smith', 'john@example.com', 'Example Corp', 'Technology', 'active'),
('Jane Doe', 'jane@sample.com', 'Sample Inc', 'Healthcare', 'active'),
('Bob Johnson', 'bob@test.com', 'Test LLC', 'Finance', 'prospect')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 6. UI CONFIGURATION TABLES
-- =============================================================================

-- Dashboard Configurations Table
CREATE TABLE IF NOT EXISTS public.dashboard_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dashboard_type TEXT NOT NULL, -- 'agency', 'intern', 'ads_executive', etc.
    component_name TEXT NOT NULL, -- 'news_ticker', 'performance_board', etc.
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Theme Configurations Table
CREATE TABLE IF NOT EXISTS public.theme_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    theme_name TEXT UNIQUE NOT NULL,
    theme_data JSONB NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation Configurations Table
CREATE TABLE IF NOT EXISTS public.navigation_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nav_type TEXT NOT NULL, -- 'sidebar', 'header', 'breadcrumb'
    role TEXT NOT NULL,
    nav_data JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dynamic Content Table
CREATE TABLE IF NOT EXISTS public.dynamic_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_type TEXT NOT NULL, -- 'quote', 'announcement', 'news', 'tip'
    title TEXT,
    content TEXT NOT NULL,
    author TEXT,
    target_roles TEXT[] DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UI Component Settings Table
CREATE TABLE IF NOT EXISTS public.ui_component_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    component_type TEXT NOT NULL, -- 'card', 'table', 'form', 'chart'
    component_name TEXT NOT NULL,
    settings JSONB NOT NULL,
    applies_to_roles TEXT[] DEFAULT '{}',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application Settings Table
CREATE TABLE IF NOT EXISTS public.application_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL, -- 'string', 'number', 'boolean', 'object', 'array'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_type_component ON public.dashboard_configurations(dashboard_type, component_name);
CREATE INDEX IF NOT EXISTS idx_theme_configs_name ON public.theme_configurations(theme_name);
CREATE INDEX IF NOT EXISTS idx_nav_configs_type_role ON public.navigation_configurations(nav_type, role);
CREATE INDEX IF NOT EXISTS idx_dynamic_content_type_active ON public.dynamic_content(content_type, is_active);
CREATE INDEX IF NOT EXISTS idx_ui_component_type_name ON public.ui_component_settings(component_type, component_name);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.application_settings(setting_key);

-- Enable RLS on all UI configuration tables
ALTER TABLE public.dashboard_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_component_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for UI configuration tables
-- Dashboard Configurations
CREATE POLICY "Anyone can read dashboard configurations" ON public.dashboard_configurations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage dashboard configurations" ON public.dashboard_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category = 'admin'
        )
    );

-- Theme Configurations
CREATE POLICY "Anyone can read theme configurations" ON public.theme_configurations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage theme configurations" ON public.theme_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category = 'admin'
        )
    );

-- Navigation Configurations
CREATE POLICY "Users can read relevant navigation configurations" ON public.navigation_configurations
    FOR SELECT USING (
        is_active = true AND (
            role = 'all' OR 
            role IN (
                SELECT u.role FROM public.unified_users u 
                WHERE u.auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can manage navigation configurations" ON public.navigation_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category = 'admin'
        )
    );

-- Dynamic Content
CREATE POLICY "Users can read relevant dynamic content" ON public.dynamic_content
    FOR SELECT USING (
        is_active = true AND 
        (start_date IS NULL OR start_date <= CURRENT_DATE) AND
        (end_date IS NULL OR end_date >= CURRENT_DATE) AND
        (
            target_roles = '{}' OR 
            EXISTS (
                SELECT 1 FROM public.unified_users u 
                WHERE u.auth_user_id = auth.uid() 
                AND u.role = ANY(target_roles)
            )
        )
    );

CREATE POLICY "Admins can manage dynamic content" ON public.dynamic_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category = 'admin'
        )
    );

-- UI Component Settings
CREATE POLICY "Users can read relevant UI component settings" ON public.ui_component_settings
    FOR SELECT USING (
        is_active = true AND (
            applies_to_roles = '{}' OR 
            EXISTS (
                SELECT 1 FROM public.unified_users u 
                WHERE u.auth_user_id = auth.uid() 
                AND u.role = ANY(applies_to_roles)
            )
        )
    );

CREATE POLICY "Admins can manage UI component settings" ON public.ui_component_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category = 'admin'
        )
    );

-- Application Settings
CREATE POLICY "Anyone can read application settings" ON public.application_settings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage application settings" ON public.application_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category = 'admin'
        )
    );

-- Insert sample UI configuration data
-- Sample Dashboard Configurations
INSERT INTO public.dashboard_configurations (dashboard_type, component_name, config_key, config_value, description) VALUES
('agency', 'news_ticker', 'items', '[{"id": 1, "text": "Welcome to the Agency Dashboard!", "type": "info"}, {"id": 2, "text": "New project management tools available", "type": "update"}]', 'News ticker items for agency dashboard'),
('intern', 'welcome_message', 'text', '"Welcome to your internship journey!"', 'Welcome message for intern dashboard'),
('ads_executive', 'performance_metrics', 'kpis', '[{"name": "CTR", "value": "2.5%", "trend": "up"}, {"name": "CPC", "value": "$0.45", "trend": "down"}]', 'Performance metrics for ads executive dashboard')
ON CONFLICT DO NOTHING;

-- Sample Theme Configurations
INSERT INTO public.theme_configurations (theme_name, theme_data, description, is_default) VALUES
('default', '{"primary": "#3b82f6", "secondary": "#64748b", "accent": "#10b981", "background": "#ffffff", "surface": "#f8fafc"}', 'Default light theme', true),
('dark', '{"primary": "#60a5fa", "secondary": "#94a3b8", "accent": "#34d399", "background": "#0f172a", "surface": "#1e293b"}', 'Dark theme', false)
ON CONFLICT (theme_name) DO NOTHING;

-- Sample Dynamic Content
INSERT INTO public.dynamic_content (content_type, title, content, author, target_roles, priority) VALUES
('quote', 'Daily Inspiration', 'Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', '{}', 1),
('announcement', 'System Maintenance', 'Scheduled maintenance will occur this weekend from 2-4 AM EST.', 'IT Team', '{"admin", "manager"}', 2),
('tip', 'Productivity Tip', 'Use keyboard shortcuts to increase your efficiency. Press Ctrl+/ to see available shortcuts.', 'Productivity Team', '{}', 1)
ON CONFLICT DO NOTHING;

-- Sample Application Settings
INSERT INTO public.application_settings (setting_key, setting_value, setting_type, description) VALUES
('app_name', '"BPTM Dashboard"', 'string', 'Application name displayed in header'),
('max_file_upload_size', '10485760', 'number', 'Maximum file upload size in bytes (10MB)'),
('enable_notifications', 'true', 'boolean', 'Enable push notifications'),
('supported_file_types', '["jpg", "jpeg", "png", "pdf", "doc", "docx"]', 'array', 'Supported file types for uploads')
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

-- Add a comment to indicate successful completion
COMMENT ON TABLE public.unified_users IS 'Database setup completed successfully. All core tables and policies created.';
COMMENT ON TABLE public.dashboard_configurations IS 'UI configuration system setup completed successfully.';