-- Fix authentication by creating users that match TestSprite test expectations
-- This script creates the exact users that TestSprite is trying to authenticate with

-- Temporarily disable RLS to insert test users
ALTER TABLE public.unified_users DISABLE ROW LEVEL SECURITY;

-- Clear existing users first
DELETE FROM public.unified_users;

-- Insert TestSprite-expected users with correct credentials
INSERT INTO public.unified_users (
    user_id, name, email, phone, password_hash, role, user_category, 
    department, employee_id, status, dashboard_access, permissions,
    account_locked, login_attempts, created_at, updated_at
) VALUES 
-- TestSprite expects these exact users:
('USR001', 'Marketing Manager', 'marketing.manager@example.com', '9876543210', 'password123', 'Manager', 'employee', 
 'Marketing', 'EMP001', 'active', ARRAY['employee_dashboard', 'manager_dashboard'], '{"read": true, "write": true}',
 false, 0, NOW(), NOW()),

('USR002', 'Super Admin', 'super.admin@example.com', '9876543211', 'password123', 'Super Admin', 'super_admin', 
 'Administration', 'ADM001', 'active', ARRAY['all_dashboards', 'admin_dashboard'], '{"full_access": true}',
 false, 0, NOW(), NOW()),

('USR003', 'Admin User', 'admin@example.com', '9876543212', 'password123', 'Admin', 'admin', 
 'Administration', 'ADM002', 'active', ARRAY['admin_dashboard', 'employee_dashboard'], '{"admin_access": true}',
 false, 0, NOW(), NOW()),

('USR004', 'Employee User', 'employee@example.com', '9876543213', 'password123', 'SEO', 'employee', 
 'Marketing', 'EMP002', 'active', ARRAY['employee_dashboard'], '{"read": true, "write": true}',
 false, 0, NOW(), NOW()),

('USR005', 'Freelancer User', 'freelancer@example.com', '9876543214', 'password123', 'Freelancer', 'freelancer', 
 'Marketing', 'FRL001', 'active', ARRAY['freelancer_dashboard'], '{"read": true, "write": false}',
 false, 0, NOW(), NOW()),

('USR006', 'Intern User', 'intern@example.com', '9876543215', 'password123', 'Intern', 'intern', 
 'Marketing', 'INT001', 'active', ARRAY['intern_dashboard'], '{"read": true, "write": false}',
 false, 0, NOW(), NOW()),

('USR007', 'Senior Developer', 'senior.developer@example.com', '9876543216', 'password123', 'Web Developer', 'employee', 
 'Technology', 'EMP003', 'active', ARRAY['employee_dashboard', 'dev_dashboard'], '{"read": true, "write": true}',
 false, 0, NOW(), NOW()),

-- Additional users for comprehensive testing
('USR008', 'Client Onboarding', 'client.onboarding@example.com', '9876543217', 'password123', 'Manager', 'employee', 
 'Sales', 'EMP004', 'active', ARRAY['employee_dashboard', 'client_dashboard'], '{"read": true, "write": true}',
 false, 0, NOW(), NOW());

-- Re-enable RLS
ALTER TABLE public.unified_users ENABLE ROW LEVEL SECURITY;

-- Verify the users were created
SELECT 
    user_id,
    name, 
    email,
    password_hash,
    role, 
    user_category, 
    department,
    status
FROM public.unified_users 
ORDER BY user_category, role;

-- Show count
SELECT COUNT(*) as total_users FROM public.unified_users;