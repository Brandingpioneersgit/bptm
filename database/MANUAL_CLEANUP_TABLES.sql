-- =====================================================
-- MANUAL DATABASE CLEANUP SCRIPT
-- Run this in Supabase SQL Editor to remove redundant tables
-- =====================================================

-- This script removes redundant authentication tables and module-specific user tables
-- All functionality has been consolidated into unified_users and user_sessions

-- =====================================================
-- 1. DROP REDUNDANT AUTHENTICATION TABLES
-- =====================================================

-- Remove old authentication tables (replaced by unified_users)
DROP TABLE IF EXISTS public.user_accounts CASCADE;
DROP TABLE IF EXISTS public.login_tracking CASCADE;
DROP TABLE IF EXISTS public.login_attempts CASCADE;

-- =====================================================
-- 2. DROP MODULE-SPECIFIC USER TABLES
-- =====================================================

-- Remove module-specific user tables (all users now in unified_users)
DROP TABLE IF EXISTS public.ads_users CASCADE;
DROP TABLE IF EXISTS public.web_users CASCADE;
DROP TABLE IF EXISTS public.social_users CASCADE;
DROP TABLE IF EXISTS public.intern_users CASCADE;
DROP TABLE IF EXISTS public.freelancer_users CASCADE;
DROP TABLE IF EXISTS public.sales_users CASCADE;
DROP TABLE IF EXISTS public.cs_users CASCADE;
DROP TABLE IF EXISTS public.af_users CASCADE;
DROP TABLE IF EXISTS public.hr_users CASCADE;
DROP TABLE IF EXISTS public.yt_users CASCADE;
DROP TABLE IF EXISTS public.seo_users CASCADE;

-- =====================================================
-- 3. DROP RELATED FUNCTIONS
-- =====================================================

-- Remove old authentication functions
DROP FUNCTION IF EXISTS authenticate_user CASCADE;
DROP FUNCTION IF EXISTS sync_employee_to_user_account CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_login_attempts CASCADE;
DROP FUNCTION IF EXISTS create_user_account CASCADE;
DROP FUNCTION IF EXISTS update_user_last_login CASCADE;
DROP FUNCTION IF EXISTS track_login_attempt CASCADE;

-- =====================================================
-- 4. VERIFICATION QUERIES
-- =====================================================

-- Verify unified_users table exists and has proper structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'unified_users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify user_sessions table exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_sessions' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any remaining old tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'user_accounts', 'login_tracking', 'login_attempts',
        'ads_users', 'web_users', 'social_users', 'intern_users',
        'freelancer_users', 'sales_users', 'cs_users', 'af_users',
        'hr_users', 'yt_users', 'seo_users'
    );

-- =====================================================
-- 5. NOTES FOR DEVELOPERS
-- =====================================================

/*
After running this cleanup script:

1. All user authentication should use unified_users table
2. All session management should use user_sessions table
3. Update any remaining code references to use these tables
4. Foreign key references in other tables may need updating
5. Test all authentication and user management functionality

Key changes:
- unified_users replaces all module-specific user tables
- user_sessions handles all session management
- authenticate_unified_user function handles authentication
- IP tracking is built into user_sessions
- Role-based access control is centralized
*/