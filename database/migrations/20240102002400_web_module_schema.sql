-- Web Module Schema for Branding Pioneers
-- Comprehensive project-centric performance tracking system

-- Web users table (extends main users for web-specific roles)
CREATE TABLE IF NOT EXISTS web_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'tl', 'pm', 'employee', 'reviewer')),
    department VARCHAR(50) DEFAULT 'Web',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Web projects table
CREATE TABLE IF NOT EXISTS web_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('WordPress', 'Shopify', 'Custom', 'React', 'Vue', 'Angular', 'Static')),
    total_pages_planned INTEGER DEFAULT 1,
    scope_of_work TEXT,
    start_date DATE NOT NULL,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'on-hold', 'completed', 'cancelled')),
    client_type VARCHAR(20) DEFAULT 'SMB' CHECK (client_type IN ('Large', 'SMB')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Web assignments table (employee-project relationships)
CREATE TABLE IF NOT EXISTS web_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES web_projects(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('designer', 'developer', 'pm', 'qa', 'lead')),
    active BOOLEAN DEFAULT true,
    assigned_date DATE DEFAULT CURRENT_DATE,
    unassigned_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, project_id, role)
);

-- Web monthly entries table (core performance tracking)
CREATE TABLE IF NOT EXISTS web_monthly_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES web_projects(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Delivery metrics
    pages_designed_count INTEGER DEFAULT 0,
    pages_developed_count INTEGER DEFAULT 0,
    pages_approved_count INTEGER DEFAULT 0,
    page_links TEXT[], -- Array of URLs/links
    
    -- Quality metrics (design)
    homepage_design_score DECIMAL(3,1) CHECK (homepage_design_score >= 0 AND homepage_design_score <= 10),
    service_design_score DECIMAL(3,1) CHECK (service_design_score >= 0 AND service_design_score <= 10),
    
    -- Technical metrics
    homepage_pagespeed_score INTEGER CHECK (homepage_pagespeed_score >= 0 AND homepage_pagespeed_score <= 100),
    
    -- Client management
    interactions_count INTEGER DEFAULT 0,
    meetings_count INTEGER DEFAULT 0,
    nps_client DECIMAL(3,1) CHECK (nps_client >= 1 AND nps_client <= 10),
    
    -- Planning
    activities_next_month TEXT,
    estimated_signoff_date DATE,
    
    -- Business impact / upsell
    marketing_upsell_count INTEGER DEFAULT 0,
    website_changes_count INTEGER DEFAULT 0,
    saas_tools_upsold_count INTEGER DEFAULT 0,
    landing_pages_created_count INTEGER DEFAULT 0,
    portfolio_update BOOLEAN DEFAULT false,
    domain_server_renewal BOOLEAN DEFAULT false,
    
    -- Mentor/TL assessment
    mentor_score DECIMAL(3,1) CHECK (mentor_score >= 1 AND mentor_score <= 10),
    
    -- System calculated scores
    delivery_completion_ratio DECIMAL(5,2) DEFAULT 0,
    design_quality_score DECIMAL(5,2) DEFAULT 0,
    technical_health_score DECIMAL(5,2) DEFAULT 0,
    client_relationship_score DECIMAL(5,2) DEFAULT 0,
    planning_predictability_score DECIMAL(5,2) DEFAULT 0,
    business_impact_score DECIMAL(5,2) DEFAULT 0,
    process_hygiene_score DECIMAL(5,2) DEFAULT 0,
    month_score DECIMAL(5,2) DEFAULT 0, -- 0-100
    
    -- Workflow
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    review_comment TEXT,
    reviewed_by UUID REFERENCES web_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(employee_id, project_id, month)
);

-- Web appraisal table
CREATE TABLE IF NOT EXISTS web_appraisal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES web_users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    avg_month_score DECIMAL(5,2) DEFAULT 0,
    final_rating_band VARCHAR(1) CHECK (final_rating_band IN ('A', 'B', 'C', 'D')),
    eligible_increment_pct DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES web_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate delivery and milestones score (35 points)
CREATE OR REPLACE FUNCTION calculate_delivery_score(
    pages_approved INTEGER,
    total_pages_planned INTEGER,
    estimated_signoff_date DATE,
    actual_signoff_date DATE DEFAULT NULL
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    completion_score DECIMAL(5,2) := 0;
    predictability_score DECIMAL(5,2) := 0;
    completion_ratio DECIMAL(5,2);
    delay_days INTEGER;
BEGIN
    -- Completion vs plan (0-25 points)
    completion_ratio := CASE 
        WHEN total_pages_planned = 0 THEN 0
        ELSE (pages_approved::DECIMAL / GREATEST(total_pages_planned, 1)) * 100
    END;
    
    completion_score := CASE
        WHEN completion_ratio >= 100 THEN 25
        WHEN completion_ratio >= 80 THEN 20
        WHEN completion_ratio >= 60 THEN 15
        WHEN completion_ratio >= 40 THEN 10
        WHEN completion_ratio >= 1 THEN 5
        ELSE 0
    END;
    
    -- Sign-off predictability (0-10 points)
    IF actual_signoff_date IS NOT NULL AND estimated_signoff_date IS NOT NULL THEN
        delay_days := actual_signoff_date - estimated_signoff_date;
        predictability_score := CASE
            WHEN delay_days <= 0 THEN 10
            WHEN delay_days <= 7 THEN 7
            WHEN delay_days <= 14 THEN 4
            ELSE 0
        END;
    ELSIF estimated_signoff_date IS NOT NULL THEN
        -- For ongoing projects, estimate adherence based on current progress
        delay_days := CURRENT_DATE - estimated_signoff_date;
        predictability_score := CASE
            WHEN delay_days <= 0 THEN 10
            WHEN delay_days <= 7 THEN 7
            WHEN delay_days <= 14 THEN 4
            ELSE 0
        END;
    END;
    
    RETURN completion_score + predictability_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate design quality score (20 points)
CREATE OR REPLACE FUNCTION calculate_design_quality_score(
    homepage_design_score DECIMAL(3,1),
    service_design_score DECIMAL(3,1)
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_score DECIMAL(5,2) := 0;
    score_count INTEGER := 0;
BEGIN
    IF homepage_design_score IS NOT NULL THEN
        total_score := total_score + homepage_design_score;
        score_count := score_count + 1;
    END IF;
    
    IF service_design_score IS NOT NULL THEN
        total_score := total_score + service_design_score;
        score_count := score_count + 1;
    END IF;
    
    IF score_count = 0 THEN
        RETURN 0;
    END IF;
    
    -- Average and scale to 20 points
    RETURN (total_score / score_count) * 2;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate technical health score (15 points)
CREATE OR REPLACE FUNCTION calculate_technical_health_score(
    homepage_pagespeed_score INTEGER
) RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF homepage_pagespeed_score IS NULL THEN
        RETURN 0;
    END IF;
    
    RETURN CASE
        WHEN homepage_pagespeed_score >= 90 THEN 15
        WHEN homepage_pagespeed_score >= 80 THEN 12
        WHEN homepage_pagespeed_score >= 70 THEN 9
        WHEN homepage_pagespeed_score >= 60 THEN 6
        WHEN homepage_pagespeed_score >= 50 THEN 3
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate client relationship score (15 points)
CREATE OR REPLACE FUNCTION calculate_client_relationship_score(
    nps_client DECIMAL(3,1),
    interactions_count INTEGER,
    meetings_count INTEGER,
    mentor_score DECIMAL(3,1)
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    nps_score DECIMAL(5,2) := 0;
    touchpoint_score DECIMAL(5,2) := 0;
    mentor_points DECIMAL(5,2) := 0;
BEGIN
    -- NPS score (0-8 points)
    IF nps_client IS NOT NULL THEN
        nps_score := (nps_client / 10.0) * 8;
    END IF;
    
    -- Touchpoints score (0-5 points)
    IF interactions_count >= 4 AND meetings_count >= 1 THEN
        touchpoint_score := 5;
    ELSE
        touchpoint_score := LEAST(interactions_count + meetings_count, 4);
    END IF;
    
    -- Mentor score (0-2 points)
    IF mentor_score IS NOT NULL THEN
        mentor_points := (mentor_score / 10.0) * 2;
    END IF;
    
    RETURN nps_score + touchpoint_score + mentor_points;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate business impact score (10 points)
CREATE OR REPLACE FUNCTION calculate_business_impact_score(
    landing_pages_created_count INTEGER,
    marketing_upsell_count INTEGER,
    saas_tools_upsold_count INTEGER,
    client_type VARCHAR(20)
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    lp_score DECIMAL(5,2) := 0;
    upsell_score DECIMAL(5,2) := 0;
    lp_target INTEGER;
BEGIN
    -- Landing pages score (0-6 points)
    lp_target := CASE WHEN client_type = 'Large' THEN 2 ELSE 1 END;
    
    IF landing_pages_created_count >= lp_target THEN
        lp_score := 6;
    ELSIF landing_pages_created_count > 0 THEN
        lp_score := 3;
    END IF;
    
    -- Upsell score (0-4 points)
    IF marketing_upsell_count > 0 OR saas_tools_upsold_count > 0 THEN
        upsell_score := 4;
    END IF;
    
    RETURN lp_score + upsell_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate process hygiene score (5 points)
CREATE OR REPLACE FUNCTION calculate_process_hygiene_score(
    activities_next_month TEXT,
    page_links TEXT[],
    estimated_signoff_date DATE,
    portfolio_update BOOLEAN
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    score DECIMAL(5,2) := 0;
BEGIN
    -- Activities next month filled
    IF activities_next_month IS NOT NULL AND LENGTH(TRIM(activities_next_month)) > 0 THEN
        score := score + 1.5;
    END IF;
    
    -- Links provided
    IF page_links IS NOT NULL AND array_length(page_links, 1) > 0 THEN
        score := score + 1.5;
    END IF;
    
    -- Estimate updated
    IF estimated_signoff_date IS NOT NULL THEN
        score := score + 1;
    END IF;
    
    -- Portfolio update or repo hygiene
    IF portfolio_update = true THEN
        score := score + 1;
    END IF;
    
    RETURN LEAST(score, 5);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate overall month score
CREATE OR REPLACE FUNCTION calculate_month_score(
    entry_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    entry_record web_monthly_entries%ROWTYPE;
    project_record web_projects%ROWTYPE;
    delivery_score DECIMAL(5,2);
    design_score DECIMAL(5,2);
    technical_score DECIMAL(5,2);
    relationship_score DECIMAL(5,2);
    business_score DECIMAL(5,2);
    hygiene_score DECIMAL(5,2);
    total_score DECIMAL(5,2);
    penalty DECIMAL(5,2) := 0;
BEGIN
    -- Get entry and project data
    SELECT * INTO entry_record FROM web_monthly_entries WHERE id = entry_id;
    SELECT * INTO project_record FROM web_projects WHERE id = entry_record.project_id;
    
    -- Calculate component scores
    delivery_score := calculate_delivery_score(
        entry_record.pages_approved_count,
        project_record.total_pages_planned,
        entry_record.estimated_signoff_date
    );
    
    design_score := calculate_design_quality_score(
        entry_record.homepage_design_score,
        entry_record.service_design_score
    );
    
    technical_score := calculate_technical_health_score(
        entry_record.homepage_pagespeed_score
    );
    
    relationship_score := calculate_client_relationship_score(
        entry_record.nps_client,
        entry_record.interactions_count,
        entry_record.meetings_count,
        entry_record.mentor_score
    );
    
    business_score := calculate_business_impact_score(
        entry_record.landing_pages_created_count,
        entry_record.marketing_upsell_count,
        entry_record.saas_tools_upsold_count,
        project_record.client_type
    );
    
    hygiene_score := calculate_process_hygiene_score(
        entry_record.activities_next_month,
        entry_record.page_links,
        entry_record.estimated_signoff_date,
        entry_record.portfolio_update
    );
    
    -- Apply penalties
    -- 14-day slip without estimate update: -5
    IF entry_record.estimated_signoff_date IS NOT NULL 
       AND CURRENT_DATE > entry_record.estimated_signoff_date + INTERVAL '14 days'
       AND entry_record.updated_at < CURRENT_DATE - INTERVAL '14 days' THEN
        penalty := penalty + 5;
    END IF;
    
    -- Zero approved pages for two consecutive months: -10 (would need additional logic)
    
    total_score := delivery_score + design_score + technical_score + relationship_score + business_score + hygiene_score - penalty;
    
    RETURN GREATEST(total_score, 0);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update scores when entry is modified
CREATE OR REPLACE FUNCTION update_web_entry_scores()
RETURNS TRIGGER AS $$
DECLARE
    project_record web_projects%ROWTYPE;
BEGIN
    SELECT * INTO project_record FROM web_projects WHERE id = NEW.project_id;
    
    -- Update calculated fields
    NEW.delivery_completion_ratio := CASE 
        WHEN project_record.total_pages_planned = 0 THEN 0
        ELSE (NEW.pages_approved_count::DECIMAL / GREATEST(project_record.total_pages_planned, 1)) * 100
    END;
    
    NEW.design_quality_score := calculate_design_quality_score(
        NEW.homepage_design_score,
        NEW.service_design_score
    );
    
    NEW.technical_health_score := calculate_technical_health_score(
        NEW.homepage_pagespeed_score
    );
    
    NEW.client_relationship_score := calculate_client_relationship_score(
        NEW.nps_client,
        NEW.interactions_count,
        NEW.meetings_count,
        NEW.mentor_score
    );
    
    NEW.business_impact_score := calculate_business_impact_score(
        NEW.landing_pages_created_count,
        NEW.marketing_upsell_count,
        NEW.saas_tools_upsold_count,
        project_record.client_type
    );
    
    NEW.process_hygiene_score := calculate_process_hygiene_score(
        NEW.activities_next_month,
        NEW.page_links,
        NEW.estimated_signoff_date,
        NEW.portfolio_update
    );
    
    NEW.month_score := calculate_month_score(NEW.id);
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_web_entry_scores_trigger
    BEFORE UPDATE ON web_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_web_entry_scores();

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_web_users_updated_at BEFORE UPDATE ON web_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_projects_updated_at BEFORE UPDATE ON web_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_assignments_updated_at BEFORE UPDATE ON web_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_web_appraisal_updated_at BEFORE UPDATE ON web_appraisal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE web_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_appraisal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for web_users
CREATE POLICY "Users can view all web users" ON web_users FOR SELECT USING (true);
CREATE POLICY "Admins can manage web users" ON web_users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid() 
        AND wu.role IN ('admin')
    )
);
CREATE POLICY "Users can update own profile" ON web_users FOR UPDATE USING (
    user_id = auth.uid()
);

-- RLS Policies for web_projects
CREATE POLICY "All web users can view projects" ON web_projects FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid()
    )
);
CREATE POLICY "TL and Admin can manage projects" ON web_projects FOR ALL USING (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid() 
        AND wu.role IN ('admin', 'tl', 'pm')
    )
);

-- RLS Policies for web_assignments
CREATE POLICY "Users can view relevant assignments" ON web_assignments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid() 
        AND (wu.role IN ('admin', 'tl', 'pm') OR wu.id = employee_id)
    )
);
CREATE POLICY "TL and Admin can manage assignments" ON web_assignments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid() 
        AND wu.role IN ('admin', 'tl', 'pm')
    )
);

-- RLS Policies for web_monthly_entries
CREATE POLICY "Users can view own entries and TL can view team entries" ON web_monthly_entries FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid() 
        AND (wu.role IN ('admin', 'tl', 'pm') OR wu.id = employee_id)
    )
);
CREATE POLICY "Users can create own entries" ON web_monthly_entries FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid() 
        AND wu.id = employee_id
    )
);
CREATE POLICY "Users can update own draft entries" ON web_monthly_entries FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid() 
        AND wu.id = employee_id
        AND status = 'draft'
    )
);
CREATE POLICY "TL can review submitted entries" ON web_monthly_entries FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid() 
        AND wu.role IN ('admin', 'tl', 'pm')
        AND status = 'submitted'
    )
);

-- RLS Policies for web_appraisal
CREATE POLICY "Users can view own appraisals and TL can view team appraisals" ON web_appraisal FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid() 
        AND (wu.role IN ('admin', 'tl') OR wu.id = employee_id)
    )
);
CREATE POLICY "TL and Admin can manage appraisals" ON web_appraisal FOR ALL USING (
    EXISTS (
        SELECT 1 FROM web_users wu 
        WHERE wu.user_id = auth.uid() 
        AND wu.role IN ('admin', 'tl')
    )
);

-- Create indexes for performance
CREATE INDEX idx_web_users_user_id ON web_users(user_id);
CREATE INDEX idx_web_users_role ON web_users(role);
CREATE INDEX idx_web_projects_client_id ON web_projects(client_id);
CREATE INDEX idx_web_projects_status ON web_projects(status);
CREATE INDEX idx_web_assignments_employee_id ON web_assignments(employee_id);
CREATE INDEX idx_web_assignments_project_id ON web_assignments(project_id);
CREATE INDEX idx_web_monthly_entries_employee_id ON web_monthly_entries(employee_id);
CREATE INDEX idx_web_monthly_entries_project_id ON web_monthly_entries(project_id);
CREATE INDEX idx_web_monthly_entries_month ON web_monthly_entries(month);
CREATE INDEX idx_web_monthly_entries_status ON web_monthly_entries(status);
CREATE INDEX idx_web_appraisal_employee_id ON web_appraisal(employee_id);

-- Create view for employee dashboard
CREATE OR REPLACE VIEW web_employee_dashboard AS
SELECT 
    wu.id as employee_id,
    wu.name as employee_name,
    wu.email,
    wu.role,
    
    -- YTD Average Score
    COALESCE(AVG(CASE 
        WHEN wme.month >= TO_CHAR(DATE_TRUNC('year', CURRENT_DATE), 'YYYY-MM') 
        AND wme.status = 'approved' 
        THEN wme.month_score 
    END), 0) as ytd_avg_score,
    
    -- Last Month Score
    COALESCE(AVG(CASE 
        WHEN wme.month = TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 'YYYY-MM') 
        AND wme.status = 'approved' 
        THEN wme.month_score 
    END), 0) as last_month_score,
    
    -- Active Projects Count
    COUNT(DISTINCT CASE WHEN wp.status = 'active' THEN wp.id END) as active_projects,
    
    -- Average NPS (90 days)
    COALESCE(AVG(CASE 
        WHEN wme.created_at >= CURRENT_DATE - INTERVAL '90 days' 
        AND wme.nps_client IS NOT NULL 
        THEN wme.nps_client 
    END), 0) as avg_nps_90d,
    
    -- Current month entries count
    COUNT(CASE 
        WHEN wme.month = TO_CHAR(DATE_TRUNC('month', CURRENT_DATE), 'YYYY-MM') 
        THEN 1 
    END) as current_month_entries
    
FROM web_users wu
LEFT JOIN web_assignments wa ON wu.id = wa.employee_id AND wa.active = true
LEFT JOIN web_projects wp ON wa.project_id = wp.id
LEFT JOIN web_monthly_entries wme ON wu.id = wme.employee_id AND wp.id = wme.project_id
WHERE wu.role = 'employee' AND wu.status = 'active'
GROUP BY wu.id, wu.name, wu.email, wu.role;

-- Grant permissions
GRANT ALL ON web_users TO authenticated;
GRANT ALL ON web_projects TO authenticated;
GRANT ALL ON web_assignments TO authenticated;
GRANT ALL ON web_monthly_entries TO authenticated;
GRANT ALL ON web_appraisal TO authenticated;
GRANT SELECT ON web_employee_dashboard TO authenticated;

-- Insert sample data for testing
INSERT INTO web_users (name, email, role, user_id) VALUES 
('John Smith', 'john.smith@brandingpioneers.com', 'admin', gen_random_uuid()),
('Sarah Johnson', 'sarah.johnson@brandingpioneers.com', 'tl', gen_random_uuid()),
('Mike Chen', 'mike.chen@brandingpioneers.com', 'employee', gen_random_uuid()),
('Lisa Wong', 'lisa.wong@brandingpioneers.com', 'employee', gen_random_uuid())
ON CONFLICT (email) DO NOTHING;

COMMIT;