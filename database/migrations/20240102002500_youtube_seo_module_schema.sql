-- YouTube SEO Module Schema
-- Comprehensive schema for YouTube SEO performance tracking and management

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- YouTube SEO Users table
CREATE TABLE IF NOT EXISTS yt_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'tl', 'employee', 'reviewer')),
    department VARCHAR(50) DEFAULT 'YouTube' CHECK (department = 'YouTube'),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- YouTube Channels table
CREATE TABLE IF NOT EXISTS yt_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    handle VARCHAR(255),
    url VARCHAR(500),
    niche VARCHAR(100),
    client_name VARCHAR(255) NOT NULL,
    client_type VARCHAR(50) NOT NULL CHECK (client_type IN ('Standard', 'Premium', 'Enterprise')),
    scope_of_work TEXT,
    start_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- YouTube Monthly Entries table
CREATE TABLE IF NOT EXISTS yt_monthly_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES yt_users(id),
    channel_id UUID REFERENCES yt_channels(id),
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Scope & Planning
    scope_completed TEXT,
    activities_next_month TEXT,
    
    -- Growth & Visibility Metrics (Previous/Current)
    posts_prev INTEGER DEFAULT 0,
    posts_curr INTEGER DEFAULT 0,
    posts_growth_pct DECIMAL(5,2) DEFAULT 0,
    
    reach_prev BIGINT DEFAULT 0,
    reach_curr BIGINT DEFAULT 0,
    reach_growth_pct DECIMAL(5,2) DEFAULT 0,
    
    subs_prev BIGINT DEFAULT 0,
    subs_curr BIGINT DEFAULT 0,
    subs_growth_pct DECIMAL(5,2) DEFAULT 0,
    
    views_prev BIGINT DEFAULT 0,
    views_curr BIGINT DEFAULT 0,
    views_growth_pct DECIMAL(5,2) DEFAULT 0,
    
    watch_prev BIGINT DEFAULT 0, -- in minutes
    watch_curr BIGINT DEFAULT 0, -- in minutes
    watch_growth_pct DECIMAL(5,2) DEFAULT 0,
    
    ctr_prev DECIMAL(5,2) DEFAULT 0,
    ctr_curr DECIMAL(5,2) DEFAULT 0,
    ctr_growth_pct DECIMAL(5,2) DEFAULT 0,
    
    -- Content Output
    long_videos_count INTEGER DEFAULT 0,
    shorts_count INTEGER DEFAULT 0,
    community_posts INTEGER DEFAULT 0,
    collabs_count INTEGER DEFAULT 0,
    
    -- SEO Hygiene & Metadata
    metadata_completeness_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    chapters_usage_rate DECIMAL(5,2) DEFAULT 0,
    end_screens_cards_rate DECIMAL(5,2) DEFAULT 0,
    playlist_assignment_rate DECIMAL(5,2) DEFAULT 0,
    thumbs_a_b_tests INTEGER DEFAULT 0,
    
    -- Search Performance (optional)
    search_impressions_share DECIMAL(5,2) DEFAULT 0,
    search_click_share DECIMAL(5,2) DEFAULT 0,
    top_keywords_covered INTEGER DEFAULT 0,
    keywords_gaining_rank INTEGER DEFAULT 0,
    
    -- Retention Metrics
    avg_view_duration_sec INTEGER DEFAULT 0,
    avg_percent_viewed DECIMAL(5,2) DEFAULT 0,
    
    -- Client Management
    meetings_with_client INTEGER DEFAULT 0,
    nps_client DECIMAL(3,1) DEFAULT 0 CHECK (nps_client >= 0 AND nps_client <= 10),
    mentor_score DECIMAL(3,1) DEFAULT 0 CHECK (mentor_score >= 0 AND mentor_score <= 10),
    
    -- System Calculated Scores
    discoverability_score DECIMAL(4,1) DEFAULT 0,
    retention_quality_score DECIMAL(4,1) DEFAULT 0,
    content_consistency_score DECIMAL(4,1) DEFAULT 0,
    seo_hygiene_score DECIMAL(4,1) DEFAULT 0,
    search_performance_score DECIMAL(4,1) DEFAULT 0,
    relationship_score DECIMAL(4,1) DEFAULT 0,
    
    month_score DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    review_comment TEXT,
    reviewed_by UUID REFERENCES yt_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(employee_id, channel_id, month)
);

-- YouTube Appraisal table
CREATE TABLE IF NOT EXISTS yt_appraisal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES yt_users(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    avg_month_score DECIMAL(5,2) DEFAULT 0,
    final_rating_band VARCHAR(10) CHECK (final_rating_band IN ('A', 'B', 'C', 'D')),
    eligible_increment_pct DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES yt_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate growth percentages
CREATE OR REPLACE FUNCTION calculate_yt_growth_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate growth percentages
    NEW.posts_growth_pct = CASE 
        WHEN NEW.posts_prev > 0 THEN ((NEW.posts_curr - NEW.posts_prev)::DECIMAL / NEW.posts_prev) * 100
        ELSE 0
    END;
    
    NEW.reach_growth_pct = CASE 
        WHEN NEW.reach_prev > 0 THEN ((NEW.reach_curr - NEW.reach_prev)::DECIMAL / NEW.reach_prev) * 100
        ELSE 0
    END;
    
    NEW.subs_growth_pct = CASE 
        WHEN NEW.subs_prev > 0 THEN ((NEW.subs_curr - NEW.subs_prev)::DECIMAL / NEW.subs_prev) * 100
        ELSE 0
    END;
    
    NEW.views_growth_pct = CASE 
        WHEN NEW.views_prev > 0 THEN ((NEW.views_curr - NEW.views_prev)::DECIMAL / NEW.views_prev) * 100
        ELSE 0
    END;
    
    NEW.watch_growth_pct = CASE 
        WHEN NEW.watch_prev > 0 THEN ((NEW.watch_curr - NEW.watch_prev)::DECIMAL / NEW.watch_prev) * 100
        ELSE 0
    END;
    
    NEW.ctr_growth_pct = CASE 
        WHEN NEW.ctr_prev > 0 THEN ((NEW.ctr_curr - NEW.ctr_prev)::DECIMAL / NEW.ctr_prev) * 100
        ELSE 0
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate YouTube SEO monthly score (0-100 points)
CREATE OR REPLACE FUNCTION calculate_yt_monthly_score()
RETURNS TRIGGER AS $$
DECLARE
    channel_client_type VARCHAR(50);
    discoverability_pts DECIMAL(4,1) := 0;
    retention_pts DECIMAL(4,1) := 0;
    content_pts DECIMAL(4,1) := 0;
    seo_pts DECIMAL(4,1) := 0;
    search_pts DECIMAL(4,1) := 0;
    relationship_pts DECIMAL(4,1) := 0;
    penalty_pts DECIMAL(4,1) := 0;
BEGIN
    -- Get channel client type
    SELECT client_type INTO channel_client_type 
    FROM yt_channels WHERE id = NEW.channel_id;
    
    -- A) Discoverability & Growth — 30 pts
    -- Subs growth (0-12 pts)
    discoverability_pts = discoverability_pts + CASE
        WHEN NEW.subs_growth_pct >= 30 THEN 12
        WHEN NEW.subs_growth_pct >= 15 THEN 9
        WHEN NEW.subs_growth_pct >= 5 THEN 6
        WHEN NEW.subs_growth_pct >= 0 THEN 4
        WHEN NEW.subs_growth_pct >= -10 THEN 2
        ELSE 0
    END;
    
    -- Views growth (0-10 pts)
    discoverability_pts = discoverability_pts + CASE
        WHEN NEW.views_growth_pct >= 30 THEN 10
        WHEN NEW.views_growth_pct >= 15 THEN 7.5
        WHEN NEW.views_growth_pct >= 5 THEN 5
        WHEN NEW.views_growth_pct >= 0 THEN 3
        WHEN NEW.views_growth_pct >= -10 THEN 1.5
        ELSE 0
    END;
    
    -- CTR growth (0-8 pts)
    discoverability_pts = discoverability_pts + CASE
        WHEN NEW.ctr_growth_pct >= 30 THEN 8
        WHEN NEW.ctr_growth_pct >= 15 THEN 6
        WHEN NEW.ctr_growth_pct >= 5 THEN 4
        WHEN NEW.ctr_growth_pct >= 0 THEN 2
        ELSE 0
    END;
    
    -- B) Retention & Watch Quality — 25 pts
    -- Watch time growth (0-10 pts)
    retention_pts = retention_pts + CASE
        WHEN NEW.watch_growth_pct >= 30 THEN 10
        WHEN NEW.watch_growth_pct >= 15 THEN 7.5
        WHEN NEW.watch_growth_pct >= 5 THEN 5
        WHEN NEW.watch_growth_pct >= 0 THEN 3
        WHEN NEW.watch_growth_pct >= -10 THEN 1.5
        ELSE 0
    END;
    
    -- Average View Duration (0-10 pts)
    -- For long-form content
    IF NEW.long_videos_count > 0 THEN
        retention_pts = retention_pts + CASE
            WHEN NEW.avg_view_duration_sec >= 360 THEN 10 -- ≥6:00
            WHEN NEW.avg_view_duration_sec >= 240 THEN 8  -- 4:00-5:59
            WHEN NEW.avg_view_duration_sec >= 180 THEN 6  -- 3:00-3:59
            WHEN NEW.avg_view_duration_sec >= 120 THEN 4  -- 2:00-2:59
            WHEN NEW.avg_view_duration_sec > 0 THEN 2     -- <2:00
            ELSE 0
        END;
    -- For shorts content
    ELSIF NEW.shorts_count > 0 THEN
        retention_pts = retention_pts + CASE
            WHEN NEW.avg_percent_viewed >= 100 THEN 10
            WHEN NEW.avg_percent_viewed >= 80 THEN 8
            WHEN NEW.avg_percent_viewed >= 60 THEN 6
            WHEN NEW.avg_percent_viewed >= 40 THEN 4
            WHEN NEW.avg_percent_viewed > 0 THEN 2
            ELSE 0
        END;
    END IF;
    
    -- Consistency of retention (0-5 pts)
    -- Simplified: if avg metrics meet thresholds
    IF (NEW.avg_view_duration_sec >= 180 AND NEW.long_videos_count > 0) OR 
       (NEW.avg_percent_viewed >= 70 AND NEW.shorts_count > 0) THEN
        retention_pts = retention_pts + 5;
    END IF;
    
    -- C) Content Output & Consistency — 15 pts
    DECLARE
        long_target INTEGER;
        shorts_target INTEGER;
        community_target INTEGER;
        long_score DECIMAL(4,1) := 0;
        shorts_score DECIMAL(4,1) := 0;
        community_score DECIMAL(4,1) := 0;
    BEGIN
        -- Set targets based on client type
        CASE channel_client_type
            WHEN 'Premium' THEN
                long_target := 4;
                shorts_target := 12;
                community_target := 4;
            WHEN 'Standard' THEN
                long_target := 2;
                shorts_target := 8;
                community_target := 2;
            ELSE -- Enterprise or other
                long_target := 6;
                shorts_target := 16;
                community_target := 6;
        END CASE;
        
        -- Calculate scores for each content type (5 pts each)
        long_score = CASE
            WHEN NEW.long_videos_count >= long_target THEN 5
            WHEN NEW.long_videos_count >= (long_target * 0.75) THEN 3.75
            WHEN NEW.long_videos_count >= (long_target * 0.5) THEN 2.5
            ELSE 0
        END;
        
        shorts_score = CASE
            WHEN NEW.shorts_count >= shorts_target THEN 5
            WHEN NEW.shorts_count >= (shorts_target * 0.75) THEN 3.75
            WHEN NEW.shorts_count >= (shorts_target * 0.5) THEN 2.5
            ELSE 0
        END;
        
        community_score = CASE
            WHEN NEW.community_posts >= community_target THEN 5
            WHEN NEW.community_posts >= (community_target * 0.75) THEN 3.75
            WHEN NEW.community_posts >= (community_target * 0.5) THEN 2.5
            ELSE 0
        END;
        
        content_pts = long_score + shorts_score + community_score;
    END;
    
    -- D) SEO Hygiene & Metadata — 15 pts
    -- Metadata completeness (0-6 pts)
    seo_pts = seo_pts + CASE
        WHEN NEW.metadata_completeness_rate >= 90 THEN 6
        WHEN NEW.metadata_completeness_rate >= 80 THEN 5
        WHEN NEW.metadata_completeness_rate >= 70 THEN 4
        WHEN NEW.metadata_completeness_rate >= 60 THEN 3
        WHEN NEW.metadata_completeness_rate >= 40 THEN 2
        ELSE 0
    END;
    
    -- Chapters, end screens, playlists (0-6 pts total, 2 each)
    seo_pts = seo_pts + LEAST(2, NEW.chapters_usage_rate / 50); -- 0-2 pts
    seo_pts = seo_pts + LEAST(2, NEW.end_screens_cards_rate / 50); -- 0-2 pts
    seo_pts = seo_pts + LEAST(2, NEW.playlist_assignment_rate / 50); -- 0-2 pts
    
    -- Thumbnail testing (0-3 pts)
    seo_pts = seo_pts + CASE
        WHEN NEW.thumbs_a_b_tests >= 2 THEN 3
        WHEN NEW.thumbs_a_b_tests >= 1 THEN 2
        ELSE 0
    END;
    
    -- E) Search Surface Performance — 10 pts (optional)
    -- Search impressions & click share (0-6 pts)
    search_pts = search_pts + LEAST(3, NEW.search_impressions_share / 20); -- 0-3 pts
    search_pts = search_pts + LEAST(3, NEW.search_click_share / 20); -- 0-3 pts
    
    -- Keywords covered & gaining rank (0-4 pts)
    search_pts = search_pts + LEAST(2, NEW.top_keywords_covered / 5); -- 0-2 pts
    search_pts = search_pts + LEAST(2, NEW.keywords_gaining_rank / 3); -- 0-2 pts
    
    -- F) Relationship & QA — 5 pts
    relationship_pts = (NEW.nps_client / 10) * 3; -- 0-3 pts
    relationship_pts = relationship_pts + (NEW.mentor_score / 10) * 2; -- 0-2 pts
    
    -- Apply penalties
    -- Check for consecutive negative growth (simplified - would need previous month data)
    IF NEW.subs_growth_pct < 0 AND NEW.views_growth_pct < 0 THEN
        penalty_pts = penalty_pts + 5;
    END IF;
    
    -- Zero uploads penalty
    IF NEW.long_videos_count = 0 AND NEW.shorts_count = 0 AND NEW.community_posts = 0 THEN
        penalty_pts = penalty_pts + 10;
    END IF;
    
    -- Store individual scores
    NEW.discoverability_score = discoverability_pts;
    NEW.retention_quality_score = retention_pts;
    NEW.content_consistency_score = content_pts;
    NEW.seo_hygiene_score = seo_pts;
    NEW.search_performance_score = search_pts;
    NEW.relationship_score = relationship_pts;
    
    -- Calculate final score
    NEW.month_score = GREATEST(0, discoverability_pts + retention_pts + content_pts + seo_pts + search_pts + relationship_pts - penalty_pts);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER calculate_yt_growth_metrics_trigger
    BEFORE INSERT OR UPDATE ON yt_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_yt_growth_metrics();

CREATE TRIGGER calculate_yt_monthly_score_trigger
    BEFORE INSERT OR UPDATE ON yt_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_yt_monthly_score();

-- Updated timestamp triggers
CREATE TRIGGER update_yt_users_updated_at
    BEFORE UPDATE ON yt_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_channels_updated_at
    BEFORE UPDATE ON yt_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_monthly_entries_updated_at
    BEFORE UPDATE ON yt_monthly_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yt_appraisal_updated_at
    BEFORE UPDATE ON yt_appraisal
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE yt_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE yt_appraisal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for yt_users
CREATE POLICY "Users can view their own profile" ON yt_users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins and TLs can view all users" ON yt_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'tl')
        )
    );

CREATE POLICY "Admins can manage users" ON yt_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id::text = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- RLS Policies for yt_channels
CREATE POLICY "Users can view channels they work on" ON yt_channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM yt_monthly_entries 
            WHERE channel_id = yt_channels.id 
            AND employee_id::text = auth.uid()::text
        ) OR
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'tl')
        )
    );

CREATE POLICY "Admins and TLs can manage channels" ON yt_channels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'tl')
        )
    );

-- RLS Policies for yt_monthly_entries
CREATE POLICY "Users can view their own entries" ON yt_monthly_entries
    FOR SELECT USING (employee_id::text = auth.uid()::text);

CREATE POLICY "Users can create their own entries" ON yt_monthly_entries
    FOR INSERT WITH CHECK (employee_id::text = auth.uid()::text);

CREATE POLICY "Users can update their draft entries" ON yt_monthly_entries
    FOR UPDATE USING (
        employee_id::text = auth.uid()::text 
        AND status = 'draft'
    );

CREATE POLICY "TLs and Admins can view all entries" ON yt_monthly_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'tl')
        )
    );

CREATE POLICY "TLs and Admins can update entry status" ON yt_monthly_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'tl')
        )
    );

-- RLS Policies for yt_appraisal
CREATE POLICY "Users can view their own appraisals" ON yt_appraisal
    FOR SELECT USING (employee_id::text = auth.uid()::text);

CREATE POLICY "Admins and TLs can manage appraisals" ON yt_appraisal
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM yt_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'tl')
        )
    );

-- Create YouTube Employee Dashboard View
CREATE OR REPLACE VIEW yt_employee_dashboard AS
SELECT 
    u.id as employee_id,
    u.name as employee_name,
    u.email,
    u.role,
    
    -- YTD Average Score
    COALESCE((
        SELECT AVG(month_score) 
        FROM yt_monthly_entries yme 
        WHERE yme.employee_id = u.id 
        AND yme.status = 'approved'
        AND yme.month >= TO_CHAR(DATE_TRUNC('year', CURRENT_DATE), 'YYYY-MM')
    ), 0) as ytd_avg_score,
    
    -- Last Month Score
    COALESCE((
        SELECT month_score 
        FROM yt_monthly_entries yme 
        WHERE yme.employee_id = u.id 
        AND yme.status = 'approved'
        AND yme.month = TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'), 'YYYY-MM')
        LIMIT 1
    ), 0) as last_month_score,
    
    -- Active Channels Count
    COALESCE((
        SELECT COUNT(DISTINCT yme.channel_id)
        FROM yt_monthly_entries yme
        JOIN yt_channels yc ON yme.channel_id = yc.id
        WHERE yme.employee_id = u.id
        AND yc.status = 'active'
        AND yme.month >= TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months'), 'YYYY-MM')
    ), 0) as active_channels,
    
    -- Average Watch Time (90 days)
    COALESCE((
        SELECT AVG(watch_curr)
        FROM yt_monthly_entries yme
        WHERE yme.employee_id = u.id
        AND yme.status = 'approved'
        AND yme.month >= TO_CHAR(DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months'), 'YYYY-MM')
    ), 0) as avg_watch_time_90d,
    
    -- Performance Band
    CASE 
        WHEN COALESCE((
            SELECT AVG(month_score) 
            FROM yt_monthly_entries yme 
            WHERE yme.employee_id = u.id 
            AND yme.status = 'approved'
            AND yme.month >= TO_CHAR(DATE_TRUNC('year', CURRENT_DATE), 'YYYY-MM')
        ), 0) >= 85 THEN 'A'
        WHEN COALESCE((
            SELECT AVG(month_score) 
            FROM yt_monthly_entries yme 
            WHERE yme.employee_id = u.id 
            AND yme.status = 'approved'
            AND yme.month >= TO_CHAR(DATE_TRUNC('year', CURRENT_DATE), 'YYYY-MM')
        ), 0) >= 75 THEN 'B'
        WHEN COALESCE((
            SELECT AVG(month_score) 
            FROM yt_monthly_entries yme 
            WHERE yme.employee_id = u.id 
            AND yme.status = 'approved'
            AND yme.month >= TO_CHAR(DATE_TRUNC('year', CURRENT_DATE), 'YYYY-MM')
        ), 0) >= 65 THEN 'C'
        ELSE 'D'
    END as performance_band,
    
    u.created_at,
    u.updated_at
FROM yt_users u
WHERE u.status = 'active'
ORDER BY u.name;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_yt_monthly_entries_employee_month ON yt_monthly_entries(employee_id, month);
CREATE INDEX IF NOT EXISTS idx_yt_monthly_entries_channel_month ON yt_monthly_entries(channel_id, month);
CREATE INDEX IF NOT EXISTS idx_yt_monthly_entries_status ON yt_monthly_entries(status);
CREATE INDEX IF NOT EXISTS idx_yt_channels_client_id ON yt_channels(client_id);
CREATE INDEX IF NOT EXISTS idx_yt_channels_status ON yt_channels(status);
CREATE INDEX IF NOT EXISTS idx_yt_users_role ON yt_users(role);
CREATE INDEX IF NOT EXISTS idx_yt_users_email ON yt_users(email);

-- Insert sample data for testing (optional)
INSERT INTO yt_users (name, email, role, department) VALUES
('Alex Johnson', 'alex.johnson@company.com', 'employee', 'YouTube'),
('Sarah Chen', 'sarah.chen@company.com', 'tl', 'YouTube'),
('Mike Rodriguez', 'mike.rodriguez@company.com', 'admin', 'YouTube')
ON CONFLICT (email) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE yt_users IS 'YouTube SEO team users with role-based access';
COMMENT ON TABLE yt_channels IS 'YouTube channels managed by the team';
COMMENT ON TABLE yt_monthly_entries IS 'Monthly performance entries with comprehensive SEO metrics and 100-point scoring';
COMMENT ON TABLE yt_appraisal IS 'Performance appraisals based on monthly scores';
COMMENT ON VIEW yt_employee_dashboard IS 'Dashboard view showing key performance metrics for YouTube SEO employees';

COMMENT ON COLUMN yt_monthly_entries.month_score IS 'Calculated score out of 100: Discoverability(30) + Retention(25) + Content(15) + SEO(15) + Search(10) + Relationship(5)';
COMMENT ON COLUMN yt_monthly_entries.metadata_completeness_rate IS 'Percentage of videos with complete SEO metadata (titles, descriptions, tags)';
COMMENT ON COLUMN yt_monthly_entries.avg_view_duration_sec IS 'Average view duration in seconds for uploaded content';
COMMENT ON COLUMN yt_monthly_entries.search_impressions_share IS 'Percentage share of search impressions vs total impressions';