-- =============================================
-- DEFAULT PERMISSIONS AND TEST USERS
-- =============================================
-- This migration sets up default role permissions and creates test users
-- for all predefined roles in the unified authentication system
-- Timestamp: 20240102004100

BEGIN;

-- =============================================
-- DEFAULT ROLE PERMISSIONS
-- =============================================

-- Insert default permissions for each role

-- SEO Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('SEO', 'seo_dashboard', 'read', true),
('SEO', 'seo_dashboard', 'write', true),
('SEO', 'seo_reports', 'create', true),
('SEO', 'seo_reports', 'read', true),
('SEO', 'seo_reports', 'update', true),
('SEO', 'clients', 'read', true),
('SEO', 'monthly_forms', 'create', true),
('SEO', 'monthly_forms', 'read', true),
('SEO', 'monthly_forms', 'update', true);

-- Ads Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('Ads', 'ads_dashboard', 'read', true),
('Ads', 'ads_dashboard', 'write', true),
('Ads', 'ads_reports', 'create', true),
('Ads', 'ads_reports', 'read', true),
('Ads', 'ads_reports', 'update', true),
('Ads', 'ads_accounts', 'read', true),
('Ads', 'ads_accounts', 'write', true),
('Ads', 'clients', 'read', true),
('Ads', 'monthly_forms', 'create', true),
('Ads', 'monthly_forms', 'read', true),
('Ads', 'monthly_forms', 'update', true);

-- Social Media Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('Social Media', 'social_dashboard', 'read', true),
('Social Media', 'social_dashboard', 'write', true),
('Social Media', 'social_reports', 'create', true),
('Social Media', 'social_reports', 'read', true),
('Social Media', 'social_reports', 'update', true),
('Social Media', 'content_calendar', 'read', true),
('Social Media', 'content_calendar', 'write', true),
('Social Media', 'clients', 'read', true),
('Social Media', 'monthly_forms', 'create', true),
('Social Media', 'monthly_forms', 'read', true),
('Social Media', 'monthly_forms', 'update', true);

-- YouTube SEO Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('YouTube SEO', 'youtube_dashboard', 'read', true),
('YouTube SEO', 'youtube_dashboard', 'write', true),
('YouTube SEO', 'youtube_reports', 'create', true),
('YouTube SEO', 'youtube_reports', 'read', true),
('YouTube SEO', 'youtube_reports', 'update', true),
('YouTube SEO', 'video_analytics', 'read', true),
('YouTube SEO', 'clients', 'read', true),
('YouTube SEO', 'monthly_forms', 'create', true),
('YouTube SEO', 'monthly_forms', 'read', true),
('YouTube SEO', 'monthly_forms', 'update', true);

-- Web Developer Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('Web Developer', 'dev_dashboard', 'read', true),
('Web Developer', 'dev_dashboard', 'write', true),
('Web Developer', 'projects', 'create', true),
('Web Developer', 'projects', 'read', true),
('Web Developer', 'projects', 'update', true),
('Web Developer', 'code_repositories', 'read', true),
('Web Developer', 'code_repositories', 'write', true),
('Web Developer', 'clients', 'read', true),
('Web Developer', 'monthly_forms', 'create', true),
('Web Developer', 'monthly_forms', 'read', true),
('Web Developer', 'monthly_forms', 'update', true);

-- Graphic Designer Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('Graphic Designer', 'design_dashboard', 'read', true),
('Graphic Designer', 'design_dashboard', 'write', true),
('Graphic Designer', 'design_projects', 'create', true),
('Graphic Designer', 'design_projects', 'read', true),
('Graphic Designer', 'design_projects', 'update', true),
('Graphic Designer', 'design_assets', 'read', true),
('Graphic Designer', 'design_assets', 'write', true),
('Graphic Designer', 'clients', 'read', true),
('Graphic Designer', 'monthly_forms', 'create', true),
('Graphic Designer', 'monthly_forms', 'read', true),
('Graphic Designer', 'monthly_forms', 'update', true);

-- Freelancer Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('Freelancer', 'freelancer_dashboard', 'read', true),
('Freelancer', 'freelancer_dashboard', 'write', true),
('Freelancer', 'freelancer_tasks', 'read', true),
('Freelancer', 'freelancer_tasks', 'update', true),
('Freelancer', 'freelancer_reports', 'create', true),
('Freelancer', 'freelancer_reports', 'read', true),
('Freelancer', 'freelancer_reports', 'update', true),
('Freelancer', 'monthly_forms', 'create', true),
('Freelancer', 'monthly_forms', 'read', true),
('Freelancer', 'monthly_forms', 'update', true);

-- Intern Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('Intern', 'intern_dashboard', 'read', true),
('Intern', 'intern_dashboard', 'write', true),
('Intern', 'intern_reports', 'create', true),
('Intern', 'intern_reports', 'read', true),
('Intern', 'intern_reports', 'update', true),
('Intern', 'intern_projects', 'read', true),
('Intern', 'intern_projects', 'update', true),
('Intern', 'monthly_forms', 'create', true),
('Intern', 'monthly_forms', 'read', true),
('Intern', 'monthly_forms', 'update', true);



-- Operations Head Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('Operations Head', 'operations_dashboard', 'read', true),
('Operations Head', 'operations_dashboard', 'write', true),
('Operations Head', 'employees', 'read', true),
('Operations Head', 'employees', 'write', true),
('Operations Head', 'interns', 'read', true),
('Operations Head', 'interns', 'write', true),
('Operations Head', 'interns', 'approve', true),
('Operations Head', 'freelancers', 'read', true),
('Operations Head', 'freelancers', 'write', true),
('Operations Head', 'freelancers', 'approve', true),
('Operations Head', 'monthly_forms', 'read', true),
('Operations Head', 'monthly_forms', 'approve', true),
('Operations Head', 'analytics', 'read', true);

-- Accountant Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('Accountant', 'accounting_dashboard', 'read', true),
('Accountant', 'accounting_dashboard', 'write', true),
('Accountant', 'financial_reports', 'create', true),
('Accountant', 'financial_reports', 'read', true),
('Accountant', 'financial_reports', 'update', true),
('Accountant', 'invoices', 'create', true),
('Accountant', 'invoices', 'read', true),
('Accountant', 'invoices', 'update', true),
('Accountant', 'expenses', 'read', true),
('Accountant', 'expenses', 'write', true),
('Accountant', 'monthly_forms', 'create', true),
('Accountant', 'monthly_forms', 'read', true),
('Accountant', 'monthly_forms', 'update', true);

-- Sales Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('Sales', 'sales_dashboard', 'read', true),
('Sales', 'sales_dashboard', 'write', true),
('Sales', 'leads', 'create', true),
('Sales', 'leads', 'read', true),
('Sales', 'leads', 'update', true),
('Sales', 'clients', 'create', true),
('Sales', 'clients', 'read', true),
('Sales', 'clients', 'update', true),
('Sales', 'sales_reports', 'create', true),
('Sales', 'sales_reports', 'read', true),
('Sales', 'sales_reports', 'update', true),
('Sales', 'monthly_forms', 'create', true),
('Sales', 'monthly_forms', 'read', true),
('Sales', 'monthly_forms', 'update', true);

-- HR Role Permissions
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('HR', 'hr_dashboard', 'read', true),
('HR', 'hr_dashboard', 'write', true),
('HR', 'employees', 'create', true),
('HR', 'employees', 'read', true),
('HR', 'employees', 'update', true),
('HR', 'employees', 'delete', true),
('HR', 'hr_reports', 'create', true),
('HR', 'hr_reports', 'read', true),
('HR', 'hr_reports', 'update', true),
('HR', 'performance_reviews', 'read', true),
('HR', 'performance_reviews', 'write', true),
('HR', 'monthly_forms', 'create', true),
('HR', 'monthly_forms', 'read', true),
('HR', 'monthly_forms', 'update', true),
('HR', 'monthly_forms', 'approve', true);

-- Super Admin Role Permissions (Full Access)
INSERT INTO public.role_permissions (role, resource, action, allowed) VALUES
('Super Admin', 'all_dashboards', 'read', true),
('Super Admin', 'all_dashboards', 'write', true),
('Super Admin', 'all_resources', 'create', true),
('Super Admin', 'all_resources', 'read', true),
('Super Admin', 'all_resources', 'update', true),
('Super Admin', 'all_resources', 'delete', true),
('Super Admin', 'all_resources', 'approve', true),
('Super Admin', 'system_settings', 'read', true),
('Super Admin', 'system_settings', 'write', true),
('Super Admin', 'user_management', 'create', true),
('Super Admin', 'user_management', 'read', true),
('Super Admin', 'user_management', 'update', true),
('Super Admin', 'user_management', 'delete', true),
('Super Admin', 'audit_logs', 'read', true);

-- =============================================
-- TEST USERS
-- =============================================

-- Create test users for each role (password is 'test123' for all)

-- Employee Category Users
INSERT INTO public.unified_users (
    user_id, name, email, phone, password_hash, role, user_category, 
    department, employee_id, hire_date, employment_type, skills, 
    dashboard_access, permissions, status
) VALUES
-- SEO Employee
('USR001', 'John SEO', 'john.seo@agency.com', '+91-9876543210', 'test123', 'SEO', 'employee', 
 'Marketing', 'EMP001', '2024-01-01', 'full_time', ARRAY['SEO', 'Google Analytics', 'Keyword Research'], 
 ARRAY['seo_dashboard'], '{"can_edit_seo_reports": true}', 'active'),

-- Ads Employee
('USR002', 'Sarah Ads', 'sarah.ads@agency.com', '+91-9876543211', 'test123', 'Ads', 'employee', 
 'Marketing', 'EMP002', '2024-01-01', 'full_time', ARRAY['Google Ads', 'Facebook Ads', 'PPC'], 
 ARRAY['ads_dashboard'], '{"can_manage_ad_accounts": true}', 'active'),

-- Social Media Employee
('USR003', 'Mike Social', 'mike.social@agency.com', '+91-9876543212', 'test123', 'Social Media', 'employee', 
 'Marketing', 'EMP003', '2024-01-01', 'full_time', ARRAY['Content Creation', 'Instagram', 'Facebook'], 
 ARRAY['social_dashboard'], '{"can_schedule_posts": true}', 'active'),

-- YouTube SEO Employee
('USR004', 'Lisa YouTube', 'lisa.youtube@agency.com', '+91-9876543213', 'test123', 'YouTube SEO', 'employee', 
 'Marketing', 'EMP004', '2024-01-01', 'full_time', ARRAY['YouTube Analytics', 'Video SEO', 'Content Strategy'], 
 ARRAY['youtube_dashboard'], '{"can_optimize_videos": true}', 'active'),

-- Web Developer
('USR005', 'David Dev', 'david.dev@agency.com', '+91-9876543214', 'test123', 'Web Developer', 'employee', 
 'Technology', 'EMP005', '2024-01-01', 'full_time', ARRAY['React', 'Node.js', 'JavaScript', 'HTML', 'CSS'], 
 ARRAY['dev_dashboard'], '{"can_deploy_code": true}', 'active'),

-- Graphic Designer
('USR006', 'Emma Design', 'emma.design@agency.com', '+91-9876543215', 'test123', 'Graphic Designer', 'employee', 
 'Creative', 'EMP006', '2024-01-01', 'full_time', ARRAY['Photoshop', 'Illustrator', 'Figma', 'Branding'], 
 ARRAY['design_dashboard'], '{"can_create_brand_assets": true}', 'active');

-- Freelancer Category Users
INSERT INTO public.unified_users (
    user_id, name, email, phone, password_hash, role, user_category, 
    hire_date, employment_type, skills, dashboard_access, permissions, status
) VALUES
('USR007', 'Alex Freelancer', 'alex.freelancer@agency.com', '+91-9876543216', 'test123', 'Freelancer', 'freelancer', 
 '2024-01-01', 'freelancer', ARRAY['Video Editing', 'Motion Graphics', 'After Effects'], 
 ARRAY['freelancer_dashboard'], '{"hourly_rate": 500, "category": "video_editor"}', 'active'),

('USR008', 'Maya Freelancer', 'maya.freelancer@agency.com', '+91-9876543217', 'test123', 'Freelancer', 'freelancer', 
 '2024-01-01', 'freelancer', ARRAY['Photography', 'Videography', 'Drone Operation'], 
 ARRAY['freelancer_dashboard'], '{"hourly_rate": 800, "category": "videographer"}', 'active');

-- Intern Category Users
INSERT INTO public.unified_users (
    user_id, name, email, phone, password_hash, role, user_category, 
    department, hire_date, employment_type, skills, dashboard_access, permissions, status
) VALUES
('USR009', 'Priya Intern', 'priya.intern@agency.com', '+91-9876543218', 'test123', 'Intern', 'intern', 
 'Marketing', '2024-01-01', 'intern', ARRAY['Digital Marketing', 'Content Writing', 'Research'], 
 ARRAY['intern_dashboard'], '{"duration_months": 6, "stipend": 15000}', 'active'),

('USR010', 'Rahul Intern', 'rahul.intern@agency.com', '+91-9876543219', 'test123', 'Intern', 'intern', 
 'Technology', '2024-01-01', 'intern', ARRAY['Python', 'Data Analysis', 'Machine Learning'], 
 ARRAY['intern_dashboard'], '{"duration_months": 6, "stipend": 18000}', 'active');

-- Management Category Users
INSERT INTO public.unified_users (
    user_id, name, email, phone, password_hash, role, user_category, 
    department, employee_id, hire_date, employment_type, skills, 
    dashboard_access, permissions, status
) VALUES
('USR012', 'Jennifer Operations', 'jennifer.ops@agency.com', '+91-9876543221', 'test123', 'Operations Head', 'management', 
 'Operations', 'MGR002', '2024-01-01', 'full_time', ARRAY['Operations Management', 'Process Optimization', 'Team Leadership'], 
 ARRAY['operations_dashboard'], '{"manages_marketing": true, "manages_interns": true, "manages_freelancers": true}', 'active');

-- Admin Category Users
INSERT INTO public.unified_users (
    user_id, name, email, phone, password_hash, role, user_category, 
    department, employee_id, hire_date, employment_type, skills, 
    dashboard_access, permissions, status
) VALUES
('USR013', 'Michael Accountant', 'michael.accounts@agency.com', '+91-9876543222', 'test123', 'Accountant', 'admin', 
 'Finance', 'ACC001', '2024-01-01', 'full_time', ARRAY['Financial Analysis', 'QuickBooks', 'Tax Planning'], 
 ARRAY['accounting_dashboard'], '{"can_approve_expenses": true, "access_financial_data": true}', 'active'),

('USR014', 'Amanda Sales', 'amanda.sales@agency.com', '+91-9876543223', 'test123', 'Sales', 'admin', 
 'Sales', 'SAL001', '2024-01-01', 'full_time', ARRAY['Lead Generation', 'CRM Management', 'Client Relations'], 
 ARRAY['sales_dashboard'], '{"can_create_proposals": true, "access_client_data": true}', 'active'),

('USR015', 'Rachel HR', 'rachel.hr@agency.com', '+91-9876543224', 'test123', 'HR', 'admin', 
 'Human Resources', 'HR001', '2024-01-01', 'full_time', ARRAY['Recruitment', 'Employee Relations', 'Policy Development'], 
 ARRAY['hr_dashboard'], '{"can_hire_employees": true, "access_employee_data": true}', 'active');

-- Super Admin User
INSERT INTO public.unified_users (
    user_id, name, email, phone, password_hash, role, user_category, 
    department, employee_id, hire_date, employment_type, skills, 
    dashboard_access, permissions, status
) VALUES
('USR016', 'Admin Super', 'admin@agency.com', '+91-9876543225', 'test123', 'Super Admin', 'super_admin', 
 'Administration', 'ADM001', '2024-01-01', 'full_time', ARRAY['System Administration', 'Full Stack Development', 'Database Management'], 
 ARRAY['all_dashboards'], '{"full_system_access": true, "can_modify_permissions": true, "can_create_users": true}', 'active');

-- =============================================
-- UPDATE USER DASHBOARD ACCESS
-- =============================================

-- Update dashboard access based on role categories
UPDATE public.unified_users SET dashboard_access = ARRAY['seo_dashboard', 'employee_dashboard'] WHERE role = 'SEO';
UPDATE public.unified_users SET dashboard_access = ARRAY['ads_dashboard', 'employee_dashboard'] WHERE role = 'Ads';
UPDATE public.unified_users SET dashboard_access = ARRAY['social_dashboard', 'employee_dashboard'] WHERE role = 'Social Media';
UPDATE public.unified_users SET dashboard_access = ARRAY['youtube_dashboard', 'employee_dashboard'] WHERE role = 'YouTube SEO';
UPDATE public.unified_users SET dashboard_access = ARRAY['dev_dashboard', 'employee_dashboard'] WHERE role = 'Web Developer';
UPDATE public.unified_users SET dashboard_access = ARRAY['design_dashboard', 'employee_dashboard'] WHERE role = 'Graphic Designer';
UPDATE public.unified_users SET dashboard_access = ARRAY['freelancer_dashboard'] WHERE role = 'Freelancer';
UPDATE public.unified_users SET dashboard_access = ARRAY['intern_dashboard'] WHERE role = 'Intern';
UPDATE public.unified_users SET dashboard_access = ARRAY['operations_dashboard', 'management_dashboard'] WHERE role = 'Operations Head';
UPDATE public.unified_users SET dashboard_access = ARRAY['accounting_dashboard', 'admin_dashboard'] WHERE role = 'Accountant';
UPDATE public.unified_users SET dashboard_access = ARRAY['sales_dashboard', 'admin_dashboard'] WHERE role = 'Sales';
UPDATE public.unified_users SET dashboard_access = ARRAY['hr_dashboard', 'admin_dashboard'] WHERE role = 'HR';
UPDATE public.unified_users SET dashboard_access = ARRAY['super_admin_dashboard', 'all_dashboards'] WHERE role = 'Super Admin';

COMMIT;