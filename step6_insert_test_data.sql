-- Step 6: Insert test data
-- Run this after step5_permissions_indexes.sql

-- Temporarily disable RLS for data insertion
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_rows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entity_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_daily DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_tracking DISABLE ROW LEVEL SECURITY;

-- Clear existing test data (optional)
DELETE FROM public.employees WHERE email LIKE '%@testcompany.com';
DELETE FROM public.submissions WHERE employee_phone LIKE '+91-9%';
DELETE FROM public.performance_metrics WHERE employee_phone LIKE '+91-9%';
DELETE FROM public.monthly_rows WHERE employee_phone LIKE '+91-9%';
DELETE FROM public.users WHERE email LIKE '%@testcompany.com';
DELETE FROM public.user_entity_mappings;
DELETE FROM public.entities WHERE name LIKE 'Test%';
DELETE FROM public.attendance_daily WHERE employee_phone LIKE '+91-9%';
DELETE FROM public.login_tracking WHERE email LIKE '%@testcompany.com';

-- Insert test employees
INSERT INTO public.employees (name, phone, email, department, role, employee_type, work_location, status, hire_date, direct_manager, performance_rating, appraisal_date) VALUES
('Rahul Sharma', '+91-9876543210', 'rahul.sharma@testcompany.com', 'Engineering', '{"Senior Developer", "Team Lead"}', 'Full-time', 'Office', 'Active', '2023-01-15', 'Priya Patel', 4.2, '2023-12-15'),
('Priya Patel', '+91-9876543211', 'priya.patel@testcompany.com', 'Engineering', '{"Engineering Manager"}', 'Full-time', 'Office', 'Active', '2022-03-10', 'Amit Kumar', 4.5, '2023-12-15'),
('Amit Kumar', '+91-9876543212', 'amit.kumar@testcompany.com', 'Engineering', '{"VP Engineering"}', 'Full-time', 'Office', 'Active', '2021-06-01', 'CEO', 4.8, '2023-12-15'),
('Sneha Gupta', '+91-9876543213', 'sneha.gupta@testcompany.com', 'Marketing', '{"Marketing Specialist"}', 'Full-time', 'Hybrid', 'Active', '2023-02-20', 'Vikram Singh', 4.0, '2023-12-15'),
('Vikram Singh', '+91-9876543214', 'vikram.singh@testcompany.com', 'Marketing', '{"Marketing Manager"}', 'Full-time', 'Office', 'Active', '2022-08-15', 'Neha Agarwal', 4.3, '2023-12-15'),
('Neha Agarwal', '+91-9876543215', 'neha.agarwal@testcompany.com', 'Sales', '{"Sales Manager"}', 'Full-time', 'Office', 'Active', '2022-05-10', 'Rajesh Verma', 4.4, '2023-12-15'),
('Rajesh Verma', '+91-9876543216', 'rajesh.verma@testcompany.com', 'Sales', '{"VP Sales"}', 'Full-time', 'Office', 'Active', '2021-09-01', 'CEO', 4.6, '2023-12-15'),
('Anita Desai', '+91-9876543217', 'anita.desai@testcompany.com', 'HR', '{"HR Specialist"}', 'Full-time', 'Office', 'Active', '2023-04-01', 'Kiran Joshi', 3.9, '2023-12-15'),
('Kiran Joshi', '+91-9876543218', 'kiran.joshi@testcompany.com', 'HR', '{"HR Manager"}', 'Full-time', 'Office', 'Active', '2022-01-15', 'CEO', 4.1, '2023-12-15'),
('Suresh Reddy', '+91-9876543219', 'suresh.reddy@testcompany.com', 'Operations', '{"Operations Specialist"}', 'Full-time', 'Office', 'Active', '2023-03-15', 'Meera Nair', 4.0, '2023-12-15');

-- Insert test submissions
INSERT INTO public.submissions (employee_name, employee_phone, department, role, month_key, attendance_wfo, attendance_wfh, tasks_completed, clients, kpi_score, learning_score, relationship_score, overall_score, status) VALUES
('Rahul Sharma', '+91-9876543210', 'Engineering', 'Senior Developer', '2024-01', 20, 2, 'Completed user authentication module, Fixed 15 bugs, Code review for 3 PRs', 'Client A, Client B', 4.2, 4.0, 4.3, 4.2, 'submitted'),
('Priya Patel', '+91-9876543211', 'Engineering', 'Engineering Manager', '2024-01', 22, 0, 'Team planning, Sprint reviews, Architecture decisions', 'Client A, Client C', 4.5, 4.2, 4.6, 4.4, 'submitted'),
('Sneha Gupta', '+91-9876543213', 'Marketing', 'Marketing Specialist', '2024-01', 18, 4, 'Campaign creation, Social media management, Analytics reporting', 'Client D, Client E', 4.0, 3.8, 4.1, 4.0, 'submitted'),
('Vikram Singh', '+91-9876543214', 'Marketing', 'Marketing Manager', '2024-01', 21, 1, 'Strategy planning, Team coordination, Client presentations', 'Client D, Client F', 4.3, 4.1, 4.4, 4.3, 'submitted'),
('Neha Agarwal', '+91-9876543215', 'Sales', 'Sales Manager', '2024-01', 20, 2, 'Lead generation, Client meetings, Deal closures', 'Client G, Client H', 4.4, 4.0, 4.5, 4.3, 'submitted');

-- Insert test performance metrics
INSERT INTO public.performance_metrics (employee_name, employee_phone, department, month_key, kpi_score, learning_score, relationship_score, overall_score, attendance_percentage, tasks_completed, client_satisfaction) VALUES
('Rahul Sharma', '+91-9876543210', 'Engineering', '2024-01', 4.2, 4.0, 4.3, 4.2, 95.5, 18, 4.1),
('Priya Patel', '+91-9876543211', 'Engineering', '2024-01', 4.5, 4.2, 4.6, 4.4, 100.0, 15, 4.3),
('Sneha Gupta', '+91-9876543213', 'Marketing', '2024-01', 4.0, 3.8, 4.1, 4.0, 91.7, 12, 3.9),
('Vikram Singh', '+91-9876543214', 'Marketing', '2024-01', 4.3, 4.1, 4.4, 4.3, 95.7, 14, 4.2),
('Neha Agarwal', '+91-9876543215', 'Sales', '2024-01', 4.4, 4.0, 4.5, 4.3, 95.7, 16, 4.4);

-- Insert test users (legacy table)
INSERT INTO public.users (name, email, phone, role, department) VALUES
('Rahul Sharma', 'rahul.sharma@testcompany.com', '+91-9876543210', 'Senior Developer', 'Engineering'),
('Priya Patel', 'priya.patel@testcompany.com', '+91-9876543211', 'Engineering Manager', 'Engineering'),
('Sneha Gupta', 'sneha.gupta@testcompany.com', '+91-9876543213', 'Marketing Specialist', 'Marketing');

-- Insert test entities
INSERT INTO public.entities (name, type, description) VALUES
('Test Department - Engineering', 'department', 'Engineering department for testing'),
('Test Department - Marketing', 'department', 'Marketing department for testing'),
('Test Project Alpha', 'project', 'Sample project for testing dashboard'),
('Test Client Beta', 'client', 'Sample client for testing relationships');

-- Insert test attendance records
INSERT INTO public.attendance_daily (employee_name, employee_phone, date, status, work_type, check_in_time, check_out_time, hours_worked) VALUES
('Rahul Sharma', '+91-9876543210', '2024-01-15', 'present', 'wfo', '09:00:00', '18:00:00', 8.0),
('Rahul Sharma', '+91-9876543210', '2024-01-16', 'present', 'wfh', '09:30:00', '17:30:00', 7.5),
('Priya Patel', '+91-9876543211', '2024-01-15', 'present', 'wfo', '09:15:00', '18:15:00', 8.0),
('Sneha Gupta', '+91-9876543213', '2024-01-15', 'present', 'wfo', '09:00:00', '17:00:00', 7.5),
('Sneha Gupta', '+91-9876543213', '2024-01-16', 'present', 'wfh', '10:00:00', '18:00:00', 7.5);

-- Insert test login tracking
INSERT INTO public.login_tracking (email, phone, login_timestamp, ip_address, user_agent, login_method, success) VALUES
('rahul.sharma@testcompany.com', '+91-9876543210', NOW() - INTERVAL '1 day', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'email', true),
('priya.patel@testcompany.com', '+91-9876543211', NOW() - INTERVAL '2 hours', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'email', true),
('sneha.gupta@testcompany.com', '+91-9876543213', NOW() - INTERVAL '30 minutes', '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)', 'phone', true);

-- Re-enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_tracking ENABLE ROW LEVEL SECURITY;