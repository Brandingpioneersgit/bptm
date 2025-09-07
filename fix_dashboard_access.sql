-- Fix Dashboard Access Permissions for All Users
-- This script adds missing dashboard access permissions

-- Update Admin user to include super_admin_dashboard and profile access
UPDATE unified_users 
SET dashboard_access = ARRAY['super_admin_dashboard', 'all_dashboards', 'profile']
WHERE name ILIKE 'Admin%' AND role = 'Super Admin';

-- Update all other users to include profile access
UPDATE unified_users 
SET dashboard_access = dashboard_access || ARRAY['profile']
WHERE role != 'Super Admin' AND NOT ('profile' = ANY(dashboard_access));

-- Verify the updates
SELECT 
    name,
    role,
    dashboard_access,
    array_length(dashboard_access, 1) as access_count
FROM unified_users 
ORDER BY name;

-- Check specific access patterns
SELECT 
    'Super Admin Access Check' as check_type,
    COUNT(*) as count
FROM unified_users 
WHERE role = 'Super Admin' 
    AND 'super_admin_dashboard' = ANY(dashboard_access)
    AND 'profile' = ANY(dashboard_access);

SELECT 
    'Profile Access Check' as check_type,
    COUNT(*) as users_with_profile_access,
    (SELECT COUNT(*) FROM unified_users WHERE status = 'active') as total_active_users
FROM unified_users 
WHERE 'profile' = ANY(dashboard_access) AND status = 'active';

-- Final verification query
SELECT 
    name,
    role,
    CASE 
        WHEN 'profile' = ANY(dashboard_access) THEN '✅'
        ELSE '❌'
    END as has_profile_access,
    CASE 
        WHEN role = 'Super Admin' AND 'super_admin_dashboard' = ANY(dashboard_access) THEN '✅'
        WHEN role != 'Super Admin' THEN '✅'
        ELSE '❌'
    END as has_role_access,
    dashboard_access
FROM unified_users 
WHERE status = 'active'
ORDER BY name;