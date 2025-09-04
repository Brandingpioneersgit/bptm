-- Client Servicing Module Schema
-- Comprehensive schema for Client Servicing team with role-aware access and 100-point scoring system

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create cs_users table (extends base users for Client Servicing)
CREATE TABLE IF NOT EXISTS cs_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'lead', 'employee', 'reviewer')),
    department VARCHAR(100) DEFAULT 'Client Servicing',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table (if not exists from other modules)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Standard', 'Premium')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'churned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cs_accounts table (client assignments)
CREATE TABLE IF NOT EXISTS cs_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES cs_users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    scope TEXT, -- Summary of scope of work
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, client_id)
);

-- Create cs_monthly_entries table
CREATE TABLE IF NOT EXISTS cs_monthly_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES cs_users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Meetings & Cadence
    meetings_count INTEGER DEFAULT 0,
    syncs_count INTEGER DEFAULT 0,
    agenda_shared BOOLEAN DEFAULT false,
    mom_shared_on_time BOOLEAN DEFAULT false,
    
    -- SLA Management
    requests_received INTEGER DEFAULT 0,
    requests_closed INTEGER DEFAULT 0,
    avg_tat_hours DECIMAL(5,2) DEFAULT 0,
    breaches_count INTEGER DEFAULT 0,
    
    -- Escalations & Risk
    escalations_count INTEGER DEFAULT 0,
    escalations_resolved INTEGER DEFAULT 0,
    churn_risk_flag BOOLEAN DEFAULT false,
    risk_notes TEXT,
    
    -- Planning
    activities_next_month TEXT,
    campaign_calendar_shared BOOLEAN DEFAULT false,
    
    -- Commercials
    upsell_discussions INTEGER DEFAULT 0,
    upsells_closed INTEGER DEFAULT 0,
    renewal_stage VARCHAR(20) DEFAULT 'none' CHECK (renewal_stage IN ('none', 'discovery', 'proposal', 'negotiation', 'closed')),
    renewal_closed BOOLEAN DEFAULT false,
    
    -- Relationship
    nps_client INTEGER CHECK (nps_client >= 1 AND nps_client <= 10),
    mentor_score INTEGER CHECK (mentor_score >= 1 AND mentor_score <= 10),
    
    -- Evidence
    moms_links TEXT[], -- Array of MOM document links
    deck_links TEXT[], -- Array of presentation/deck links
    
    -- Read-through KPIs (optional, can be auto-pulled)
    posts_prev INTEGER DEFAULT 0,
    posts_curr INTEGER DEFAULT 0,
    reach_prev BIGINT DEFAULT 0,
    reach_curr BIGINT DEFAULT 0,
    followers_prev INTEGER DEFAULT 0,
    followers_curr INTEGER DEFAULT 0,
    video_views_prev BIGINT DEFAULT 0,
    video_views_curr BIGINT DEFAULT 0,
    watch_time_prev INTEGER DEFAULT 0, -- in minutes
    watch_time_curr INTEGER DEFAULT 0,
    likes_prev INTEGER DEFAULT 0,
    likes_curr INTEGER DEFAULT 0,
    comments_prev INTEGER DEFAULT 0,
    comments_curr INTEGER DEFAULT 0,
    shares_prev INTEGER DEFAULT 0,
    shares_curr INTEGER DEFAULT 0,
    video_ctr_prev DECIMAL(5,2) DEFAULT 0,
    video_ctr_curr DECIMAL(5,2) DEFAULT 0,
    
    -- Output counts
    reels_posted INTEGER DEFAULT 0,
    stories_posted INTEGER DEFAULT 0,
    videos_posted INTEGER DEFAULT 0,
    creator_collabs INTEGER DEFAULT 0,
    
    -- System calculated fields
    sla_closure_rate DECIMAL(5,2) DEFAULT 0,
    breach_rate DECIMAL(5,2) DEFAULT 0,
    account_health_score DECIMAL(5,2) DEFAULT 0,
    servicing_hygiene_score DECIMAL(5,2) DEFAULT 0,
    relationship_score DECIMAL(5,2) DEFAULT 0,
    risk_mitigation_score DECIMAL(5,2) DEFAULT 0,
    commercials_score DECIMAL(5,2) DEFAULT 0,
    month_score DECIMAL(5,2) DEFAULT 0,
    
    -- Review workflow
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    review_comment TEXT,
    reviewed_by UUID REFERENCES cs_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(employee_id, client_id, month)
);

-- Create cs_appraisal table
CREATE TABLE IF NOT EXISTS cs_appraisal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES cs_users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    avg_month_score DECIMAL(5,2) DEFAULT 0,
    final_rating_band VARCHAR(1) CHECK (final_rating_band IN ('A', 'B', 'C', 'D')),
    eligible_increment_pct DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate SLA metrics
CREATE OR REPLACE FUNCTION calculate_cs_sla_metrics(entry_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE cs_monthly_entries 
    SET 
        sla_closure_rate = CASE 
            WHEN requests_received > 0 THEN (requests_closed::DECIMAL / requests_received) * 100
            ELSE 0
        END,
        breach_rate = CASE 
            WHEN requests_received > 0 THEN (breaches_count::DECIMAL / requests_received) * 100
            ELSE 0
        END
    WHERE id = entry_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate account health score (10 points)
CREATE OR REPLACE FUNCTION calculate_cs_account_health_score(entry_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    entry_record cs_monthly_entries%ROWTYPE;
    reach_growth DECIMAL;
    engagement_growth DECIMAL;
    followers_growth DECIMAL;
    posting_consistency BOOLEAN;
    positive_metrics INTEGER := 0;
    health_score DECIMAL := 0;
BEGIN
    SELECT * INTO entry_record FROM cs_monthly_entries WHERE id = entry_id;
    
    -- Calculate growth percentages
    reach_growth := CASE 
        WHEN entry_record.reach_prev > 0 THEN 
            ((entry_record.reach_curr - entry_record.reach_prev)::DECIMAL / entry_record.reach_prev) * 100
        ELSE 0
    END;
    
    engagement_growth := CASE 
        WHEN (entry_record.likes_prev + entry_record.comments_prev + entry_record.shares_prev) > 0 THEN 
            (((entry_record.likes_curr + entry_record.comments_curr + entry_record.shares_curr) - 
              (entry_record.likes_prev + entry_record.comments_prev + entry_record.shares_prev))::DECIMAL / 
             (entry_record.likes_prev + entry_record.comments_prev + entry_record.shares_prev)) * 100
        ELSE 0
    END;
    
    followers_growth := CASE 
        WHEN entry_record.followers_prev > 0 THEN 
            ((entry_record.followers_curr - entry_record.followers_prev)::DECIMAL / entry_record.followers_prev) * 100
        ELSE 0
    END;
    
    posting_consistency := entry_record.posts_curr >= entry_record.posts_prev AND entry_record.posts_curr > 0;
    
    -- Count positive metrics
    IF reach_growth >= 0 THEN positive_metrics := positive_metrics + 1; END IF;
    IF engagement_growth >= 0 THEN positive_metrics := positive_metrics + 1; END IF;
    IF followers_growth >= 0 THEN positive_metrics := positive_metrics + 1; END IF;
    IF posting_consistency THEN positive_metrics := positive_metrics + 1; END IF;
    
    -- Calculate health score
    health_score := CASE 
        WHEN positive_metrics >= 3 THEN 10
        WHEN positive_metrics = 2 THEN 7
        WHEN positive_metrics = 1 THEN 4
        ELSE 1
    END;
    
    -- Guard against no posting
    IF entry_record.posts_curr = 0 THEN
        health_score := LEAST(health_score, 2);
    END IF;
    
    RETURN health_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate servicing hygiene score (25 points)
CREATE OR REPLACE FUNCTION calculate_cs_servicing_hygiene_score(entry_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    entry_record cs_monthly_entries%ROWTYPE;
    client_record clients%ROWTYPE;
    meetings_score DECIMAL := 0;
    discipline_score DECIMAL := 0;
    planning_score DECIMAL := 0;
    total_score DECIMAL := 0;
BEGIN
    SELECT e.*, c.type INTO entry_record, client_record 
    FROM cs_monthly_entries e 
    JOIN clients c ON e.client_id = c.id 
    WHERE e.id = entry_id;
    
    -- Meetings cadence (0-10 points)
    IF client_record.type = 'Premium' THEN
        meetings_score := CASE 
            WHEN entry_record.meetings_count >= 4 THEN 10
            WHEN entry_record.meetings_count = 3 THEN 8
            WHEN entry_record.meetings_count = 2 THEN 6
            WHEN entry_record.meetings_count = 1 THEN 3
            ELSE 0
        END;
    ELSE -- Standard
        meetings_score := CASE 
            WHEN entry_record.meetings_count >= 2 THEN 10
            WHEN entry_record.meetings_count = 1 THEN 6
            ELSE 0
        END;
    END IF;
    
    -- Agenda & MOM discipline (0-10 points)
    -- Assuming 80% compliance if both agenda_shared and mom_shared_on_time are true
    IF entry_record.agenda_shared AND entry_record.mom_shared_on_time THEN
        discipline_score := 10;
    ELSIF entry_record.agenda_shared OR entry_record.mom_shared_on_time THEN
        discipline_score := 7;
    ELSE
        discipline_score := 0;
    END IF;
    
    -- Planning hygiene (0-5 points)
    planning_score := 0;
    IF entry_record.campaign_calendar_shared THEN planning_score := planning_score + 2.5; END IF;
    IF entry_record.activities_next_month IS NOT NULL AND LENGTH(entry_record.activities_next_month) > 10 THEN 
        planning_score := planning_score + 2.5; 
    END IF;
    
    total_score := meetings_score + discipline_score + planning_score;
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate SLA & Issue Management score (25 points)
CREATE OR REPLACE FUNCTION calculate_cs_sla_score(entry_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    entry_record cs_monthly_entries%ROWTYPE;
    closure_score DECIMAL := 0;
    tat_score DECIMAL := 0;
    breach_score DECIMAL := 0;
    total_score DECIMAL := 0;
BEGIN
    SELECT * INTO entry_record FROM cs_monthly_entries WHERE id = entry_id;
    
    -- Closure rate (0-12 points)
    closure_score := CASE 
        WHEN entry_record.sla_closure_rate >= 95 THEN 12
        WHEN entry_record.sla_closure_rate >= 90 THEN 10
        WHEN entry_record.sla_closure_rate >= 85 THEN 8
        WHEN entry_record.sla_closure_rate >= 75 THEN 5
        ELSE 2
    END;
    
    -- Average TAT (0-8 points)
    tat_score := CASE 
        WHEN entry_record.avg_tat_hours <= 24 THEN 8
        WHEN entry_record.avg_tat_hours <= 36 THEN 6
        WHEN entry_record.avg_tat_hours <= 48 THEN 4
        WHEN entry_record.avg_tat_hours <= 72 THEN 2
        ELSE 0
    END;
    
    -- Breach rate (0-5 points)
    breach_score := CASE 
        WHEN entry_record.breach_rate = 0 THEN 5
        WHEN entry_record.breach_rate <= 5 THEN 3
        WHEN entry_record.breach_rate <= 10 THEN 1
        ELSE 0
    END;
    
    total_score := closure_score + tat_score + breach_score;
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate relationship & risk score (20 points)
CREATE OR REPLACE FUNCTION calculate_cs_relationship_score(entry_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    entry_record cs_monthly_entries%ROWTYPE;
    nps_score DECIMAL := 0;
    escalation_score DECIMAL := 0;
    risk_penalty DECIMAL := 0;
    total_score DECIMAL := 0;
BEGIN
    SELECT * INTO entry_record FROM cs_monthly_entries WHERE id = entry_id;
    
    -- NPS score (0-12 points)
    IF entry_record.nps_client IS NOT NULL THEN
        nps_score := (entry_record.nps_client::DECIMAL / 10) * 12;
    END IF;
    
    -- Escalation handling (0-6 points)
    IF entry_record.escalations_count = 0 THEN
        escalation_score := 6;
    ELSIF entry_record.escalations_count > 0 AND entry_record.escalations_resolved > 0 THEN
        IF (entry_record.escalations_resolved::DECIMAL / entry_record.escalations_count) >= 0.8 THEN
            escalation_score := 4;
        ELSIF (entry_record.escalations_resolved::DECIMAL / entry_record.escalations_count) >= 0.5 THEN
            escalation_score := 2;
        ELSE
            escalation_score := 0;
        END IF;
    END IF;
    
    -- Churn risk penalty (up to -2 points)
    IF entry_record.churn_risk_flag AND (entry_record.activities_next_month IS NULL OR LENGTH(entry_record.activities_next_month) < 10) THEN
        risk_penalty := -2;
    END IF;
    
    total_score := nps_score + escalation_score + risk_penalty;
    RETURN GREATEST(total_score, 0); -- Ensure non-negative
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commercials score (15 points)
CREATE OR REPLACE FUNCTION calculate_cs_commercials_score(entry_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    entry_record cs_monthly_entries%ROWTYPE;
    renewal_score DECIMAL := 0;
    upsell_score DECIMAL := 0;
    total_score DECIMAL := 0;
BEGIN
    SELECT * INTO entry_record FROM cs_monthly_entries WHERE id = entry_id;
    
    -- Renewal progression (0-8 points)
    renewal_score := CASE entry_record.renewal_stage
        WHEN 'closed' THEN 8
        WHEN 'negotiation' THEN 6
        WHEN 'proposal' THEN 4
        WHEN 'discovery' THEN 2
        ELSE 0
    END;
    
    -- Upsells (0-7 points)
    IF entry_record.upsells_closed >= 1 THEN
        upsell_score := 7;
    ELSIF entry_record.upsell_discussions > 0 THEN
        upsell_score := 3;
    ELSE
        upsell_score := 0;
    END IF;
    
    total_score := renewal_score + upsell_score;
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate mentor quality score (5 points)
CREATE OR REPLACE FUNCTION calculate_cs_mentor_score(entry_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    entry_record cs_monthly_entries%ROWTYPE;
BEGIN
    SELECT * INTO entry_record FROM cs_monthly_entries WHERE id = entry_id;
    
    IF entry_record.mentor_score IS NOT NULL THEN
        RETURN (entry_record.mentor_score::DECIMAL / 10) * 5;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total month score with guardrails
CREATE OR REPLACE FUNCTION calculate_cs_month_score(entry_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    entry_record cs_monthly_entries%ROWTYPE;
    hygiene_score DECIMAL;
    sla_score DECIMAL;
    relationship_score DECIMAL;
    commercials_score DECIMAL;
    health_score DECIMAL;
    mentor_score DECIMAL;
    total_score DECIMAL;
    penalties DECIMAL := 0;
BEGIN
    SELECT * INTO entry_record FROM cs_monthly_entries WHERE id = entry_id;
    
    -- Calculate individual scores
    hygiene_score := calculate_cs_servicing_hygiene_score(entry_id);
    sla_score := calculate_cs_sla_score(entry_id);
    relationship_score := calculate_cs_relationship_score(entry_id);
    commercials_score := calculate_cs_commercials_score(entry_id);
    health_score := calculate_cs_account_health_score(entry_id);
    mentor_score := calculate_cs_mentor_score(entry_id);
    
    -- Apply guardrails/penalties
    -- Two consecutive months with breach_rate >10% (simplified check)
    IF entry_record.breach_rate > 10 THEN
        penalties := penalties + 5;
    END IF;
    
    -- Missing MOMs for all meetings
    IF entry_record.meetings_count > 0 AND NOT entry_record.mom_shared_on_time THEN
        penalties := penalties + 5;
    END IF;
    
    -- No next-month plan on at-risk account
    IF entry_record.churn_risk_flag AND (entry_record.activities_next_month IS NULL OR LENGTH(entry_record.activities_next_month) < 10) THEN
        penalties := penalties + 3;
    END IF;
    
    total_score := hygiene_score + sla_score + relationship_score + commercials_score + health_score + mentor_score - penalties;
    
    -- Ensure score is between 0 and 100
    total_score := GREATEST(0, LEAST(100, total_score));
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update all scores for an entry
CREATE OR REPLACE FUNCTION update_cs_entry_scores(entry_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Calculate SLA metrics first
    PERFORM calculate_cs_sla_metrics(entry_id);
    
    -- Update all scores
    UPDATE cs_monthly_entries 
    SET 
        account_health_score = calculate_cs_account_health_score(entry_id),
        servicing_hygiene_score = calculate_cs_servicing_hygiene_score(entry_id),
        relationship_score = calculate_cs_relationship_score(entry_id),
        commercials_score = calculate_cs_commercials_score(entry_id),
        month_score = calculate_cs_month_score(entry_id),
        updated_at = NOW()
    WHERE id = entry_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update scores when entry data changes
CREATE OR REPLACE FUNCTION trigger_update_cs_scores()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_cs_entry_scores(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cs_monthly_entries_score_update
    AFTER INSERT OR UPDATE ON cs_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_cs_scores();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cs_users_updated_at
    BEFORE UPDATE ON cs_users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_updated_at();

CREATE TRIGGER clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_updated_at();

CREATE TRIGGER cs_accounts_updated_at
    BEFORE UPDATE ON cs_accounts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_updated_at();

CREATE TRIGGER cs_appraisal_updated_at
    BEFORE UPDATE ON cs_appraisal
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_updated_at();

-- Enable Row Level Security
ALTER TABLE cs_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_appraisal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cs_users
CREATE POLICY "cs_users_select_policy" ON cs_users
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'lead') OR 
        id = (auth.jwt() ->> 'user_id')::UUID
    );

CREATE POLICY "cs_users_insert_policy" ON cs_users
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'lead'));

CREATE POLICY "cs_users_update_policy" ON cs_users
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'lead') OR 
        id = (auth.jwt() ->> 'user_id')::UUID
    );

-- RLS Policies for clients
CREATE POLICY "clients_select_policy" ON clients
    FOR SELECT USING (true); -- All CS users can view clients

CREATE POLICY "clients_insert_policy" ON clients
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'lead'));

CREATE POLICY "clients_update_policy" ON clients
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'lead'));

-- RLS Policies for cs_accounts
CREATE POLICY "cs_accounts_select_policy" ON cs_accounts
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'lead') OR 
        employee_id = (auth.jwt() ->> 'user_id')::UUID
    );

CREATE POLICY "cs_accounts_insert_policy" ON cs_accounts
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'lead'));

CREATE POLICY "cs_accounts_update_policy" ON cs_accounts
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'lead'));

-- RLS Policies for cs_monthly_entries
CREATE POLICY "cs_monthly_entries_select_policy" ON cs_monthly_entries
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'lead', 'reviewer') OR 
        employee_id = (auth.jwt() ->> 'user_id')::UUID
    );

CREATE POLICY "cs_monthly_entries_insert_policy" ON cs_monthly_entries
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'lead') OR 
        employee_id = (auth.jwt() ->> 'user_id')::UUID
    );

CREATE POLICY "cs_monthly_entries_update_policy" ON cs_monthly_entries
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'lead', 'reviewer') OR 
        (employee_id = (auth.jwt() ->> 'user_id')::UUID AND status = 'draft')
    );

-- RLS Policies for cs_appraisal
CREATE POLICY "cs_appraisal_select_policy" ON cs_appraisal
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'lead') OR 
        employee_id = (auth.jwt() ->> 'user_id')::UUID
    );

CREATE POLICY "cs_appraisal_insert_policy" ON cs_appraisal
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'lead'));

CREATE POLICY "cs_appraisal_update_policy" ON cs_appraisal
    FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'lead'));

-- Create view for employee dashboard
CREATE OR REPLACE VIEW cs_employee_dashboard AS
SELECT 
    e.employee_id,
    u.name as employee_name,
    e.month,
    c.name as client_name,
    c.type as client_type,
    e.meetings_count,
    e.sla_closure_rate,
    e.breach_rate,
    e.escalations_count,
    e.nps_client,
    CONCAT(e.upsell_discussions, '/', e.upsells_closed) as upsells_discussed_closed,
    e.renewal_stage,
    e.account_health_score,
    e.month_score,
    e.status,
    e.created_at,
    e.updated_at
FROM cs_monthly_entries e
JOIN cs_users u ON e.employee_id = u.id
JOIN clients c ON e.client_id = c.id
ORDER BY e.month DESC, e.month_score DESC;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cs_monthly_entries_employee_month ON cs_monthly_entries(employee_id, month);
CREATE INDEX IF NOT EXISTS idx_cs_monthly_entries_client_month ON cs_monthly_entries(client_id, month);
CREATE INDEX IF NOT EXISTS idx_cs_monthly_entries_status ON cs_monthly_entries(status);
CREATE INDEX IF NOT EXISTS idx_cs_accounts_employee ON cs_accounts(employee_id);
CREATE INDEX IF NOT EXISTS idx_cs_accounts_client ON cs_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_cs_appraisal_employee ON cs_appraisal(employee_id);

-- Insert sample data for testing (optional)
INSERT INTO cs_users (name, email, role) VALUES 
('John Doe', 'john.doe@company.com', 'employee'),
('Jane Smith', 'jane.smith@company.com', 'lead'),
('Admin User', 'admin@company.com', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO clients (name, type) VALUES 
('Acme Corp', 'Premium'),
('Beta Ltd', 'Standard'),
('Gamma Inc', 'Premium')
ON CONFLICT DO NOTHING;

COMMIT;