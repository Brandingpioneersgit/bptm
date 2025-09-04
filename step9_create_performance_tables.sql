-- Step 9: Create performance management tables
-- Run this after step8_create_dashboard_usage.sql

-- Create employee_performance table for detailed performance tracking
CREATE TABLE IF NOT EXISTS public.employee_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    
    -- Performance scoring (0-10 scale)
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 10),
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 10),
    productivity_score DECIMAL(3,2) CHECK (productivity_score >= 0 AND productivity_score <= 10),
    communication_score DECIMAL(3,2) CHECK (communication_score >= 0 AND communication_score <= 10),
    teamwork_score DECIMAL(3,2) CHECK (teamwork_score >= 0 AND teamwork_score <= 10),
    initiative_score DECIMAL(3,2) CHECK (initiative_score >= 0 AND initiative_score <= 10),
    
    -- Performance period
    evaluation_period VARCHAR(20) NOT NULL, -- e.g., 'Q1 2024', 'Jan 2024'
    evaluation_date DATE NOT NULL,
    evaluator_id VARCHAR(255) NOT NULL,
    evaluator_name VARCHAR(255) NOT NULL,
    
    -- Performance status
    performance_level VARCHAR(20) CHECK (performance_level IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor')),
    is_low_performer BOOLEAN DEFAULT false,
    requires_pip BOOLEAN DEFAULT false, -- Performance Improvement Plan
    
    -- Comments and feedback
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_next_period TEXT,
    manager_comments TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_employee_performance_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Create performance_concerns table for tracking struggling employees
CREATE TABLE IF NOT EXISTS public.performance_concerns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    
    -- Concern details
    concern_type VARCHAR(50) NOT NULL CHECK (concern_type IN (
        'quality_issues', 'productivity_low', 'attendance_poor', 
        'communication_problems', 'behavioral_issues', 'skill_gaps', 'other'
    )),
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Detailed information
    concern_description TEXT NOT NULL,
    specific_incidents TEXT,
    impact_on_team TEXT,
    impact_on_business TEXT,
    
    -- Performance context
    current_performance_score DECIMAL(3,2),
    previous_performance_score DECIMAL(3,2),
    performance_trend VARCHAR(20) CHECK (performance_trend IN ('improving', 'stable', 'declining')),
    
    -- Action taken
    immediate_actions_taken TEXT,
    support_provided TEXT,
    training_recommended TEXT,
    
    -- Timeline and follow-up
    concern_raised_date DATE NOT NULL,
    expected_improvement_date DATE,
    next_review_date DATE,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated', 'closed')),
    resolution_notes TEXT,
    
    -- Reporting
    reported_by_id VARCHAR(255) NOT NULL,
    reported_by_name VARCHAR(255) NOT NULL,
    hr_notified BOOLEAN DEFAULT false,
    hr_notified_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_performance_concerns_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Create performance_improvement_plans table for PIP management
CREATE TABLE IF NOT EXISTS public.performance_improvement_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    
    -- PIP details
    pip_title VARCHAR(255) NOT NULL,
    pip_description TEXT NOT NULL,
    performance_gaps TEXT NOT NULL,
    improvement_goals TEXT NOT NULL,
    success_metrics TEXT NOT NULL,
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    review_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (review_frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
    
    -- Support and resources
    training_required TEXT,
    resources_provided TEXT,
    mentor_assigned VARCHAR(255),
    additional_support TEXT,
    
    -- Status and outcome
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'terminated', 'extended')),
    outcome VARCHAR(20) CHECK (outcome IN ('successful', 'unsuccessful', 'partially_successful', 'ongoing')),
    final_assessment TEXT,
    
    -- Stakeholders
    manager_id VARCHAR(255) NOT NULL,
    manager_name VARCHAR(255) NOT NULL,
    hr_representative VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_pip_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Create pip_progress_reviews table for tracking PIP progress
CREATE TABLE IF NOT EXISTS public.pip_progress_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pip_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    
    -- Review details
    review_date DATE NOT NULL,
    review_period VARCHAR(50) NOT NULL, -- e.g., 'Week 1', 'Month 1'
    reviewer_id VARCHAR(255) NOT NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    
    -- Progress assessment
    goals_met INTEGER DEFAULT 0, -- Number of goals met
    total_goals INTEGER DEFAULT 0, -- Total number of goals
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Detailed feedback
    achievements TEXT,
    challenges_faced TEXT,
    areas_of_improvement TEXT,
    support_needed TEXT,
    
    -- Scores and ratings
    overall_progress_rating VARCHAR(20) CHECK (overall_progress_rating IN ('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor')),
    manager_satisfaction_score DECIMAL(3,2) CHECK (manager_satisfaction_score >= 0 AND manager_satisfaction_score <= 10),
    
    -- Next steps
    action_items TEXT,
    next_review_date DATE,
    recommendations TEXT,
    
    -- Status
    review_status VARCHAR(20) DEFAULT 'completed' CHECK (review_status IN ('scheduled', 'in_progress', 'completed', 'postponed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_pip_progress_pip FOREIGN KEY (pip_id) REFERENCES public.performance_improvement_plans(id),
    CONSTRAINT fk_pip_progress_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Create triggers for updated_at columns
CREATE OR REPLACE TRIGGER update_employee_performance_updated_at
    BEFORE UPDATE ON public.employee_performance
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_performance_concerns_updated_at
    BEFORE UPDATE ON public.performance_concerns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_performance_improvement_plans_updated_at
    BEFORE UPDATE ON public.performance_improvement_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_pip_progress_reviews_updated_at
    BEFORE UPDATE ON public.pip_progress_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_performance_employee_id ON public.employee_performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_performance_evaluation_date ON public.employee_performance(evaluation_date);
CREATE INDEX IF NOT EXISTS idx_employee_performance_department ON public.employee_performance(department);
CREATE INDEX IF NOT EXISTS idx_employee_performance_low_performer ON public.employee_performance(is_low_performer);

CREATE INDEX IF NOT EXISTS idx_performance_concerns_employee_id ON public.performance_concerns(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_concerns_status ON public.performance_concerns(status);
CREATE INDEX IF NOT EXISTS idx_performance_concerns_severity ON public.performance_concerns(severity_level);
CREATE INDEX IF NOT EXISTS idx_performance_concerns_department ON public.performance_concerns(department);

CREATE INDEX IF NOT EXISTS idx_pip_employee_id ON public.performance_improvement_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_pip_status ON public.performance_improvement_plans(status);
CREATE INDEX IF NOT EXISTS idx_pip_dates ON public.performance_improvement_plans(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_pip_progress_pip_id ON public.pip_progress_reviews(pip_id);
CREATE INDEX IF NOT EXISTS idx_pip_progress_employee_id ON public.pip_progress_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_pip_progress_review_date ON public.pip_progress_reviews(review_date);

-- Enable Row Level Security
ALTER TABLE public.employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_concerns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_improvement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pip_progress_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON public.employee_performance FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.performance_concerns FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.performance_improvement_plans FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.pip_progress_reviews FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.employee_performance TO authenticated, anon;
GRANT ALL ON public.performance_concerns TO authenticated, anon;
GRANT ALL ON public.performance_improvement_plans TO authenticated, anon;
GRANT ALL ON public.pip_progress_reviews TO authenticated, anon;

SELECT 'Performance management tables created successfully!' as status;