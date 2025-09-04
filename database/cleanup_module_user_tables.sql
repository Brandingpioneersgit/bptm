-- =============================================
-- CLEANUP MODULE-SPECIFIC USER TABLES
-- =============================================
-- This script removes module-specific user tables that duplicate
-- the functionality of unified_users table
-- All user management should go through unified_users

BEGIN;

-- =============================================
-- DROP MODULE-SPECIFIC USER TABLES
-- =============================================

-- Ads Module
DROP TABLE IF EXISTS public.ads_users CASCADE;

-- Web Module
DROP TABLE IF EXISTS public.web_users CASCADE;

-- Social Media Module
DROP TABLE IF EXISTS public.social_users CASCADE;

-- Interns Module
DROP TABLE IF EXISTS public.intern_users CASCADE;

-- Freelancers Module
DROP TABLE IF EXISTS public.freelancer_users CASCADE;

-- Sales CRM Module
DROP TABLE IF EXISTS public.sales_users CASCADE;

-- Client Servicing Module
DROP TABLE IF EXISTS public.cs_users CASCADE;

-- Accounts & Finance Module
DROP TABLE IF EXISTS public.af_users CASCADE;

-- HR Module
DROP TABLE IF EXISTS public.hr_users CASCADE;

-- YouTube SEO Module
DROP TABLE IF EXISTS public.yt_users CASCADE;

-- SEO Module (if exists)
DROP TABLE IF EXISTS public.seo_users CASCADE;

-- =============================================
-- UPDATE FOREIGN KEY REFERENCES
-- =============================================

-- Note: After dropping these tables, you'll need to update any tables
-- that reference these user tables to reference unified_users instead
-- This includes:
-- - ads_accounts.employee_id -> should reference unified_users.id
-- - web_assignments.employee_id -> should reference unified_users.id
-- - social_accounts.employee_id -> should reference unified_users.id
-- - And similar references in other modules

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify unified_users contains all necessary roles
SELECT 
    role,
    COUNT(*) as user_count
FROM public.unified_users 
GROUP BY role
ORDER BY role;

-- List remaining user-related tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND (table_name LIKE '%user%' OR table_name LIKE '%_users')
ORDER BY table_name;

-- Check for any broken foreign key constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND (ccu.table_name LIKE '%_users' OR ccu.table_name IN ('ads_users', 'web_users', 'social_users', 'intern_users', 'freelancer_users', 'sales_users', 'cs_users', 'af_users', 'hr_users', 'yt_users', 'seo_users'))
ORDER BY tc.table_name;

COMMIT;

SELECT 'Module-specific user tables cleanup completed!' as status;
SELECT 'WARNING: You may need to update foreign key references to point to unified_users' as warning;