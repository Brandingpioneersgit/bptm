-- =============================================
-- SIMPLIFIED USER STRUCTURE
-- =============================================
-- This script creates a new simplified user table structure
-- with firstname, phone (10 digits), password, and department

BEGIN;

-- =============================================
-- DROP EXISTING COMPLEX TABLES
-- =============================================

-- Drop existing complex authentication tables
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.monthly_form_submissions CASCADE;
DROP TABLE IF EXISTS public.unified_users CASCADE;

-- =============================================
-- CREATE SIMPLIFIED USERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.simple_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstname VARCHAR(100) NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL CHECK (phone ~ '^[0-9]{10}$'), -- Exactly 10 digits
    password_hash TEXT NOT NULL,
    department VARCHAR(100) NOT NULL,
    
    -- Basic user info
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- CREATE SIMPLE SESSIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.simple_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.simple_users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CREATE DEPARTMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INSERT DEFAULT DEPARTMENTS
-- =============================================

INSERT INTO public.departments (name, description) VALUES
('Marketing', 'Digital marketing, SEO, and advertising'),
('Development', 'Web development and technical services'),
('Design', 'Graphic design and creative services'),
('Operations', 'Business operations and management'),
('HR', 'Human resources and administration'),
('Sales', 'Client acquisition and account management'),
('Finance', 'Accounting and financial management'),
('Content', 'Content creation and social media');

-- =============================================
-- CREATE INDEXES
-- =============================================

-- Simple Users Indexes
CREATE INDEX IF NOT EXISTS idx_simple_users_phone ON public.simple_users(phone);
CREATE INDEX IF NOT EXISTS idx_simple_users_department ON public.simple_users(department);
CREATE INDEX IF NOT EXISTS idx_simple_users_status ON public.simple_users(status);
CREATE INDEX IF NOT EXISTS idx_simple_users_firstname ON public.simple_users(firstname);

-- Simple Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_simple_sessions_user_id ON public.simple_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_simple_sessions_token ON public.simple_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_simple_sessions_active ON public.simple_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_simple_sessions_expires ON public.simple_sessions(expires_at);

-- Departments Indexes
CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments(name);

-- =============================================
-- CREATE UPDATED_AT TRIGGER
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for simple_users
CREATE TRIGGER update_simple_users_updated_at
    BEFORE UPDATE ON public.simple_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- AUTHENTICATION FUNCTION
-- =============================================

-- Function to authenticate user with phone/password
CREATE OR REPLACE FUNCTION authenticate_simple_user(
    login_phone TEXT,
    login_password TEXT
)
RETURNS TABLE (
    user_id UUID,
    firstname TEXT,
    phone TEXT,
    department TEXT,
    authentication_success BOOLEAN
) AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Find user by phone
    SELECT * INTO user_record
    FROM public.simple_users
    WHERE phone = login_phone
    AND status = 'active';
    
    -- Check if user exists and password matches
    IF user_record.id IS NOT NULL AND user_record.password_hash = login_password THEN
        -- Update last login
        UPDATE public.simple_users 
        SET last_login = NOW()
        WHERE id = user_record.id;
        
        -- Return successful authentication
        RETURN QUERY SELECT 
            user_record.id,
            user_record.firstname,
            user_record.phone,
            user_record.department,
            TRUE as authentication_success;
    ELSE
        -- Return failed authentication
        RETURN QUERY SELECT 
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            FALSE as authentication_success;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on tables
ALTER TABLE public.simple_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Simple policies for now (can be enhanced later)
CREATE POLICY "Allow all operations for authenticated users" ON public.simple_users FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.simple_sessions FOR ALL USING (true);
CREATE POLICY "Allow read access to departments" ON public.departments FOR SELECT USING (true);

CONSOLE.LOG('✅ Simplified user structure created successfully!');
CONSOLE.LOG('📋 Tables: simple_users, simple_sessions, departments');
CONSOLE.LOG('🔑 Login fields: firstname, phone (10 digits), password, department');

COMMIT;