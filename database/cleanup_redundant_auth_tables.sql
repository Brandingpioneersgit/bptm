-- =============================================
-- CLEANUP REDUNDANT AUTHENTICATION TABLES
-- =============================================
-- This script removes redundant authentication tables that have been
-- replaced by the unified authentication system (unified_users, user_sessions)
-- Run this after confirming unified_users is working properly

BEGIN;

-- =============================================
-- DROP REDUNDANT AUTHENTICATION TABLES
-- =============================================

-- These tables are replaced by unified_users and user_sessions
DROP TABLE IF EXISTS public.user_accounts CASCADE;
DROP TABLE IF EXISTS public.login_tracking CASCADE;
DROP TABLE IF EXISTS public.login_attempts CASCADE;

-- Drop any remaining authentication functions that reference old tables
DROP FUNCTION IF EXISTS authenticate_user CASCADE;
DROP FUNCTION IF EXISTS sync_employee_to_user_account CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_login_attempts CASCADE;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify unified_users table exists and has data
SELECT 
    'unified_users' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT role) as unique_roles
FROM public.unified_users;

-- Verify user_sessions table exists
SELECT 
    'user_sessions' as table_name,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE is_active = true) as active_sessions
FROM public.user_sessions;

-- List remaining tables to confirm cleanup
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name LIKE '%user%' 
    OR table_name LIKE '%login%' 
    OR table_name LIKE '%auth%'
ORDER BY table_name;

COMMIT;

SELECT 'Redundant authentication tables cleanup completed!' as status;