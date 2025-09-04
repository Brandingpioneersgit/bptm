-- =============================================
-- UNIFIED AUTHENTICATION SCHEMA
-- =============================================
-- This migration creates a unified authentication system
-- with predefined roles and replaces all existing login mechanisms
-- Timestamp: 20240102004000

BEGIN;

-- =============================================
-- DROP EXISTING AUTHENTICATION TABLES
-- =============================================

-- Drop existing authentication-related tables and functions
DROP TABLE IF EXISTS public.user_accounts CASCADE;
DROP TABLE IF EXISTS public.login_tracking CASCADE;
DROP FUNCTION IF EXISTS authenticate_user CASCADE;
DROP FUNCTION IF EXISTS sync_employee_to_user_account CASCADE;

-- =============================================
-- UNIFIED USER SYSTEM
-- =============================================

-- Create unified users table with predefined roles
CREATE TABLE IF NOT EXISTS public.unified_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(20) UNIQUE NOT NULL, -- USR001, USR002, etc.
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash TEXT NOT NULL, -- Hashed password
    
    -- Role System (Predefined roles only)
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'SEO',
        'Ads',
        'Social Media',
        'YouTube SEO', 
        'Web Developer',
        'Graphic Designer',
        'Freelancer',
        'Intern',

        'Operations Head',
        'Accountant',
        'Sales',
        'HR',
        'Super Admin'
    )),
    
    -- User Category (for routing and permissions)
    user_category VARCHAR(20) NOT NULL CHECK (user_category IN (
        'employee',     -- SEO, Ads, Social Media, YouTube SEO, Web Developer, Graphic Designer
        'freelancer',   -- Freelancer
        'intern',       -- Intern
        'management',   -- Operations Head
        'admin',        -- Accountant, Sales, HR
        'super_admin'   -- Super Admin
    )),
    
    -- Department (for employees)
    department VARCHAR(50),
    
    -- Professional Details
    employee_id VARCHAR(20), -- Links to existing employee records if applicable
    hire_date DATE,
    employment_type VARCHAR(20) DEFAULT 'full_time' CHECK (employment_type IN (
        'full_time', 'part_time', 'contract', 'intern', 'freelancer'
    )),
    
    -- Contact Information
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    
    -- Professional Links
    linkedin_url TEXT,
    portfolio_url TEXT,
    github_url TEXT,
    
    -- Skills and Expertise
    skills TEXT[],
    certifications TEXT[],
    experience_years DECIMAL(3,1),
    
    -- Account Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'inactive', 'suspended', 'terminated', 'pending_approval'
    )),
    
    -- Authentication Security
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT FALSE,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Monthly Form Tracking
    last_monthly_form_submission TIMESTAMP WITH TIME ZONE,
    monthly_form_reminder_sent BOOLEAN DEFAULT FALSE,
    
    -- Permissions and Access
    permissions JSONB DEFAULT '{}'::jsonb,
    dashboard_access TEXT[] DEFAULT '{}',
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.unified_users(id),
    updated_by UUID REFERENCES public.unified_users(id)
);

-- =============================================
-- USER SESSIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.unified_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    logout_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROLE PERMISSIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL, -- 'employees', 'interns', 'freelancers', 'clients', etc.
    action VARCHAR(50) NOT NULL,    -- 'create', 'read', 'update', 'delete', 'approve'
    allowed BOOLEAN DEFAULT TRUE,
    conditions JSONB DEFAULT '{}'::jsonb, -- Additional conditions for permission
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MONTHLY FORM SUBMISSIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.monthly_form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.unified_users(id) ON DELETE CASCADE,
    submission_month DATE NOT NULL, -- First day of the month
    form_type VARCHAR(50) NOT NULL, -- 'employee_performance', 'intern_report', 'freelancer_summary'
    form_data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN (
        'draft', 'submitted', 'reviewed', 'approved', 'rejected'
    )),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES public.unified_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, submission_month, form_type)
);

-- =============================================
-- INDEXES
-- =============================================

-- Unified Users Indexes
CREATE INDEX IF NOT EXISTS idx_unified_users_email ON public.unified_users(email);
CREATE INDEX IF NOT EXISTS idx_unified_users_phone ON public.unified_users(phone);
CREATE INDEX IF NOT EXISTS idx_unified_users_role ON public.unified_users(role);
CREATE INDEX IF NOT EXISTS idx_unified_users_user_category ON public.unified_users(user_category);
CREATE INDEX IF NOT EXISTS idx_unified_users_department ON public.unified_users(department);
CREATE INDEX IF NOT EXISTS idx_unified_users_status ON public.unified_users(status);
CREATE INDEX IF NOT EXISTS idx_unified_users_employee_id ON public.unified_users(employee_id);

-- User Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- Role Permissions Indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON public.role_permissions(resource);
CREATE INDEX IF NOT EXISTS idx_role_permissions_action ON public.role_permissions(action);

-- Monthly Form Submissions Indexes
CREATE INDEX IF NOT EXISTS idx_monthly_forms_user_id ON public.monthly_form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_forms_month ON public.monthly_form_submissions(submission_month);
CREATE INDEX IF NOT EXISTS idx_monthly_forms_status ON public.monthly_form_submissions(status);

-- =============================================
-- TRIGGERS
-- =============================================

-- Updated at trigger for unified_users
CREATE TRIGGER update_unified_users_updated_at
    BEFORE UPDATE ON public.unified_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Updated at trigger for monthly_form_submissions
CREATE TRIGGER update_monthly_forms_updated_at
    BEFORE UPDATE ON public.monthly_form_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AUTHENTICATION FUNCTIONS
-- =============================================

-- Function to authenticate user with email/password
CREATE OR REPLACE FUNCTION authenticate_unified_user(
    login_email TEXT,
    login_password TEXT
)
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    user_category TEXT,
    department TEXT,
    permissions JSONB,
    dashboard_access TEXT[],
    authentication_success BOOLEAN
) AS $$
DECLARE
    user_record RECORD;
    session_token TEXT;
BEGIN
    -- Find user by email
    SELECT * INTO user_record
    FROM public.unified_users
    WHERE email = login_email
    AND status = 'active'
    AND account_locked = FALSE;
    
    -- Check if user exists and password matches (simplified - in production use proper hashing)
    IF user_record.id IS NOT NULL AND user_record.password_hash = login_password THEN
        -- Generate session token
        session_token := gen_random_uuid()::TEXT;
        
        -- Create session
        INSERT INTO public.user_sessions (user_id, session_token, expires_at)
        VALUES (user_record.id, session_token, NOW() + INTERVAL '24 hours');
        
        -- Update last login and reset login attempts
        UPDATE public.unified_users
        SET 
            last_login = NOW(),
            login_attempts = 0,
            updated_at = NOW()
        WHERE id = user_record.id;
        
        -- Return successful authentication
        RETURN QUERY SELECT 
            user_record.id,
            user_record.name,
            user_record.email,
            user_record.role,
            user_record.user_category,
            user_record.department,
            user_record.permissions,
            user_record.dashboard_access,
            TRUE as authentication_success;
    ELSE
        -- Increment login attempts if user exists
        IF user_record.id IS NOT NULL THEN
            UPDATE public.unified_users
            SET 
                login_attempts = login_attempts + 1,
                account_locked = CASE WHEN login_attempts >= 4 THEN TRUE ELSE FALSE END,
                updated_at = NOW()
            WHERE id = user_record.id;
        END IF;
        
        -- Return failed authentication
        RETURN QUERY SELECT 
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            NULL::JSONB,
            NULL::TEXT[],
            FALSE as authentication_success;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    user_role TEXT,
    resource_name TEXT,
    action_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    permission_exists BOOLEAN := FALSE;
BEGIN
    SELECT allowed INTO permission_exists
    FROM public.role_permissions
    WHERE role = user_role
    AND resource = resource_name
    AND action = action_name
    LIMIT 1;
    
    RETURN COALESCE(permission_exists, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get users requiring monthly form submission
CREATE OR REPLACE FUNCTION get_users_needing_monthly_forms()
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    last_submission DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.last_monthly_form_submission::DATE
    FROM public.unified_users u
    WHERE u.status = 'active'
    AND (
        u.last_monthly_form_submission IS NULL
        OR u.last_monthly_form_submission < DATE_TRUNC('month', CURRENT_DATE)
    )
    ORDER BY u.last_monthly_form_submission ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.unified_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_form_submissions ENABLE ROW LEVEL SECURITY;

-- Unified Users Policies
CREATE POLICY "Users can view own profile" ON public.unified_users
    FOR SELECT USING (auth.uid()::TEXT = id::TEXT);

CREATE POLICY "Users can update own profile" ON public.unified_users
    FOR UPDATE USING (auth.uid()::TEXT = id::TEXT);

CREATE POLICY "Super Admin full access to users" ON public.unified_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND role = 'Super Admin'
        )
    );

CREATE POLICY "Operations Head access to marketing users" ON public.unified_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.unified_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND role = 'Operations Head'
        )
        AND user_category IN ('employee', 'intern', 'freelancer')
    );

-- User Sessions Policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "System can manage sessions" ON public.user_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Monthly Form Submissions Policies
CREATE POLICY "Users can manage own submissions" ON public.monthly_form_submissions
    FOR ALL USING (auth.uid()::TEXT = user_id::TEXT);

CREATE POLICY "Managers can view team submissions" ON public.monthly_form_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.unified_users
            WHERE id::TEXT = auth.uid()::TEXT
            AND user_category IN ('management', 'admin', 'super_admin')
        )
    );

COMMIT;