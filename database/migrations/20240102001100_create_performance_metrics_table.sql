-- Migration: create_performance_metrics_table
-- Source: 09_create_performance_metrics_table.sql
-- Timestamp: 20240102001100

-- Create performance_metrics table for KPI tracking and historical performance data
-- This table stores calculated performance metrics, trends, and analytics for dashboard reporting

CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Reference data
    employee_id VARCHAR(255), -- Reference to employee
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    month_key VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    submission_id UUID, -- Reference to submission if applicable
    
    -- Core performance scores
    overall_score DECIMAL(4,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    quality_score DECIMAL(4,2) CHECK (quality_score >= 0 AND quality_score <= 100),
    productivity_score DECIMAL(4,2) CHECK (productivity_score >= 0 AND productivity_score <= 100),
    timeliness_score DECIMAL(4,2) CHECK (timeliness_score >= 0 AND timeliness_score <= 100),
    collaboration_score DECIMAL(4,2) CHECK (collaboration_score >= 0 AND collaboration_score <= 100),
    
    -- KPI metrics by department
    -- HR metrics
    new_hires_processed INTEGER DEFAULT 0,
    employee_issues_resolved INTEGER DEFAULT 0,
    training_sessions_conducted INTEGER DEFAULT 0,
    
    -- Accounts metrics
    invoices_processed INTEGER DEFAULT 0,
    payments_collected DECIMAL(12,2) DEFAULT 0,
    accounts_accuracy_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Sales metrics
    leads_generated INTEGER DEFAULT 0,
    deals_closed INTEGER DEFAULT 0,
    revenue_generated DECIMAL(12,2) DEFAULT 0,
    client_satisfaction_score DECIMAL(3,1) DEFAULT 0,
    
    -- Operations metrics
    projects_completed INTEGER DEFAULT 0,
    efficiency_rating DECIMAL(3,1) DEFAULT 0,
    cost_savings_achieved DECIMAL(12,2) DEFAULT 0,
    
    -- Web/Digital metrics
    websites_delivered INTEGER DEFAULT 0,
    seo_improvements INTEGER DEFAULT 0,
    social_media_engagement DECIMAL(8,2) DEFAULT 0,
    ad_campaign_performance DECIMAL(5,2) DEFAULT 0,
    
    -- Growth and trend indicators
    month_over_month_growth DECIMAL(5,2), -- Percentage growth from previous month
    quarter_over_quarter_growth DECIMAL(5,2), -- Percentage growth from previous quarter
    year_over_year_growth DECIMAL(5,2), -- Percentage growth from previous year
    performance_trend VARCHAR(20) CHECK (performance_trend IN ('improving', 'stable', 'declining', 'volatile')),
    
    -- Attendance and engagement
    attendance_rate DECIMAL(5,2) DEFAULT 100, -- Percentage
    punctuality_score DECIMAL(3,1) DEFAULT 10, -- Out of 10
    engagement_level VARCHAR(20) CHECK (engagement_level IN ('low', 'medium', 'high', 'exceptional')),
    
    -- Goals and targets
    monthly_target_achievement DECIMAL(5,2), -- Percentage of monthly target achieved
    quarterly_target_achievement DECIMAL(5,2), -- Percentage of quarterly target achieved
    annual_target_achievement DECIMAL(5,2), -- Percentage of annual target achieved
    
    -- Recognition and feedback
    recognition_count INTEGER DEFAULT 0,
    feedback_score DECIMAL(3,1) DEFAULT 0, -- Average feedback score
    peer_rating DECIMAL(3,1) DEFAULT 0, -- Peer evaluation score
    
    -- Metadata
    calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(50) DEFAULT 'submission' CHECK (data_source IN ('submission', 'manual', 'automated', 'imported')),
    is_verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE(employee_id, month_key, data_source)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_employee_id ON performance_metrics(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_department ON performance_metrics(department);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_month_key ON performance_metrics(month_key);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_overall_score ON performance_metrics(overall_score);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_calculation_date ON performance_metrics(calculation_date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_performance_trend ON performance_metrics(performance_trend);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_performance_metrics_dept_month ON performance_metrics(department, month_key);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_employee_month ON performance_metrics(employee_id, month_key);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_trend_score ON performance_metrics(performance_trend, overall_score);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_performance_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_performance_metrics_updated_at
    BEFORE UPDATE ON performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_performance_metrics_updated_at();

-- Enable Row Level Security
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Employees can view their own metrics
CREATE POLICY "Employees can view their own metrics" ON performance_metrics
    FOR SELECT USING (
        employee_name = current_setting('app.current_user_name', true)
        OR 
        current_setting('app.user_type', true) = 'manager'
    );

-- Only managers can insert/update metrics
CREATE POLICY "Managers can manage metrics" ON performance_metrics
    FOR ALL USING (
        current_setting('app.user_type', true) = 'manager'
    );

-- Create function to calculate performance metrics from submissions
CREATE OR REPLACE FUNCTION calculate_performance_metrics(
    target_month_key VARCHAR(7) DEFAULT NULL,
    target_employee_id VARCHAR(255) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    submission_record RECORD;
    metrics_record performance_metrics%ROWTYPE;
    calculated_count INTEGER := 0;
BEGIN
    -- Loop through submissions to calculate metrics
    FOR submission_record IN 
        SELECT 
            s.*,
            sw.overall_score as workflow_score,
            sw.quality_score as workflow_quality,
            sw.timeliness_score as workflow_timeliness
        FROM submissions s
        LEFT JOIN submission_workflow sw ON s.id = sw.submission_id
        WHERE (target_month_key IS NULL OR s.month_key = target_month_key)
          AND (target_employee_id IS NULL OR (s.employee->>'name') = target_employee_id)
    LOOP
        -- Initialize metrics record
        metrics_record := ROW(
            gen_random_uuid(), -- id
            submission_record.employee->>'name', -- employee_id (using name as ID)
            submission_record.employee->>'name', -- employee_name
            submission_record.employee->>'department', -- department
            submission_record.month_key, -- month_key
            submission_record.id, -- submission_id
            
            -- Calculate scores (using submission total_score or workflow scores)
            COALESCE(submission_record.total_score * 10, submission_record.workflow_score, 75.0), -- overall_score
            COALESCE(submission_record.workflow_quality, submission_record.total_score * 10, 75.0), -- quality_score
            COALESCE(submission_record.workflow_timeliness, 80.0), -- productivity_score
            COALESCE(submission_record.workflow_timeliness, 85.0), -- timeliness_score
            80.0, -- collaboration_score (default)
            
            -- Department-specific metrics (extracted from submission data)
            CASE WHEN submission_record.employee->>'department' = 'HR' 
                 THEN COALESCE((submission_record.meta->'internalKpis'->>'newHires')::INTEGER, 0) 
                 ELSE 0 END, -- new_hires_processed
            CASE WHEN submission_record.employee->>'department' = 'HR' 
                 THEN COALESCE((submission_record.meta->'internalKpis'->>'issuesResolved')::INTEGER, 0) 
                 ELSE 0 END, -- employee_issues_resolved
            CASE WHEN submission_record.employee->>'department' = 'HR' 
                 THEN COALESCE((submission_record.meta->'internalKpis'->>'trainingSessions')::INTEGER, 0) 
                 ELSE 0 END, -- training_sessions_conducted
            
            CASE WHEN submission_record.employee->>'department' = 'Accounts' 
                 THEN COALESCE((submission_record.meta->'internalKpis'->>'invoicesProcessed')::INTEGER, 0) 
                 ELSE 0 END, -- invoices_processed
            CASE WHEN submission_record.employee->>'department' = 'Accounts' 
                 THEN COALESCE((submission_record.meta->'internalKpis'->>'paymentsCollected')::DECIMAL, 0) 
                 ELSE 0 END, -- payments_collected
            90.0, -- accounts_accuracy_rate (default)
            
            0, 0, 0.0, 0.0, -- sales metrics (defaults)
            0, 0.0, 0.0, -- operations metrics (defaults)
            0, 0, 0.0, 0.0, -- web/digital metrics (defaults)
            
            -- Growth indicators (calculated later)
            NULL, NULL, NULL, 'stable', -- growth and trend
            
            -- Attendance and engagement
            95.0, 9.0, 'high', -- attendance, punctuality, engagement
            
            -- Goals and targets
            NULL, NULL, NULL, -- target achievements
            
            -- Recognition
            0, 0.0, 0.0, -- recognition and ratings
            
            -- Metadata
            NOW(), 'submission', false, NULL, NULL, -- calculation metadata
            NOW(), NOW() -- audit fields
        );
        
        -- Insert or update the metrics record
        INSERT INTO performance_metrics 
        SELECT metrics_record.*
        ON CONFLICT (employee_id, month_key, data_source) 
        DO UPDATE SET
            overall_score = EXCLUDED.overall_score,
            quality_score = EXCLUDED.quality_score,
            productivity_score = EXCLUDED.productivity_score,
            timeliness_score = EXCLUDED.timeliness_score,
            new_hires_processed = EXCLUDED.new_hires_processed,
            employee_issues_resolved = EXCLUDED.employee_issues_resolved,
            training_sessions_conducted = EXCLUDED.training_sessions_conducted,
            invoices_processed = EXCLUDED.invoices_processed,
            payments_collected = EXCLUDED.payments_collected,
            calculation_date = NOW(),
            updated_at = NOW();
        
        calculated_count := calculated_count + 1;
    END LOOP;
    
    RETURN calculated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get department performance summary
CREATE OR REPLACE FUNCTION get_department_performance(
    target_department VARCHAR(100),
    start_month VARCHAR(7) DEFAULT NULL,
    end_month VARCHAR(7) DEFAULT NULL
)
RETURNS TABLE(
    month_key VARCHAR(7),
    avg_overall_score DECIMAL(5,2),
    avg_quality_score DECIMAL(5,2),
    total_employees INTEGER,
    top_performer VARCHAR(255),
    performance_trend VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.month_key,
        AVG(pm.overall_score)::DECIMAL(5,2) as avg_overall_score,
        AVG(pm.quality_score)::DECIMAL(5,2) as avg_quality_score,
        COUNT(DISTINCT pm.employee_id)::INTEGER as total_employees,
        (SELECT employee_name FROM performance_metrics pm2 
         WHERE pm2.department = target_department AND pm2.month_key = pm.month_key 
         ORDER BY pm2.overall_score DESC LIMIT 1) as top_performer,
        MODE() WITHIN GROUP (ORDER BY pm.performance_trend) as performance_trend
    FROM performance_metrics pm
    WHERE pm.department = target_department
      AND (start_month IS NULL OR pm.month_key >= start_month)
      AND (end_month IS NULL OR pm.month_key <= end_month)
    GROUP BY pm.month_key
    ORDER BY pm.month_key DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get employee performance history
CREATE OR REPLACE FUNCTION get_employee_performance_history(
    target_employee_id VARCHAR(255),
    months_back INTEGER DEFAULT 12
)
RETURNS TABLE(
    month_key VARCHAR(7),
    overall_score DECIMAL(4,2),
    quality_score DECIMAL(4,2),
    productivity_score DECIMAL(4,2),
    month_over_month_growth DECIMAL(5,2),
    performance_trend VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.month_key,
        pm.overall_score,
        pm.quality_score,
        pm.productivity_score,
        pm.month_over_month_growth,
        pm.performance_trend
    FROM performance_metrics pm
    WHERE pm.employee_id = target_employee_id
      AND pm.calculation_date >= NOW() - (months_back || ' months')::INTERVAL
    ORDER BY pm.month_key DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample performance metrics data
INSERT INTO performance_metrics (
    employee_id, employee_name, department, month_key, 
    overall_score, quality_score, productivity_score, timeliness_score,
    performance_trend, attendance_rate, engagement_level
) VALUES
('emp_001', 'John Doe', 'Web Development', '2024-01', 85.5, 88.0, 82.0, 90.0, 'improving', 98.5, 'high'),
('emp_002', 'Jane Smith', 'HR', '2024-01', 92.0, 95.0, 89.0, 94.0, 'stable', 100.0, 'exceptional'),
('emp_003', 'Mike Johnson', 'Accounts', '2024-01', 78.5, 80.0, 77.0, 85.0, 'improving', 95.0, 'medium'),
('emp_004', 'Sarah Wilson', 'Sales', '2024-01', 88.0, 85.0, 91.0, 87.0, 'stable', 97.0, 'high')
ON CONFLICT (employee_id, month_key, data_source) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON performance_metrics TO authenticated;
GRANT USAGE ON SEQUENCE performance_metrics_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_performance_metrics(VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_department_performance(VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employee_performance_history(VARCHAR, INTEGER) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE performance_metrics IS 'Stores calculated performance metrics and KPI data for employees';
COMMENT ON COLUMN performance_metrics.overall_score IS 'Calculated overall performance score (0-100)';
COMMENT ON COLUMN performance_metrics.month_over_month_growth IS 'Percentage growth compared to previous month';
COMMENT ON COLUMN performance_metrics.performance_trend IS 'Trend indicator based on recent performance';
COMMENT ON FUNCTION calculate_performance_metrics(VARCHAR, VARCHAR) IS 'Calculates performance metrics from submission data';
COMMENT ON FUNCTION get_department_performance(VARCHAR, VARCHAR, VARCHAR) IS 'Returns department performance summary';
COMMENT ON FUNCTION get_employee_performance_history(VARCHAR, INTEGER) IS 'Returns employee performance history';