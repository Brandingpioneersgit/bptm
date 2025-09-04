-- Manual SQL script to populate unified_users table
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS
ALTER TABLE public.unified_users DISABLE ROW LEVEL SECURITY;

-- Clear existing users first
DELETE FROM public.unified_users;

-- Insert test users
INSERT INTO public.unified_users (user_id, name, phone, email, password_hash, role, user_category, department, status, dashboard_access, permissions) VALUES 
('USR001', 'Admin Super', '+91-9876543225', 'admin@testcompany.com', '$2b$10$hashedpassword1', 'Super Admin', 'super_admin', 'Administration', 'active', ARRAY['super_admin_dashboard', 'all_dashboards'], '{"all":true}'),
('USR002', 'John SEO', '+91-9876543210', 'john.seo@testcompany.com', '$2b$10$hashedpassword2', 'SEO', 'employee', 'Marketing', 'active', ARRAY['seo_dashboard', 'employee_dashboard'], '{"read":true,"write":true}'),
('USR003', 'Sarah Ads', '+91-9876543211', 'sarah.ads@testcompany.com', '$2b$10$hashedpassword3', 'Ads', 'employee', 'Marketing', 'active', ARRAY['ads_dashboard', 'employee_dashboard'], '{"read":true,"write":true}'),
('USR004', 'Mike Social', '+91-9876543212', 'mike.social@testcompany.com', '$2b$10$hashedpassword4', 'Social Media', 'employee', 'Marketing', 'active', ARRAY['social_dashboard', 'employee_dashboard'], '{"read":true,"write":true}'),
('USR005', 'Lisa YouTube', '+91-9876543213', 'lisa.youtube@testcompany.com', '$2b$10$hashedpassword5', 'YouTube SEO', 'employee', 'Marketing', 'active', ARRAY['youtube_dashboard', 'employee_dashboard'], '{"read":true,"write":true}'),
('USR006', 'David Dev', '+91-9876543214', 'david.dev@testcompany.com', '$2b$10$hashedpassword6', 'Web Developer', 'employee', 'Technology', 'active', ARRAY['dev_dashboard', 'employee_dashboard'], '{"read":true,"write":true}'),
('USR007', 'Emma Design', '+91-9876543215', 'emma.design@testcompany.com', '$2b$10$hashedpassword7', 'Graphic Designer', 'employee', 'Creative', 'active', ARRAY['design_dashboard', 'employee_dashboard'], '{"read":true,"write":true}'),
('USR008', 'Alex Freelancer', '+91-9876543216', 'alex.freelancer@testcompany.com', '$2b$10$hashedpassword8', 'Freelancer', 'freelancer', NULL, 'active', ARRAY['freelancer_dashboard'], '{"read":true,"write":true}'),
('USR009', 'Priya Intern', '+91-9876543218', 'priya.intern@testcompany.com', '$2b$10$hashedpassword9', 'Intern', 'intern', NULL, 'active', ARRAY['intern_dashboard'], '{"read":true}'),

('USR011', 'Jennifer Operations', '+91-9876543221', 'jennifer.operations@testcompany.com', '$2b$10$hashedpassword11', 'Operations Head', 'management', 'Operations', 'active', ARRAY['operations_dashboard', 'management_dashboard'], '{"read":true,"write":true,"approve":true}'),
('USR012', 'Michael Accountant', '+91-9876543222', 'michael.accountant@testcompany.com', '$2b$10$hashedpassword12', 'Accountant', 'admin', 'Finance', 'active', ARRAY['accounting_dashboard', 'admin_dashboard'], '{"read":true,"write":true,"approve":true}'),
('USR013', 'Amanda Sales', '+91-9876543223', 'amanda.sales@testcompany.com', '$2b$10$hashedpassword13', 'Sales', 'admin', 'Sales', 'active', ARRAY['sales_dashboard', 'admin_dashboard'], '{"read":true,"write":true,"approve":true}'),
('USR014', 'Rachel HR', '+91-9876543224', 'rachel.hr@testcompany.com', '$2b$10$hashedpassword14', 'HR', 'admin', 'Human Resources', 'active', ARRAY['hr_dashboard', 'admin_dashboard'], '{"read":true,"write":true,"approve":true}');

-- Re-enable RLS
ALTER TABLE public.unified_users ENABLE ROW LEVEL SECURITY;

-- Verify the data
SELECT name, role, user_category, department FROM public.unified_users ORDER BY user_category, role;