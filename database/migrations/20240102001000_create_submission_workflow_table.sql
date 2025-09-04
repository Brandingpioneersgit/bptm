-- Migration: create_submission_workflow_table
-- Source: 08_create_submission_workflow_table.sql
-- Timestamp: 20240102001000

-- Create submission_workflow table for manager evaluation and approval process tracking
-- This table stores workflow states, manager comments, and approval history for submissions

CREATE TABLE IF NOT EXISTS submission_workflow (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID NOT NULL,
    workflow_status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (
        workflow_status IN ('pending', 'under_review', 'approved', 'rejected', 'revision_requested', 'completed')
    ),
    reviewer_id VARCHAR(255), -- Manager or reviewer identifier
    reviewer_name VARCHAR(255),
    reviewer_type VARCHAR(50) DEFAULT 'manager' CHECK (reviewer_type IN ('manager', 'admin', 'supervisor')),
    
    -- Evaluation scores and metrics
    overall_score DECIMAL(3,1) CHECK (overall_score >= 0 AND overall_score <= 10),
    quality_score DECIMAL(3,1) CHECK (quality_score >= 0 AND quality_score <= 10),
    timeliness_score DECIMAL(3,1) CHECK (timeliness_score >= 0 AND timeliness_score <= 10),
    completeness_score DECIMAL(3,1) CHECK (completeness_score >= 0 AND completeness_score <= 10),
    
    -- Comments and feedback
    manager_comments TEXT,
    feedback_summary TEXT,
    improvement_suggestions TEXT,
    strengths_noted TEXT,
    
    -- Workflow tracking
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional metadata
    review_priority VARCHAR(20) DEFAULT 'normal' CHECK (review_priority IN ('low', 'normal', 'high', 'urgent')),
    estimated_review_time INTEGER, -- in minutes
    actual_review_time INTEGER, -- in minutes
    revision_count INTEGER DEFAULT 0,
    
    -- Testimonial and recognition
    testimonial_url TEXT,
    recognition_level VARCHAR(50) CHECK (recognition_level IN ('none', 'good', 'excellent', 'outstanding')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraint (will be enforced if submissions table exists)
    CONSTRAINT fk_submission_workflow_submission 
        FOREIGN KEY (submission_id) REFERENCES submissions(id) 
        ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submission_workflow_submission_id ON submission_workflow(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_workflow_status ON submission_workflow(workflow_status);
CREATE INDEX IF NOT EXISTS idx_submission_workflow_reviewer ON submission_workflow(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_submission_workflow_priority ON submission_workflow(review_priority);
CREATE INDEX IF NOT EXISTS idx_submission_workflow_submitted_at ON submission_workflow(submitted_at);
CREATE INDEX IF NOT EXISTS idx_submission_workflow_reviewed_at ON submission_workflow(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_submission_workflow_overall_score ON submission_workflow(overall_score);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_submission_workflow_status_priority ON submission_workflow(workflow_status, review_priority);
CREATE INDEX IF NOT EXISTS idx_submission_workflow_reviewer_status ON submission_workflow(reviewer_id, workflow_status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_submission_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-update workflow timestamps based on status changes
    IF OLD.workflow_status != NEW.workflow_status THEN
        CASE NEW.workflow_status
            WHEN 'under_review' THEN
                NEW.reviewed_at = NOW();
            WHEN 'approved' THEN
                NEW.approved_at = NOW();
            WHEN 'completed' THEN
                NEW.completed_at = NOW();
            ELSE
                -- Keep existing timestamps
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_submission_workflow_updated_at
    BEFORE UPDATE ON submission_workflow
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_workflow_updated_at();

-- Enable Row Level Security
ALTER TABLE submission_workflow ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Employees can view workflow for their own submissions
CREATE POLICY "Employees can view their submission workflows" ON submission_workflow
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM submissions s 
            WHERE s.id = submission_workflow.submission_id 
            AND s.employee->>'name' = current_setting('app.current_user_name', true)
        )
        OR 
        current_setting('app.user_type', true) = 'manager'
    );

-- Only managers can insert/update workflow records
CREATE POLICY "Managers can manage workflows" ON submission_workflow
    FOR ALL USING (
        current_setting('app.user_type', true) = 'manager'
    );

-- Create function to get pending reviews for a manager
CREATE OR REPLACE FUNCTION get_pending_reviews(reviewer_id_param VARCHAR(255) DEFAULT NULL)
RETURNS TABLE(
    workflow_id UUID,
    submission_id UUID,
    employee_name VARCHAR(255),
    department VARCHAR(255),
    month_key VARCHAR(7),
    submitted_at TIMESTAMP WITH TIME ZONE,
    review_priority VARCHAR(20),
    days_pending INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sw.id as workflow_id,
        sw.submission_id,
        (s.employee->>'name')::VARCHAR(255) as employee_name,
        (s.employee->>'department')::VARCHAR(255) as department,
        s.month_key,
        sw.submitted_at,
        sw.review_priority,
        EXTRACT(DAY FROM NOW() - sw.submitted_at)::INTEGER as days_pending
    FROM submission_workflow sw
    JOIN submissions s ON sw.submission_id = s.id
    WHERE sw.workflow_status IN ('pending', 'under_review')
      AND (reviewer_id_param IS NULL OR sw.reviewer_id = reviewer_id_param)
    ORDER BY 
        CASE sw.review_priority 
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
        END,
        sw.submitted_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update workflow status
CREATE OR REPLACE FUNCTION update_workflow_status(
    workflow_id_param UUID,
    new_status VARCHAR(50),
    reviewer_id_param VARCHAR(255),
    comments_param TEXT DEFAULT NULL,
    overall_score_param DECIMAL(3,1) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    workflow_exists BOOLEAN;
BEGIN
    UPDATE submission_workflow 
    SET 
        workflow_status = new_status,
        reviewer_id = reviewer_id_param,
        manager_comments = COALESCE(comments_param, manager_comments),
        overall_score = COALESCE(overall_score_param, overall_score),
        updated_at = NOW()
    WHERE id = workflow_id_param;
    
    GET DIAGNOSTICS workflow_exists = FOUND;
    
    RETURN workflow_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get workflow statistics
CREATE OR REPLACE FUNCTION get_workflow_statistics(date_from DATE DEFAULT NULL, date_to DATE DEFAULT NULL)
RETURNS TABLE(
    total_submissions INTEGER,
    pending_reviews INTEGER,
    completed_reviews INTEGER,
    avg_review_time_hours DECIMAL(5,2),
    avg_overall_score DECIMAL(3,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_submissions,
        COUNT(CASE WHEN workflow_status IN ('pending', 'under_review') THEN 1 END)::INTEGER as pending_reviews,
        COUNT(CASE WHEN workflow_status IN ('approved', 'completed') THEN 1 END)::INTEGER as completed_reviews,
        AVG(EXTRACT(EPOCH FROM (completed_at - submitted_at))/3600)::DECIMAL(5,2) as avg_review_time_hours,
        AVG(overall_score)::DECIMAL(3,2) as avg_overall_score
    FROM submission_workflow
    WHERE (date_from IS NULL OR DATE(submitted_at) >= date_from)
      AND (date_to IS NULL OR DATE(submitted_at) <= date_to);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample workflow data
INSERT INTO submission_workflow (submission_id, workflow_status, reviewer_id, reviewer_name, overall_score, manager_comments, submitted_at) 
SELECT 
    s.id,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'pending'
        WHEN RANDOM() < 0.6 THEN 'approved'
        ELSE 'completed'
    END as workflow_status,
    'manager_admin' as reviewer_id,
    'System Manager' as reviewer_name,
    (RANDOM() * 3 + 7)::DECIMAL(3,1) as overall_score, -- Random score between 7.0 and 10.0
    CASE 
        WHEN RANDOM() < 0.5 THEN 'Good work this month. Keep up the quality.'
        ELSE 'Excellent performance. Shows consistent improvement.'
    END as manager_comments,
    s.created_at as submitted_at
FROM submissions s
WHERE NOT EXISTS (
    SELECT 1 FROM submission_workflow sw WHERE sw.submission_id = s.id
)
LIMIT 10;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON submission_workflow TO authenticated;
GRANT USAGE ON SEQUENCE submission_workflow_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_reviews(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION update_workflow_status(UUID, VARCHAR, VARCHAR, TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_workflow_statistics(DATE, DATE) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE submission_workflow IS 'Tracks manager evaluation and approval workflow for submissions';
COMMENT ON COLUMN submission_workflow.workflow_status IS 'Current status of the submission in the review workflow';
COMMENT ON COLUMN submission_workflow.overall_score IS 'Manager-assigned overall performance score (0-10)';
COMMENT ON COLUMN submission_workflow.manager_comments IS 'Manager feedback and evaluation comments';
COMMENT ON COLUMN submission_workflow.review_priority IS 'Priority level for review processing';
COMMENT ON FUNCTION get_pending_reviews(VARCHAR) IS 'Returns submissions pending manager review';
COMMENT ON FUNCTION update_workflow_status(UUID, VARCHAR, VARCHAR, TEXT, DECIMAL) IS 'Updates workflow status and evaluation';
COMMENT ON FUNCTION get_workflow_statistics(DATE, DATE) IS 'Returns workflow performance statistics';