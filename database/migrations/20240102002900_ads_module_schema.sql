-- =============================================
-- Ads Executive Module Schema
-- Migration: 20240102002900_ads_module_schema.sql
-- =============================================

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- =============================================
-- 1. ADS USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ads_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'ads_lead', 'ads_executive', 'reviewer')),
    department VARCHAR(20) DEFAULT 'Ads',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    hire_date DATE,
    reporting_manager_id UUID REFERENCES ads_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. CLIENTS TABLE (Shared/Referenced)
-- =============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('Large', 'SMB')),
    industry VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'churned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. ADS ACCOUNTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ads_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES ads_users(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    platforms JSONB NOT NULL DEFAULT '[]', -- ["google", "meta"]
    scope TEXT,
    start_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. ADS MONTHLY ENTRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ads_monthly_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES ads_users(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Scope & Deliverables
    scope_completed TEXT,
    activities_next_month TEXT,
    
    -- Previous Period Metrics
    cvr_prev DECIMAL(5,2), -- Conversion Rate (Visitor→Lead)
    ctr_prev DECIMAL(5,2), -- Ad CTR
    leads_prev INTEGER,
    calls_prev INTEGER, -- GMB/GBP calls
    cpc_prev DECIMAL(10,2), -- Cost Per Click
    cpa_prev DECIMAL(10,2), -- Cost Per Acquisition/Lead
    cpm_prev DECIMAL(10,2), -- Cost Per Mille
    roas_prev DECIMAL(5,2), -- Return on Ad Spend
    pos_prev DECIMAL(3,1), -- Average Position/Ad Rank
    
    -- Current Period Metrics
    cvr_curr DECIMAL(5,2),
    ctr_curr DECIMAL(5,2),
    leads_curr INTEGER,
    calls_curr INTEGER,
    cpc_curr DECIMAL(10,2),
    cpa_curr DECIMAL(10,2),
    cpm_curr DECIMAL(10,2),
    roas_curr DECIMAL(5,2),
    pos_curr DECIMAL(3,1),
    
    -- Growth Percentages (Auto-calculated)
    cvr_growth_pct DECIMAL(5,2),
    ctr_growth_pct DECIMAL(5,2),
    leads_growth_pct DECIMAL(5,2),
    calls_growth_pct DECIMAL(5,2),
    cpc_growth_pct DECIMAL(5,2),
    cpa_growth_pct DECIMAL(5,2),
    cpm_growth_pct DECIMAL(5,2),
    roas_growth_pct DECIMAL(5,2),
    pos_growth_pct DECIMAL(5,2),
    
    -- Account Structure & Spend
    campaigns_running_count INTEGER,
    ads_per_campaign DECIMAL(3,1),
    ad_spend_breakdown TEXT,
    total_ad_spend DECIMAL(12,2),
    
    -- Client Management
    meetings_with_client INTEGER,
    nps_client INTEGER CHECK (nps_client >= 1 AND nps_client <= 10),
    mentor_score INTEGER CHECK (mentor_score >= 1 AND mentor_score <= 10),
    
    -- System Calculated Scores
    efficiency_score DECIMAL(5,2) DEFAULT 0,
    impact_score DECIMAL(5,2) DEFAULT 0,
    structure_quality_score DECIMAL(5,2) DEFAULT 0,
    relationship_score DECIMAL(5,2) DEFAULT 0,
    discipline_score DECIMAL(5,2) DEFAULT 0,
    bonus_points DECIMAL(5,2) DEFAULT 0,
    penalties DECIMAL(5,2) DEFAULT 0,
    month_score DECIMAL(5,2) DEFAULT 0,
    
    -- Workflow
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'returned')),
    review_comment TEXT,
    reviewed_by UUID REFERENCES ads_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(employee_id, client_id, month)
);

-- =============================================
-- 5. ADS APPRAISAL TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ads_appraisal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES ads_users(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    avg_month_score DECIMAL(5,2),
    final_rating_band VARCHAR(1) CHECK (final_rating_band IN ('A', 'B', 'C', 'D')),
    eligible_increment_pct DECIMAL(5,2),
    notes TEXT,
    created_by UUID REFERENCES ads_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SCORING FUNCTIONS
-- =============================================

-- Function to calculate CPL/CPA improvement score (0-15 points)
CREATE OR REPLACE FUNCTION calculate_ads_cpl_score(cpa_prev DECIMAL, cpa_curr DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    improvement_pct DECIMAL;
BEGIN
    IF cpa_prev IS NULL OR cpa_prev = 0 OR cpa_curr IS NULL THEN
        RETURN 0;
    END IF;
    
    improvement_pct := ((cpa_prev - cpa_curr) / cpa_prev) * 100;
    
    CASE
        WHEN improvement_pct >= 20 THEN RETURN 15; -- ≤-20% (cheaper)
        WHEN improvement_pct >= 10 THEN RETURN 12; -- -10% to -19%
        WHEN improvement_pct >= 1 THEN RETURN 9;   -- -1% to -9%
        WHEN improvement_pct >= -9 THEN RETURN 6;  -- 0% to +9% (worse)
        WHEN improvement_pct >= -19 THEN RETURN 3; -- +10% to +19%
        ELSE RETURN 0; -- ≥+20%
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate CPC improvement score (0-8 points)
CREATE OR REPLACE FUNCTION calculate_ads_cpc_score(cpc_prev DECIMAL, cpc_curr DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    improvement_pct DECIMAL;
BEGIN
    IF cpc_prev IS NULL OR cpc_prev = 0 OR cpc_curr IS NULL THEN
        RETURN 0;
    END IF;
    
    improvement_pct := ((cpc_prev - cpc_curr) / cpc_prev) * 100;
    
    CASE
        WHEN improvement_pct >= 20 THEN RETURN 8;
        WHEN improvement_pct >= 10 THEN RETURN 6.4;
        WHEN improvement_pct >= 1 THEN RETURN 4.8;
        WHEN improvement_pct >= -9 THEN RETURN 3.2;
        WHEN improvement_pct >= -19 THEN RETURN 1.6;
        ELSE RETURN 0;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate CTR improvement score (0-7 points)
CREATE OR REPLACE FUNCTION calculate_ads_ctr_score(ctr_prev DECIMAL, ctr_curr DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    improvement_pct DECIMAL;
BEGIN
    IF ctr_prev IS NULL OR ctr_prev = 0 OR ctr_curr IS NULL THEN
        RETURN 0;
    END IF;
    
    improvement_pct := ((ctr_curr - ctr_prev) / ctr_prev) * 100;
    
    CASE
        WHEN improvement_pct >= 30 THEN RETURN 7;
        WHEN improvement_pct >= 15 THEN RETURN 5;
        WHEN improvement_pct >= 5 THEN RETURN 3;
        WHEN improvement_pct >= 0 THEN RETURN 2;
        ELSE RETURN 0; -- negative
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Average Position score (0-5 points)
CREATE OR REPLACE FUNCTION calculate_ads_position_score(pos_curr DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF pos_curr IS NULL THEN
        RETURN 0;
    END IF;
    
    CASE
        WHEN pos_curr <= 1.5 THEN RETURN 5;
        WHEN pos_curr <= 2.0 THEN RETURN 4;
        WHEN pos_curr <= 2.5 THEN RETURN 3;
        WHEN pos_curr <= 3.0 THEN RETURN 2;
        ELSE RETURN 0;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Leads growth score (0-12 points)
CREATE OR REPLACE FUNCTION calculate_ads_leads_score(leads_prev INTEGER, leads_curr INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    growth_pct DECIMAL;
BEGIN
    IF leads_prev IS NULL OR leads_prev = 0 OR leads_curr IS NULL THEN
        RETURN 0;
    END IF;
    
    growth_pct := ((leads_curr - leads_prev)::DECIMAL / leads_prev) * 100;
    
    CASE
        WHEN growth_pct >= 30 THEN RETURN 12;
        WHEN growth_pct >= 15 THEN RETURN 9;
        WHEN growth_pct >= 5 THEN RETURN 6;
        WHEN growth_pct >= 0 THEN RETURN 4;
        WHEN growth_pct >= -10 THEN RETURN 2;
        ELSE RETURN 0; -- <-10%
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate CVR score (0-8 points)
CREATE OR REPLACE FUNCTION calculate_ads_cvr_score(cvr_prev DECIMAL, cvr_curr DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    growth_pct DECIMAL;
BEGIN
    IF cvr_prev IS NULL OR cvr_prev = 0 OR cvr_curr IS NULL THEN
        RETURN 0;
    END IF;
    
    growth_pct := ((cvr_curr - cvr_prev) / cvr_prev) * 100;
    
    CASE
        WHEN growth_pct >= 30 THEN RETURN 8;
        WHEN growth_pct >= 15 THEN RETURN 6;
        WHEN growth_pct >= 5 THEN RETURN 4;
        WHEN growth_pct >= 0 THEN RETURN 2.67;
        WHEN growth_pct >= -10 THEN RETURN 1.33;
        ELSE RETURN 0;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate ROAS score (0-10 points)
CREATE OR REPLACE FUNCTION calculate_ads_roas_score(roas_curr DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF roas_curr IS NULL THEN
        RETURN 0;
    END IF;
    
    CASE
        WHEN roas_curr >= 5 THEN RETURN 10;
        WHEN roas_curr >= 3 THEN RETURN 8;
        WHEN roas_curr >= 2 THEN RETURN 6;
        WHEN roas_curr >= 1 THEN RETURN 3;
        ELSE RETURN 0; -- <1
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Structure & Hygiene score (0-7 points)
CREATE OR REPLACE FUNCTION calculate_ads_structure_score(
    campaigns_count INTEGER,
    ads_per_campaign DECIMAL,
    scope_completed TEXT
)
RETURNS DECIMAL AS $$
DECLARE
    structure_quality VARCHAR(20) := 'Poor';
    optimization_keywords TEXT[];
BEGIN
    -- Check for optimization keywords in scope_completed
    optimization_keywords := ARRAY['A/B', 'RSA', 'keyword pruning', 'LP test', 'landing page', 'optimization', 'test'];
    
    -- Determine structure quality based on campaigns and ads per campaign
    IF campaigns_count IS NOT NULL AND ads_per_campaign IS NOT NULL THEN
        IF campaigns_count >= 3 AND ads_per_campaign >= 2 AND ads_per_campaign <= 5 THEN
            structure_quality := 'Good';
            
            -- Check if scope mentions optimization activities
            IF scope_completed IS NOT NULL THEN
                FOR i IN 1..array_length(optimization_keywords, 1) LOOP
                    IF LOWER(scope_completed) LIKE '%' || LOWER(optimization_keywords[i]) || '%' THEN
                        structure_quality := 'Excellent';
                        EXIT;
                    END IF;
                END LOOP;
            END IF;
        ELSIF campaigns_count >= 1 AND ads_per_campaign >= 1 THEN
            structure_quality := 'Basic';
        END IF;
    END IF;
    
    CASE structure_quality
        WHEN 'Excellent' THEN RETURN 7;
        WHEN 'Good' THEN RETURN 5;
        WHEN 'Basic' THEN RETURN 3;
        ELSE RETURN 0; -- Poor
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Spend Discipline score (0-8 points)
CREATE OR REPLACE FUNCTION calculate_ads_spend_score(
    total_ad_spend DECIMAL,
    ad_spend_breakdown TEXT
)
RETURNS DECIMAL AS $$
BEGIN
    -- For now, simplified logic - can be enhanced with actual plan comparison
    IF total_ad_spend IS NOT NULL AND total_ad_spend > 0 AND 
       ad_spend_breakdown IS NOT NULL AND LENGTH(ad_spend_breakdown) > 10 THEN
        RETURN 8; -- Assume documented spend is within plan
    ELSIF total_ad_spend IS NOT NULL AND total_ad_spend > 0 THEN
        RETURN 5; -- Spend recorded but breakdown missing
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate NPS score (0-9 points)
CREATE OR REPLACE FUNCTION calculate_ads_nps_score(nps_client INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    IF nps_client IS NULL THEN
        RETURN 0;
    END IF;
    
    RETURN (nps_client::DECIMAL / 10) * 9;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Meetings score (0-4 points)
CREATE OR REPLACE FUNCTION calculate_ads_meetings_score(meetings_count INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    IF meetings_count IS NULL THEN
        RETURN 0;
    END IF;
    
    CASE
        WHEN meetings_count >= 4 THEN RETURN 4;
        WHEN meetings_count = 3 THEN RETURN 3;
        WHEN meetings_count = 2 THEN RETURN 2;
        WHEN meetings_count = 1 THEN RETURN 1;
        ELSE RETURN 0;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Mentor score (0-2 points)
CREATE OR REPLACE FUNCTION calculate_ads_mentor_score(mentor_score INTEGER)
RETURNS DECIMAL AS $$
BEGIN
    IF mentor_score IS NULL THEN
        RETURN 0;
    END IF;
    
    RETURN (mentor_score::DECIMAL / 10) * 2;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Landing Page bonus (0-5 points)
CREATE OR REPLACE FUNCTION calculate_ads_lp_bonus(
    scope_completed TEXT,
    cvr_prev DECIMAL,
    cvr_curr DECIMAL,
    cpa_prev DECIMAL,
    cpa_curr DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    lp_keywords TEXT[];
    has_lp_optimization BOOLEAN := FALSE;
    has_uplift BOOLEAN := FALSE;
BEGIN
    lp_keywords := ARRAY['landing page', 'LP optimization', 'page optimization', 'conversion optimization'];
    
    -- Check if scope mentions landing page optimization
    IF scope_completed IS NOT NULL THEN
        FOR i IN 1..array_length(lp_keywords, 1) LOOP
            IF LOWER(scope_completed) LIKE '%' || LOWER(lp_keywords[i]) || '%' THEN
                has_lp_optimization := TRUE;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    -- Check for documented uplift in CVR or CPL
    IF (cvr_prev IS NOT NULL AND cvr_curr IS NOT NULL AND cvr_curr > cvr_prev) OR
       (cpa_prev IS NOT NULL AND cpa_curr IS NOT NULL AND cpa_curr < cpa_prev) THEN
        has_uplift := TRUE;
    END IF;
    
    IF has_lp_optimization AND has_uplift THEN
        RETURN 5;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate penalties
CREATE OR REPLACE FUNCTION calculate_ads_penalties(
    employee_id UUID,
    current_month VARCHAR(7),
    cpa_prev DECIMAL,
    cpa_curr DECIMAL,
    total_ad_spend DECIMAL,
    scope_completed TEXT
)
RETURNS DECIMAL AS $$
DECLARE
    penalty DECIMAL := 0;
    prev_month VARCHAR(7);
    prev_entry RECORD;
    cpa_worsening_pct DECIMAL;
    prev_cpa_worsening_pct DECIMAL;
BEGIN
    -- Calculate previous month
    prev_month := TO_CHAR(TO_DATE(current_month || '-01', 'YYYY-MM-DD') - INTERVAL '1 month', 'YYYY-MM');
    
    -- Check for two consecutive months CPL worsens ≥20%
    IF cpa_prev IS NOT NULL AND cpa_curr IS NOT NULL AND cpa_prev > 0 THEN
        cpa_worsening_pct := ((cpa_curr - cpa_prev) / cpa_prev) * 100;
        
        IF cpa_worsening_pct >= 20 THEN
            -- Check previous month's performance
            SELECT cpa_prev, cpa_curr INTO prev_entry
            FROM ads_monthly_entries
            WHERE employee_id = calculate_ads_penalties.employee_id
            AND month = prev_month
            LIMIT 1;
            
            IF prev_entry.cpa_prev IS NOT NULL AND prev_entry.cpa_curr IS NOT NULL AND prev_entry.cpa_prev > 0 THEN
                prev_cpa_worsening_pct := ((prev_entry.cpa_curr - prev_entry.cpa_prev) / prev_entry.cpa_prev) * 100;
                
                IF prev_cpa_worsening_pct >= 20 THEN
                    penalty := penalty + 5; -- Two consecutive months penalty
                END IF;
            END IF;
        END IF;
    END IF;
    
    -- Check for zero documented optimization with spend > ₹1L
    IF total_ad_spend IS NOT NULL AND total_ad_spend > 100000 THEN
        IF scope_completed IS NULL OR LENGTH(TRIM(scope_completed)) < 10 THEN
            penalty := penalty + 3;
        END IF;
    END IF;
    
    RETURN penalty;
END;
$$ LANGUAGE plpgsql;

-- Main function to calculate monthly score
CREATE OR REPLACE FUNCTION calculate_ads_month_score(
    entry_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
    entry RECORD;
    efficiency_score DECIMAL := 0;
    impact_score DECIMAL := 0;
    structure_score DECIMAL := 0;
    relationship_score DECIMAL := 0;
    bonus_points DECIMAL := 0;
    penalties DECIMAL := 0;
    total_score DECIMAL := 0;
BEGIN
    -- Get the entry data
    SELECT * INTO entry FROM ads_monthly_entries WHERE id = entry_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- A) Cost & Efficiency (35 points)
    efficiency_score := 
        calculate_ads_cpl_score(entry.cpa_prev, entry.cpa_curr) +  -- 0-15
        calculate_ads_cpc_score(entry.cpc_prev, entry.cpc_curr) +  -- 0-8
        calculate_ads_ctr_score(entry.ctr_prev, entry.ctr_curr) +  -- 0-7
        calculate_ads_position_score(entry.pos_curr);              -- 0-5
    
    -- B) Impact & Outcomes (30 points)
    impact_score := 
        calculate_ads_leads_score(entry.leads_prev, entry.leads_curr) +  -- 0-12
        calculate_ads_cvr_score(entry.cvr_prev, entry.cvr_curr) +        -- 0-8
        calculate_ads_roas_score(entry.roas_curr);                       -- 0-10
    
    -- C) Structure & Hygiene (15 points)
    structure_score := 
        calculate_ads_structure_score(entry.campaigns_running_count, entry.ads_per_campaign, entry.scope_completed) +  -- 0-7
        calculate_ads_spend_score(entry.total_ad_spend, entry.ad_spend_breakdown);  -- 0-8
    
    -- D) Relationship & Governance (15 points)
    relationship_score := 
        calculate_ads_nps_score(entry.nps_client) +                    -- 0-9
        calculate_ads_meetings_score(entry.meetings_with_client) +     -- 0-4
        calculate_ads_mentor_score(entry.mentor_score);                -- 0-2
    
    -- Bonus Points (5 points)
    bonus_points := calculate_ads_lp_bonus(
        entry.scope_completed,
        entry.cvr_prev,
        entry.cvr_curr,
        entry.cpa_prev,
        entry.cpa_curr
    );
    
    -- Penalties
    penalties := calculate_ads_penalties(
        entry.employee_id,
        entry.month,
        entry.cpa_prev,
        entry.cpa_curr,
        entry.total_ad_spend,
        entry.scope_completed
    );
    
    -- Calculate total score
    total_score := efficiency_score + impact_score + structure_score + relationship_score + bonus_points - penalties;
    
    -- Ensure score is between 0 and 100
    total_score := GREATEST(0, LEAST(100, total_score));
    
    -- Update the entry with calculated scores
    UPDATE ads_monthly_entries SET
        efficiency_score = calculate_ads_month_score.efficiency_score,
        impact_score = calculate_ads_month_score.impact_score,
        structure_quality_score = structure_score,
        relationship_score = calculate_ads_month_score.relationship_score,
        bonus_points = calculate_ads_month_score.bonus_points,
        penalties = calculate_ads_month_score.penalties,
        month_score = total_score,
        updated_at = NOW()
    WHERE id = entry_id;
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Function to calculate growth percentages
CREATE OR REPLACE FUNCTION calculate_growth_percentages()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate growth percentages
    IF NEW.cvr_prev IS NOT NULL AND NEW.cvr_prev > 0 AND NEW.cvr_curr IS NOT NULL THEN
        NEW.cvr_growth_pct := ((NEW.cvr_curr - NEW.cvr_prev) / NEW.cvr_prev) * 100;
    END IF;
    
    IF NEW.ctr_prev IS NOT NULL AND NEW.ctr_prev > 0 AND NEW.ctr_curr IS NOT NULL THEN
        NEW.ctr_growth_pct := ((NEW.ctr_curr - NEW.ctr_prev) / NEW.ctr_prev) * 100;
    END IF;
    
    IF NEW.leads_prev IS NOT NULL AND NEW.leads_prev > 0 AND NEW.leads_curr IS NOT NULL THEN
        NEW.leads_growth_pct := ((NEW.leads_curr - NEW.leads_prev)::DECIMAL / NEW.leads_prev) * 100;
    END IF;
    
    IF NEW.calls_prev IS NOT NULL AND NEW.calls_prev > 0 AND NEW.calls_curr IS NOT NULL THEN
        NEW.calls_growth_pct := ((NEW.calls_curr - NEW.calls_prev)::DECIMAL / NEW.calls_prev) * 100;
    END IF;
    
    IF NEW.cpc_prev IS NOT NULL AND NEW.cpc_prev > 0 AND NEW.cpc_curr IS NOT NULL THEN
        NEW.cpc_growth_pct := ((NEW.cpc_curr - NEW.cpc_prev) / NEW.cpc_prev) * 100;
    END IF;
    
    IF NEW.cpa_prev IS NOT NULL AND NEW.cpa_prev > 0 AND NEW.cpa_curr IS NOT NULL THEN
        NEW.cpa_growth_pct := ((NEW.cpa_curr - NEW.cpa_prev) / NEW.cpa_prev) * 100;
    END IF;
    
    IF NEW.cpm_prev IS NOT NULL AND NEW.cpm_prev > 0 AND NEW.cpm_curr IS NOT NULL THEN
        NEW.cpm_growth_pct := ((NEW.cpm_curr - NEW.cpm_prev) / NEW.cpm_prev) * 100;
    END IF;
    
    IF NEW.roas_prev IS NOT NULL AND NEW.roas_prev > 0 AND NEW.roas_curr IS NOT NULL THEN
        NEW.roas_growth_pct := ((NEW.roas_curr - NEW.roas_prev) / NEW.roas_prev) * 100;
    END IF;
    
    IF NEW.pos_prev IS NOT NULL AND NEW.pos_prev > 0 AND NEW.pos_curr IS NOT NULL THEN
        NEW.pos_growth_pct := ((NEW.pos_curr - NEW.pos_prev) / NEW.pos_prev) * 100;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate growth percentages and scores
CREATE TRIGGER ads_monthly_entries_calculate_growth
    BEFORE INSERT OR UPDATE ON ads_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_growth_percentages();

-- Trigger to calculate scores after insert/update
CREATE OR REPLACE FUNCTION trigger_calculate_ads_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate score after the row is inserted/updated
    PERFORM calculate_ads_month_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ads_monthly_entries_calculate_score
    AFTER INSERT OR UPDATE ON ads_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_ads_score();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE ads_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_appraisal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ads_users
CREATE POLICY "ads_users_select_policy" ON ads_users
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead') OR
        auth.jwt() ->> 'user_id' = id::text
    );

CREATE POLICY "ads_users_insert_policy" ON ads_users
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead')
    );

CREATE POLICY "ads_users_update_policy" ON ads_users
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead') OR
        auth.jwt() ->> 'user_id' = id::text
    );

-- RLS Policies for clients
CREATE POLICY "clients_select_policy" ON clients
    FOR SELECT USING (true); -- All ads users can view clients

CREATE POLICY "clients_insert_policy" ON clients
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead')
    );

CREATE POLICY "clients_update_policy" ON clients
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead')
    );

-- RLS Policies for ads_accounts
CREATE POLICY "ads_accounts_select_policy" ON ads_accounts
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead') OR
        employee_id::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "ads_accounts_insert_policy" ON ads_accounts
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead')
    );

CREATE POLICY "ads_accounts_update_policy" ON ads_accounts
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead') OR
        employee_id::text = auth.jwt() ->> 'user_id'
    );

-- RLS Policies for ads_monthly_entries
CREATE POLICY "ads_monthly_entries_select_policy" ON ads_monthly_entries
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead', 'reviewer') OR
        employee_id::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "ads_monthly_entries_insert_policy" ON ads_monthly_entries
    FOR INSERT WITH CHECK (
        employee_id::text = auth.jwt() ->> 'user_id' OR
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead')
    );

CREATE POLICY "ads_monthly_entries_update_policy" ON ads_monthly_entries
    FOR UPDATE USING (
        (employee_id::text = auth.jwt() ->> 'user_id' AND status IN ('draft', 'returned')) OR
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead', 'reviewer')
    );

-- RLS Policies for ads_appraisal
CREATE POLICY "ads_appraisal_select_policy" ON ads_appraisal
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead') OR
        employee_id::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "ads_appraisal_insert_policy" ON ads_appraisal
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead')
    );

CREATE POLICY "ads_appraisal_update_policy" ON ads_appraisal
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'ads_lead')
    );

-- =============================================
-- VIEWS
-- =============================================

-- Employee Dashboard View
CREATE OR REPLACE VIEW ads_employee_dashboard AS
SELECT 
    u.id as employee_id,
    u.name as employee_name,
    u.role,
    
    -- YTD Average Score
    COALESCE(AVG(ame.month_score) FILTER (WHERE EXTRACT(YEAR FROM TO_DATE(ame.month || '-01', 'YYYY-MM-DD')) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) as ytd_avg_score,
    
    -- Last Month Score
    COALESCE((
        SELECT month_score 
        FROM ads_monthly_entries 
        WHERE employee_id = u.id 
        AND month = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
        ORDER BY updated_at DESC 
        LIMIT 1
    ), 0) as last_month_score,
    
    -- Active Accounts
    COUNT(DISTINCT aa.id) FILTER (WHERE aa.status = 'active') as active_accounts,
    
    -- Average ROAS (90 days)
    COALESCE(AVG(ame.roas_curr) FILTER (WHERE ame.created_at >= CURRENT_DATE - INTERVAL '90 days'), 0) as avg_roas_90d,
    
    -- Performance Band
    CASE 
        WHEN AVG(ame.month_score) FILTER (WHERE EXTRACT(YEAR FROM TO_DATE(ame.month || '-01', 'YYYY-MM-DD')) = EXTRACT(YEAR FROM CURRENT_DATE)) >= 85 THEN 'A'
        WHEN AVG(ame.month_score) FILTER (WHERE EXTRACT(YEAR FROM TO_DATE(ame.month || '-01', 'YYYY-MM-DD')) = EXTRACT(YEAR FROM CURRENT_DATE)) >= 75 THEN 'B'
        WHEN AVG(ame.month_score) FILTER (WHERE EXTRACT(YEAR FROM TO_DATE(ame.month || '-01', 'YYYY-MM-DD')) = EXTRACT(YEAR FROM CURRENT_DATE)) >= 65 THEN 'C'
        ELSE 'D'
    END as performance_band
    
FROM ads_users u
LEFT JOIN ads_accounts aa ON u.id = aa.employee_id
LEFT JOIN ads_monthly_entries ame ON u.id = ame.employee_id
WHERE u.status = 'active'
GROUP BY u.id, u.name, u.role;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_ads_users_employee_id ON ads_users(employee_id);
CREATE INDEX IF NOT EXISTS idx_ads_users_role ON ads_users(role);
CREATE INDEX IF NOT EXISTS idx_ads_accounts_employee_id ON ads_accounts(employee_id);
CREATE INDEX IF NOT EXISTS idx_ads_accounts_client_id ON ads_accounts(client_id);
CREATE INDEX IF NOT EXISTS idx_ads_monthly_entries_employee_id ON ads_monthly_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_ads_monthly_entries_month ON ads_monthly_entries(month);
CREATE INDEX IF NOT EXISTS idx_ads_monthly_entries_status ON ads_monthly_entries(status);
CREATE INDEX IF NOT EXISTS idx_ads_monthly_entries_employee_month ON ads_monthly_entries(employee_id, month);
CREATE INDEX IF NOT EXISTS idx_ads_appraisal_employee_id ON ads_appraisal(employee_id);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- =============================================
-- SAMPLE DATA (Optional)
-- =============================================

-- Insert sample ads users
INSERT INTO ads_users (employee_id, name, email, role, hire_date) VALUES
('ADS001', 'Rahul Sharma', 'rahul.sharma@company.com', 'ads_executive', '2023-01-15'),
('ADS002', 'Priya Patel', 'priya.patel@company.com', 'ads_executive', '2023-03-20'),
('ADS003', 'Amit Kumar', 'amit.kumar@company.com', 'ads_lead', '2022-06-10'),
('ADS004', 'Sneha Gupta', 'sneha.gupta@company.com', 'reviewer', '2022-08-05'),
('ADS005', 'Vikram Singh', 'vikram.singh@company.com', 'admin', '2021-12-01')
ON CONFLICT (employee_id) DO NOTHING;

-- Insert sample clients if not exists
INSERT INTO clients (name, type, industry, status) VALUES
('TechCorp Solutions', 'Large', 'Technology', 'active'),
('Digital Marketing Pro', 'SMB', 'Marketing', 'active'),
('E-commerce Startup', 'SMB', 'E-commerce', 'active'),
('Healthcare Plus', 'Large', 'Healthcare', 'active')
ON CONFLICT DO NOTHING;

COMMIT;