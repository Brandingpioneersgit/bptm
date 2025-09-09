-- SQL Script to Create Missing Backend Tables
-- This resolves 404 errors for missing API endpoints
-- Run this in Supabase SQL Editor

-- 1. CLIENT_PROJECTS TABLE
-- Used for client project management and tracking
CREATE TABLE IF NOT EXISTS public.client_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID, -- REFERENCES clients(id) ON DELETE CASCADE, -- Commented out until clients table exists
    project_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    estimated_completion DATE,
    actual_completion DATE,
    budget DECIMAL(12,2),
    team_members TEXT[],
    departments TEXT[],
    description TEXT,
    requirements JSONB,
    deliverables JSONB,
    progress_percentage INTEGER DEFAULT 0,
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ANNOUNCEMENTS TABLE
-- Used for company-wide announcements and news
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES unified_users(id),
    author_name VARCHAR(255),
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    category VARCHAR(100), -- news, policy, event, system
    target_roles TEXT[], -- which roles can see this
    target_departments TEXT[], -- which departments can see this
    active BOOLEAN DEFAULT true,
    publish_date TIMESTAMPTZ DEFAULT NOW(),
    expire_date TIMESTAMPTZ,
    read_count INTEGER DEFAULT 0,
    attachments JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EVENTS TABLE
-- Used for calendar events, meetings, and scheduling
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100), -- meeting, deadline, holiday, training
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    virtual_link VARCHAR(500),
    organizer_id UUID REFERENCES unified_users(id),
    organizer_name VARCHAR(255),
    attendees JSONB, -- array of user IDs and names
    departments TEXT[], -- which departments this applies to
    all_company BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, cancelled, completed
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SYSTEM_UPDATES TABLE
-- Used for system updates, maintenance notices, and technical announcements
CREATE TABLE IF NOT EXISTS public.system_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    update_type VARCHAR(100), -- feature, bugfix, maintenance, security
    version VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
    active BOOLEAN DEFAULT true,
    affects_users BOOLEAN DEFAULT true,
    downtime_expected BOOLEAN DEFAULT false,
    scheduled_date TIMESTAMPTZ,
    completion_date TIMESTAMPTZ,
    rollback_plan TEXT,
    created_by UUID REFERENCES unified_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CLIENT_PAYMENTS TABLE
-- Used for tracking client payments and billing
CREATE TABLE IF NOT EXISTS public.client_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID, -- REFERENCES clients(id) ON DELETE CASCADE, -- Commented out until clients table exists
    project_id UUID REFERENCES client_projects(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(100), -- bank_transfer, upi, card, cash, cheque
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    due_date DATE,
    paid_date DATE,
    payment_reference VARCHAR(255),
    payment_proof_url VARCHAR(500),
    description TEXT,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    late_fee DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES unified_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WEB_PROJECTS TABLE
-- Used for web development project tracking
CREATE TABLE IF NOT EXISTS public.web_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    client_id UUID, -- REFERENCES clients(id) ON DELETE SET NULL, -- Commented out until clients table exists
    project_type VARCHAR(100), -- website, webapp, ecommerce, landing_page
    technology_stack TEXT[], -- react, node, php, wordpress, etc
    status VARCHAR(50) DEFAULT 'planning', -- planning, development, testing, deployed, maintenance
    priority VARCHAR(20) DEFAULT 'medium',
    start_date DATE,
    estimated_completion DATE,
    actual_completion DATE,
    team_size INTEGER DEFAULT 1,
    departments TEXT[] DEFAULT ARRAY['Web'],
    assigned_developers UUID[],
    project_manager_id UUID REFERENCES unified_users(id),
    budget DECIMAL(12,2),
    hours_estimated INTEGER,
    hours_actual INTEGER,
    progress_percentage INTEGER DEFAULT 0,
    repository_url VARCHAR(500),
    staging_url VARCHAR(500),
    production_url VARCHAR(500),
    requirements JSONB,
    features JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RECURRING_CLIENTS TABLE
-- Used for managing recurring client relationships and contracts
CREATE TABLE IF NOT EXISTS public.recurring_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID, -- REFERENCES clients(id) ON DELETE CASCADE, -- Commented out until clients table exists
    service_type VARCHAR(100) NOT NULL, -- SEO, Ads, Social Media, Web Development, etc
    contract_type VARCHAR(50) DEFAULT 'monthly', -- monthly, quarterly, yearly
    status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled, expired
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_fee DECIMAL(12,2),
    total_contract_value DECIMAL(12,2),
    payment_frequency VARCHAR(50) DEFAULT 'monthly', -- monthly, quarterly, yearly
    next_payment_date DATE,
    last_payment_date DATE,
    assigned_team_members UUID[],
    primary_contact_id UUID REFERENCES unified_users(id),
    service_details JSONB,
    performance_metrics JSONB,
    renewal_date DATE,
    auto_renewal BOOLEAN DEFAULT false,
    contract_notes TEXT,
    created_by UUID REFERENCES unified_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_projects_client_id ON client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_status ON client_projects(status);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON announcements(publish_date);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_system_updates_active ON system_updates(active);
CREATE INDEX IF NOT EXISTS idx_client_payments_client_id ON client_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_client_payments_status ON client_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_web_projects_status ON web_projects(status);
CREATE INDEX IF NOT EXISTS idx_web_projects_client_id ON web_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_clients_client_id ON recurring_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_clients_status ON recurring_clients(status);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_clients ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for authenticated users - adjust as needed)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON client_projects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON announcements;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON events;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON system_updates;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON client_payments;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON web_projects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON recurring_clients;

-- Create new policies
CREATE POLICY "Allow all operations for authenticated users" ON client_projects FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON announcements FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON system_updates FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON client_payments FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON web_projects FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON recurring_clients FOR ALL USING (true);

-- Insert some sample data to test the tables

-- Sample announcements
INSERT INTO announcements (title, content, author_name, category, active) VALUES
('Welcome to the New Dashboard', 'We have updated our dashboard with new features and improved performance.', 'System Admin', 'system', true),
('Monthly Team Meeting', 'Don''t forget about our monthly team meeting scheduled for next Friday.', 'HR Team', 'event', true);

-- Sample events
INSERT INTO events (title, description, event_type, date, start_time, organizer_name, all_company) VALUES
('Team Standup', 'Daily team standup meeting', 'meeting', CURRENT_DATE + INTERVAL '1 day', '09:00:00', 'Project Manager', false),
('Company Holiday', 'National Holiday - Office Closed', 'holiday', CURRENT_DATE + INTERVAL '7 days', NULL, 'HR Team', true);

-- Sample system updates
INSERT INTO system_updates (title, content, update_type, active) VALUES
('Dashboard Performance Improvements', 'We have optimized the dashboard loading times and fixed several bugs.', 'feature', true),
('Security Update Applied', 'Latest security patches have been applied to all systems.', 'security', true);

COMMIT;

-- Success message
SELECT 'All missing backend tables created successfully! 🎉' as status;