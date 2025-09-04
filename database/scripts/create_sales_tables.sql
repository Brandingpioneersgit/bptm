-- Create Sales Tables for Sales Dashboard
-- This script creates the necessary tables for the Sales Department Dashboard

-- Create sales_users table
CREATE TABLE IF NOT EXISTS public.sales_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'Sales Executive',
    department TEXT DEFAULT 'Sales',
    territory TEXT,
    target_monthly DECIMAL(10,2) DEFAULT 0,
    target_quarterly DECIMAL(10,2) DEFAULT 0,
    target_yearly DECIMAL(10,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    hire_date DATE DEFAULT CURRENT_DATE,
    manager_id UUID REFERENCES public.sales_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly_sales_entries table
CREATE TABLE IF NOT EXISTS public.monthly_sales_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sales_user_id UUID REFERENCES public.sales_users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    deals_closed INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    meetings_held INTEGER DEFAULT 0,
    proposals_sent INTEGER DEFAULT 0,
    follow_ups INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sales_user_id, month)
);

-- Create sales_leads table
CREATE TABLE IF NOT EXISTS public.sales_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    industry TEXT,
    company_size TEXT,
    lead_source TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    estimated_value DECIMAL(10,2),
    expected_close_date DATE,
    assigned_to UUID REFERENCES public.sales_users(id),
    notes TEXT,
    last_contact_date DATE,
    next_follow_up DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_activities table
CREATE TABLE IF NOT EXISTS public.sales_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sales_user_id UUID REFERENCES public.sales_users(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'proposal', 'follow_up', 'demo', 'other')),
    subject TEXT NOT NULL,
    description TEXT,
    outcome TEXT,
    duration_minutes INTEGER,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_users_status ON public.sales_users(status);
CREATE INDEX IF NOT EXISTS idx_sales_users_department ON public.sales_users(department);
CREATE INDEX IF NOT EXISTS idx_monthly_sales_entries_month ON public.monthly_sales_entries(month);
CREATE INDEX IF NOT EXISTS idx_monthly_sales_entries_user ON public.monthly_sales_entries(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON public.sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_assigned ON public.sales_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sales_activities_user ON public.sales_activities(sales_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_activities_lead ON public.sales_activities(lead_id);

-- Enable Row Level Security
ALTER TABLE public.sales_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all sales data" ON public.sales_users FOR SELECT USING (true);
CREATE POLICY "Users can insert sales data" ON public.sales_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sales data" ON public.sales_users FOR UPDATE USING (true);

CREATE POLICY "Users can view all sales entries" ON public.monthly_sales_entries FOR SELECT USING (true);
CREATE POLICY "Users can insert sales entries" ON public.monthly_sales_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sales entries" ON public.monthly_sales_entries FOR UPDATE USING (true);

CREATE POLICY "Users can view all leads" ON public.sales_leads FOR SELECT USING (true);
CREATE POLICY "Users can insert leads" ON public.sales_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update leads" ON public.sales_leads FOR UPDATE USING (true);

CREATE POLICY "Users can view all activities" ON public.sales_activities FOR SELECT USING (true);
CREATE POLICY "Users can insert activities" ON public.sales_activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update activities" ON public.sales_activities FOR UPDATE USING (true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_users_updated_at BEFORE UPDATE ON public.sales_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_sales_entries_updated_at BEFORE UPDATE ON public.monthly_sales_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_leads_updated_at BEFORE UPDATE ON public.sales_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_activities_updated_at BEFORE UPDATE ON public.sales_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.sales_users (name, email, phone, role, territory, target_monthly, target_quarterly, status) VALUES
('John Smith', 'john.smith@company.com', '+1-555-0101', 'Senior Sales Executive', 'North America', 50000, 150000, 'active'),
('Sarah Johnson', 'sarah.johnson@company.com', '+1-555-0102', 'Sales Executive', 'Europe', 40000, 120000, 'active'),
('Mike Chen', 'mike.chen@company.com', '+1-555-0103', 'Sales Manager', 'Asia Pacific', 60000, 180000, 'active'),
('Emily Davis', 'emily.davis@company.com', '+1-555-0104', 'Sales Executive', 'North America', 35000, 105000, 'active'),
('David Wilson', 'david.wilson@company.com', '+1-555-0105', 'Senior Sales Executive', 'Europe', 45000, 135000, 'active');

-- Insert sample monthly sales entries
INSERT INTO public.monthly_sales_entries (sales_user_id, month, revenue_generated, deals_closed, leads_generated, calls_made, meetings_held, proposals_sent, conversion_rate) 
SELECT 
    su.id,
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
    RANDOM() * 40000 + 10000,
    FLOOR(RANDOM() * 8 + 2)::INTEGER,
    FLOOR(RANDOM() * 25 + 10)::INTEGER,
    FLOOR(RANDOM() * 80 + 20)::INTEGER,
    FLOOR(RANDOM() * 15 + 5)::INTEGER,
    FLOOR(RANDOM() * 10 + 3)::INTEGER,
    RANDOM() * 20 + 10
FROM public.sales_users su;

-- Insert current month entries
INSERT INTO public.monthly_sales_entries (sales_user_id, month, revenue_generated, deals_closed, leads_generated, calls_made, meetings_held, proposals_sent, conversion_rate) 
SELECT 
    su.id,
    DATE_TRUNC('month', CURRENT_DATE),
    RANDOM() * 35000 + 8000,
    FLOOR(RANDOM() * 6 + 1)::INTEGER,
    FLOOR(RANDOM() * 20 + 8)::INTEGER,
    FLOOR(RANDOM() * 60 + 15)::INTEGER,
    FLOOR(RANDOM() * 12 + 3)::INTEGER,
    FLOOR(RANDOM() * 8 + 2)::INTEGER,
    RANDOM() * 18 + 8
FROM public.sales_users su;

-- Insert sample leads
INSERT INTO public.sales_leads (company_name, contact_person, email, phone, industry, company_size, lead_source, status, priority, estimated_value, expected_close_date, assigned_to) 
SELECT 
    'Company ' || generate_series,
    'Contact Person ' || generate_series,
    'contact' || generate_series || '@company.com',
    '+1-555-' || LPAD(generate_series::TEXT, 4, '0'),
    CASE (generate_series % 5) 
        WHEN 0 THEN 'Technology'
        WHEN 1 THEN 'Healthcare'
        WHEN 2 THEN 'Finance'
        WHEN 3 THEN 'Manufacturing'
        ELSE 'Retail'
    END,
    CASE (generate_series % 4)
        WHEN 0 THEN 'Small (1-50)'
        WHEN 1 THEN 'Medium (51-200)'
        WHEN 2 THEN 'Large (201-1000)'
        ELSE 'Enterprise (1000+)'
    END,
    CASE (generate_series % 4)
        WHEN 0 THEN 'Website'
        WHEN 1 THEN 'Referral'
        WHEN 2 THEN 'Cold Call'
        ELSE 'Social Media'
    END,
    CASE (generate_series % 6)
        WHEN 0 THEN 'new'
        WHEN 1 THEN 'contacted'
        WHEN 2 THEN 'qualified'
        WHEN 3 THEN 'proposal'
        WHEN 4 THEN 'negotiation'
        ELSE 'closed_won'
    END,
    CASE (generate_series % 3)
        WHEN 0 THEN 'low'
        WHEN 1 THEN 'medium'
        ELSE 'high'
    END,
    RANDOM() * 80000 + 20000,
    CURRENT_DATE + INTERVAL '30 days' * RANDOM(),
    (SELECT id FROM public.sales_users ORDER BY RANDOM() LIMIT 1)
FROM generate_series(1, 20);

COMMIT;