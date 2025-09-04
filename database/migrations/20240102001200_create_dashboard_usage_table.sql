-- Migration: create_dashboard_usage_table
-- Source: 10_create_dashboard_usage_table.sql
-- Timestamp: 20240102001200

-- Create dashboard_usage table for tracking dashboard analytics and user interactions
-- This table stores real usage data instead of mock analytics currently used in DashboardAnalytics.jsx

CREATE TABLE IF NOT EXISTS dashboard_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Session information
    session_id UUID, -- Reference to user_sessions table
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('employee', 'manager', 'intern')),
    
    -- Page/Component tracking
    page_path VARCHAR(500) NOT NULL,
    component_name VARCHAR(100),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'page_view', 'component_load', 'button_click', 'form_submit', 
        'data_export', 'filter_apply', 'search', 'sort', 'refresh',
        'modal_open', 'modal_close', 'tab_switch', 'dropdown_select'
    )),
    
    -- Interaction details
    action_target VARCHAR(200), -- What was clicked/interacted with
    action_value TEXT, -- Value of the interaction (search term, filter value, etc.)
    interaction_duration INTEGER, -- Time spent on action in milliseconds
    
    -- Performance metrics
    page_load_time INTEGER, -- Page load time in milliseconds
    component_render_time INTEGER, -- Component render time in milliseconds
    api_response_time INTEGER, -- API call response time in milliseconds
    
    -- User context
    department VARCHAR(100),
    browser_info JSONB, -- Browser, OS, screen resolution, etc.
    device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
    
    -- Navigation tracking
    referrer_page VARCHAR(500), -- Previous page
    entry_page BOOLEAN DEFAULT false, -- Is this the entry point?
    exit_page BOOLEAN DEFAULT false, -- Is this where user left?
    
    -- Error tracking
    error_occurred BOOLEAN DEFAULT false,
    error_type VARCHAR(100),
    error_message TEXT,
    error_stack TEXT,
    
    -- Feature usage
    feature_flags JSONB, -- Active feature flags during this interaction
    ab_test_variant VARCHAR(50), -- A/B testing variant if applicable
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    session_start_time TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_user_id ON dashboard_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_session_id ON dashboard_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_timestamp ON dashboard_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_page_path ON dashboard_usage(page_path);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_action_type ON dashboard_usage(action_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_user_type ON dashboard_usage(user_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_department ON dashboard_usage(department);

-- Create composite indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_user_timestamp ON dashboard_usage(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_page_action ON dashboard_usage(page_path, action_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_dept_timestamp ON dashboard_usage(department, timestamp);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_session_timestamp ON dashboard_usage(session_id, timestamp);

-- Enable Row Level Security
ALTER TABLE dashboard_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own usage data
CREATE POLICY "Users can view their own usage" ON dashboard_usage
    FOR SELECT USING (
        user_name = current_setting('app.current_user_name', true)
        OR 
        current_setting('app.user_type', true) = 'manager'
    );

-- All authenticated users can insert their usage data
CREATE POLICY "Users can insert their usage" ON dashboard_usage
    FOR INSERT WITH CHECK (
        user_name = current_setting('app.current_user_name', true)
    );

-- Only managers can view all usage data
CREATE POLICY "Managers can view all usage" ON dashboard_usage
    FOR SELECT USING (
        current_setting('app.user_type', true) = 'manager'
    );

-- Create function to track page view
CREATE OR REPLACE FUNCTION track_page_view(
    p_user_id VARCHAR(255),
    p_user_name VARCHAR(255),
    p_user_type VARCHAR(20),
    p_page_path VARCHAR(500),
    p_department VARCHAR(100) DEFAULT NULL,
    p_session_id UUID DEFAULT NULL,
    p_referrer_page VARCHAR(500) DEFAULT NULL,
    p_page_load_time INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    INSERT INTO dashboard_usage (
        session_id, user_id, user_name, user_type,
        page_path, action_type, department,
        referrer_page, page_load_time,
        entry_page
    ) VALUES (
        p_session_id, p_user_id, p_user_name, p_user_type,
        p_page_path, 'page_view', p_department,
        p_referrer_page, p_page_load_time,
        p_referrer_page IS NULL -- Entry page if no referrer
    )
    RETURNING id INTO usage_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track user interaction
CREATE OR REPLACE FUNCTION track_user_interaction(
    p_user_id VARCHAR(255),
    p_user_name VARCHAR(255),
    p_user_type VARCHAR(20),
    p_page_path VARCHAR(500),
    p_action_type VARCHAR(50),
    p_action_target VARCHAR(200) DEFAULT NULL,
    p_action_value TEXT DEFAULT NULL,
    p_component_name VARCHAR(100) DEFAULT NULL,
    p_session_id UUID DEFAULT NULL,
    p_interaction_duration INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    INSERT INTO dashboard_usage (
        session_id, user_id, user_name, user_type,
        page_path, action_type, action_target, action_value,
        component_name, interaction_duration
    ) VALUES (
        p_session_id, p_user_id, p_user_name, p_user_type,
        p_page_path, p_action_type, p_action_target, p_action_value,
        p_component_name, p_interaction_duration
    )
    RETURNING id INTO usage_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get usage analytics
CREATE OR REPLACE FUNCTION get_usage_analytics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_department VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE(
    total_sessions BIGINT,
    unique_users BIGINT,
    total_page_views BIGINT,
    avg_session_duration DECIMAL(10,2),
    avg_page_load_time DECIMAL(8,2),
    most_visited_page VARCHAR(500),
    most_active_department VARCHAR(100),
    bounce_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH session_stats AS (
        SELECT 
            session_id,
            user_id,
            department,
            MIN(timestamp) as session_start,
            MAX(timestamp) as session_end,
            COUNT(*) as page_views,
            EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as session_duration
        FROM dashboard_usage
        WHERE timestamp BETWEEN start_date AND end_date
          AND (target_department IS NULL OR department = target_department)
          AND session_id IS NOT NULL
        GROUP BY session_id, user_id, department
    ),
    page_stats AS (
        SELECT 
            page_path,
            COUNT(*) as visits
        FROM dashboard_usage
        WHERE timestamp BETWEEN start_date AND end_date
          AND (target_department IS NULL OR department = target_department)
          AND action_type = 'page_view'
        GROUP BY page_path
        ORDER BY visits DESC
        LIMIT 1
    ),
    dept_stats AS (
        SELECT 
            department,
            COUNT(*) as activity_count
        FROM dashboard_usage
        WHERE timestamp BETWEEN start_date AND end_date
          AND department IS NOT NULL
        GROUP BY department
        ORDER BY activity_count DESC
        LIMIT 1
    )
    SELECT 
        COUNT(DISTINCT ss.session_id)::BIGINT as total_sessions,
        COUNT(DISTINCT ss.user_id)::BIGINT as unique_users,
        SUM(ss.page_views)::BIGINT as total_page_views,
        AVG(ss.session_duration)::DECIMAL(10,2) as avg_session_duration,
        (
            SELECT AVG(page_load_time)::DECIMAL(8,2)
            FROM dashboard_usage
            WHERE timestamp BETWEEN start_date AND end_date
              AND page_load_time IS NOT NULL
              AND (target_department IS NULL OR department = target_department)
        ) as avg_page_load_time,
        (SELECT page_path FROM page_stats LIMIT 1) as most_visited_page,
        (SELECT department FROM dept_stats LIMIT 1) as most_active_department,
        (
            SELECT 
                (COUNT(*) FILTER (WHERE page_views = 1) * 100.0 / COUNT(*))::DECIMAL(5,2)
            FROM session_stats
        ) as bounce_rate
    FROM session_stats ss;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(
    target_user_id VARCHAR(255),
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_sessions INTEGER,
    total_page_views INTEGER,
    avg_session_duration DECIMAL(8,2),
    most_used_features TEXT[],
    last_active TIMESTAMP WITH TIME ZONE,
    activity_by_day JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH user_sessions AS (
        SELECT 
            session_id,
            MIN(timestamp) as session_start,
            MAX(timestamp) as session_end,
            COUNT(*) as interactions,
            EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as duration
        FROM dashboard_usage
        WHERE user_id = target_user_id
          AND timestamp >= NOW() - (days_back || ' days')::INTERVAL
          AND session_id IS NOT NULL
        GROUP BY session_id
    ),
    feature_usage AS (
        SELECT 
            action_type,
            COUNT(*) as usage_count
        FROM dashboard_usage
        WHERE user_id = target_user_id
          AND timestamp >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY action_type
        ORDER BY usage_count DESC
        LIMIT 5
    ),
    daily_activity AS (
        SELECT 
            DATE(timestamp) as activity_date,
            COUNT(*) as daily_interactions
        FROM dashboard_usage
        WHERE user_id = target_user_id
          AND timestamp >= NOW() - (days_back || ' days')::INTERVAL
        GROUP BY DATE(timestamp)
        ORDER BY activity_date
    )
    SELECT 
        COUNT(DISTINCT us.session_id)::INTEGER as total_sessions,
        (
            SELECT COUNT(*)::INTEGER
            FROM dashboard_usage
            WHERE user_id = target_user_id
              AND action_type = 'page_view'
              AND timestamp >= NOW() - (days_back || ' days')::INTERVAL
        ) as total_page_views,
        AVG(us.duration)::DECIMAL(8,2) as avg_session_duration,
        (
            SELECT ARRAY_AGG(action_type)
            FROM feature_usage
        ) as most_used_features,
        (
            SELECT MAX(timestamp)
            FROM dashboard_usage
            WHERE user_id = target_user_id
        ) as last_active,
        (
            SELECT JSONB_OBJECT_AGG(activity_date, daily_interactions)
            FROM daily_activity
        ) as activity_by_day
    FROM user_sessions us;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track errors
CREATE OR REPLACE FUNCTION track_error(
    p_user_id VARCHAR(255),
    p_user_name VARCHAR(255),
    p_user_type VARCHAR(20),
    p_page_path VARCHAR(500),
    p_error_type VARCHAR(100),
    p_error_message TEXT,
    p_error_stack TEXT DEFAULT NULL,
    p_session_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    INSERT INTO dashboard_usage (
        session_id, user_id, user_name, user_type,
        page_path, action_type, error_occurred,
        error_type, error_message, error_stack
    ) VALUES (
        p_session_id, p_user_id, p_user_name, p_user_type,
        p_page_path, 'error', true,
        p_error_type, p_error_message, p_error_stack
    )
    RETURNING id INTO usage_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample dashboard usage data
INSERT INTO dashboard_usage (
    user_id, user_name, user_type, page_path, action_type,
    department, page_load_time, timestamp
) VALUES
('emp_001', 'John Doe', 'employee', '/dashboard', 'page_view', 'Web Development', 1200, NOW() - INTERVAL '1 hour'),
('emp_002', 'Jane Smith', 'manager', '/manager-dashboard', 'page_view', 'HR', 800, NOW() - INTERVAL '2 hours'),
('emp_003', 'Mike Johnson', 'employee', '/submissions', 'page_view', 'Accounts', 1500, NOW() - INTERVAL '3 hours'),
('emp_001', 'John Doe', 'employee', '/dashboard', 'button_click', 'Web Development', NULL, NOW() - INTERVAL '1 hour'),
('emp_002', 'Jane Smith', 'manager', '/manager-dashboard', 'data_export', 'HR', NULL, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard_usage TO authenticated;
GRANT EXECUTE ON FUNCTION track_page_view(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION track_user_interaction(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity_summary(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION track_error(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT, UUID) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE dashboard_usage IS 'Tracks real dashboard usage analytics and user interactions';
COMMENT ON COLUMN dashboard_usage.action_type IS 'Type of user interaction or system event';
COMMENT ON COLUMN dashboard_usage.page_load_time IS 'Page load time in milliseconds';
COMMENT ON COLUMN dashboard_usage.interaction_duration IS 'Time spent on specific interaction in milliseconds';
COMMENT ON FUNCTION track_page_view(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID, VARCHAR, INTEGER) IS 'Records a page view event';
COMMENT ON FUNCTION track_user_interaction(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, VARCHAR, UUID, INTEGER) IS 'Records a user interaction event';
COMMENT ON FUNCTION get_usage_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, VARCHAR) IS 'Returns comprehensive usage analytics';
COMMENT ON FUNCTION get_user_activity_summary(VARCHAR, INTEGER) IS 'Returns user activity summary and patterns';
COMMENT ON FUNCTION track_error(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT, TEXT, UUID) IS 'Records error events for debugging';