-- Sales CRM Module Schema
-- Comprehensive sales management system with lead tracking, proposal management, and performance scoring

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create enum types for Sales CRM
CREATE TYPE sales_role AS ENUM ('admin', 'sales_lead', 'sales_executive', 'reviewer_mentor');
CREATE TYPE lead_stage AS ENUM ('new', 'qualified', 'discovery', 'proposal_sent', 'negotiation', 'won', 'lost', 'on_hold');
CREATE TYPE lead_source AS ENUM ('fb_ads', 'website', 'seo', 'google_ads', 'reference', 'other');
CREATE TYPE lead_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE activity_type AS ENUM ('call', 'email', 'meeting', 'whatsapp', 'demo');
CREATE TYPE activity_outcome AS ENUM ('connected', 'no_answer', 'meeting_booked');
CREATE TYPE proposal_status AS ENUM ('sent', 'revised', 'accepted', 'rejected');
CREATE TYPE client_response AS ENUM ('opened', 'viewed', 'feedback', 'ignored');
CREATE TYPE deal_status AS ENUM ('won', 'lost');
CREATE TYPE reason_lost AS ENUM ('price', 'delay', 'scope', 'competitor', 'no_fit', 'unresponsive', 'other');
CREATE TYPE billing_cycle AS ENUM ('one_time', 'monthly');
CREATE TYPE created_via AS ENUM ('manual', 'import', 'api');
CREATE TYPE service_interest AS ENUM ('seo', 'social', 'web', 'ads', 'video', 'packages');

-- Sales Users table
CREATE TABLE IF NOT EXISTS sales_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role sales_role NOT NULL DEFAULT 'sales_executive',
    department VARCHAR(50) DEFAULT 'Sales',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts table (for multiple contacts per client)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    size VARCHAR(50),
    city VARCHAR(100),
    website VARCHAR(255),
    owner_id UUID REFERENCES sales_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES sales_users(id),
    account_id UUID REFERENCES accounts(id),
    
    -- Identity
    lead_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    city VARCHAR(100),
    
    -- Source & campaign
    source lead_source NOT NULL,
    source_detail TEXT,
    
    -- Sales info
    stage lead_stage NOT NULL DEFAULT 'new',
    score INTEGER CHECK (score >= 0 AND score <= 100),
    priority lead_priority DEFAULT 'medium',
    est_amount DECIMAL(12,2),
    est_close_date DATE,
    probability_pct INTEGER CHECK (probability_pct >= 0 AND probability_pct <= 100),
    service_interest service_interest[],
    
    -- Qualifying
    need_summary TEXT,
    budget_range VARCHAR(100),
    timeline VARCHAR(100),
    decision_maker VARCHAR(255),
    competition TEXT,
    
    -- Operational
    owner_notes TEXT,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    next_followup_at TIMESTAMP WITH TIME ZONE,
    is_stale BOOLEAN DEFAULT FALSE,
    created_via created_via DEFAULT 'manual',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Activities table
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES sales_users(id),
    type activity_type NOT NULL,
    activity_time TIMESTAMP WITH TIME ZONE NOT NULL,
    summary TEXT,
    duration_min INTEGER,
    attachments TEXT[],
    outcome activity_outcome,
    next_action_at TIMESTAMP WITH TIME ZONE,
    next_action_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES sales_users(id),
    proposal_link VARCHAR(500),
    version INTEGER DEFAULT 1,
    sent_at TIMESTAMP WITH TIME ZONE,
    client_response client_response,
    response_at TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(12,2),
    discount_pct DECIMAL(5,2),
    payment_terms TEXT,
    status proposal_status DEFAULT 'sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    closed_by UUID NOT NULL REFERENCES sales_users(id),
    closed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status deal_status NOT NULL,
    amount DECIMAL(12,2),
    service_breakup JSONB,
    billing_cycle billing_cycle,
    reason_lost reason_lost,
    lost_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly Sales Entries table
CREATE TABLE IF NOT EXISTS monthly_sales_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES sales_users(id),
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Counters
    new_leads INTEGER DEFAULT 0,
    qualified INTEGER DEFAULT 0,
    meetings_done INTEGER DEFAULT 0,
    proposals_sent INTEGER DEFAULT 0,
    deals_won INTEGER DEFAULT 0,
    deals_lost INTEGER DEFAULT 0,
    
    -- Values
    pipeline_start DECIMAL(12,2) DEFAULT 0,
    pipeline_end DECIMAL(12,2) DEFAULT 0,
    revenue_won DECIMAL(12,2) DEFAULT 0,
    avg_deal_size DECIMAL(12,2) DEFAULT 0,
    
    -- Rates
    win_rate DECIMAL(5,2) DEFAULT 0,
    lead_to_meeting_pct DECIMAL(5,2) DEFAULT 0,
    meeting_to_proposal_pct DECIMAL(5,2) DEFAULT 0,
    proposal_to_win_pct DECIMAL(5,2) DEFAULT 0,
    
    -- Hygiene
    avg_followup_sla_hours DECIMAL(8,2) DEFAULT 0,
    stale_leads_count INTEGER DEFAULT 0,
    overdue_tasks_count INTEGER DEFAULT 0,
    
    -- Scores
    efficiency_score DECIMAL(5,2) DEFAULT 0,
    conversion_score DECIMAL(5,2) DEFAULT 0,
    hygiene_score DECIMAL(5,2) DEFAULT 0,
    forecast_accuracy_score DECIMAL(5,2) DEFAULT 0,
    relationship_score DECIMAL(5,2) DEFAULT 0,
    month_score DECIMAL(5,2) DEFAULT 0,
    
    -- Review
    mentor_score INTEGER CHECK (mentor_score >= 1 AND mentor_score <= 10),
    nps_internal INTEGER CHECK (nps_internal >= 1 AND nps_internal <= 10),
    review_comment TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, month)
);

-- Sales Appraisal table
CREATE TABLE IF NOT EXISTS sales_appraisal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES sales_users(id),
    month VARCHAR(7) NOT NULL,
    
    -- Revenue & Target Attainment (35 pts)
    revenue_target_score DECIMAL(5,2) DEFAULT 0, -- 0-25 pts
    pipeline_coverage_score DECIMAL(5,2) DEFAULT 0, -- 0-10 pts
    
    -- Conversion Performance (25 pts)
    lead_to_meeting_score DECIMAL(5,2) DEFAULT 0, -- 0-8 pts
    meeting_to_proposal_score DECIMAL(5,2) DEFAULT 0, -- 0-8 pts
    proposal_to_win_score DECIMAL(5,2) DEFAULT 0, -- 0-9 pts
    
    -- Velocity & Discipline (20 pts)
    followup_sla_score DECIMAL(5,2) DEFAULT 0, -- 0-8 pts
    stale_control_score DECIMAL(5,2) DEFAULT 0, -- 0-6 pts
    activities_throughput_score DECIMAL(5,2) DEFAULT 0, -- 0-6 pts
    
    -- Hygiene & Governance (10 pts)
    proposal_discipline_score DECIMAL(5,2) DEFAULT 0, -- 0-4 pts
    data_completeness_score DECIMAL(5,2) DEFAULT 0, -- 0-4 pts
    mentor_score_points DECIMAL(5,2) DEFAULT 0, -- 0-2 pts
    
    -- Relationship (10 pts)
    cs_delivery_nps_score DECIMAL(5,2) DEFAULT 0, -- 0-6 pts
    handoff_quality_score DECIMAL(5,2) DEFAULT 0, -- 0-4 pts
    
    -- Penalties
    forecast_error_penalty DECIMAL(5,2) DEFAULT 0,
    missing_next_action_penalty DECIMAL(5,2) DEFAULT 0,
    won_without_invoice_penalty DECIMAL(5,2) DEFAULT 0,
    
    -- Final scores
    total_score DECIMAL(5,2) DEFAULT 0,
    final_score DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, month)
);

-- Scoring Functions

-- Revenue Target Score (0-25 points)
CREATE OR REPLACE FUNCTION calculate_revenue_target_score(revenue_won DECIMAL, target DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    achievement_pct DECIMAL;
BEGIN
    IF target = 0 THEN RETURN 0; END IF;
    
    achievement_pct := (revenue_won / target) * 100;
    
    RETURN CASE
        WHEN achievement_pct >= 100 THEN 25
        WHEN achievement_pct >= 90 THEN 20
        WHEN achievement_pct >= 75 THEN 15
        WHEN achievement_pct >= 50 THEN 10
        WHEN achievement_pct >= 25 THEN 5
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Pipeline Coverage Score (0-10 points)
CREATE OR REPLACE FUNCTION calculate_pipeline_coverage_score(pipeline_value DECIMAL, next_2_month_target DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    coverage_ratio DECIMAL;
BEGIN
    IF next_2_month_target = 0 THEN RETURN 0; END IF;
    
    coverage_ratio := pipeline_value / next_2_month_target;
    
    RETURN CASE
        WHEN coverage_ratio >= 3.0 THEN 10
        WHEN coverage_ratio >= 2.0 THEN 8
        WHEN coverage_ratio >= 1.5 THEN 6
        WHEN coverage_ratio >= 1.0 THEN 4
        ELSE 2
    END;
END;
$$ LANGUAGE plpgsql;

-- Conversion Score (0-8/9 points each)
CREATE OR REPLACE FUNCTION calculate_conversion_score(conversion_rate DECIMAL, benchmark_green DECIMAL, benchmark_amber DECIMAL, max_points INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    RETURN CASE
        WHEN conversion_rate >= benchmark_green THEN max_points
        WHEN conversion_rate >= benchmark_amber THEN max_points * 0.6
        ELSE max_points * 0.3
    END;
END;
$$ LANGUAGE plpgsql;

-- Follow-up SLA Score (0-8 points)
CREATE OR REPLACE FUNCTION calculate_followup_sla_score(avg_sla_hours DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN CASE
        WHEN avg_sla_hours <= 24 THEN 8
        WHEN avg_sla_hours <= 36 THEN 6
        WHEN avg_sla_hours <= 48 THEN 4
        WHEN avg_sla_hours <= 72 THEN 2
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Stale Control Score (0-6 points)
CREATE OR REPLACE FUNCTION calculate_stale_control_score(stale_percentage DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    RETURN CASE
        WHEN stale_percentage <= 10 THEN 6
        WHEN stale_percentage <= 20 THEN 4
        WHEN stale_percentage <= 35 THEN 2
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Activities Throughput Score (0-6 points)
CREATE OR REPLACE FUNCTION calculate_activities_throughput_score(activities_done INTEGER, monthly_minimum INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    achievement_pct DECIMAL;
BEGIN
    IF monthly_minimum = 0 THEN RETURN 0; END IF;
    
    achievement_pct := (activities_done::DECIMAL / monthly_minimum) * 100;
    
    RETURN CASE
        WHEN achievement_pct >= 100 THEN 6
        WHEN achievement_pct >= 75 THEN 4
        WHEN achievement_pct >= 50 THEN 2
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Proposal Discipline Score (0-4 points)
CREATE OR REPLACE FUNCTION calculate_proposal_discipline_score(proposals_with_link_and_response INTEGER, total_proposals INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    discipline_pct DECIMAL;
BEGIN
    IF total_proposals = 0 THEN RETURN 4; END IF;
    
    discipline_pct := (proposals_with_link_and_response::DECIMAL / total_proposals) * 100;
    
    RETURN CASE
        WHEN discipline_pct >= 90 THEN 4
        WHEN discipline_pct >= 80 THEN 3
        WHEN discipline_pct >= 60 THEN 2
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Main scoring function
CREATE OR REPLACE FUNCTION calculate_sales_month_score(
    employee_id_param UUID,
    month_param VARCHAR(7)
)
RETURNS DECIMAL AS $$
DECLARE
    entry_record monthly_sales_entries%ROWTYPE;
    appraisal_record sales_appraisal%ROWTYPE;
    total_score DECIMAL := 0;
    final_score DECIMAL := 0;
BEGIN
    -- Get monthly entry
    SELECT * INTO entry_record FROM monthly_sales_entries 
    WHERE employee_id = employee_id_param AND month = month_param;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate or get appraisal scores
    SELECT * INTO appraisal_record FROM sales_appraisal 
    WHERE employee_id = employee_id_param AND month = month_param;
    
    IF NOT FOUND THEN
        -- Create new appraisal record with calculated scores
        INSERT INTO sales_appraisal (employee_id, month) 
        VALUES (employee_id_param, month_param);
        
        SELECT * INTO appraisal_record FROM sales_appraisal 
        WHERE employee_id = employee_id_param AND month = month_param;
    END IF;
    
    -- Calculate total score
    total_score := 
        COALESCE(appraisal_record.revenue_target_score, 0) +
        COALESCE(appraisal_record.pipeline_coverage_score, 0) +
        COALESCE(appraisal_record.lead_to_meeting_score, 0) +
        COALESCE(appraisal_record.meeting_to_proposal_score, 0) +
        COALESCE(appraisal_record.proposal_to_win_score, 0) +
        COALESCE(appraisal_record.followup_sla_score, 0) +
        COALESCE(appraisal_record.stale_control_score, 0) +
        COALESCE(appraisal_record.activities_throughput_score, 0) +
        COALESCE(appraisal_record.proposal_discipline_score, 0) +
        COALESCE(appraisal_record.data_completeness_score, 0) +
        COALESCE(appraisal_record.mentor_score_points, 0) +
        COALESCE(appraisal_record.cs_delivery_nps_score, 0) +
        COALESCE(appraisal_record.handoff_quality_score, 0);
    
    -- Apply penalties
    final_score := total_score - 
        COALESCE(appraisal_record.forecast_error_penalty, 0) -
        COALESCE(appraisal_record.missing_next_action_penalty, 0) -
        COALESCE(appraisal_record.won_without_invoice_penalty, 0);
    
    -- Ensure score is between 0 and 100
    final_score := GREATEST(0, LEAST(100, final_score));
    
    -- Update the appraisal record
    UPDATE sales_appraisal 
    SET 
        total_score = total_score,
        final_score = final_score,
        updated_at = NOW()
    WHERE employee_id = employee_id_param AND month = month_param;
    
    -- Update monthly entry
    UPDATE monthly_sales_entries 
    SET 
        month_score = final_score,
        updated_at = NOW()
    WHERE employee_id = employee_id_param AND month = month_param;
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update scores when monthly entries change
CREATE OR REPLACE FUNCTION update_sales_scores_trigger()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_sales_month_score(NEW.employee_id, NEW.month);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sales_monthly_entries_score_update
    AFTER INSERT OR UPDATE ON monthly_sales_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_sales_scores_trigger();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_actor_id ON lead_activities(actor_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_monthly_sales_entries_employee_month ON monthly_sales_entries(employee_id, month);
CREATE INDEX IF NOT EXISTS idx_sales_appraisal_employee_month ON sales_appraisal(employee_id, month);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE sales_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_appraisal ENABLE ROW LEVEL SECURITY;

-- Sales Users policies
CREATE POLICY "Sales users can view all users" ON sales_users
    FOR SELECT USING (true);

CREATE POLICY "Admins and leads can manage users" ON sales_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_users su 
            WHERE su.id = auth.uid() 
            AND su.role IN ('admin', 'sales_lead')
        )
    );

-- Accounts policies
CREATE POLICY "Sales users can view accounts" ON accounts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM sales_users WHERE id = auth.uid())
    );

CREATE POLICY "Account owners and leads can manage accounts" ON accounts
    FOR ALL USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM sales_users su 
            WHERE su.id = auth.uid() 
            AND su.role IN ('admin', 'sales_lead')
        )
    );

-- Leads policies
CREATE POLICY "Sales users can view leads" ON leads
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM sales_users su 
            WHERE su.id = auth.uid() 
            AND su.role IN ('admin', 'sales_lead', 'reviewer_mentor')
        )
    );

CREATE POLICY "Lead owners can manage their leads" ON leads
    FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Leads and admins can manage all leads" ON leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_users su 
            WHERE su.id = auth.uid() 
            AND su.role IN ('admin', 'sales_lead')
        )
    );

-- Lead Activities policies
CREATE POLICY "Users can view activities for accessible leads" ON lead_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM leads l 
            WHERE l.id = lead_id 
            AND (l.owner_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM sales_users su 
                     WHERE su.id = auth.uid() 
                     AND su.role IN ('admin', 'sales_lead', 'reviewer_mentor')
                 ))
        )
    );

CREATE POLICY "Users can create activities for accessible leads" ON lead_activities
    FOR INSERT WITH CHECK (
        actor_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM leads l 
            WHERE l.id = lead_id 
            AND (l.owner_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM sales_users su 
                     WHERE su.id = auth.uid() 
                     AND su.role IN ('admin', 'sales_lead')
                 ))
        )
    );

-- Proposals policies
CREATE POLICY "Users can view proposals for accessible leads" ON proposals
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM leads l 
            WHERE l.id = lead_id 
            AND (l.owner_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM sales_users su 
                     WHERE su.id = auth.uid() 
                     AND su.role IN ('admin', 'sales_lead', 'reviewer_mentor')
                 ))
        )
    );

CREATE POLICY "Proposal owners can manage their proposals" ON proposals
    FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Leads and admins can manage all proposals" ON proposals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_users su 
            WHERE su.id = auth.uid() 
            AND su.role IN ('admin', 'sales_lead')
        )
    );

-- Deals policies
CREATE POLICY "Users can view deals for accessible leads" ON deals
    FOR SELECT USING (
        closed_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM leads l 
            WHERE l.id = lead_id 
            AND (l.owner_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM sales_users su 
                     WHERE su.id = auth.uid() 
                     AND su.role IN ('admin', 'sales_lead', 'reviewer_mentor')
                 ))
        )
    );

CREATE POLICY "Deal closers can manage their deals" ON deals
    FOR ALL USING (closed_by = auth.uid());

CREATE POLICY "Leads and admins can manage all deals" ON deals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_users su 
            WHERE su.id = auth.uid() 
            AND su.role IN ('admin', 'sales_lead')
        )
    );

-- Monthly Sales Entries policies
CREATE POLICY "Users can view their own entries" ON monthly_sales_entries
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Leads and admins can view all entries" ON monthly_sales_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_users su 
            WHERE su.id = auth.uid() 
            AND su.role IN ('admin', 'sales_lead', 'reviewer_mentor')
        )
    );

CREATE POLICY "Users can manage their own entries" ON monthly_sales_entries
    FOR ALL USING (employee_id = auth.uid());

CREATE POLICY "Leads and admins can manage all entries" ON monthly_sales_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_users su 
            WHERE su.id = auth.uid() 
            AND su.role IN ('admin', 'sales_lead')
        )
    );

-- Sales Appraisal policies
CREATE POLICY "Users can view their own appraisals" ON sales_appraisal
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Leads and admins can view all appraisals" ON sales_appraisal
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_users su 
            WHERE su.id = auth.uid() 
            AND su.role IN ('admin', 'sales_lead', 'reviewer_mentor')
        )
    );

CREATE POLICY "Leads and admins can manage appraisals" ON sales_appraisal
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_users su 
            WHERE su.id = auth.uid() 
            AND su.role IN ('admin', 'sales_lead')
        )
    );

-- Create dashboard view for sales performance
CREATE OR REPLACE VIEW sales_employee_dashboard AS
SELECT 
    su.id,
    su.name,
    su.email,
    su.role,
    mse.month,
    mse.new_leads,
    mse.qualified,
    mse.meetings_done,
    mse.proposals_sent,
    mse.deals_won,
    mse.deals_lost,
    mse.revenue_won,
    mse.avg_deal_size,
    mse.win_rate,
    mse.lead_to_meeting_pct,
    mse.meeting_to_proposal_pct,
    mse.proposal_to_win_pct,
    mse.avg_followup_sla_hours,
    mse.stale_leads_count,
    mse.month_score,
    sa.total_score,
    sa.final_score,
    sa.revenue_target_score,
    sa.pipeline_coverage_score,
    sa.lead_to_meeting_score,
    sa.meeting_to_proposal_score,
    sa.proposal_to_win_score,
    sa.followup_sla_score,
    sa.stale_control_score,
    sa.activities_throughput_score,
    sa.proposal_discipline_score,
    sa.data_completeness_score,
    sa.mentor_score_points,
    sa.cs_delivery_nps_score,
    sa.handoff_quality_score
FROM sales_users su
LEFT JOIN monthly_sales_entries mse ON su.id = mse.employee_id
LEFT JOIN sales_appraisal sa ON su.id = sa.employee_id AND mse.month = sa.month
WHERE su.status = 'active';

-- Grant permissions
GRANT SELECT ON sales_employee_dashboard TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Insert sample data for testing
INSERT INTO sales_users (name, email, role) VALUES
('John Smith', 'john.smith@company.com', 'sales_executive'),
('Sarah Johnson', 'sarah.johnson@company.com', 'sales_lead'),
('Mike Wilson', 'mike.wilson@company.com', 'sales_executive'),
('Admin User', 'admin@company.com', 'admin');

-- Sample monthly entry
INSERT INTO monthly_sales_entries (employee_id, month, new_leads, qualified, meetings_done, proposals_sent, deals_won, revenue_won)
SELECT id, '2024-01', 15, 8, 12, 5, 2, 150000
FROM sales_users WHERE email = 'john.smith@company.com';

COMMIT;