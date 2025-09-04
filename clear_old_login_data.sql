-- =============================================
-- CLEAR OLD LOGIN DATA
-- =============================================
-- This script removes all existing user data to prepare for
-- the new simplified login system with firstname, phone, password, department

BEGIN;

-- =============================================
-- BACKUP EXISTING DATA (Optional - for safety)
-- =============================================

-- Create backup tables (uncomment if you want to keep backups)
-- CREATE TABLE IF NOT EXISTS backup_unified_users AS SELECT * FROM public.unified_users;
-- CREATE TABLE IF NOT EXISTS backup_user_sessions AS SELECT * FROM public.user_sessions;

-- =============================================
-- CLEAR USER SESSIONS
-- =============================================

-- Delete all active sessions
DELETE FROM public.user_sessions;
CONSOLE.LOG('✅ Cleared all user sessions');

-- =============================================
-- CLEAR USER DATA
-- =============================================

-- Delete all users from unified_users table
DELETE FROM public.unified_users;
CONSOLE.LOG('✅ Cleared all user data from unified_users');

-- =============================================
-- CLEAR RELATED DATA
-- =============================================

-- Clear monthly form submissions
DELETE FROM public.monthly_form_submissions;
CONSOLE.LOG('✅ Cleared monthly form submissions');

-- Clear role permissions (we'll recreate these for new departments)
DELETE FROM public.role_permissions;
CONSOLE.LOG('✅ Cleared role permissions');

-- =============================================
-- RESET SEQUENCES (if any)
-- =============================================

-- Reset any auto-increment sequences
-- ALTER SEQUENCE IF EXISTS unified_users_id_seq RESTART WITH 1;

CONSOLE.LOG('🧹 Database cleanup completed successfully!');
CONSOLE.LOG('📋 Ready for new simplified login system');

COMMIT;