-- Update Company Structure SQL Script
-- This script updates the database to reflect the actual company structure
-- with proper departments and multi-role support

BEGIN;

-- =============================================
-- 1. CREATE DEPARTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_employee_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert company departments
INSERT INTO departments (name, description) VALUES
('Web', 'Web development and design team'),
('Marketing', 'SEO and digital marketing team'),
('Social Media', 'Social media management and content creation'),
('Performance Ads', 'Paid advertising and performance marketing'),
('AI', 'Artificial intelligence and automation team'),
('Management', 'Management, Accounting, Sales, and HR')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 2. CREATE ROLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  department_id UUID REFERENCES departments(id),
  level TEXT CHECK (level IN ('junior', 'senior', 'lead', 'head', 'manager')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert roles for each department
WITH dept_ids AS (
  SELECT id, name FROM departments
)
INSERT INTO roles (name, department_id, level, description) VALUES
-- Web Department
((SELECT id FROM dept_ids WHERE name = 'Web'), 'Web Team Lead', 'lead', 'Lead of web development team'),
((SELECT id FROM dept_ids WHERE name = 'Web'), 'Web Developer', 'senior', 'Full-stack web developer'),
((SELECT id FROM dept_ids WHERE name = 'Web'), 'Graphic Designer', 'senior', 'UI/UX and graphic designer'),
((SELECT id FROM dept_ids WHERE name = 'Web'), 'Content Writer', 'junior', 'Web content writer'),

-- Marketing Department
((SELECT id FROM dept_ids WHERE name = 'Marketing'), 'SEO Team Lead', 'lead', 'Lead of SEO team'),
((SELECT id FROM dept_ids WHERE name = 'Marketing'), 'SEO Executive', 'senior', 'SEO specialist and executor'),
((SELECT id FROM dept_ids WHERE name = 'Marketing'), 'SEO Content Writer', 'junior', 'SEO-focused content writer'),

-- Social Media Department
((SELECT id FROM dept_ids WHERE name = 'Social Media'), 'Social Media Manager', 'senior', 'Social media strategy and client servicing'),
((SELECT id FROM dept_ids WHERE name = 'Social Media'), 'Youtube SEO', 'senior', 'YouTube optimization specialist'),
((SELECT id FROM dept_ids WHERE name = 'Social Media'), 'Graphics Designer', 'senior', 'Social media graphics designer'),
((SELECT id FROM dept_ids WHERE name = 'Social Media'), 'Video Editor', 'senior', 'Video content editor'),

-- Performance Ads Department
((SELECT id FROM dept_ids WHERE name = 'Performance Ads'), 'Ads Team Lead', 'lead', 'Lead of performance ads team'),
((SELECT id FROM dept_ids WHERE name = 'Performance Ads'), 'Meta Ads Specialist', 'senior', 'Facebook and Instagram ads specialist'),
((SELECT id FROM dept_ids WHERE name = 'Performance Ads'), 'Google Ads Specialist', 'senior', 'Google Ads specialist'),

-- AI Department
((SELECT id FROM dept_ids WHERE name = 'AI'), 'AI Team Lead', 'lead', 'Lead of AI development team'),
((SELECT id FROM dept_ids WHERE name = 'AI'), 'AI Executive', 'senior', 'AI implementation specialist'),

-- Management Department
((SELECT id FROM dept_ids WHERE name = 'Management'), 'Manager', 'manager', 'Department manager'),
((SELECT id FROM dept_ids WHERE name = 'Management'), 'Head', 'head', 'Department head'),
((SELECT id FROM dept_ids WHERE name = 'Management'), 'Accountant', 'senior', 'Financial accounting specialist'),
((SELECT id FROM dept_ids WHERE name = 'Management'), 'Sales Executive', 'senior', 'Sales and business development'),
((SELECT id FROM dept_ids WHERE name = 'Management'), 'HR Specialist', 'senior', 'Human resources specialist')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 3. CREATE EMPLOYMENT TYPES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS employment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO employment_types (name, description) VALUES
('Full Time', 'Full-time permanent employee'),
('Part Time', 'Part-time employee'),
('Remote', 'Remote worker'),
('Intern', 'Internship position'),
('Freelancer', 'Freelance contractor')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 4. CREATE EMPLOYEE_ROLES JUNCTION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS employee_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  department_id UUID NOT NULL REFERENCES departments(id),
  is_primary BOOLEAN DEFAULT FALSE,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, role_id, department_id)
);

-- =============================================
-- 5. UPDATE EMPLOYEES TABLE
-- =============================================
-- Add new columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS primary_department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS employment_type_id UUID REFERENCES employment_types(id),
ADD COLUMN IF NOT EXISTS manager_employee_id UUID REFERENCES employees(id);

-- Update department constraint to include new departments
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_department_check;
ALTER TABLE employees ADD CONSTRAINT employees_department_check 
CHECK (department IN ('Web', 'Marketing', 'Social Media', 'Performance Ads', 'AI', 'Management'));

-- =============================================
-- 6. INSERT MANAGEMENT TEAM DATA
-- =============================================
-- Insert Arush Thapar (Head of SEO, Web)
INSERT INTO employees (
  name, phone, email, department, employee_type, status, hire_date, direct_manager
) VALUES (
  'Arush Thapar', '+91-9999999001', 'arush@company.com', 'Web', 'Full Time', 'Active', '2023-01-01', NULL
) ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  department = EXCLUDED.department;

-- Insert Nishu Sharma (Head Ads, Social Media)
INSERT INTO employees (
  name, phone, email, department, employee_type, status, hire_date, direct_manager
) VALUES (
  'Nishu Sharma', '+91-9999999002', 'nishu@company.com', 'Performance Ads', 'Full Time', 'Active', '2023-01-01', NULL
) ON CONFLICT (phone) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  department = EXCLUDED.department;

-- =============================================
-- 7. ASSIGN MULTIPLE ROLES TO MANAGEMENT
-- =============================================
-- Get employee IDs
DO $$
DECLARE
  arush_id UUID;
  nishu_id UUID;
  web_dept_id UUID;
  marketing_dept_id UUID;
  social_dept_id UUID;
  ads_dept_id UUID;
  seo_lead_role_id UUID;
  web_lead_role_id UUID;
  ads_lead_role_id UUID;
  social_mgr_role_id UUID;
BEGIN
  -- Get employee IDs
  SELECT id INTO arush_id FROM employees WHERE phone = '+91-9999999001';
  SELECT id INTO nishu_id FROM employees WHERE phone = '+91-9999999002';
  
  -- Get department IDs
  SELECT id INTO web_dept_id FROM departments WHERE name = 'Web';
  SELECT id INTO marketing_dept_id FROM departments WHERE name = 'Marketing';
  SELECT id INTO social_dept_id FROM departments WHERE name = 'Social Media';
  SELECT id INTO ads_dept_id FROM departments WHERE name = 'Performance Ads';
  
  -- Get role IDs
  SELECT id INTO seo_lead_role_id FROM roles WHERE name = 'SEO Team Lead';
  SELECT id INTO web_lead_role_id FROM roles WHERE name = 'Web Team Lead';
  SELECT id INTO ads_lead_role_id FROM roles WHERE name = 'Ads Team Lead';
  SELECT id INTO social_mgr_role_id FROM roles WHERE name = 'Social Media Manager';
  
  -- Assign roles to Arush Thapar (Head of SEO, Web)
  INSERT INTO employee_roles (employee_id, role_id, department_id, is_primary) VALUES
  (arush_id, seo_lead_role_id, marketing_dept_id, TRUE),
  (arush_id, web_lead_role_id, web_dept_id, FALSE)
  ON CONFLICT (employee_id, role_id, department_id) DO NOTHING;
  
  -- Assign roles to Nishu Sharma (Head Ads, Social Media)
  INSERT INTO employee_roles (employee_id, role_id, department_id, is_primary) VALUES
  (nishu_id, ads_lead_role_id, ads_dept_id, TRUE),
  (nishu_id, social_mgr_role_id, social_dept_id, FALSE)
  ON CONFLICT (employee_id, role_id, department_id) DO NOTHING;
  
  -- Update department heads
  UPDATE departments SET head_employee_id = arush_id WHERE name IN ('Web', 'Marketing');
  UPDATE departments SET head_employee_id = nishu_id WHERE name IN ('Performance Ads', 'Social Media');
END $$;

-- =============================================
-- 8. CREATE VIEWS FOR EASY QUERYING
-- =============================================
-- View for employees with their roles and departments
CREATE OR REPLACE VIEW employee_roles_view AS
SELECT 
  e.id as employee_id,
  e.name as employee_name,
  e.phone,
  e.email,
  e.department as primary_department,
  e.employee_type,
  e.status,
  e.hire_date,
  e.direct_manager,
  d.name as department_name,
  r.name as role_name,
  r.level as role_level,
  er.is_primary,
  er.start_date as role_start_date,
  er.end_date as role_end_date
FROM employees e
LEFT JOIN employee_roles er ON e.id = er.employee_id
LEFT JOIN roles r ON er.role_id = r.id
LEFT JOIN departments d ON er.department_id = d.id
ORDER BY e.name, er.is_primary DESC, d.name;

-- View for organization chart
CREATE OR REPLACE VIEW organization_chart_view AS
SELECT 
  d.name as department,
  d.description as department_description,
  head_emp.name as department_head,
  e.name as employee_name,
  e.phone,
  e.email,
  e.employee_type,
  e.status,
  e.hire_date,
  STRING_AGG(r.name, ', ' ORDER BY er.is_primary DESC) as roles,
  COUNT(er.role_id) as role_count
FROM departments d
LEFT JOIN employees head_emp ON d.head_employee_id = head_emp.id
LEFT JOIN employee_roles er ON d.id = er.department_id
LEFT JOIN employees e ON er.employee_id = e.id
LEFT JOIN roles r ON er.role_id = r.id
WHERE e.status = 'Active' OR e.status IS NULL
GROUP BY d.name, d.description, head_emp.name, e.name, e.phone, e.email, e.employee_type, e.status, e.hire_date
ORDER BY d.name, e.name;

-- =============================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_employee_roles_employee_id ON employee_roles(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_role_id ON employee_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_department_id ON employee_roles(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_is_primary ON employee_roles(is_primary);
CREATE INDEX IF NOT EXISTS idx_employees_primary_department_id ON employees(primary_department_id);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type_id ON employees(employment_type_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager_employee_id ON employees(manager_employee_id);
CREATE INDEX IF NOT EXISTS idx_roles_department_id ON roles(department_id);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level);

COMMIT;

-- =============================================
-- 10. VERIFICATION QUERIES
-- =============================================
SELECT 'Database schema updated successfully!' as status;

-- Show departments
SELECT 'DEPARTMENTS:' as info;
SELECT name, description, head_employee_id FROM departments ORDER BY name;

-- Show roles count by department
SELECT 'ROLES BY DEPARTMENT:' as info;
SELECT d.name as department, COUNT(r.id) as role_count
FROM departments d
LEFT JOIN roles r ON d.id = r.department_id
GROUP BY d.name
ORDER BY d.name;

-- Show management team with their roles
SELECT 'MANAGEMENT TEAM:' as info;
SELECT * FROM employee_roles_view 
WHERE employee_name IN ('Arush Thapar', 'Nishu Sharma')
ORDER BY employee_name, is_primary DESC;

-- Show organization chart preview
SELECT 'ORGANIZATION CHART PREVIEW:' as info;
SELECT department, employee_name, roles, role_count 
FROM organization_chart_view 
WHERE employee_name IS NOT NULL
ORDER BY department, employee_name;