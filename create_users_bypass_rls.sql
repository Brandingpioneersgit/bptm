-- SQL script to create test users by temporarily disabling RLS
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS to allow user insertion
ALTER TABLE public.unified_users DISABLE ROW LEVEL SECURITY;

-- Clear existing users first
DELETE FROM public.unified_users;

-- Insert test users with all required fields
INSERT INTO public.unified_users (
    user_id, name, email, phone, password_hash, role, user_category, 
    department, employee_id, hire_date, employment_type, skills, 
    status, dashboard_access, permissions, account_locked, login_attempts
) VALUES 
-- SEO Employee
('USR001', 'John SEO', 'john.seo@agency.com', '9876543210', 'test123', 'SEO', 'employee', 
 'Marketing', 'EMP001', '2024-01-01', 'full_time', ARRAY['SEO Optimization', 'Keyword Research'], 
 'active', ARRAY['employee_dashboard', 'seo_dashboard'], '{"read": true, "write": true}',
 false, 0),

-- Ads Employee
('USR002', 'Sarah Ads', 'sarah.ads@agency.com', '9876543211', 'test123', 'Ads', 'employee', 
 'Marketing', 'EMP002', '2024-01-01', 'full_time', ARRAY['Google Ads', 'Facebook Ads'], 
 'active', ARRAY['employee_dashboard', 'ads_dashboard'], '{"read": true, "write": true}',
 false, 0),

-- Social Media Employee
('USR003', 'Mike Social', 'mike.social@agency.com', '9876543212', 'test123', 'Social Media', 'employee', 
 'Marketing', 'EMP003', '2024-01-01', 'full_time', ARRAY['Social Media Management', 'Content Creation'], 
 'active', ARRAY['employee_dashboard', 'social_dashboard'], '{"read": true, "write": true}',
 false, 0),

-- YouTube SEO Employee
('USR004', 'Lisa YouTube', 'lisa.youtube@agency.com', '9876543213', 'test123', 'YouTube SEO', 'employee', 
 'Marketing', 'EMP004', '2024-01-01', 'full_time', ARRAY['YouTube Optimization', 'Video SEO'], 
 'active', ARRAY['employee_dashboard', 'youtube_dashboard'], '{"read": true, "write": true}',
 false, 0),

-- Web Developer Employee
('USR005', 'David Developer', 'david.dev@agency.com', '9876543214', 'test123', 'Web Developer', 'employee', 
 'Technology', 'EMP005', '2024-01-01', 'full_time', ARRAY['React', 'Node.js', 'Database Design'], 
 'active', ARRAY['employee_dashboard', 'dev_dashboard'], '{"read": true, "write": true}',
 false, 0),

-- Graphic Designer Employee
('USR006', 'Emma Designer', 'emma.design@agency.com', '9876543215', 'test123', 'Graphic Designer', 'employee', 
 'Creative', 'EMP006', '2024-01-01', 'full_time', ARRAY['Adobe Creative Suite', 'UI/UX Design'], 
 'active', ARRAY['employee_dashboard', 'design_dashboard'], '{"read": true, "write": true}',
 false, 0),

-- Super Admin
('USR007', 'Admin Super', 'admin@agency.com', '9876543225', 'test123', 'Super Admin', 'super_admin', 
 'Administration', 'ADM001', '2024-01-01', 'full_time', ARRAY['System Administration', 'Full Stack Development'], 
 'active', ARRAY['all_dashboards', 'admin_dashboard', 'profile'], '{"full_access": true}',
 false, 0),

-- HR User
('USR008', 'HRUser', 'hr@agency.com', '9876543226', 'test123', 'HR Manager', 'hr', 
 'Human Resources', 'HR001', '2024-01-01', 'full_time', ARRAY['Employee Management', 'Recruitment'], 
 'active', ARRAY['hr_dashboard', 'employee_dashboard'], '{"read": true, "write": true, "hr_access": true}',
 false, 0),

-- Manager
('USR009', 'Manager', 'manager@agency.com', '9876543227', 'test123', 'Team Manager', 'manager', 
 'Management', 'MGR001', '2024-01-01', 'full_time', ARRAY['Team Leadership', 'Project Management'], 
 'active', ARRAY['manager_dashboard', 'employee_dashboard'], '{"read": true, "write": true, "manage_team": true}',
 false, 0),

-- Employee
('USR010', 'Employee', 'employee@agency.com', '9876543228', 'test123', 'General Employee', 'employee', 
 'General', 'EMP007', '2024-01-01', 'full_time', ARRAY['General Tasks'], 
 'active', ARRAY['employee_dashboard'], '{"read": true, "write": false}',
 false, 0);

-- Re-enable RLS
ALTER TABLE public.unified_users ENABLE ROW LEVEL SECURITY;

-- Verify the data
SELECT 
    user_id,
    name, 
    phone, 
    role, 
    user_category, 
    department,
    dashboard_access,
    status
FROM public.unified_users 
ORDER BY user_category, role;

-- Show count
SELECT COUNT(*) as total_users FROM public.unified_users;

-- Test authentication queries
SELECT 'Authentication Test Results:' as test_section;

-- Test each user lookup
SELECT 'John SEO Test:' as test_name, 
       CASE WHEN EXISTS(
           SELECT 1 FROM public.unified_users 
           WHERE name ILIKE 'John%' AND phone = '9876543210' AND status = 'active'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT 'Sarah Ads Test:' as test_name,
       CASE WHEN EXISTS(
           SELECT 1 FROM public.unified_users 
           WHERE name ILIKE 'Sarah%' AND phone = '9876543211' AND status = 'active'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT 'Mike Social Test:' as test_name,
       CASE WHEN EXISTS(
           SELECT 1 FROM public.unified_users 
           WHERE name ILIKE 'Mike%' AND phone = '9876543212' AND status = 'active'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT 'Lisa YouTube Test:' as test_name,
       CASE WHEN EXISTS(
           SELECT 1 FROM public.unified_users 
           WHERE name ILIKE 'Lisa%' AND phone = '9876543213' AND status = 'active'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT 'David Developer Test:' as test_name,
       CASE WHEN EXISTS(
           SELECT 1 FROM public.unified_users 
           WHERE name ILIKE 'David%' AND phone = '9876543214' AND status = 'active'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT 'Emma Designer Test:' as test_name,
       CASE WHEN EXISTS(
           SELECT 1 FROM public.unified_users 
           WHERE name ILIKE 'Emma%' AND phone = '9876543215' AND status = 'active'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT 'Admin Super Test:' as test_name,
       CASE WHEN EXISTS(
           SELECT 1 FROM public.unified_users 
           WHERE name ILIKE 'Admin%' AND phone = '9876543225' AND status = 'active'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT 'HRUser Test:' as test_name,
       CASE WHEN EXISTS(
           SELECT 1 FROM public.unified_users 
           WHERE name ILIKE 'HRUser%' AND phone = '9876543226' AND status = 'active'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT 'Manager Test:' as test_name,
       CASE WHEN EXISTS(
           SELECT 1 FROM public.unified_users 
           WHERE name ILIKE 'Manager%' AND phone = '9876543227' AND status = 'active'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

SELECT 'Employee Test:' as test_name,
       CASE WHEN EXISTS(
           SELECT 1 FROM public.unified_users 
           WHERE name ILIKE 'Employee%' AND phone = '9876543228' AND status = 'active'
       ) THEN '✅ PASS' ELSE '❌ FAIL' END as result;

-- Summary
SELECT 
    'SUMMARY:' as section,
    COUNT(*) as total_users_created,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN account_locked = false THEN 1 END) as unlocked_users
FROM public.unified_users;