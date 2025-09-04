-- Migration: seo_module_schema
-- Source: 19_seo_module_schema.sql
-- Timestamp: 20240102002100

-- SEO Module Database Schema
-- Creates tables for SEO performance tracking and management

-- Extend users table with SEO-specific roles if not already present
-- Note: This assumes the existing users table structure
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT 'General';

-- Update existing users or insert SEO roles
-- Role values: 'admin', 'tl' (Team Lead), 'employee' (SEO Executive), 'reviewer' (Mentor)

-- Clients table for SEO module - using existing clients table from previous migration
-- Adding SEO-specific columns to existing clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type VARCHAR(20) CHECK (type IN ('Large', 'SMB', 'Premium', 'Standard', 'Basic'));
ALTER TABLE clients ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Update existing client_type to type for SEO compatibility
-- UPDATE clients SET type = client_type WHERE type IS NULL;

-- SEO Accounts - mapping between employees and clients with scope
CREATE TABLE IF NOT EXISTS seo_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    scope TEXT[] NOT NULL, -- Array of: 'SERP', 'GMB', 'Tech', 'Content'
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, client_id, start_date)
);

-- SEO Monthly Entries - core performance data
CREATE TABLE IF NOT EXISTS seo_monthly_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    
    -- Employee Input Fields (Previous Month Data)
    deliverables_blogs INTEGER DEFAULT 0,
    deliverables_backlinks INTEGER DEFAULT 0,
    deliverables_onpage INTEGER DEFAULT 0,
    deliverables_techfixes INTEGER DEFAULT 0,
    notes TEXT,
    
    -- Google Search Console Data
    gsc_organic_prev_30d INTEGER DEFAULT 0,
    gsc_organic_curr_30d INTEGER DEFAULT 0,
    
    -- Google Analytics Data
    ga_total_prev_30d INTEGER DEFAULT 0,
    ga_total_curr_30d INTEGER DEFAULT 0,
    
    -- SERP Rankings
    serp_top3_count INTEGER DEFAULT 0,
    serp_top10_count INTEGER DEFAULT 0,
    
    -- GMB Rankings
    gmb_top3_count INTEGER DEFAULT 0,
    
    -- Technical Health Metrics
    pagespeed_home INTEGER DEFAULT 0 CHECK (pagespeed_home >= 0 AND pagespeed_home <= 100),
    pagespeed_service INTEGER DEFAULT 0 CHECK (pagespeed_service >= 0 AND pagespeed_service <= 100),
    pagespeed_location INTEGER DEFAULT 0 CHECK (pagespeed_location >= 0 AND pagespeed_location <= 100),
    
    -- Search Console Errors
    sc_errors_home INTEGER DEFAULT 0,
    sc_errors_service INTEGER DEFAULT 0,
    sc_errors_location INTEGER DEFAULT 0,
    
    -- Client Relationship
    client_meeting_date DATE,
    interactions_count INTEGER DEFAULT 0,
    nps_client INTEGER CHECK (nps_client >= 1 AND nps_client <= 10),
    mentor_score INTEGER CHECK (mentor_score >= 1 AND mentor_score <= 10),
    
    -- System Calculated Fields
    organic_growth_pct DECIMAL(10,2),
    traffic_growth_pct DECIMAL(10,2),
    technical_health_score DECIMAL(5,2),
    ranking_score DECIMAL(5,2),
    delivery_score DECIMAL(5,2),
    relationship_score DECIMAL(5,2),
    month_score DECIMAL(5,2) CHECK (month_score >= 0 AND month_score <= 100),
    
    -- Workflow Fields
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'returned')),
    review_comment TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(employee_id, client_id, month)
);

-- SEO Appraisal - performance evaluation periods
CREATE TABLE IF NOT EXISTS seo_appraisal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    avg_month_score DECIMAL(5,2),
    final_rating_band VARCHAR(1) CHECK (final_rating_band IN ('A', 'B', 'C', 'D')),
    eligible_increment_pct DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, period_start, period_end)
);

-- SEO Configuration - for scoring weights and thresholds
CREATE TABLE IF NOT EXISTS seo_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default SEO configuration
INSERT INTO seo_config (config_key, config_value, description) VALUES
('scoring_weights', '{
  "traffic_impact": 35,
  "rankings": 20,
  "technical_health": 20,
  "delivery_scope": 15,
  "relationship_quality": 10
}', 'SEO scoring component weights'),
('client_weights', '{
  "Large": 1.25,
  "SMB": 1.0
}', 'Client type weights for employee scoring'),
('delivery_targets', '{
  "Large": {
    "blogs": 8,
    "backlinks": 12,
    "onpage": 6,
    "techfixes": 3
  },
  "SMB": {
    "blogs": 4,
    "backlinks": 6,
    "onpage": 3,
    "techfixes": 1
  }
}', 'Monthly delivery targets by client type'),
('ranking_targets', '{
  "Large": {
    "serp_target": 20,
    "gmb_target": 8
  },
  "SMB": {
    "serp_target": 12,
    "gmb_target": 5
  }
}', 'Ranking targets by client type'),
('appraisal_bands', '{
  "A": {"min_score": 85, "increment_pct": 15},
  "B": {"min_score": 75, "increment_pct": 10},
  "C": {"min_score": 65, "increment_pct": 5},
  "D": {"min_score": 0, "increment_pct": 0}
}', 'Appraisal rating bands and increment percentages')
ON CONFLICT (config_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_seo_accounts_employee_client ON seo_accounts(employee_id, client_id);
CREATE INDEX IF NOT EXISTS idx_seo_accounts_status ON seo_accounts(status);
CREATE INDEX IF NOT EXISTS idx_seo_monthly_entries_employee_month ON seo_monthly_entries(employee_id, month);
CREATE INDEX IF NOT EXISTS idx_seo_monthly_entries_client_month ON seo_monthly_entries(client_id, month);
CREATE INDEX IF NOT EXISTS idx_seo_monthly_entries_status ON seo_monthly_entries(status);
CREATE INDEX IF NOT EXISTS idx_seo_appraisal_employee_period ON seo_appraisal(employee_id, period_start, period_end);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_accounts_updated_at BEFORE UPDATE ON seo_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_monthly_entries_updated_at BEFORE UPDATE ON seo_monthly_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_appraisal_updated_at BEFORE UPDATE ON seo_appraisal
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_config_updated_at BEFORE UPDATE ON seo_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_appraisal ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_config ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on auth requirements)
-- Clients: readable by all authenticated users
CREATE POLICY "Clients are viewable by authenticated users" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

-- SEO Accounts: users can see their own accounts, TL/Admin can see team accounts
CREATE POLICY "Users can view their own SEO accounts" ON seo_accounts
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "TL and Admin can view all SEO accounts" ON seo_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'tl')
        )
    );

-- SEO Monthly Entries: similar pattern
CREATE POLICY "Users can manage their own entries" ON seo_monthly_entries
    FOR ALL USING (employee_id = auth.uid());

CREATE POLICY "TL and Admin can manage all entries" ON seo_monthly_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'tl')
        )
    );

-- SEO Config: readable by all, writable by admin
CREATE POLICY "Config readable by authenticated users" ON seo_config
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Config writable by admin" ON seo_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Comments
COMMENT ON TABLE clients IS 'SEO client information with type classification';
COMMENT ON TABLE seo_accounts IS 'Employee-client mappings with scope definitions';
COMMENT ON TABLE seo_monthly_entries IS 'Monthly SEO performance data and scoring';
COMMENT ON TABLE seo_appraisal IS 'Performance evaluation periods and ratings';
COMMENT ON TABLE seo_config IS 'SEO module configuration and scoring parameters';