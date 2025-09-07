-- Temporarily disable RLS to insert test users
ALTER TABLE public.unified_users DISABLE ROW LEVEL SECURITY;

-- Clear existing users
DELETE FROM public.unified_users;

-- Insert test users with exact names and phone numbers expected by authentication system
INSERT INTO public.unified_users (
    user_id, name, email, phone, password_hash, role, user_category, 
    department, employee_id, status, dashboard_access, permissions,
    account_locked, login_attempts, created_at, updated_at
) VALUES 
-- SEO Employee
('USR001', 'John SEO', 'john.seo@agency.com', '9876543210', 'test123', 'SEO', 'employee', 
 'Marketing', 'EMP001', 'active', ARRAY['employee_dashboard', 'seo_dashboard'], '{"read": true, "write": true}',
 false, 0, NOW(), NOW()),

-- Ads Employee
('USR002', 'Sarah Ads', 'sarah.ads@agency.com', '9876543211', 'test123', 'Ads', 'employee', 
 'Marketing', 'EMP002', 'active', ARRAY['employee_dashboard', 'ads_dashboard'], '{"read": true, "write": true}',
 false, 0, NOW(), NOW()),

-- Social Media Employee
('USR003', 'Mike Social', 'mike.social@agency.com', '9876543212', 'test123', 'Social Media', 'employee', 
 'Marketing', 'EMP003', 'active', ARRAY['employee_dashboard', 'social_dashboard'], '{"read": true, "write": true}',
 false, 0, NOW(), NOW()),

-- YouTube SEO Employee
('USR004', 'Lisa YouTube', 'lisa.youtube@agency.com', '9876543213', 'test123', 'YouTube SEO', 'employee', 
 'Marketing', 'EMP004', 'active', ARRAY['employee_dashboard', 'youtube_dashboard'], '{"read": true, "write": true}',
 false, 0, NOW(), NOW()),

-- Web Developer Employee
('USR005', 'David Developer', 'david.dev@agency.com', '9876543214', 'test123', 'Web Developer', 'employee', 
 'Technology', 'EMP005', 'active', ARRAY['employee_dashboard', 'dev_dashboard'], '{"read": true, "write": true}',
 false, 0, NOW(), NOW()),

-- Graphic Designer Employee
('USR006', 'Emma Designer', 'emma.design@agency.com', '9876543215', 'test123', 'Graphic Designer', 'employee', 
 'Creative', 'EMP006', 'active', ARRAY['employee_dashboard', 'design_dashboard'], '{"read": true, "write": true}',
 false, 0, NOW(), NOW()),

-- Super Admin
('USR007', 'Admin Super', 'admin@agency.com', '9876543225', 'test123', 'Super Admin', 'super_admin', 
 'Administration', 'ADM001', 'active', ARRAY['all_dashboards', 'admin_dashboard', 'profile'], '{"full_access": true}',
 false, 0, NOW(), NOW());

-- Re-enable RLS
ALTER TABLE public.unified_users ENABLE ROW LEVEL SECURITY;

-- Verify the data
SELECT 
    name, 
    phone, 
    role, 
    user_category, 
    department,
    dashboard_access
FROM public.unified_users 
ORDER BY user_category, role;

-- Show count
SELECT COUNT(*) as total_users FROM public.unified_users;