-- Create Remaining Essential Tables
-- Run this in Supabase SQL Editor to complete the database setup

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create employee_kpis table
CREATE TABLE IF NOT EXISTS employee_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    kpi_name VARCHAR(255) NOT NULL,
    kpi_value DECIMAL(10,2),
    target_value DECIMAL(10,2),
    period_start DATE,
    period_end DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_attendance table
CREATE TABLE IF NOT EXISTS employee_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    hours_worked DECIMAL(4,2),
    status VARCHAR(50) DEFAULT 'present', -- present, absent, late, half_day
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES unified_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, error, success
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_notifications table
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    target_roles TEXT[], -- Array of roles this notification targets
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'normal',
    created_by UUID REFERENCES unified_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboard_configurations table
CREATE TABLE IF NOT EXISTS dashboard_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES unified_users(id) ON DELETE CASCADE,
    dashboard_type VARCHAR(100) NOT NULL, -- employee, manager, admin, etc.
    widget_config JSONB DEFAULT '{}',
    layout_config JSONB DEFAULT '{}',
    theme_preferences JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, dashboard_type)
);

-- Create tools table
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    url VARCHAR(500),
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    access_roles TEXT[], -- Array of roles that can access this tool
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_kpis_employee_id ON employee_kpis(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpis_period ON employee_kpis(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee_id ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON employee_attendance(date);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_system_notifications_is_active ON system_notifications(is_active);
CREATE INDEX IF NOT EXISTS idx_system_notifications_dates ON system_notifications(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_user_id ON dashboard_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_configurations_type ON dashboard_configurations(dashboard_type);

CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_is_active ON tools(is_active);

-- Enable Row Level Security
ALTER TABLE employee_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - adjust based on your auth requirements)

-- Employee KPIs policies
CREATE POLICY "Users can view their own KPIs" ON employee_kpis
    FOR SELECT USING (employee_id IN (
        SELECT id FROM employees WHERE email = auth.email()
    ));

CREATE POLICY "Managers can view team KPIs" ON employee_kpis
    FOR SELECT USING (true); -- Adjust based on your role system

-- Employee attendance policies
CREATE POLICY "Users can view their own attendance" ON employee_attendance
    FOR SELECT USING (employee_id IN (
        SELECT id FROM employees WHERE email = auth.email()
    ));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- System notifications policies
CREATE POLICY "All authenticated users can view active system notifications" ON system_notifications
    FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Dashboard configurations policies
CREATE POLICY "Users can manage their own dashboard configs" ON dashboard_configurations
    FOR ALL USING (user_id = auth.uid());

-- Tools policies
CREATE POLICY "All authenticated users can view active tools" ON tools
    FOR SELECT USING (is_active = true AND auth.role() = 'authenticated');

-- Create update timestamp function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_employee_kpis_updated_at BEFORE UPDATE ON employee_kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_attendance_updated_at BEFORE UPDATE ON employee_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_notifications_updated_at BEFORE UPDATE ON system_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_configurations_updated_at BEFORE UPDATE ON dashboard_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for tools table
INSERT INTO tools (name, description, category, url, is_active, access_roles) VALUES
('Employee Portal', 'Access employee dashboard and forms', 'Core', '/employee-dashboard', true, ARRAY['employee', 'manager', 'admin']),
('Manager Dashboard', 'Management tools and reports', 'Management', '/manager-dashboard', true, ARRAY['manager', 'admin']),
('Admin Panel', 'Administrative controls', 'Administration', '/admin-dashboard', true, ARRAY['admin']),
('KPI Tracker', 'Track and manage KPIs', 'Analytics', '/kpi-dashboard', true, ARRAY['employee', 'manager', 'admin']),
('Attendance System', 'Manage attendance records', 'HR', '/attendance', true, ARRAY['hr', 'manager', 'admin'])
ON CONFLICT DO NOTHING;

-- Insert sample system notification
INSERT INTO system_notifications (title, message, type, target_roles, is_active, priority) VALUES
('Database Setup Complete', 'All essential database tables have been created successfully. The application is now ready for use.', 'success', ARRAY['admin', 'manager'], true, 'normal')
ON CONFLICT DO NOTHING;

SELECT 'All remaining essential tables created successfully!' as status;