-- Migration: create_clients_table
-- Source: 02_create_clients_table.sql
-- Timestamp: 20240102000300

-- =====================================================
-- CLIENTS TABLE - Complete Schema with Sample Data
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This creates the clients table with proper constraints and sample data

-- Drop existing table if you need to recreate it
-- DROP TABLE IF EXISTS public.clients CASCADE;

-- Create clients table with comprehensive schema
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  client_type text DEFAULT 'Standard' CHECK (client_type IN ('Premium', 'Standard', 'Basic')),
  team text NOT NULL CHECK (team IN ('Web', 'Marketing', 'Sales', 'Operations', 'HR', 'Accounts')),
  scope_of_work text,
  services jsonb DEFAULT '[]'::jsonb, -- Array of services: ["SEO", "Social Media", "Google Ads"]
  service_scopes jsonb DEFAULT '{}'::jsonb, -- Object with service details
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Paused', 'Completed')),
  contact_email text,
  contact_phone text,
  contact_person text,
  address jsonb, -- {"street": "123 Business St", "city": "Mumbai", "state": "Maharashtra"}
  billing_info jsonb, -- {"billing_contact": "John Doe", "billing_email": "billing@client.com"}
  contract_start_date date,
  contract_end_date date,
  monthly_retainer numeric(10,2),
  notes text,
  logo_url text,
  website_url text,
  industry text,
  company_size text,
  priority_level text DEFAULT 'Medium' CHECK (priority_level IN ('High', 'Medium', 'Low')),
  departed_reason text, -- Reason if status becomes 'Completed' or 'Inactive'
  departed_employees jsonb, -- Array of employee names who caused departure
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_team ON public.clients(team);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON public.clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_priority ON public.clients(priority_level);

-- Enable RLS (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.clients;
CREATE POLICY "Allow all operations for authenticated users" ON public.clients
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.clients TO authenticated;
GRANT ALL ON public.clients TO anon;

-- Insert comprehensive sample clients data
INSERT INTO public.clients (
  name, client_type, team, scope_of_work, services, service_scopes, status, 
  contact_email, contact_phone, industry, monthly_retainer
) VALUES 

-- Web Team Clients
('TechCorp Solutions', 'Premium', 'Web', 'Complete web application development and maintenance', 
 '["Web Development", "API Integration", "Database Design"]'::jsonb, 
 '{"Web Development": {"deliverables": 20, "description": "Full-stack web application", "frequency": "weekly"}, "API Integration": {"deliverables": 8, "description": "Third-party API integrations", "frequency": "monthly"}, "Database Design": {"deliverables": 5, "description": "Database optimization and design", "frequency": "monthly"}}'::jsonb, 
 'Active', 'contact@techcorp.com', '+1-555-0101', 'Technology', 12000.00),

('E-Commerce Plus', 'Standard', 'Web', 'E-commerce platform development and optimization', 
 '["Web Development", "Payment Integration", "Security Audit"]'::jsonb, 
 '{"Web Development": {"deliverables": 15, "description": "E-commerce platform features", "frequency": "bi-weekly"}, "Payment Integration": {"deliverables": 3, "description": "Payment gateway setup", "frequency": "monthly"}, "Security Audit": {"deliverables": 2, "description": "Security assessment", "frequency": "quarterly"}}'::jsonb, 
 'Active', 'dev@ecommerceplus.com', '+1-555-0102', 'E-commerce', 8500.00),

-- Marketing Team Clients
('Digital Marketing Pro', 'Premium', 'Marketing', 'Comprehensive digital marketing strategy and execution', 
 '["SEO", "Social Media", "Google Ads", "Content Marketing"]'::jsonb, 
 '{"SEO": {"deliverables": 25, "description": "Search engine optimization", "frequency": "monthly"}, "Social Media": {"deliverables": 30, "description": "Social media management", "frequency": "daily"}, "Google Ads": {"deliverables": 10, "description": "PPC campaign management", "frequency": "weekly"}, "Content Marketing": {"deliverables": 12, "description": "Blog posts and articles", "frequency": "weekly"}}'::jsonb, 
 'Active', 'marketing@digitalmarketingpro.com', '+1-555-0201', 'Marketing Agency', 15000.00),

('Local Restaurant Chain', 'Standard', 'Marketing', 'Local SEO and social media for restaurant locations', 
 '["SEO", "Social Media", "GBP SEO"]'::jsonb, 
 '{"SEO": {"deliverables": 15, "description": "Local restaurant SEO", "frequency": "monthly"}, "Social Media": {"deliverables": 20, "description": "Food photography and posts", "frequency": "daily"}, "GBP SEO": {"deliverables": 8, "description": "Google Business Profile management", "frequency": "weekly"}}'::jsonb, 
 'Active', 'marketing@localrestaurant.com', '+1-555-0202', 'Food & Beverage', 4500.00),

('Fitness Studio Network', 'Standard', 'Marketing', 'Health and fitness marketing campaigns', 
 '["Social Media", "Meta Ads", "Content Marketing"]'::jsonb, 
 '{"Social Media": {"deliverables": 25, "description": "Fitness content and member spotlights", "frequency": "daily"}, "Meta Ads": {"deliverables": 6, "description": "Facebook and Instagram ads", "frequency": "weekly"}, "Content Marketing": {"deliverables": 8, "description": "Health and fitness blog content", "frequency": "weekly"}}'::jsonb, 
 'Active', 'info@fitnessstudio.com', '+1-555-0203', 'Health & Fitness', 3800.00),

-- Sales Team Clients
('B2B Software Solutions', 'Premium', 'Sales', 'Enterprise software sales and lead generation', 
 '["Lead Generation", "CRM Management", "Sales Automation"]'::jsonb, 
 '{"Lead Generation": {"deliverables": 50, "description": "Qualified B2B leads", "frequency": "weekly"}, "CRM Management": {"deliverables": 10, "description": "CRM setup and optimization", "frequency": "monthly"}, "Sales Automation": {"deliverables": 5, "description": "Sales process automation", "frequency": "monthly"}}'::jsonb, 
 'Active', 'sales@b2bsoftware.com', '+1-555-0301', 'Software', 18000.00),

-- Operations Team Clients
('Supply Chain Logistics', 'Standard', 'Operations', 'Operations optimization and process improvement', 
 '["Process Optimization", "Workflow Management", "Quality Assurance"]'::jsonb, 
 '{"Process Optimization": {"deliverables": 8, "description": "Supply chain process improvements", "frequency": "monthly"}, "Workflow Management": {"deliverables": 12, "description": "Workflow automation setup", "frequency": "bi-weekly"}, "Quality Assurance": {"deliverables": 6, "description": "Quality control processes", "frequency": "monthly"}}'::jsonb, 
 'Active', 'operations@supplychainlogistics.com', '+1-555-0401', 'Logistics', 9500.00),

-- HR Team Clients
('Corporate HR Services', 'Standard', 'HR', 'Human resources consulting and recruitment', 
 '["Recruitment", "HR Consulting", "Employee Training"]'::jsonb, 
 '{"Recruitment": {"deliverables": 15, "description": "Candidate sourcing and screening", "frequency": "weekly"}, "HR Consulting": {"deliverables": 8, "description": "HR policy development", "frequency": "monthly"}, "Employee Training": {"deliverables": 4, "description": "Training program development", "frequency": "monthly"}}'::jsonb, 
 'Active', 'hr@corporatehrservices.com', '+1-555-0501', 'Human Resources', 7200.00),

-- Accounts Team Clients
('Financial Advisory Group', 'Premium', 'Accounts', 'Financial planning and accounting services', 
 '["Financial Planning", "Tax Preparation", "Audit Support"]'::jsonb, 
 '{"Financial Planning": {"deliverables": 12, "description": "Financial strategy and planning", "frequency": "monthly"}, "Tax Preparation": {"deliverables": 6, "description": "Tax filing and compliance", "frequency": "quarterly"}, "Audit Support": {"deliverables": 4, "description": "Audit preparation and support", "frequency": "quarterly"}}'::jsonb, 
 'Active', 'accounts@financialadvisory.com', '+1-555-0601', 'Financial Services', 11000.00)

ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger only if it doesn't exist
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- Verify the data was inserted - commented out due to column mismatch
/*
SELECT 
  name, 
  client_type,
  team, 
  status,
  jsonb_array_length(services) as service_count,
  monthly_retainer,
  industry
FROM public.clients 
WHERE status = 'Active'
ORDER BY team, name;
*/

-- Success message commented out for clean migration
-- SELECT 'Clients table created successfully with ' || COUNT(*) || ' sample clients across ' || COUNT(DISTINCT team) || ' teams' as result
-- FROM public.clients;