-- Migration: performance_concerns_schema
-- Source: 15_performance_concerns_schema.sql
-- Timestamp: 20240102001800

-- Performance Concerns and Employee Performance Tracking Schema
-- This schema supports performance management, concerns tracking, and PIP processes

-- Table for tracking employee performance scores
CREATE TABLE IF NOT EXISTS employee_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    performance_period VARCHAR(50) NOT NULL, -- e.g., 'Q1-2024', 'H1-2024'
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 10),
    productivity_score DECIMAL(3,2) CHECK (productivity_score >= 0 AND productivity_score <= 10),
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 10),
    communication_score DECIMAL(3,2) CHECK (communication_score >= 0 AND communication_score <= 10),
    teamwork_score DECIMAL(3,2) CHECK (teamwork_score >= 0 AND teamwork_score <= 10),
    attendance_score DECIMAL(3,2) CHECK (attendance_score >= 0 AND attendance_score <= 10),
    performance_status VARCHAR(20) DEFAULT 'satisfactory' CHECK (performance_status IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory')),
    is_low_performer BOOLEAN DEFAULT FALSE,
    evaluated_by UUID REFERENCES employees(id),
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for performance concerns form submissions
CREATE TABLE IF NOT EXISTS performance_concerns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    performance_id UUID REFERENCES employee_performance(id),
    
    -- Overview of Performance Concerns
    understanding_concerns TEXT,
    feedback_feelings TEXT,
    
    -- Self-Assessment
    challenges_faced TEXT,
    less_confident_areas TEXT,
    
    -- Work Environment and Support
    team_manager_support TEXT,
    lacking_resources TEXT,
    work_environment_perception TEXT,
    
    -- Specific Instances
    challenging_situations TEXT,
    unmet_expectations_examples TEXT,
    
    -- Professional Skills and Training
    training_needs TEXT,
    skills_update_methods TEXT,
    
    -- Feedback and Communication
    supervisor_communication_effectiveness TEXT,
    communication_examples TEXT,
    helpful_feedback_types TEXT,
    
    -- Personal Circumstances
    personal_circumstances TEXT,
    work_life_balance TEXT,
    
    -- Future Focus
    suggested_role_changes TEXT,
    short_term_commitments TEXT,
    long_term_commitments TEXT,
    
    -- Support Expectations
    beneficial_support_types TEXT,
    barriers_to_address TEXT,
    
    -- Closing and Open Comments
    additional_comments TEXT,
    pip_questions_concerns TEXT,
    
    submission_status VARCHAR(20) DEFAULT 'submitted' CHECK (submission_status IN ('draft', 'submitted', 'under_review', 'reviewed', 'action_planned')),
    reviewed_by UUID REFERENCES employees(id),
    review_date TIMESTAMP,
    hr_notes TEXT,
    action_plan TEXT,
    follow_up_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for Performance Improvement Plans (PIP)
CREATE TABLE IF NOT EXISTS performance_improvement_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    performance_concern_id UUID REFERENCES performance_concerns(id),
    
    plan_title VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_weeks INTEGER DEFAULT 12,
    
    -- Goals and Objectives
    performance_goals TEXT NOT NULL,
    specific_objectives JSONB, -- Array of specific objectives with deadlines
    success_metrics TEXT,
    
    -- Support and Resources
    training_provided TEXT,
    mentoring_assigned TEXT,
    resources_allocated TEXT,
    
    -- Review Schedule
    review_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (review_frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
    next_review_date DATE,
    
    -- Status and Outcomes
    pip_status VARCHAR(20) DEFAULT 'active' CHECK (pip_status IN ('draft', 'active', 'on_track', 'at_risk', 'completed_successful', 'completed_unsuccessful', 'terminated')),
    final_outcome VARCHAR(50),
    completion_notes TEXT,
    
    created_by UUID REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for PIP progress tracking
CREATE TABLE IF NOT EXISTS pip_progress_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pip_id UUID REFERENCES performance_improvement_plans(id) ON DELETE CASCADE,
    review_date DATE NOT NULL,
    reviewer_id UUID REFERENCES employees(id),
    
    progress_rating VARCHAR(20) CHECK (progress_rating IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory')),
    objectives_met INTEGER DEFAULT 0,
    total_objectives INTEGER DEFAULT 0,
    
    achievements TEXT,
    challenges TEXT,
    support_needed TEXT,
    next_steps TEXT,
    
    is_on_track BOOLEAN DEFAULT TRUE,
    concerns_raised TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_improvement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pip_progress_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_performance
CREATE POLICY "Employees can view their own performance" ON employee_performance
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Managers and HR can view all performance" ON employee_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'hr', 'admin')
        )
    );

CREATE POLICY "Managers and HR can insert performance" ON employee_performance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'hr', 'admin')
        )
    );

CREATE POLICY "Managers and HR can update performance" ON employee_performance
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'hr', 'admin')
        )
    );

-- RLS Policies for performance_concerns
CREATE POLICY "Employees can view their own concerns" ON performance_concerns
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Low performers can insert concerns" ON performance_concerns
    FOR INSERT WITH CHECK (
        employee_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM employee_performance 
            WHERE employee_id = auth.uid() 
            AND is_low_performer = TRUE
        )
    );

CREATE POLICY "Employees can update their own concerns" ON performance_concerns
    FOR UPDATE USING (employee_id = auth.uid());

CREATE POLICY "Managers and HR can view all concerns" ON performance_concerns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'hr', 'admin')
        )
    );

CREATE POLICY "Managers and HR can update concerns" ON performance_concerns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'hr', 'admin')
        )
    );

-- RLS Policies for performance_improvement_plans
CREATE POLICY "Employees can view their own PIP" ON performance_improvement_plans
    FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "Managers and HR can view all PIPs" ON performance_improvement_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'hr', 'admin')
        )
    );

CREATE POLICY "Managers and HR can manage PIPs" ON performance_improvement_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'hr', 'admin')
        )
    );

-- RLS Policies for pip_progress_reviews
CREATE POLICY "Employees can view their PIP reviews" ON pip_progress_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM performance_improvement_plans 
            WHERE id = pip_progress_reviews.pip_id 
            AND employee_id = auth.uid()
        )
    );

CREATE POLICY "Managers and HR can manage PIP reviews" ON pip_progress_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid() 
            AND role IN ('manager', 'hr', 'admin')
        )
    );

-- Functions for performance management

-- Function to check if employee is low performer
CREATE OR REPLACE FUNCTION is_employee_low_performer(emp_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM employee_performance 
        WHERE employee_id = emp_id 
        AND is_low_performer = TRUE
        AND evaluation_date >= CURRENT_DATE - INTERVAL '6 months'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to submit performance concerns
CREATE OR REPLACE FUNCTION submit_performance_concerns(
    p_understanding_concerns TEXT,
    p_feedback_feelings TEXT,
    p_challenges_faced TEXT,
    p_less_confident_areas TEXT,
    p_team_manager_support TEXT,
    p_lacking_resources TEXT,
    p_work_environment_perception TEXT,
    p_challenging_situations TEXT,
    p_unmet_expectations_examples TEXT,
    p_training_needs TEXT,
    p_skills_update_methods TEXT,
    p_supervisor_communication_effectiveness TEXT,
    p_communication_examples TEXT,
    p_helpful_feedback_types TEXT,
    p_personal_circumstances TEXT,
    p_work_life_balance TEXT,
    p_suggested_role_changes TEXT,
    p_short_term_commitments TEXT,
    p_long_term_commitments TEXT,
    p_beneficial_support_types TEXT,
    p_barriers_to_address TEXT,
    p_additional_comments TEXT,
    p_pip_questions_concerns TEXT
)
RETURNS UUID AS $$
DECLARE
    concern_id UUID;
    latest_performance_id UUID;
BEGIN
    -- Check if user is low performer
    IF NOT is_employee_low_performer(auth.uid()) THEN
        RAISE EXCEPTION 'Only employees with low performance scores can submit performance concerns';
    END IF;
    
    -- Get latest performance record
    SELECT id INTO latest_performance_id
    FROM employee_performance 
    WHERE employee_id = auth.uid() 
    ORDER BY evaluation_date DESC 
    LIMIT 1;
    
    -- Insert performance concerns
    INSERT INTO performance_concerns (
        employee_id, performance_id,
        understanding_concerns, feedback_feelings,
        challenges_faced, less_confident_areas,
        team_manager_support, lacking_resources, work_environment_perception,
        challenging_situations, unmet_expectations_examples,
        training_needs, skills_update_methods,
        supervisor_communication_effectiveness, communication_examples, helpful_feedback_types,
        personal_circumstances, work_life_balance,
        suggested_role_changes, short_term_commitments, long_term_commitments,
        beneficial_support_types, barriers_to_address,
        additional_comments, pip_questions_concerns
    ) VALUES (
        auth.uid(), latest_performance_id,
        p_understanding_concerns, p_feedback_feelings,
        p_challenges_faced, p_less_confident_areas,
        p_team_manager_support, p_lacking_resources, p_work_environment_perception,
        p_challenging_situations, p_unmet_expectations_examples,
        p_training_needs, p_skills_update_methods,
        p_supervisor_communication_effectiveness, p_communication_examples, p_helpful_feedback_types,
        p_personal_circumstances, p_work_life_balance,
        p_suggested_role_changes, p_short_term_commitments, p_long_term_commitments,
        p_beneficial_support_types, p_barriers_to_address,
        p_additional_comments, p_pip_questions_concerns
    ) RETURNING id INTO concern_id;
    
    RETURN concern_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create PIP from performance concerns
CREATE OR REPLACE FUNCTION create_pip_from_concerns(
    concern_id UUID,
    plan_title TEXT,
    start_date DATE,
    end_date DATE,
    performance_goals TEXT,
    success_metrics TEXT
)
RETURNS UUID AS $$
DECLARE
    pip_id UUID;
    emp_id UUID;
BEGIN
    -- Check if user has manager/HR role
    IF NOT EXISTS (
        SELECT 1 FROM employees 
        WHERE id = auth.uid() 
        AND role IN ('manager', 'hr', 'admin')
    ) THEN
        RAISE EXCEPTION 'Only managers and HR can create PIPs';
    END IF;
    
    -- Get employee ID from concerns
    SELECT employee_id INTO emp_id
    FROM performance_concerns 
    WHERE id = concern_id;
    
    -- Insert PIP
    INSERT INTO performance_improvement_plans (
        employee_id, performance_concern_id,
        plan_title, start_date, end_date,
        performance_goals, success_metrics,
        created_by
    ) VALUES (
        emp_id, concern_id,
        plan_title, start_date, end_date,
        performance_goals, success_metrics,
        auth.uid()
    ) RETURNING id INTO pip_id;
    
    RETURN pip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_performance_employee_id ON employee_performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_period ON employee_performance(performance_period);
CREATE INDEX IF NOT EXISTS idx_employee_performance_low_performer ON employee_performance(is_low_performer);
CREATE INDEX IF NOT EXISTS idx_performance_concerns_employee_id ON performance_concerns(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_concerns_status ON performance_concerns(submission_status);
CREATE INDEX IF NOT EXISTS idx_pip_employee_id ON performance_improvement_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_pip_status ON performance_improvement_plans(pip_status);
CREATE INDEX IF NOT EXISTS idx_pip_reviews_pip_id ON pip_progress_reviews(pip_id);

-- Sample data for testing (optional)
-- INSERT INTO employee_performance (employee_id, performance_period, overall_score, is_low_performer)
-- SELECT id, 'Q4-2024', 3.5, TRUE 
-- FROM employees 
-- WHERE role = 'employee' 
-- LIMIT 2;

COMMIT;