-- Manual SQL script to populate unified_users table
-- This will fix the authentication issue for all roles

-- Temporarily disable RLS to allow insertion
ALTER TABLE public.unified_users DISABLE ROW LEVEL SECURITY;

-- Clear existing users first
DELETE FROM public.unified_users;

-- Insert test users with various roles
INSERT INTO public.unified_users (
    user_id, name, email, phone, password_hash, role, user_category, 
    department, status, dashboard_access, permissions
) VALUES 
-- Super Admin
('USR001', 'Admin Super', 'admin@testcompany.com', '+91-9876543225', 'temp123', 'Super Admin', 'super_admin', 'Administration', 'active', ARRAY['all_dashboards'], '{"full_access": true}'),

-- SEO Users
('USR002', 'John SEO', 'john.seo@testcompany.com', '+91-9876543210', 'temp123', 'SEO', 'employee', 'Marketing', 'active', ARRAY['seo_dashboard', 'employee_dashboard'], '{"read": true, "write": true}'),
('USR003', 'Priya Sharma', 'priya.sharma@testcompany.com', '+91-9876543211', 'temp123', 'SEO', 'management', 'Marketing', 'active', ARRAY['seo_dashboard', 'management_dashboard'], '{"read": true, "write": true}'),

-- Ads Users
('USR004', 'Sarah Ads', 'sarah.ads@testcompany.com', '+91-9876543212', 'temp123', 'Ads', 'employee', 'Marketing', 'active', ARRAY['ads_dashboard', 'employee_dashboard'], '{"read": true, "write": true}'),
('USR005', 'Mike Ads Manager', 'mike.ads@testcompany.com', '+91-9876543213', 'temp123', 'Ads', 'management', 'Marketing', 'active', ARRAY['ads_dashboard', 'management_dashboard'], '{"read": true, "write": true}'),

-- Social Media Users
('USR006', 'Lisa Social', 'lisa.social@testcompany.com', '+91-9876543214', 'temp123', 'Social Media', 'employee', 'Marketing', 'active', ARRAY['social_dashboard', 'employee_dashboard'], '{"read": true, "write": true}'),

-- Web Developer Users
('USR007', 'Arjun Patel', 'arjun.patel@testcompany.com', '+91-9876543215', 'temp123', 'Web Developer', 'employee', 'Engineering', 'active', ARRAY['dev_dashboard', 'employee_dashboard'], '{"read": true, "write": true}'),
('USR008', 'Dev Manager', 'dev.manager@testcompany.com', '+91-9876543216', 'temp123', 'Web Developer', 'management', 'Engineering', 'active', ARRAY['dev_dashboard', 'management_dashboard'], '{"read": true, "write": true}'),

-- Operations Head
('USR009', 'Kiran Joshi', 'kiran.joshi@testcompany.com', '+91-9876543217', 'temp123', 'Operations Head', 'management', 'Operations', 'active', ARRAY['operations_dashboard', 'management_dashboard'], '{"read": true, "write": true, "manage_team": true}'),

-- Graphic Designer
('USR010', 'Design Pro', 'design.pro@testcompany.com', '+91-9876543218', 'temp123', 'Graphic Designer', 'employee', 'Creative', 'active', ARRAY['design_dashboard', 'employee_dashboard'], '{"read": true, "write": true}'),

-- YouTube SEO
('USR011', 'YouTube Expert', 'youtube.expert@testcompany.com', '+91-9876543219', 'temp123', 'YouTube SEO', 'employee', 'Marketing', 'active', ARRAY['youtube_dashboard', 'employee_dashboard'], '{"read": true, "write": true}'),

-- Freelancer
('USR012', 'Freelance Pro', 'freelance.pro@testcompany.com', '+91-9876543220', 'temp123', 'Freelancer', 'freelancer', 'External', 'active', ARRAY['freelancer_dashboard'], '{"read": true, "write": false}'),

-- Intern
('USR013', 'Intern Student', 'intern.student@testcompany.com', '+91-9876543221', 'temp123', 'Intern', 'intern', 'General', 'active', ARRAY['intern_dashboard'], '{"read": true, "write": false}');

-- Re-enable RLS
ALTER TABLE public.unified_users ENABLE ROW LEVEL SECURITY;

-- Verify the insertion
SELECT 
    user_id, 
    name, 
    phone, 
    role, 
    user_category, 
    department,
    status
FROM public.unified_users 
WHERE status = 'active'
ORDER BY user_id;