-- Create monthly_kpi_reports table for storing employee KPI data
CREATE TABLE IF NOT EXISTS monthly_kpi_reports (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    
    -- Client Management KPIs
    meetings_with_clients INTEGER DEFAULT 0,
    whatsapp_messages_sent INTEGER DEFAULT 0,
    client_issues_resolved INTEGER DEFAULT 0,
    client_satisfaction_score INTEGER DEFAULT 0 CHECK (client_satisfaction_score >= 0 AND client_satisfaction_score <= 10),
    
    -- Work Performance KPIs
    tasks_completed INTEGER DEFAULT 0,
    projects_delivered INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
    deadline_adherence INTEGER DEFAULT 0 CHECK (deadline_adherence >= 0 AND deadline_adherence <= 100),
    
    -- Learning & Growth KPIs
    learning_hours INTEGER DEFAULT 0,
    courses_completed INTEGER DEFAULT 0,
    certifications_earned INTEGER DEFAULT 0,
    
    -- Attendance & Engagement KPIs
    punctuality_score INTEGER DEFAULT 0 CHECK (punctuality_score >= 0 AND punctuality_score <= 100),
    team_collaboration_score INTEGER DEFAULT 0 CHECK (team_collaboration_score >= 0 AND team_collaboration_score <= 100),
    
    -- Additional Information
    achievements TEXT,
    challenges_faced TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(employee_id, month_year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monthly_kpi_reports_employee_id ON monthly_kpi_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_monthly_kpi_reports_month_year ON monthly_kpi_reports(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_kpi_reports_employee_month ON monthly_kpi_reports(employee_id, month_year);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_kpi_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_monthly_kpi_reports_updated_at
    BEFORE UPDATE ON monthly_kpi_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_kpi_reports_updated_at();

-- Add comments for documentation
COMMENT ON TABLE monthly_kpi_reports IS 'Stores monthly KPI data for employees';
COMMENT ON COLUMN monthly_kpi_reports.employee_id IS 'Reference to the employee';
COMMENT ON COLUMN monthly_kpi_reports.month_year IS 'Month and year in YYYY-MM format';
COMMENT ON COLUMN monthly_kpi_reports.client_satisfaction_score IS 'Client satisfaction rating from 1-10';
COMMENT ON COLUMN monthly_kpi_reports.quality_score IS 'Work quality percentage score';
COMMENT ON COLUMN monthly_kpi_reports.deadline_adherence IS 'Percentage of deadlines met';
COMMENT ON COLUMN monthly_kpi_reports.punctuality_score IS 'Punctuality percentage score';
COMMENT ON COLUMN monthly_kpi_reports.team_collaboration_score IS 'Team collaboration percentage score';