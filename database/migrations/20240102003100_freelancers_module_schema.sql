-- =============================================
-- FREELANCERS MODULE SCHEMA
-- =============================================
-- This migration creates the complete schema for the Freelancers module
-- Supporting videographer, video editor, graphic designer, Ads manager, SEO, and Social media freelancers
-- with task management, reporting, manager approval, and cost calculation

BEGIN;

-- =============================================
-- TABLES
-- =============================================

-- Freelancer Users Table
CREATE TABLE IF NOT EXISTS freelancer_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id VARCHAR(20) UNIQUE NOT NULL, -- FRL001, FRL002, etc.
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    category VARCHAR(50) NOT NULL CHECK (category IN ('videographer', 'video_editor', 'graphic_designer', 'ads_manager', 'seo', 'social_media')),
    role VARCHAR(50) DEFAULT 'freelancer' CHECK (role IN ('freelancer', 'manager', 'admin')),
    
    -- Professional Details
    experience_years DECIMAL(3,1),
    hourly_rate DECIMAL(8,2),
    portfolio_url TEXT,
    linkedin_url TEXT,
    behance_url TEXT,
    dribbble_url TEXT,
    
    -- Skills & Expertise
    primary_skills TEXT[] NOT NULL,
    secondary_skills TEXT[],
    software_proficiency JSONB, -- {"photoshop": "expert", "premiere": "intermediate"}
    certifications TEXT[],
    
    -- Contract Details
    contract_type VARCHAR(20) DEFAULT 'project_based' CHECK (contract_type IN ('hourly', 'project_based', 'retainer')),
    start_date DATE NOT NULL,
    end_date DATE,
    payment_terms VARCHAR(50), -- "Net 30", "Upon completion", etc.
    
    -- Contact & Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Banking Details (encrypted)
    bank_account_number TEXT,
    bank_name VARCHAR(255),
    ifsc_code VARCHAR(20),
    pan_number VARCHAR(20),
    
    -- Performance Metrics
    total_tasks_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    on_time_delivery_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
    availability_status VARCHAR(20) DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
    
    -- Manager Assignment
    assigned_manager_id UUID REFERENCES freelancer_users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS freelancer_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_code VARCHAR(50) UNIQUE NOT NULL, -- TSK-VID-001, TSK-GFX-001, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Assignment Details
    assigned_to UUID NOT NULL REFERENCES freelancer_users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES freelancer_users(id),
    category VARCHAR(50) NOT NULL CHECK (category IN ('videographer', 'video_editor', 'graphic_designer', 'ads_manager', 'seo', 'social_media')),
    
    -- Task Specifications
    task_type VARCHAR(100) NOT NULL, -- "Product Video", "Logo Design", "SEO Audit", etc.
    complexity_level VARCHAR(20) DEFAULT 'medium' CHECK (complexity_level IN ('simple', 'medium', 'complex', 'expert')),
    estimated_hours DECIMAL(6,2),
    
    -- Timeline
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    actual_start_date DATE,
    actual_completion_date DATE,
    
    -- Requirements & Deliverables
    requirements TEXT NOT NULL,
    deliverables TEXT NOT NULL,
    file_format_requirements TEXT,
    quality_standards TEXT,
    reference_materials_urls TEXT[],
    
    -- Pricing
    cost_type VARCHAR(20) DEFAULT 'fixed' CHECK (cost_type IN ('fixed', 'hourly', 'per_item')),
    quoted_amount DECIMAL(10,2) NOT NULL,
    actual_hours_worked DECIMAL(6,2) DEFAULT 0,
    final_amount DECIMAL(10,2),
    
    -- Priority & Status
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'submitted', 'revision_requested', 'completed', 'cancelled')),
    
    -- Approval Workflow
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_required')),
    approved_by UUID REFERENCES freelancer_users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Client/Project Context
    client_name VARCHAR(255),
    project_name VARCHAR(255),
    internal_project_code VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Reports Table
CREATE TABLE IF NOT EXISTS freelancer_task_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES freelancer_tasks(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_users(id) ON DELETE CASCADE,
    
    -- Report Details
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    report_type VARCHAR(20) DEFAULT 'progress' CHECK (report_type IN ('progress', 'completion', 'revision', 'issue')),
    
    -- Work Summary
    work_completed TEXT NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL CHECK (hours_worked >= 0),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Deliverables
    deliverables_submitted TEXT,
    file_urls TEXT[], -- Array of file URLs
    preview_urls TEXT[], -- Array of preview/thumbnail URLs
    
    -- Challenges & Solutions
    challenges_faced TEXT,
    solutions_implemented TEXT,
    additional_resources_needed TEXT,
    
    -- Quality Metrics (category-specific)
    technical_quality_score INTEGER CHECK (technical_quality_score >= 1 AND technical_quality_score <= 5),
    creativity_score INTEGER CHECK (creativity_score >= 1 AND creativity_score <= 5),
    adherence_to_brief_score INTEGER CHECK (adherence_to_brief_score >= 1 AND adherence_to_brief_score <= 5),
    
    -- Time Management
    estimated_completion_date DATE,
    on_schedule BOOLEAN DEFAULT TRUE,
    delay_reason TEXT,
    
    -- Client Feedback (if applicable)
    client_feedback TEXT,
    client_satisfaction_score INTEGER CHECK (client_satisfaction_score >= 1 AND client_satisfaction_score <= 5),
    
    -- Revision Details
    revision_number INTEGER DEFAULT 0,
    revision_notes TEXT,
    
    -- Manager Review
    reviewed_by UUID REFERENCES freelancer_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    manager_feedback TEXT,
    manager_rating INTEGER CHECK (manager_rating >= 1 AND manager_rating <= 5),
    
    -- Status
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'revision_required')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly Approvals Table
CREATE TABLE IF NOT EXISTS freelancer_monthly_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_users(id) ON DELETE CASCADE,
    approval_month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Manager Details
    approved_by UUID NOT NULL REFERENCES freelancer_users(id),
    approval_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Task Summary
    total_tasks_assigned INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    total_tasks_approved INTEGER DEFAULT 0,
    total_tasks_rejected INTEGER DEFAULT 0,
    
    -- Time & Cost Summary
    total_hours_worked DECIMAL(8,2) DEFAULT 0,
    total_quoted_amount DECIMAL(12,2) DEFAULT 0,
    total_approved_amount DECIMAL(12,2) DEFAULT 0,
    total_rejected_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Performance Metrics
    average_quality_score DECIMAL(3,2),
    on_time_delivery_rate DECIMAL(5,2),
    client_satisfaction_average DECIMAL(3,2),
    
    -- Manager Assessment
    overall_performance_rating INTEGER CHECK (overall_performance_rating >= 1 AND overall_performance_rating <= 5),
    strengths TEXT,
    areas_for_improvement TEXT,
    recommendations TEXT,
    
    -- Bonus & Penalties
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    bonus_reason TEXT,
    penalty_amount DECIMAL(10,2) DEFAULT 0,
    penalty_reason TEXT,
    
    -- Final Calculation
    final_payable_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Payment Status
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processed', 'paid', 'on_hold')),
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'finalized')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(freelancer_id, approval_month)
);

-- Freelancer Performance Tracking Table
CREATE TABLE IF NOT EXISTS freelancer_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_users(id) ON DELETE CASCADE,
    evaluation_month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Task Metrics
    tasks_assigned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_on_time INTEGER DEFAULT 0,
    tasks_with_revisions INTEGER DEFAULT 0,
    
    -- Quality Metrics
    average_technical_score DECIMAL(3,2),
    average_creativity_score DECIMAL(3,2),
    average_adherence_score DECIMAL(3,2),
    average_manager_rating DECIMAL(3,2),
    average_client_satisfaction DECIMAL(3,2),
    
    -- Time Management
    total_hours_logged DECIMAL(8,2) DEFAULT 0,
    average_hours_per_task DECIMAL(6,2),
    efficiency_score DECIMAL(5,2), -- tasks completed per hour
    
    -- Financial Performance
    total_earnings DECIMAL(12,2) DEFAULT 0,
    average_task_value DECIMAL(10,2),
    bonus_earned DECIMAL(10,2) DEFAULT 0,
    penalties_incurred DECIMAL(10,2) DEFAULT 0,
    
    -- Communication & Collaboration
    response_time_hours DECIMAL(6,2), -- Average response time to messages
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    collaboration_score INTEGER CHECK (collaboration_score >= 1 AND collaboration_score <= 5),
    
    -- Overall Performance Score (calculated)
    overall_performance_score DECIMAL(5,2) DEFAULT 0, -- Out of 100
    performance_grade VARCHAR(5) CHECK (performance_grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F')),
    
    -- Manager Feedback
    manager_feedback TEXT,
    development_areas TEXT[],
    skill_improvement_suggestions TEXT[],
    
    -- Review Details
    reviewed_by UUID REFERENCES freelancer_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(freelancer_id, evaluation_month)
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to calculate freelancer performance score
CREATE OR REPLACE FUNCTION calculate_freelancer_performance_score(performance_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    performance_record RECORD;
    completion_score DECIMAL := 0;
    quality_score DECIMAL := 0;
    timeliness_score DECIMAL := 0;
    efficiency_score DECIMAL := 0;
    communication_score DECIMAL := 0;
    total_score DECIMAL := 0;
BEGIN
    -- Get performance record
    SELECT * INTO performance_record 
    FROM freelancer_performance 
    WHERE id = performance_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate Task Completion Score (25 points)
    IF performance_record.tasks_assigned > 0 THEN
        completion_score := (performance_record.tasks_completed::DECIMAL / performance_record.tasks_assigned) * 25;
    END IF;
    
    -- Calculate Quality Score (30 points)
    quality_score := COALESCE(performance_record.average_technical_score, 0) * 6; -- 5*6=30
    quality_score := quality_score + COALESCE(performance_record.average_creativity_score, 0) * 6;
    quality_score := quality_score + COALESCE(performance_record.average_adherence_score, 0) * 6;
    quality_score := quality_score + COALESCE(performance_record.average_manager_rating, 0) * 6;
    quality_score := quality_score + COALESCE(performance_record.average_client_satisfaction, 0) * 6;
    quality_score := quality_score / 5; -- Average of 5 metrics
    
    -- Calculate Timeliness Score (20 points)
    IF performance_record.tasks_completed > 0 THEN
        timeliness_score := (performance_record.tasks_on_time::DECIMAL / performance_record.tasks_completed) * 20;
    END IF;
    
    -- Calculate Efficiency Score (15 points)
    IF performance_record.total_hours_logged > 0 AND performance_record.tasks_completed > 0 THEN
        -- Efficiency = tasks per hour, normalized to 15 points
        efficiency_score := LEAST(15, (performance_record.tasks_completed::DECIMAL / performance_record.total_hours_logged) * 50);
    END IF;
    
    -- Calculate Communication Score (10 points)
    communication_score := COALESCE(performance_record.communication_rating, 0) * 2; -- 5*2=10
    
    -- Calculate Total Score
    total_score := completion_score + quality_score + timeliness_score + efficiency_score + communication_score;
    total_score := LEAST(100, GREATEST(0, total_score));
    
    -- Update the performance record
    UPDATE freelancer_performance 
    SET overall_performance_score = total_score,
        performance_grade = CASE 
            WHEN total_score >= 95 THEN 'A+'
            WHEN total_score >= 90 THEN 'A'
            WHEN total_score >= 85 THEN 'B+'
            WHEN total_score >= 80 THEN 'B'
            WHEN total_score >= 75 THEN 'C+'
            WHEN total_score >= 70 THEN 'C'
            WHEN total_score >= 60 THEN 'D'
            ELSE 'F'
        END,
        updated_at = NOW()
    WHERE id = performance_id;
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate monthly approval amounts
CREATE OR REPLACE FUNCTION calculate_monthly_approval_amounts(approval_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    approval_record RECORD;
    approved_tasks_total DECIMAL := 0;
    final_amount DECIMAL := 0;
BEGIN
    -- Get approval record
    SELECT * INTO approval_record 
    FROM freelancer_monthly_approvals 
    WHERE id = approval_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate total from approved tasks only
    SELECT COALESCE(SUM(ft.final_amount), 0) INTO approved_tasks_total
    FROM freelancer_tasks ft
    WHERE ft.assigned_to = approval_record.freelancer_id
    AND TO_CHAR(ft.actual_completion_date, 'YYYY-MM') = approval_record.approval_month
    AND ft.approval_status = 'approved';
    
    -- Calculate final payable amount
    final_amount := approved_tasks_total + approval_record.bonus_amount - approval_record.penalty_amount;
    final_amount := GREATEST(0, final_amount);
    
    -- Update the approval record
    UPDATE freelancer_monthly_approvals 
    SET total_approved_amount = approved_tasks_total,
        final_payable_amount = final_amount,
        updated_at = NOW()
    WHERE id = approval_id;
    
    RETURN final_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-approve tasks based on criteria
CREATE OR REPLACE FUNCTION auto_approve_task(task_id UUID, manager_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    task_record RECORD;
    latest_report RECORD;
BEGIN
    -- Get task details
    SELECT * INTO task_record FROM freelancer_tasks WHERE id = task_id;
    
    IF NOT FOUND OR task_record.status != 'submitted' THEN
        RETURN FALSE;
    END IF;
    
    -- Get latest task report
    SELECT * INTO latest_report 
    FROM freelancer_task_reports 
    WHERE task_id = task_id 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Auto-approve if quality scores are high
    IF latest_report.technical_quality_score >= 4 
       AND latest_report.creativity_score >= 4 
       AND latest_report.adherence_to_brief_score >= 4 
       AND latest_report.progress_percentage = 100 THEN
        
        UPDATE freelancer_tasks 
        SET approval_status = 'approved',
            approved_by = manager_id,
            approved_at = NOW(),
            status = 'completed',
            final_amount = quoted_amount,
            updated_at = NOW()
        WHERE id = task_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_freelancer_users_updated_at BEFORE UPDATE ON freelancer_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_freelancer_tasks_updated_at BEFORE UPDATE ON freelancer_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_freelancer_task_reports_updated_at BEFORE UPDATE ON freelancer_task_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_freelancer_monthly_approvals_updated_at BEFORE UPDATE ON freelancer_monthly_approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_freelancer_performance_updated_at BEFORE UPDATE ON freelancer_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-calculate performance scores
CREATE OR REPLACE FUNCTION trigger_calculate_freelancer_performance()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_freelancer_performance_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER freelancer_performance_calculate_score
    AFTER INSERT OR UPDATE ON freelancer_performance
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_freelancer_performance();

-- Trigger to auto-calculate monthly approval amounts
CREATE OR REPLACE FUNCTION trigger_calculate_monthly_amounts()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_monthly_approval_amounts(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER freelancer_monthly_approvals_calculate_amounts
    AFTER INSERT OR UPDATE ON freelancer_monthly_approvals
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_monthly_amounts();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE freelancer_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_task_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_monthly_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for freelancer_users
CREATE POLICY "freelancer_users_select_policy" ON freelancer_users
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        auth.jwt() ->> 'user_id' = id::text OR
        assigned_manager_id::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "freelancer_users_insert_policy" ON freelancer_users
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );

CREATE POLICY "freelancer_users_update_policy" ON freelancer_users
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        auth.jwt() ->> 'user_id' = id::text
    );

-- RLS Policies for freelancer_tasks
CREATE POLICY "freelancer_tasks_select_policy" ON freelancer_tasks
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        assigned_to::text = auth.jwt() ->> 'user_id' OR
        assigned_by::text = auth.jwt() ->> 'user_id' OR
        approved_by::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "freelancer_tasks_insert_policy" ON freelancer_tasks
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );

CREATE POLICY "freelancer_tasks_update_policy" ON freelancer_tasks
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        assigned_by::text = auth.jwt() ->> 'user_id' OR
        approved_by::text = auth.jwt() ->> 'user_id'
    );

-- RLS Policies for freelancer_task_reports
CREATE POLICY "freelancer_task_reports_select_policy" ON freelancer_task_reports
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        freelancer_id::text = auth.jwt() ->> 'user_id' OR
        reviewed_by::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "freelancer_task_reports_insert_policy" ON freelancer_task_reports
    FOR INSERT WITH CHECK (
        freelancer_id::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "freelancer_task_reports_update_policy" ON freelancer_task_reports
    FOR UPDATE USING (
        (freelancer_id::text = auth.jwt() ->> 'user_id' AND status IN ('draft', 'submitted')) OR
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        reviewed_by::text = auth.jwt() ->> 'user_id'
    );

-- RLS Policies for freelancer_monthly_approvals
CREATE POLICY "freelancer_monthly_approvals_select_policy" ON freelancer_monthly_approvals
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        freelancer_id::text = auth.jwt() ->> 'user_id' OR
        approved_by::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "freelancer_monthly_approvals_insert_policy" ON freelancer_monthly_approvals
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );

CREATE POLICY "freelancer_monthly_approvals_update_policy" ON freelancer_monthly_approvals
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        approved_by::text = auth.jwt() ->> 'user_id'
    );

-- RLS Policies for freelancer_performance
CREATE POLICY "freelancer_performance_select_policy" ON freelancer_performance
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        freelancer_id::text = auth.jwt() ->> 'user_id' OR
        reviewed_by::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "freelancer_performance_insert_policy" ON freelancer_performance
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );

CREATE POLICY "freelancer_performance_update_policy" ON freelancer_performance
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        reviewed_by::text = auth.jwt() ->> 'user_id'
    );

-- =============================================
-- VIEWS
-- =============================================

-- Freelancer Dashboard View
CREATE OR REPLACE VIEW freelancer_dashboard AS
SELECT 
    fu.id as freelancer_id,
    fu.freelancer_id as freelancer_code,
    fu.name,
    fu.category,
    fu.status,
    fu.availability_status,
    
    -- Current Month Performance
    COALESCE(fp_current.overall_performance_score, 0) as current_month_score,
    fp_current.performance_grade as current_month_grade,
    
    -- Overall Performance
    COALESCE(AVG(fp_all.overall_performance_score), 0) as avg_performance_score,
    
    -- Task Statistics
    COUNT(DISTINCT ft.id) as total_tasks_assigned,
    COUNT(DISTINCT ft.id) FILTER (WHERE ft.status = 'completed') as tasks_completed,
    COUNT(DISTINCT ft.id) FILTER (WHERE ft.status IN ('assigned', 'in_progress', 'submitted')) as tasks_active,
    COUNT(DISTINCT ft.id) FILTER (WHERE ft.approval_status = 'approved') as tasks_approved,
    
    -- Financial Summary
    COALESCE(SUM(ft.final_amount) FILTER (WHERE ft.approval_status = 'approved'), 0) as total_approved_earnings,
    COALESCE(SUM(ft.quoted_amount) FILTER (WHERE ft.status IN ('assigned', 'in_progress', 'submitted')), 0) as pending_earnings,
    
    -- Quality Metrics
    COALESCE(AVG(ftr.technical_quality_score), 0) as avg_technical_score,
    COALESCE(AVG(ftr.creativity_score), 0) as avg_creativity_score,
    COALESCE(AVG(ftr.manager_rating), 0) as avg_manager_rating,
    
    -- Timeliness
    COALESCE(COUNT(DISTINCT ft.id) FILTER (WHERE ft.actual_completion_date <= ft.due_date)::DECIMAL / 
             NULLIF(COUNT(DISTINCT ft.id) FILTER (WHERE ft.status = 'completed'), 0) * 100, 0) as on_time_delivery_rate,
    
    -- Manager Info
    manager.name as manager_name
    
FROM freelancer_users fu
LEFT JOIN freelancer_performance fp_current ON fu.id = fp_current.freelancer_id 
    AND fp_current.evaluation_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
LEFT JOIN freelancer_performance fp_all ON fu.id = fp_all.freelancer_id
LEFT JOIN freelancer_tasks ft ON fu.id = ft.assigned_to
LEFT JOIN freelancer_task_reports ftr ON ft.id = ftr.task_id
LEFT JOIN freelancer_users manager ON fu.assigned_manager_id = manager.id
WHERE fu.status = 'active' AND fu.role = 'freelancer'
GROUP BY fu.id, fu.freelancer_id, fu.name, fu.category, fu.status, fu.availability_status,
         fp_current.overall_performance_score, fp_current.performance_grade, manager.name;

-- Manager Approval Dashboard View
CREATE OR REPLACE VIEW manager_approval_dashboard AS
SELECT 
    fu.id as freelancer_id,
    fu.freelancer_id as freelancer_code,
    fu.name as freelancer_name,
    fu.category,
    
    -- Current Month Summary
    TO_CHAR(CURRENT_DATE, 'YYYY-MM') as current_month,
    COUNT(DISTINCT ft.id) FILTER (WHERE TO_CHAR(ft.actual_completion_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')) as tasks_this_month,
    COUNT(DISTINCT ft.id) FILTER (WHERE TO_CHAR(ft.actual_completion_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM') AND ft.approval_status = 'approved') as approved_this_month,
    COUNT(DISTINCT ft.id) FILTER (WHERE TO_CHAR(ft.actual_completion_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM') AND ft.approval_status = 'pending') as pending_approval,
    
    -- Financial Summary
    COALESCE(SUM(ft.quoted_amount) FILTER (WHERE TO_CHAR(ft.actual_completion_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')), 0) as total_quoted_amount,
    COALESCE(SUM(ft.final_amount) FILTER (WHERE TO_CHAR(ft.actual_completion_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM') AND ft.approval_status = 'approved'), 0) as approved_amount,
    
    -- Quality Metrics
    COALESCE(AVG(ftr.technical_quality_score) FILTER (WHERE TO_CHAR(ftr.report_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')), 0) as avg_quality_score,
    
    -- Approval Status
    CASE WHEN fma.id IS NOT NULL THEN fma.status ELSE 'not_started' END as approval_status,
    fma.final_payable_amount,
    
    -- Manager Info
    fu.assigned_manager_id as manager_id
    
FROM freelancer_users fu
LEFT JOIN freelancer_tasks ft ON fu.id = ft.assigned_to
LEFT JOIN freelancer_task_reports ftr ON ft.id = ftr.task_id
LEFT JOIN freelancer_monthly_approvals fma ON fu.id = fma.freelancer_id 
    AND fma.approval_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
WHERE fu.status = 'active' AND fu.role = 'freelancer'
GROUP BY fu.id, fu.freelancer_id, fu.name, fu.category, fu.assigned_manager_id,
         fma.id, fma.status, fma.final_payable_amount;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_freelancer_users_freelancer_id ON freelancer_users(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_users_category ON freelancer_users(category);
CREATE INDEX IF NOT EXISTS idx_freelancer_users_manager_id ON freelancer_users(assigned_manager_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_users_status ON freelancer_users(status);

CREATE INDEX IF NOT EXISTS idx_freelancer_tasks_assigned_to ON freelancer_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_freelancer_tasks_category ON freelancer_tasks(category);
CREATE INDEX IF NOT EXISTS idx_freelancer_tasks_status ON freelancer_tasks(status);
CREATE INDEX IF NOT EXISTS idx_freelancer_tasks_approval_status ON freelancer_tasks(approval_status);
CREATE INDEX IF NOT EXISTS idx_freelancer_tasks_due_date ON freelancer_tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_freelancer_task_reports_task_id ON freelancer_task_reports(task_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_task_reports_freelancer_id ON freelancer_task_reports(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_task_reports_date ON freelancer_task_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_freelancer_task_reports_status ON freelancer_task_reports(status);

CREATE INDEX IF NOT EXISTS idx_freelancer_monthly_approvals_freelancer_id ON freelancer_monthly_approvals(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_monthly_approvals_month ON freelancer_monthly_approvals(approval_month);
CREATE INDEX IF NOT EXISTS idx_freelancer_monthly_approvals_status ON freelancer_monthly_approvals(status);

CREATE INDEX IF NOT EXISTS idx_freelancer_performance_freelancer_id ON freelancer_performance(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_performance_month ON freelancer_performance(evaluation_month);
CREATE INDEX IF NOT EXISTS idx_freelancer_performance_freelancer_month ON freelancer_performance(freelancer_id, evaluation_month);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample managers
INSERT INTO freelancer_users (freelancer_id, name, email, category, role, primary_skills, start_date) VALUES
('MGR001', 'Rajesh Kumar', 'rajesh.manager@company.com', 'videographer', 'manager', ARRAY['Team Management', 'Video Production'], '2023-01-01'),
('MGR002', 'Priya Sharma', 'priya.manager@company.com', 'graphic_designer', 'manager', ARRAY['Design Management', 'Creative Direction'], '2023-01-01')
ON CONFLICT (freelancer_id) DO NOTHING;

-- Insert sample freelancers
INSERT INTO freelancer_users (freelancer_id, name, email, category, hourly_rate, primary_skills, start_date, assigned_manager_id) VALUES
('FRL001', 'Amit Videographer', 'amit.video@freelancer.com', 'videographer', 1500.00, ARRAY['Video Shooting', 'Lighting', 'Camera Operation'], '2024-01-15', (SELECT id FROM freelancer_users WHERE freelancer_id = 'MGR001')),
('FRL002', 'Sneha Editor', 'sneha.editor@freelancer.com', 'video_editor', 1200.00, ARRAY['Premiere Pro', 'After Effects', 'Color Grading'], '2024-01-20', (SELECT id FROM freelancer_users WHERE freelancer_id = 'MGR001')),
('FRL003', 'Rohit Designer', 'rohit.design@freelancer.com', 'graphic_designer', 1000.00, ARRAY['Photoshop', 'Illustrator', 'Brand Design'], '2024-02-01', (SELECT id FROM freelancer_users WHERE freelancer_id = 'MGR002')),
('FRL004', 'Kavya Ads', 'kavya.ads@freelancer.com', 'ads_manager', 2000.00, ARRAY['Google Ads', 'Facebook Ads', 'Campaign Management'], '2024-02-10', (SELECT id FROM freelancer_users WHERE freelancer_id = 'MGR002')),
('FRL005', 'Arjun SEO', 'arjun.seo@freelancer.com', 'seo', 1800.00, ARRAY['Technical SEO', 'Content Optimization', 'Analytics'], '2024-02-15', (SELECT id FROM freelancer_users WHERE freelancer_id = 'MGR002')),
('FRL006', 'Pooja Social', 'pooja.social@freelancer.com', 'social_media', 1300.00, ARRAY['Content Creation', 'Social Strategy', 'Community Management'], '2024-03-01', (SELECT id FROM freelancer_users WHERE freelancer_id = 'MGR002'))
ON CONFLICT (freelancer_id) DO NOTHING;

-- Insert sample tasks
INSERT INTO freelancer_tasks (task_code, title, description, assigned_to, assigned_by, category, task_type, start_date, due_date, requirements, deliverables, quoted_amount) VALUES
('TSK-VID-001', 'Product Launch Video', 'Create a 2-minute product launch video', 
 (SELECT id FROM freelancer_users WHERE freelancer_id = 'FRL001'), 
 (SELECT id FROM freelancer_users WHERE freelancer_id = 'MGR001'), 
 'videographer', 'Product Video', '2024-03-01', '2024-03-15', 
 'High-quality 4K video with professional lighting', 
 'Final video in MP4 format, raw footage, project files', 25000.00),
('TSK-GFX-001', 'Brand Logo Design', 'Design a modern logo for new brand', 
 (SELECT id FROM freelancer_users WHERE freelancer_id = 'FRL003'), 
 (SELECT id FROM freelancer_users WHERE freelancer_id = 'MGR002'), 
 'graphic_designer', 'Logo Design', '2024-03-05', '2024-03-12', 
 'Modern, scalable design with multiple variations', 
 'Logo in AI, PNG, SVG formats with brand guidelines', 15000.00)
ON CONFLICT (task_code) DO NOTHING;

COMMIT;