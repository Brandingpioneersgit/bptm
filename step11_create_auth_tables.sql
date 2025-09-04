-- Step 11: Create authentication and user management tables
-- Run this after step10_create_incentives_tables.sql

-- Create user_accounts table for comprehensive user management
CREATE TABLE IF NOT EXISTS public.user_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic user information
    user_id VARCHAR(255) NOT NULL UNIQUE, -- Usually email
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    
    -- Authentication
    password_hash VARCHAR(255), -- For local auth (if not using Supabase auth)
    auth_provider VARCHAR(50) DEFAULT 'supabase', -- 'supabase', 'google', 'github', etc.
    auth_provider_id VARCHAR(255), -- ID from external provider
    
    -- User profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    avatar_url TEXT,
    
    -- Role and permissions
    role VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (role IN (
        'employee', 'manager', 'hr', 'admin', 'intern', 'contractor'
    )),
    department VARCHAR(100),
    designation VARCHAR(100),
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    
    -- Security settings
    two_factor_enabled BOOLEAN DEFAULT false,
    password_reset_required BOOLEAN DEFAULT false,
    last_password_change TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Profile completion
    profile_completed BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,
    
    -- Preferences
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key to employees table
    employee_id UUID,
    CONSTRAINT fk_user_accounts_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Session details
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255),
    
    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser VARCHAR(50),
    operating_system VARCHAR(50),
    
    -- Location (optional)
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- Session status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES public.user_accounts(user_id)
);

-- Create login_attempts table for security monitoring
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User identification
    user_id VARCHAR(255), -- NULL for failed attempts with invalid user
    email_attempted VARCHAR(255) NOT NULL,
    
    -- Attempt details
    attempt_type VARCHAR(20) NOT NULL CHECK (attempt_type IN ('login', 'password_reset', 'two_factor')),
    success BOOLEAN NOT NULL DEFAULT false,
    failure_reason VARCHAR(100), -- 'invalid_password', 'user_not_found', 'account_locked', etc.
    
    -- Request metadata
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    
    -- Location data
    country VARCHAR(100),
    city VARCHAR(100),
    
    -- Security flags
    is_suspicious BOOLEAN DEFAULT false,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    
    -- Timestamps
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraint (optional, as user might not exist)
    CONSTRAINT fk_login_attempts_user FOREIGN KEY (user_id) REFERENCES public.user_accounts(user_id)
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Token details
    token VARCHAR(255) NOT NULL UNIQUE,
    token_hash VARCHAR(255) NOT NULL, -- Hashed version for security
    
    -- Status
    is_used BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraint
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES public.user_accounts(user_id)
);

-- Create user_permissions table for granular permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    
    -- Permission details
    permission_name VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL, -- 'employees', 'submissions', 'reports', etc.
    action VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'approve'
    
    -- Permission scope
    scope VARCHAR(50) DEFAULT 'own' CHECK (scope IN ('own', 'department', 'all')),
    conditions JSONB, -- Additional conditions for the permission
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Granted by
    granted_by VARCHAR(255),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES public.user_accounts(user_id),
    CONSTRAINT fk_user_permissions_granted_by FOREIGN KEY (granted_by) REFERENCES public.user_accounts(user_id),
    
    -- Unique constraint to prevent duplicate permissions
    UNIQUE(user_id, permission_name, resource, action, scope)
);

-- Create triggers for updated_at columns
CREATE OR REPLACE TRIGGER update_user_accounts_updated_at
    BEFORE UPDATE ON public.user_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_sessions_last_accessed
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_permissions_updated_at
    BEFORE UPDATE ON public.user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON public.user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON public.user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_role ON public.user_accounts(role);
CREATE INDEX IF NOT EXISTS idx_user_accounts_department ON public.user_accounts(department);
CREATE INDEX IF NOT EXISTS idx_user_accounts_active ON public.user_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_user_accounts_employee_id ON public.user_accounts(employee_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON public.login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email_attempted);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON public.login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON public.login_attempts(success);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON public.password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON public.user_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON public.user_permissions(is_active);

-- Enable Row Level Security
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON public.user_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.login_attempts FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.password_reset_tokens FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_permissions FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.user_accounts TO authenticated, anon;
GRANT ALL ON public.user_sessions TO authenticated, anon;
GRANT ALL ON public.login_attempts TO authenticated, anon;
GRANT ALL ON public.password_reset_tokens TO authenticated, anon;
GRANT ALL ON public.user_permissions TO authenticated, anon;

-- Insert sample user accounts
INSERT INTO public.user_accounts (
    user_id, email, first_name, last_name, role, department, employee_id, is_active, is_verified
) VALUES
('rahul.sharma@testcompany.com', 'rahul.sharma@testcompany.com', 'Rahul', 'Sharma', 'employee', 'Engineering', (SELECT id FROM public.employees WHERE email = 'rahul.sharma@testcompany.com'), true, true),
('priya.patel@testcompany.com', 'priya.patel@testcompany.com', 'Priya', 'Patel', 'manager', 'Engineering', (SELECT id FROM public.employees WHERE email = 'priya.patel@testcompany.com'), true, true),
('sneha.gupta@testcompany.com', 'sneha.gupta@testcompany.com', 'Sneha', 'Gupta', 'employee', 'Marketing', (SELECT id FROM public.employees WHERE email = 'sneha.gupta@testcompany.com'), true, true),
('admin@testcompany.com', 'admin@testcompany.com', 'System', 'Admin', 'admin', 'IT', NULL, true, true),
('hr@testcompany.com', 'hr@testcompany.com', 'HR', 'Manager', 'hr', 'Human Resources', NULL, true, true)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample login attempts
INSERT INTO public.login_attempts (
    user_id, email_attempted, attempt_type, success, ip_address, attempted_at
) VALUES
('rahul.sharma@testcompany.com', 'rahul.sharma@testcompany.com', 'login', true, '192.168.1.100', NOW() - INTERVAL '1 hour'),
('priya.patel@testcompany.com', 'priya.patel@testcompany.com', 'login', true, '192.168.1.101', NOW() - INTERVAL '2 hours'),
('sneha.gupta@testcompany.com', 'sneha.gupta@testcompany.com', 'login', true, '192.168.1.102', NOW() - INTERVAL '3 hours'),
(NULL, 'invalid@example.com', 'login', false, '192.168.1.200', NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

SELECT 'Authentication and user management tables created successfully!' as status;