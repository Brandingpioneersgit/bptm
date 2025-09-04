-- Social Media Module Schema
-- Based on detailed product & data specifications
-- Supports role-based access, performance tracking, and scoring

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Social Media Users (extends base users table)
CREATE TABLE IF NOT EXISTS social_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'tl', 'employee', 'reviewer')),
    department VARCHAR(50) DEFAULT 'Social' NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Accounts (employee ↔ client + platform mapping)
CREATE TABLE IF NOT EXISTS social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES social_users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL, -- References clients table
    platform VARCHAR(50), -- nullable for "All" platforms
    scope TEXT,
    start_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Monthly Entries (main performance data)
CREATE TABLE IF NOT EXISTS social_monthly_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES social_users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    platform VARCHAR(50), -- nullable for aggregated data
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Employee inputs
    scope_completed TEXT,
    activities_next_month TEXT,
    
    -- Audience metrics (prev/curr)
    followers_prev INTEGER DEFAULT 0,
    followers_curr INTEGER DEFAULT 0,
    reach_prev INTEGER DEFAULT 0,
    reach_curr INTEGER DEFAULT 0,
    impressions_prev INTEGER DEFAULT 0,
    impressions_curr INTEGER DEFAULT 0,
    
    -- Engagement metrics
    engagement_prev INTEGER DEFAULT 0,
    engagement_curr INTEGER DEFAULT 0,
    
    -- Intent/traffic metrics
    profile_visits_prev INTEGER DEFAULT 0,
    profile_visits_curr INTEGER DEFAULT 0,
    website_clicks_prev INTEGER DEFAULT 0,
    website_clicks_curr INTEGER DEFAULT 0,
    
    -- Video performance metrics
    video_views_prev INTEGER DEFAULT 0,
    video_views_curr INTEGER DEFAULT 0,
    watch_time_prev INTEGER DEFAULT 0, -- in minutes
    watch_time_curr INTEGER DEFAULT 0,
    video_ctr_prev DECIMAL(5,2) DEFAULT 0,
    video_ctr_curr DECIMAL(5,2) DEFAULT 0,
    
    -- Content output counts
    videos_posted INTEGER DEFAULT 0,
    reels_posted INTEGER DEFAULT 0,
    stories_posted INTEGER DEFAULT 0,
    creator_collabs INTEGER DEFAULT 0,
    
    -- Client management
    meetings_with_client INTEGER DEFAULT 0,
    nps_client DECIMAL(3,1) CHECK (nps_client >= 0 AND nps_client <= 10),
    
    -- Mentor/TL input
    mentor_score_1_10 DECIMAL(3,1) CHECK (mentor_score_1_10 >= 0 AND mentor_score_1_10 <= 10),
    
    -- System calculated fields
    growth_followers DECIMAL(8,2),
    growth_reach DECIMAL(8,2),
    growth_impressions DECIMAL(8,2),
    growth_engagement DECIMAL(8,2),
    growth_profile_visits DECIMAL(8,2),
    growth_website_clicks DECIMAL(8,2),
    growth_video_views DECIMAL(8,2),
    growth_watch_time DECIMAL(8,2),
    growth_video_ctr DECIMAL(8,2),
    
    -- Scoring components
    content_consistency_score DECIMAL(5,2) DEFAULT 0,
    growth_score DECIMAL(5,2) DEFAULT 0,
    engagement_quality_score DECIMAL(5,2) DEFAULT 0,
    video_quality_score DECIMAL(5,2) DEFAULT 0,
    business_impact_score DECIMAL(5,2) DEFAULT 0,
    relationship_score DECIMAL(5,2) DEFAULT 0,
    
    -- Final scores and status
    month_score DECIMAL(5,2) DEFAULT 0 CHECK (month_score >= 0 AND month_score <= 100),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    review_comment TEXT,
    reviewed_by UUID REFERENCES social_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(employee_id, client_id, platform, month)
);

-- Social Appraisal (performance evaluation)
CREATE TABLE IF NOT EXISTS social_appraisal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES social_users(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    avg_month_score DECIMAL(5,2) DEFAULT 0,
    final_rating_band VARCHAR(1) CHECK (final_rating_band IN ('A', 'B', 'C', 'D')),
    eligible_increment_pct DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES social_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate growth percentages
CREATE OR REPLACE FUNCTION calculate_social_growth_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate growth percentages
    NEW.growth_followers = CASE 
        WHEN NEW.followers_prev > 0 THEN ((NEW.followers_curr - NEW.followers_prev)::DECIMAL / NEW.followers_prev) * 100
        ELSE 0
    END;
    
    NEW.growth_reach = CASE 
        WHEN NEW.reach_prev > 0 THEN ((NEW.reach_curr - NEW.reach_prev)::DECIMAL / NEW.reach_prev) * 100
        ELSE 0
    END;
    
    NEW.growth_impressions = CASE 
        WHEN NEW.impressions_prev > 0 THEN ((NEW.impressions_curr - NEW.impressions_prev)::DECIMAL / NEW.impressions_prev) * 100
        ELSE 0
    END;
    
    NEW.growth_engagement = CASE 
        WHEN NEW.engagement_prev > 0 THEN ((NEW.engagement_curr - NEW.engagement_prev)::DECIMAL / NEW.engagement_prev) * 100
        ELSE 0
    END;
    
    NEW.growth_profile_visits = CASE 
        WHEN NEW.profile_visits_prev > 0 THEN ((NEW.profile_visits_curr - NEW.profile_visits_prev)::DECIMAL / NEW.profile_visits_prev) * 100
        ELSE 0
    END;
    
    NEW.growth_website_clicks = CASE 
        WHEN NEW.website_clicks_prev > 0 THEN ((NEW.website_clicks_curr - NEW.website_clicks_prev)::DECIMAL / NEW.website_clicks_prev) * 100
        ELSE 0
    END;
    
    NEW.growth_video_views = CASE 
        WHEN NEW.video_views_prev > 0 THEN ((NEW.video_views_curr - NEW.video_views_prev)::DECIMAL / NEW.video_views_prev) * 100
        ELSE 0
    END;
    
    NEW.growth_watch_time = CASE 
        WHEN NEW.watch_time_prev > 0 THEN ((NEW.watch_time_curr - NEW.watch_time_prev)::DECIMAL / NEW.watch_time_prev) * 100
        ELSE 0
    END;
    
    NEW.growth_video_ctr = CASE 
        WHEN NEW.video_ctr_prev > 0 THEN ((NEW.video_ctr_curr - NEW.video_ctr_prev)::DECIMAL / NEW.video_ctr_prev) * 100
        ELSE 0
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly score based on specifications
CREATE OR REPLACE FUNCTION calculate_social_monthly_score()
RETURNS TRIGGER AS $$
DECLARE
    audience_score DECIMAL(5,2) := 0;
    engagement_score DECIMAL(5,2) := 0;
    video_score DECIMAL(5,2) := 0;
    content_score DECIMAL(5,2) := 0;
    business_score DECIMAL(5,2) := 0;
    relationship_score DECIMAL(5,2) := 0;
    penalty DECIMAL(5,2) := 0;
BEGIN
    -- A) Audience & Visibility Growth — 30 pts
    -- Followers Δ% (0–12)
    audience_score = audience_score + CASE 
        WHEN NEW.growth_followers >= 30 THEN 12
        WHEN NEW.growth_followers >= 15 THEN 9.6
        WHEN NEW.growth_followers >= 5 THEN 7.2
        WHEN NEW.growth_followers >= 0 THEN 4.8
        WHEN NEW.growth_followers >= -10 THEN 2.4
        ELSE 0
    END;
    
    -- Reach Δ% (0–10)
    audience_score = audience_score + CASE 
        WHEN NEW.growth_reach >= 30 THEN 10
        WHEN NEW.growth_reach >= 15 THEN 8
        WHEN NEW.growth_reach >= 5 THEN 6
        WHEN NEW.growth_reach >= 0 THEN 4
        WHEN NEW.growth_reach >= -10 THEN 2
        ELSE 0
    END;
    
    -- Impressions Δ% (0–8)
    audience_score = audience_score + CASE 
        WHEN NEW.growth_impressions >= 30 THEN 8
        WHEN NEW.growth_impressions >= 15 THEN 6.4
        WHEN NEW.growth_impressions >= 5 THEN 4.8
        WHEN NEW.growth_impressions >= 0 THEN 3.2
        WHEN NEW.growth_impressions >= -10 THEN 1.6
        ELSE 0
    END;
    
    -- B) Engagement Momentum — 20 pts
    -- Engagement Δ% (0–12)
    engagement_score = engagement_score + CASE 
        WHEN NEW.growth_engagement >= 30 THEN 12
        WHEN NEW.growth_engagement >= 15 THEN 9.6
        WHEN NEW.growth_engagement >= 5 THEN 7.2
        WHEN NEW.growth_engagement >= 0 THEN 4.8
        WHEN NEW.growth_engagement >= -10 THEN 2.4
        ELSE 0
    END;
    
    -- Engagement efficiency (0–8) - simplified calculation
    engagement_score = engagement_score + CASE 
        WHEN NEW.impressions_curr > 0 AND NEW.impressions_prev > 0 THEN
            LEAST(8, ((NEW.engagement_curr::DECIMAL / NEW.impressions_curr) / 
                     GREATEST(NEW.engagement_prev::DECIMAL / NEW.impressions_prev, 0.001)) * 4)
        ELSE 4
    END;
    
    -- C) Video Quality & Retention — 20 pts
    -- Video Views Δ% (0–6)
    video_score = video_score + CASE 
        WHEN NEW.growth_video_views >= 30 THEN 6
        WHEN NEW.growth_video_views >= 15 THEN 4.8
        WHEN NEW.growth_video_views >= 5 THEN 3.6
        WHEN NEW.growth_video_views >= 0 THEN 2.4
        WHEN NEW.growth_video_views >= -10 THEN 1.2
        ELSE 0
    END;
    
    -- Watch Time Δ% (0–8)
    video_score = video_score + CASE 
        WHEN NEW.growth_watch_time >= 30 THEN 8
        WHEN NEW.growth_watch_time >= 15 THEN 6.4
        WHEN NEW.growth_watch_time >= 5 THEN 4.8
        WHEN NEW.growth_watch_time >= 0 THEN 3.2
        WHEN NEW.growth_watch_time >= -10 THEN 1.6
        ELSE 0
    END;
    
    -- Video CTR Δ% (0–6)
    video_score = video_score + CASE 
        WHEN NEW.growth_video_ctr >= 30 THEN 6
        WHEN NEW.growth_video_ctr >= 15 THEN 4.8
        WHEN NEW.growth_video_ctr >= 5 THEN 3.6
        WHEN NEW.growth_video_ctr >= 0 THEN 2.4
        WHEN NEW.growth_video_ctr >= -10 THEN 1.2
        ELSE 0
    END;
    
    -- D) Content & Consistency — 15 pts (simplified)
    -- Assuming Large client targets: Reels≥12, Videos≥4, Stories≥20, Collabs≥2
    content_score = content_score + 
        CASE WHEN NEW.reels_posted >= 12 THEN 3.75 
             WHEN NEW.reels_posted >= 9 THEN 2.8125 
             WHEN NEW.reels_posted >= 6 THEN 1.875 
             ELSE 0 END +
        CASE WHEN NEW.videos_posted >= 4 THEN 3.75 
             WHEN NEW.videos_posted >= 3 THEN 2.8125 
             WHEN NEW.videos_posted >= 2 THEN 1.875 
             ELSE 0 END +
        CASE WHEN NEW.stories_posted >= 20 THEN 3.75 
             WHEN NEW.stories_posted >= 15 THEN 2.8125 
             WHEN NEW.stories_posted >= 10 THEN 1.875 
             ELSE 0 END +
        CASE WHEN NEW.creator_collabs >= 2 THEN 3.75 
             WHEN NEW.creator_collabs >= 1 THEN 2.8125 
             ELSE 0 END;
    
    -- E) Business Impact — 10 pts
    -- Profile Visits Δ% (0–5)
    business_score = business_score + CASE 
        WHEN NEW.growth_profile_visits >= 30 THEN 5
        WHEN NEW.growth_profile_visits >= 15 THEN 4
        WHEN NEW.growth_profile_visits >= 5 THEN 3
        WHEN NEW.growth_profile_visits >= 0 THEN 2
        WHEN NEW.growth_profile_visits >= -10 THEN 1
        ELSE 0
    END;
    
    -- Website Clicks Δ% (0–5)
    business_score = business_score + CASE 
        WHEN NEW.growth_website_clicks >= 30 THEN 5
        WHEN NEW.growth_website_clicks >= 15 THEN 4
        WHEN NEW.growth_website_clicks >= 5 THEN 3
        WHEN NEW.growth_website_clicks >= 0 THEN 2
        WHEN NEW.growth_website_clicks >= -10 THEN 1
        ELSE 0
    END;
    
    -- F) Relationship & QA — 5 pts
    relationship_score = relationship_score + 
        COALESCE((NEW.nps_client / 10) * 3, 0) + 
        COALESCE((NEW.mentor_score_1_10 / 10) * 2, 0);
    
    -- Apply penalties
    -- Zero posting penalty
    IF (NEW.videos_posted + NEW.reels_posted + NEW.stories_posted) = 0 THEN
        penalty = penalty + 10;
    END IF;
    
    -- Store component scores
    NEW.growth_score = audience_score;
    NEW.engagement_quality_score = engagement_score;
    NEW.video_quality_score = video_score;
    NEW.content_consistency_score = content_score;
    NEW.business_impact_score = business_score;
    NEW.relationship_score = relationship_score;
    
    -- Calculate final score
    NEW.month_score = GREATEST(0, audience_score + engagement_score + video_score + content_score + business_score + relationship_score - penalty);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER calculate_social_growth_before_insert_update
    BEFORE INSERT OR UPDATE ON social_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_social_growth_metrics();

CREATE TRIGGER calculate_social_score_before_insert_update
    BEFORE INSERT OR UPDATE ON social_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_social_monthly_score();

-- Updated at triggers
CREATE TRIGGER update_social_users_updated_at
    BEFORE UPDATE ON social_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
    BEFORE UPDATE ON social_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_monthly_entries_updated_at
    BEFORE UPDATE ON social_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_appraisal_updated_at
    BEFORE UPDATE ON social_appraisal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_accounts_employee_client ON social_accounts(employee_id, client_id);
CREATE INDEX IF NOT EXISTS idx_social_monthly_entries_employee_month ON social_monthly_entries(employee_id, month);
CREATE INDEX IF NOT EXISTS idx_social_monthly_entries_client_month ON social_monthly_entries(client_id, month);
CREATE INDEX IF NOT EXISTS idx_social_monthly_entries_status ON social_monthly_entries(status);
CREATE INDEX IF NOT EXISTS idx_social_appraisal_employee_period ON social_appraisal(employee_id, period_start, period_end);

-- Row Level Security (RLS)
ALTER TABLE social_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_appraisal ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Social Users policies
CREATE POLICY "Users can view their own profile" ON social_users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins and TLs can view all users" ON social_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM social_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'tl')
        )
    );

-- Social Accounts policies
CREATE POLICY "Users can view their own accounts" ON social_accounts
    FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Admins and TLs can view all accounts" ON social_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM social_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'tl')
        )
    );

-- Social Monthly Entries policies
CREATE POLICY "Users can manage their own entries" ON social_monthly_entries
    FOR ALL USING (auth.uid()::text = employee_id::text);

CREATE POLICY "TLs and Admins can view and review all entries" ON social_monthly_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM social_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'tl')
        )
    );

-- Social Appraisal policies
CREATE POLICY "Users can view their own appraisals" ON social_appraisal
    FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Admins and TLs can manage appraisals" ON social_appraisal
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM social_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'tl')
        )
    );

-- Dashboard view for employee performance
CREATE OR REPLACE VIEW social_employee_dashboard AS
SELECT 
    u.id as employee_id,
    u.name as employee_name,
    u.email,
    u.role,
    
    -- YTD metrics
    ROUND(AVG(sme.month_score), 2) as ytd_avg_score,
    
    -- Last month score
    (
        SELECT month_score 
        FROM social_monthly_entries sme2 
        WHERE sme2.employee_id = u.id 
        AND sme2.status = 'approved'
        ORDER BY sme2.month DESC 
        LIMIT 1
    ) as last_month_score,
    
    -- Active clients count
    (
        SELECT COUNT(DISTINCT client_id) 
        FROM social_accounts sa 
        WHERE sa.employee_id = u.id 
        AND sa.status = 'active'
    ) as active_clients_count,
    
    -- Average NPS (90 days)
    (
        SELECT ROUND(AVG(nps_client), 1) 
        FROM social_monthly_entries sme3 
        WHERE sme3.employee_id = u.id 
        AND sme3.created_at >= NOW() - INTERVAL '90 days'
        AND sme3.nps_client IS NOT NULL
    ) as avg_nps_90d
    
FROM social_users u
LEFT JOIN social_monthly_entries sme ON u.id = sme.employee_id 
    AND sme.status = 'approved'
    AND EXTRACT(YEAR FROM sme.created_at) = EXTRACT(YEAR FROM NOW())
WHERE u.role = 'employee'
GROUP BY u.id, u.name, u.email, u.role;

-- Grant permissions
GRANT SELECT ON social_employee_dashboard TO authenticated;
GRANT ALL ON social_users TO authenticated;
GRANT ALL ON social_accounts TO authenticated;
GRANT ALL ON social_monthly_entries TO authenticated;
GRANT ALL ON social_appraisal TO authenticated;

-- Insert sample data for testing
INSERT INTO social_users (name, email, role, department) VALUES
('John Smith', 'john.smith@company.com', 'admin', 'Social'),
('Sarah Johnson', 'sarah.johnson@company.com', 'tl', 'Social'),
('Mike Chen', 'mike.chen@company.com', 'employee', 'Social'),
('Lisa Wang', 'lisa.wang@company.com', 'employee', 'Social')
ON CONFLICT (email) DO NOTHING;

COMMIT;