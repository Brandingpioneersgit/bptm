-- =============================================
-- UI CONFIGURATION SCHEMA
-- =============================================
-- This migration creates tables for UI configuration, themes, and dynamic content
-- to support the centralized configuration system
-- Timestamp: 20240102005000

BEGIN;

-- =============================================
-- UI CONFIGURATION TABLES
-- =============================================

-- Dashboard Configuration Table
-- Stores configuration for different dashboard types and components
CREATE TABLE IF NOT EXISTS dashboard_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_type VARCHAR(50) NOT NULL, -- 'agency', 'intern', 'ads_executive', 'manager', etc.
    component_name VARCHAR(100) NOT NULL, -- 'performance_thresholds', 'learning_thresholds', etc.
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dashboard_type, component_name, config_key)
);

-- Theme Configuration Table
-- Stores theme settings and color schemes
CREATE TABLE IF NOT EXISTS theme_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_name VARCHAR(50) NOT NULL UNIQUE,
    theme_type VARCHAR(20) NOT NULL CHECK (theme_type IN ('light', 'dark', 'custom')),
    primary_color VARCHAR(7) NOT NULL, -- Hex color code
    secondary_color VARCHAR(7) NOT NULL,
    accent_color VARCHAR(7) NOT NULL,
    background_color VARCHAR(7) NOT NULL,
    text_color VARCHAR(7) NOT NULL,
    border_color VARCHAR(7) NOT NULL,
    success_color VARCHAR(7) NOT NULL,
    warning_color VARCHAR(7) NOT NULL,
    error_color VARCHAR(7) NOT NULL,
    info_color VARCHAR(7) NOT NULL,
    css_variables JSONB, -- Additional CSS custom properties
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation Configuration Table
-- Stores navigation menus and sidebar configurations
CREATE TABLE IF NOT EXISTS navigation_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nav_type VARCHAR(50) NOT NULL, -- 'sidebar', 'header', 'footer', 'breadcrumb'
    role VARCHAR(50) NOT NULL, -- User role this navigation applies to
    nav_items JSONB NOT NULL, -- Array of navigation items with labels, paths, icons
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nav_type, role)
);

-- Dynamic Content Table
-- Stores dynamic content like quotes, announcements, notifications
CREATE TABLE IF NOT EXISTS dynamic_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL, -- 'quote_of_day', 'announcement', 'notification', 'news_ticker'
    content_category VARCHAR(50), -- Additional categorization
    title VARCHAR(255),
    content TEXT NOT NULL,
    metadata JSONB, -- Additional data like author, source, etc.
    target_roles TEXT[], -- Array of roles this content applies to
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UI Component Settings Table
-- Stores settings for specific UI components
CREATE TABLE IF NOT EXISTS ui_component_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_type VARCHAR(100) NOT NULL, -- 'performance_card', 'stats_widget', 'chart_config'
    component_name VARCHAR(100) NOT NULL,
    settings JSONB NOT NULL, -- Component-specific settings
    applies_to_roles TEXT[], -- Array of roles this setting applies to
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(component_type, component_name)
);

-- Application Settings Table
-- Stores global application settings
CREATE TABLE IF NOT EXISTS application_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'object', 'array'
    description TEXT,
    is_system BOOLEAN DEFAULT false, -- System settings that shouldn't be modified by users
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_dashboard_type ON dashboard_configurations(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_component_name ON dashboard_configurations(component_name);
CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_active ON dashboard_configurations(is_active);

CREATE INDEX IF NOT EXISTS idx_theme_configurations_theme_type ON theme_configurations(theme_type);
CREATE INDEX IF NOT EXISTS idx_theme_configurations_default ON theme_configurations(is_default);
CREATE INDEX IF NOT EXISTS idx_theme_configurations_active ON theme_configurations(is_active);

CREATE INDEX IF NOT EXISTS idx_navigation_configurations_nav_type ON navigation_configurations(nav_type);
CREATE INDEX IF NOT EXISTS idx_navigation_configurations_role ON navigation_configurations(role);
CREATE INDEX IF NOT EXISTS idx_navigation_configurations_active ON navigation_configurations(is_active);

CREATE INDEX IF NOT EXISTS idx_dynamic_content_content_type ON dynamic_content(content_type);
CREATE INDEX IF NOT EXISTS idx_dynamic_content_target_roles ON dynamic_content USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_dynamic_content_active ON dynamic_content(is_active);
CREATE INDEX IF NOT EXISTS idx_dynamic_content_dates ON dynamic_content(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_ui_component_settings_component_type ON ui_component_settings(component_type);
CREATE INDEX IF NOT EXISTS idx_ui_component_settings_applies_to_roles ON ui_component_settings USING GIN(applies_to_roles);
CREATE INDEX IF NOT EXISTS idx_ui_component_settings_active ON ui_component_settings(is_active);

CREATE INDEX IF NOT EXISTS idx_application_settings_setting_key ON application_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_application_settings_setting_type ON application_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_application_settings_active ON application_settings(is_active);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert default theme configurations
INSERT INTO theme_configurations (
    theme_name, theme_type, primary_color, secondary_color, accent_color,
    background_color, text_color, border_color, success_color, warning_color,
    error_color, info_color, is_default
) VALUES 
(
    'Default Light', 'light', '#3B82F6', '#6B7280', '#10B981',
    '#FFFFFF', '#1F2937', '#E5E7EB', '#10B981', '#F59E0B',
    '#EF4444', '#3B82F6', true
),
(
    'Default Dark', 'dark', '#60A5FA', '#9CA3AF', '#34D399',
    '#1F2937', '#F9FAFB', '#374151', '#34D399', '#FBBF24',
    '#F87171', '#60A5FA', false
);

-- Insert default dashboard configurations
INSERT INTO dashboard_configurations (dashboard_type, component_name, config_key, config_value, description) VALUES
('intern', 'performance_thresholds', 'excellent', '85', 'Threshold for excellent performance'),
('intern', 'performance_thresholds', 'good', '70', 'Threshold for good performance'),
('intern', 'performance_thresholds', 'needs_improvement', '50', 'Threshold for needs improvement'),
('intern', 'learning_thresholds', 'courses_completed', '5', 'Number of courses for learning progress'),
('intern', 'learning_thresholds', 'certifications', '2', 'Number of certifications for learning progress'),
('ads_executive', 'performance_thresholds', 'excellent_roas', '4.0', 'ROAS threshold for excellent performance'),
('ads_executive', 'performance_thresholds', 'good_roas', '3.0', 'ROAS threshold for good performance'),
('ads_executive', 'performance_thresholds', 'needs_improvement_roas', '2.0', 'ROAS threshold for needs improvement'),
('manager', 'performance_thresholds', 'excellent', '90', 'Threshold for excellent team performance'),
('manager', 'performance_thresholds', 'good', '75', 'Threshold for good team performance'),
('manager', 'performance_thresholds', 'needs_improvement', '60', 'Threshold for needs improvement');

-- Insert default navigation configurations
INSERT INTO navigation_configurations (nav_type, role, nav_items) VALUES
('sidebar', 'intern', '[
    {"label": "Dashboard", "path": "/intern-dashboard", "icon": "dashboard"},
    {"label": "Tasks", "path": "/tasks", "icon": "tasks"},
    {"label": "Learning", "path": "/learning", "icon": "book"},
    {"label": "Reports", "path": "/reports", "icon": "chart"}
]'),
('sidebar', 'ads_executive', '[
    {"label": "Dashboard", "path": "/ads-dashboard", "icon": "dashboard"},
    {"label": "Campaigns", "path": "/campaigns", "icon": "megaphone"},
    {"label": "Analytics", "path": "/analytics", "icon": "chart"},
    {"label": "Clients", "path": "/clients", "icon": "users"}
]'),
('sidebar', 'manager', '[
    {"label": "Dashboard", "path": "/manager-dashboard", "icon": "dashboard"},
    {"label": "Team", "path": "/team", "icon": "users"},
    {"label": "Performance", "path": "/performance", "icon": "chart"},
    {"label": "Reports", "path": "/reports", "icon": "document"}
]');

-- Insert sample dynamic content
INSERT INTO dynamic_content (content_type, title, content, target_roles) VALUES
('quote_of_day', 'Daily Motivation', 'Success is not final, failure is not fatal: it is the courage to continue that counts.', ARRAY['intern', 'ads_executive', 'manager']),
('announcement', 'System Maintenance', 'Scheduled maintenance will occur this weekend from 2 AM to 4 AM.', ARRAY['intern', 'ads_executive', 'manager']),
('news_ticker', 'Company Update', 'Q4 results show 25% growth in client satisfaction scores.', ARRAY['manager', 'super_admin']);

-- Insert default application settings
INSERT INTO application_settings (setting_key, setting_value, setting_type, description, is_system) VALUES
('app_name', '"BPTM Dashboard"', 'string', 'Application name displayed in the header', false),
('default_theme', '"Default Light"', 'string', 'Default theme for new users', false),
('session_timeout', '3600', 'number', 'Session timeout in seconds', true),
('enable_notifications', 'true', 'boolean', 'Enable push notifications', false),
('max_file_upload_size', '10485760', 'number', 'Maximum file upload size in bytes (10MB)', true);

COMMIT;

-- =============================================
-- VERIFICATION
-- =============================================
SELECT 'UI Configuration schema created successfully!' as status;

-- Show created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'dashboard_configurations',
    'theme_configurations', 
    'navigation_configurations',
    'dynamic_content',
    'ui_component_settings',
    'application_settings'
)
ORDER BY table_name;