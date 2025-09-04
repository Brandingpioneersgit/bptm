-- Step 8: Create dashboard_usage table for analytics
-- Run this after step7_verify_setup.sql

-- Create dashboard_usage table for tracking dashboard analytics and user interactions
CREATE TABLE IF NOT EXISTS public.dashboard_usage (
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
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_user_id ON public.dashboard_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_session_id ON public.dashboard_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_timestamp ON public.dashboard_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_page_path ON public.dashboard_usage(page_path);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_user_type ON public.dashboard_usage(user_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_department ON public.dashboard_usage(department);

-- Create composite indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_user_timestamp ON public.dashboard_usage(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_page_action ON public.dashboard_usage(page_path, action_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_dept_timestamp ON public.dashboard_usage(department, timestamp);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_session_timestamp ON public.dashboard_usage(session_id, timestamp);

-- Enable Row Level Security
ALTER TABLE public.dashboard_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON public.dashboard_usage FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.dashboard_usage TO authenticated, anon;

-- Insert sample dashboard usage data
INSERT INTO public.dashboard_usage (
    user_id, user_name, user_type, page_path, action_type,
    department, page_load_time, timestamp
) VALUES
('rahul.sharma@testcompany.com', 'Rahul Sharma', 'employee', '/dashboard', 'page_view', 'Engineering', 1200, NOW() - INTERVAL '1 hour'),
('priya.patel@testcompany.com', 'Priya Patel', 'manager', '/manager-dashboard', 'page_view', 'Engineering', 800, NOW() - INTERVAL '2 hours'),
('sneha.gupta@testcompany.com', 'Sneha Gupta', 'employee', '/submissions', 'page_view', 'Marketing', 1500, NOW() - INTERVAL '3 hours'),
('rahul.sharma@testcompany.com', 'Rahul Sharma', 'employee', '/dashboard', 'button_click', 'Engineering', NULL, NOW() - INTERVAL '1 hour'),
('priya.patel@testcompany.com', 'Priya Patel', 'manager', '/manager-dashboard', 'data_export', 'Engineering', NULL, NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

SELECT 'Dashboard usage table created successfully!' as status;