-- Migration: arcade_system_schema
-- Source: 16_arcade_system_schema.sql
-- Timestamp: 20240102001900

-- Arcade System Database Schema
-- This file creates all necessary tables for the employee points and rewards system

-- 1. Arcade Points Table - Main points tracking for each employee
CREATE TABLE IF NOT EXISTS arcade_points (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    current_points INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_redeemed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 2. Arcade Activities Table - Log of all point-earning activities
CREATE TABLE IF NOT EXISTS arcade_activities (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'client_engagement', 'content_creation', 'attendance', 'performance', 'polls'
    activity_subtype VARCHAR(100) NOT NULL, -- specific action like 'whatsapp_appreciation', 'google_review', etc.
    points_earned INTEGER NOT NULL,
    description TEXT,
    proof_url TEXT, -- URL to proof/evidence
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by INTEGER, -- HR/manager who approved
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES employees(id)
);

-- 3. Arcade Escalations Table - Negative point deductions
CREATE TABLE IF NOT EXISTS arcade_escalations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    escalation_type VARCHAR(50) NOT NULL, -- 'client_issues', 'meeting_attendance', 'performance', 'behavioral'
    escalation_subtype VARCHAR(100) NOT NULL, -- specific issue like 'whatsapp_complaint', 'call_escalation', etc.
    points_deducted INTEGER NOT NULL,
    description TEXT NOT NULL,
    reported_by INTEGER NOT NULL, -- HR/Team Leader who reported
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES employees(id)
);

-- 4. Arcade Redemptions Table - Track point redemptions
CREATE TABLE IF NOT EXISTS arcade_redemptions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL, -- 'individual', 'group', 'mystery_box'
    reward_name VARCHAR(200) NOT NULL,
    points_required INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'fulfilled'
    request_details TEXT,
    approved_by INTEGER, -- HR who approved
    approved_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES employees(id)
);

-- 5. Arcade Rewards Catalog Table - Available rewards
CREATE TABLE IF NOT EXISTS arcade_rewards (
    id SERIAL PRIMARY KEY,
    reward_type VARCHAR(50) NOT NULL, -- 'individual', 'group', 'mystery_box'
    reward_name VARCHAR(200) NOT NULL,
    points_required INTEGER NOT NULL,
    description TEXT,
    availability_status VARCHAR(20) DEFAULT 'available', -- 'available', 'unavailable', 'limited'
    special_requirements TEXT, -- e.g., "Minimum 50 points balance for WFH"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Arcade Audit Log Table - Track all point changes for transparency
CREATE TABLE IF NOT EXISTS arcade_audit_log (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'points_earned', 'points_deducted', 'points_redeemed'
    points_change INTEGER NOT NULL, -- positive for earning, negative for deduction/redemption
    reference_table VARCHAR(50), -- 'arcade_activities', 'arcade_escalations', 'arcade_redemptions'
    reference_id INTEGER, -- ID from the reference table
    performed_by INTEGER, -- who performed the action
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES employees(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_arcade_points_employee_id ON arcade_points(employee_id);
CREATE INDEX IF NOT EXISTS idx_arcade_activities_employee_id ON arcade_activities(employee_id);
CREATE INDEX IF NOT EXISTS idx_arcade_activities_status ON arcade_activities(status);
CREATE INDEX IF NOT EXISTS idx_arcade_escalations_employee_id ON arcade_escalations(employee_id);
CREATE INDEX IF NOT EXISTS idx_arcade_redemptions_employee_id ON arcade_redemptions(employee_id);
CREATE INDEX IF NOT EXISTS idx_arcade_redemptions_status ON arcade_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_arcade_audit_log_employee_id ON arcade_audit_log(employee_id);

-- Insert default rewards catalog
INSERT INTO arcade_rewards (reward_type, reward_name, points_required, description, special_requirements) VALUES
-- Individual Rewards
('individual', 'Work From Home (WFH)', 10, 'One day work from home', 'Minimum balance of 50 points required'),
('individual', 'Leave with Pay', 30, 'One day paid leave', NULL),
('individual', 'Movie Tickets (Pair)', 20, 'Two movie tickets', NULL),
('individual', 'Lunch with Leader', 20, 'Lunch meeting with team leader', NULL),
('individual', 'Lunch for Two', 20, 'Lunch voucher for two people', NULL),
('individual', 'Software Purchase', 20, 'Purchase of professional software', NULL),
('individual', 'Course Purchase', 20, 'Online course enrollment', NULL),
('individual', 'Netflix (3 Months)', 20, 'Netflix subscription for 3 months', NULL),
('individual', 'Mystery Box', 20, 'Random reward from mystery box collection', NULL),
-- Group Rewards
('group', 'Office Party', 500, 'Team office party', 'Collective points from team members'),
('group', 'One-day Trip', 1000, 'Team one-day outing', 'Collective points from team members'),
('group', 'Two-day Trip', 2000, 'Team two-day trip', 'Collective points from team members'),
-- Mystery Box Items
('mystery_box', 'Movie Tickets (Pair)', 0, 'Two movie tickets from mystery box', NULL),
('mystery_box', 'Board Game', 0, 'Board game from mystery box', NULL),
('mystery_box', 'Gourmet Coffee/Tea Set', 0, 'Premium coffee or tea set', NULL),
('mystery_box', 'Bluetooth Accessories', 0, 'Bluetooth headphones or speakers', NULL),
('mystery_box', 'Gift Cards', 0, 'Various gift cards', NULL),
('mystery_box', 'Professional Development Tools', 0, 'Professional tools and resources', NULL),
('mystery_box', 'Wellness Products', 0, 'Health and wellness items', NULL),
('mystery_box', 'Entertainment Subscriptions', 0, 'Various entertainment subscriptions', NULL);

-- Create triggers to update arcade_points table when activities/escalations/redemptions are added
CREATE OR REPLACE FUNCTION update_arcade_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle activities (points earned)
    IF TG_TABLE_NAME = 'arcade_activities' AND NEW.status = 'approved' THEN
        INSERT INTO arcade_points (employee_id, current_points, total_earned)
        VALUES (NEW.employee_id, NEW.points_earned, NEW.points_earned)
        ON CONFLICT (employee_id) DO UPDATE SET
            current_points = arcade_points.current_points + NEW.points_earned,
            total_earned = arcade_points.total_earned + NEW.points_earned,
            updated_at = NOW();
            
        -- Add to audit log
        INSERT INTO arcade_audit_log (employee_id, action_type, points_change, reference_table, reference_id, performed_by, description)
        VALUES (NEW.employee_id, 'points_earned', NEW.points_earned, 'arcade_activities', NEW.id, NEW.approved_by, NEW.description);
    END IF;
    
    -- Handle escalations (points deducted)
    IF TG_TABLE_NAME = 'arcade_escalations' THEN
        INSERT INTO arcade_points (employee_id, current_points)
        VALUES (NEW.employee_id, -NEW.points_deducted)
        ON CONFLICT (employee_id) DO UPDATE SET
            current_points = arcade_points.current_points - NEW.points_deducted,
            updated_at = NOW();
            
        -- Add to audit log
        INSERT INTO arcade_audit_log (employee_id, action_type, points_change, reference_table, reference_id, performed_by, description)
        VALUES (NEW.employee_id, 'points_deducted', -NEW.points_deducted, 'arcade_escalations', NEW.id, NEW.reported_by, NEW.description);
    END IF;
    
    -- Handle redemptions (points redeemed)
    IF TG_TABLE_NAME = 'arcade_redemptions' AND NEW.status = 'approved' THEN
        INSERT INTO arcade_points (employee_id, current_points, total_redeemed)
        VALUES (NEW.employee_id, -NEW.points_required, NEW.points_required)
        ON CONFLICT (employee_id) DO UPDATE SET
            current_points = arcade_points.current_points - NEW.points_required,
            total_redeemed = arcade_points.total_redeemed + NEW.points_required,
            updated_at = NOW();
            
        -- Add to audit log
        INSERT INTO arcade_audit_log (employee_id, action_type, points_change, reference_table, reference_id, performed_by, description)
        VALUES (NEW.employee_id, 'points_redeemed', -NEW.points_required, 'arcade_redemptions', NEW.id, NEW.approved_by, NEW.reward_name);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_arcade_points_activities
    AFTER INSERT OR UPDATE ON arcade_activities
    FOR EACH ROW EXECUTE FUNCTION update_arcade_points();

CREATE TRIGGER trigger_update_arcade_points_escalations
    AFTER INSERT ON arcade_escalations
    FOR EACH ROW EXECUTE FUNCTION update_arcade_points();

CREATE TRIGGER trigger_update_arcade_points_redemptions
    AFTER INSERT OR UPDATE ON arcade_redemptions
    FOR EACH ROW EXECUTE FUNCTION update_arcade_points();

-- Enable Row Level Security (RLS)
ALTER TABLE arcade_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcade_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (employees can only see their own data, HR can see all)
CREATE POLICY "Employees can view own arcade points" ON arcade_points
    FOR SELECT USING (employee_id = auth.uid()::integer);

CREATE POLICY "Employees can view own activities" ON arcade_activities
    FOR SELECT USING (employee_id = auth.uid()::integer);

CREATE POLICY "Employees can insert own activities" ON arcade_activities
    FOR INSERT WITH CHECK (employee_id = auth.uid()::integer);

CREATE POLICY "Employees can view own redemptions" ON arcade_redemptions
    FOR SELECT USING (employee_id = auth.uid()::integer);

CREATE POLICY "Employees can insert own redemptions" ON arcade_redemptions
    FOR INSERT WITH CHECK (employee_id = auth.uid()::integer);

CREATE POLICY "Everyone can view rewards catalog" ON arcade_rewards
    FOR SELECT USING (true);

CREATE POLICY "Employees can view own audit log" ON arcade_audit_log
    FOR SELECT USING (employee_id = auth.uid()::integer);

-- HR policies (assuming HR department has special access)
CREATE POLICY "HR can manage all arcade data" ON arcade_points
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::integer 
            AND department = 'HR'
        )
    );

CREATE POLICY "HR can manage all activities" ON arcade_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::integer 
            AND department = 'HR'
        )
    );

CREATE POLICY "HR can manage all escalations" ON arcade_escalations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::integer 
            AND department = 'HR'
        )
    );

CREATE POLICY "HR can manage all redemptions" ON arcade_redemptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::integer 
            AND department = 'HR'
        )
    );

CREATE POLICY "HR can manage rewards catalog" ON arcade_rewards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::integer 
            AND department = 'HR'
        )
    );

CREATE POLICY "HR can view all audit logs" ON arcade_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::integer 
            AND department = 'HR'
        )
    );

-- Create a view for employee arcade summary
CREATE OR REPLACE VIEW arcade_employee_summary AS
SELECT 
    e.id as employee_id,
    e.name as employee_name,
    e.department,
    COALESCE(ap.current_points, 0) as current_points,
    COALESCE(ap.total_earned, 0) as total_earned,
    COALESCE(ap.total_redeemed, 0) as total_redeemed,
    (
        SELECT COUNT(*) 
        FROM arcade_activities aa 
        WHERE aa.employee_id = e.id AND aa.status = 'pending'
    ) as pending_activities,
    (
        SELECT COUNT(*) 
        FROM arcade_redemptions ar 
        WHERE ar.employee_id = e.id AND ar.status = 'pending'
    ) as pending_redemptions
FROM employees e
LEFT JOIN arcade_points ap ON e.id = ap.employee_id
WHERE e.department != 'HR' AND e.employee_type != 'Intern';

COMMENT ON TABLE arcade_points IS 'Main points tracking for each employee in the Arcade system';
COMMENT ON TABLE arcade_activities IS 'Log of all point-earning activities submitted by employees';
COMMENT ON TABLE arcade_escalations IS 'Negative point deductions reported by HR/management';
COMMENT ON TABLE arcade_redemptions IS 'Point redemption requests and their status';
COMMENT ON TABLE arcade_rewards IS 'Catalog of available rewards and their point costs';
COMMENT ON TABLE arcade_audit_log IS 'Complete audit trail of all point changes for transparency';