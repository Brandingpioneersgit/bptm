-- =============================================
-- INTERNS MODULE SCHEMA
-- =============================================
-- This migration creates the complete schema for the Interns module
-- Supporting AI, Marketing, Sales, and HR interns with daily reporting,
-- project tracking, and certificate generation

BEGIN;

-- =============================================
-- TABLES
-- =============================================

-- Intern Users Table
CREATE TABLE IF NOT EXISTS intern_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id VARCHAR(20) UNIQUE NOT NULL, -- INT001, INT002, etc.
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(50) NOT NULL CHECK (department IN ('AI', 'Marketing', 'Sales', 'HR')),
    role VARCHAR(50) DEFAULT 'intern' CHECK (role IN ('intern', 'intern_lead', 'manager', 'admin')),
    mentor_id UUID REFERENCES intern_users(id),
    start_date DATE NOT NULL,
    end_date DATE,
    duration_months INTEGER DEFAULT 3,
    stipend_amount DECIMAL(10,2),
    college_name VARCHAR(255),
    course VARCHAR(255),
    year_of_study INTEGER,
    skills TEXT[], -- Array of skills
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated', 'on_leave')),
    profile_picture_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Work Reports Table
CREATE TABLE IF NOT EXISTS daily_work_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id UUID NOT NULL REFERENCES intern_users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    
    -- Work Details
    tasks_completed TEXT NOT NULL,
    tasks_in_progress TEXT,
    tasks_planned_tomorrow TEXT,
    hours_worked DECIMAL(4,2) NOT NULL CHECK (hours_worked >= 0 AND hours_worked <= 24),
    
    -- Learning & Development
    skills_learned TEXT,
    challenges_faced TEXT,
    solutions_implemented TEXT,
    mentor_interaction BOOLEAN DEFAULT FALSE,
    mentor_feedback TEXT,
    
    -- Project Work
    project_work_done TEXT,
    project_progress_percentage INTEGER DEFAULT 0 CHECK (project_progress_percentage >= 0 AND project_progress_percentage <= 100),
    
    -- Self Assessment
    productivity_rating INTEGER CHECK (productivity_rating >= 1 AND productivity_rating <= 5),
    learning_rating INTEGER CHECK (learning_rating >= 1 AND learning_rating <= 5),
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    
    -- Attachments
    work_samples_urls TEXT[], -- Array of URLs to work samples
    screenshots_urls TEXT[], -- Array of screenshot URLs
    
    -- Status
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved')),
    reviewed_by UUID REFERENCES intern_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_comments TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(intern_id, report_date)
);

-- Project Assignments Table
CREATE TABLE IF NOT EXISTS project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(50) UNIQUE NOT NULL, -- PROJ-AI-001, PROJ-MKT-001, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    department VARCHAR(50) NOT NULL CHECK (department IN ('AI', 'Marketing', 'Sales', 'HR')),
    
    -- Assignment Details
    assigned_to UUID NOT NULL REFERENCES intern_users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES intern_users(id),
    mentor_id UUID REFERENCES intern_users(id),
    
    -- Timeline
    start_date DATE NOT NULL,
    expected_end_date DATE NOT NULL,
    actual_end_date DATE,
    
    -- Project Scope
    objectives TEXT NOT NULL,
    deliverables TEXT NOT NULL,
    success_criteria TEXT,
    resources_provided TEXT,
    
    -- Difficulty & Skills
    difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    required_skills TEXT[],
    learning_outcomes TEXT[],
    
    -- Progress Tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    milestones JSONB, -- Array of milestone objects with dates and descriptions
    
    -- Status
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Completions Table
CREATE TABLE IF NOT EXISTS project_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project_assignments(id) ON DELETE CASCADE,
    intern_id UUID NOT NULL REFERENCES intern_users(id) ON DELETE CASCADE,
    
    -- Completion Details
    completion_date DATE NOT NULL,
    final_deliverables TEXT NOT NULL,
    project_summary TEXT NOT NULL,
    challenges_overcome TEXT,
    lessons_learned TEXT,
    
    -- Self Assessment
    self_rating INTEGER CHECK (self_rating >= 1 AND self_rating <= 10),
    time_management_rating INTEGER CHECK (time_management_rating >= 1 AND time_management_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    innovation_rating INTEGER CHECK (innovation_rating >= 1 AND innovation_rating <= 5),
    
    -- Mentor Evaluation
    mentor_rating INTEGER CHECK (mentor_rating >= 1 AND mentor_rating <= 10),
    mentor_feedback TEXT,
    mentor_recommendations TEXT,
    
    -- Technical Assessment
    technical_skills_demonstrated TEXT[],
    soft_skills_demonstrated TEXT[],
    areas_for_improvement TEXT[],
    
    -- Deliverables
    final_presentation_url TEXT,
    code_repository_url TEXT,
    documentation_url TEXT,
    demo_video_url TEXT,
    other_attachments_urls TEXT[],
    
    -- Evaluation
    overall_grade VARCHAR(5) CHECK (overall_grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F')),
    pass_status BOOLEAN DEFAULT FALSE,
    certificate_eligible BOOLEAN DEFAULT FALSE,
    
    -- Review Process
    reviewed_by UUID REFERENCES intern_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS intern_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number VARCHAR(50) UNIQUE NOT NULL, -- CERT-2024-AI-001
    intern_id UUID NOT NULL REFERENCES intern_users(id) ON DELETE CASCADE,
    
    -- Certificate Details
    certificate_type VARCHAR(50) DEFAULT 'completion' CHECK (certificate_type IN ('completion', 'excellence', 'participation')),
    department VARCHAR(50) NOT NULL CHECK (department IN ('AI', 'Marketing', 'Sales', 'HR')),
    
    -- Internship Summary
    internship_duration_days INTEGER NOT NULL,
    total_projects_completed INTEGER DEFAULT 0,
    average_project_rating DECIMAL(3,2),
    total_hours_worked DECIMAL(8,2),
    
    -- Performance Metrics
    attendance_percentage DECIMAL(5,2),
    punctuality_score INTEGER CHECK (punctuality_score >= 1 AND punctuality_score <= 5),
    quality_of_work_score INTEGER CHECK (quality_of_work_score >= 1 AND quality_score <= 5),
    learning_agility_score INTEGER CHECK (learning_agility_score >= 1 AND learning_agility_score <= 5),
    teamwork_score INTEGER CHECK (teamwork_score >= 1 AND teamwork_score <= 5),
    communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 5),
    
    -- Skills & Achievements
    skills_acquired TEXT[],
    key_achievements TEXT[],
    special_recognitions TEXT[],
    
    -- Certificate Content
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_by UUID NOT NULL REFERENCES intern_users(id),
    certificate_text TEXT,
    
    -- Digital Certificate
    certificate_pdf_url TEXT,
    certificate_image_url TEXT,
    verification_code VARCHAR(50) UNIQUE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'issued', 'revoked')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intern Performance Tracking Table
CREATE TABLE IF NOT EXISTS intern_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id UUID NOT NULL REFERENCES intern_users(id) ON DELETE CASCADE,
    evaluation_month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Attendance Metrics
    total_working_days INTEGER NOT NULL,
    days_present INTEGER NOT NULL,
    days_absent INTEGER DEFAULT 0,
    late_arrivals INTEGER DEFAULT 0,
    
    -- Work Quality Metrics
    daily_reports_submitted INTEGER DEFAULT 0,
    daily_reports_on_time INTEGER DEFAULT 0,
    average_daily_hours DECIMAL(4,2),
    
    -- Project Performance
    projects_assigned INTEGER DEFAULT 0,
    projects_completed INTEGER DEFAULT 0,
    projects_on_time INTEGER DEFAULT 0,
    average_project_rating DECIMAL(3,2),
    
    -- Learning & Development
    training_sessions_attended INTEGER DEFAULT 0,
    skills_assessments_passed INTEGER DEFAULT 0,
    mentor_meetings_attended INTEGER DEFAULT 0,
    
    -- Behavioral Metrics
    peer_collaboration_score INTEGER CHECK (peer_collaboration_score >= 1 AND peer_collaboration_score <= 5),
    initiative_score INTEGER CHECK (initiative_score >= 1 AND initiative_score <= 5),
    problem_solving_score INTEGER CHECK (problem_solving_score >= 1 AND problem_solving_score <= 5),
    
    -- Overall Assessment
    overall_performance_score DECIMAL(5,2), -- Calculated score out of 100
    performance_grade VARCHAR(5) CHECK (performance_grade IN ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F')),
    
    -- Feedback
    mentor_feedback TEXT,
    areas_of_strength TEXT[],
    areas_for_improvement TEXT[],
    development_recommendations TEXT[],
    
    -- Review
    reviewed_by UUID REFERENCES intern_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(intern_id, evaluation_month)
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to calculate intern performance score
CREATE OR REPLACE FUNCTION calculate_intern_performance_score(intern_performance_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    performance_record RECORD;
    attendance_score DECIMAL := 0;
    work_quality_score DECIMAL := 0;
    project_score DECIMAL := 0;
    learning_score DECIMAL := 0;
    behavioral_score DECIMAL := 0;
    total_score DECIMAL := 0;
BEGIN
    -- Get performance record
    SELECT * INTO performance_record 
    FROM intern_performance 
    WHERE id = intern_performance_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Calculate Attendance Score (25 points)
    IF performance_record.total_working_days > 0 THEN
        attendance_score := (performance_record.days_present::DECIMAL / performance_record.total_working_days) * 25;
        -- Deduct points for late arrivals
        attendance_score := attendance_score - (performance_record.late_arrivals * 0.5);
        attendance_score := GREATEST(0, attendance_score);
    END IF;
    
    -- Calculate Work Quality Score (25 points)
    IF performance_record.daily_reports_submitted > 0 THEN
        work_quality_score := (performance_record.daily_reports_on_time::DECIMAL / performance_record.daily_reports_submitted) * 15;
    END IF;
    
    -- Add points for consistent daily hours (target: 6-8 hours)
    IF performance_record.average_daily_hours BETWEEN 6 AND 8 THEN
        work_quality_score := work_quality_score + 10;
    ELSIF performance_record.average_daily_hours BETWEEN 5 AND 9 THEN
        work_quality_score := work_quality_score + 7;
    ELSIF performance_record.average_daily_hours > 0 THEN
        work_quality_score := work_quality_score + 3;
    END IF;
    
    -- Calculate Project Score (25 points)
    IF performance_record.projects_assigned > 0 THEN
        project_score := (performance_record.projects_completed::DECIMAL / performance_record.projects_assigned) * 15;
        
        -- Bonus for on-time completion
        IF performance_record.projects_completed > 0 THEN
            project_score := project_score + (performance_record.projects_on_time::DECIMAL / performance_record.projects_completed) * 5;
        END IF;
        
        -- Bonus for high ratings
        IF performance_record.average_project_rating IS NOT NULL THEN
            project_score := project_score + (performance_record.average_project_rating * 0.5);
        END IF;
    END IF;
    
    -- Calculate Learning Score (15 points)
    learning_score := COALESCE(performance_record.training_sessions_attended, 0) * 2;
    learning_score := learning_score + COALESCE(performance_record.skills_assessments_passed, 0) * 3;
    learning_score := learning_score + COALESCE(performance_record.mentor_meetings_attended, 0) * 1;
    learning_score := LEAST(15, learning_score);
    
    -- Calculate Behavioral Score (10 points)
    behavioral_score := COALESCE(performance_record.peer_collaboration_score, 0) * 2;
    behavioral_score := behavioral_score + COALESCE(performance_record.initiative_score, 0) * 2;
    behavioral_score := behavioral_score + COALESCE(performance_record.problem_solving_score, 0) * 2;
    behavioral_score := LEAST(10, behavioral_score);
    
    -- Calculate Total Score
    total_score := attendance_score + work_quality_score + project_score + learning_score + behavioral_score;
    total_score := LEAST(100, GREATEST(0, total_score));
    
    -- Update the performance record
    UPDATE intern_performance 
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
    WHERE id = intern_performance_id;
    
    RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to check certificate eligibility
CREATE OR REPLACE FUNCTION check_certificate_eligibility(intern_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    intern_record RECORD;
    avg_performance DECIMAL;
    total_projects INTEGER;
    completed_projects INTEGER;
    attendance_rate DECIMAL;
BEGIN
    -- Get intern details
    SELECT * INTO intern_record FROM intern_users WHERE id = intern_user_id;
    
    IF NOT FOUND OR intern_record.status != 'completed' THEN
        RETURN FALSE;
    END IF;
    
    -- Check average performance score (should be >= 70)
    SELECT AVG(overall_performance_score) INTO avg_performance
    FROM intern_performance 
    WHERE intern_id = intern_user_id;
    
    IF avg_performance IS NULL OR avg_performance < 70 THEN
        RETURN FALSE;
    END IF;
    
    -- Check project completion rate (should be >= 80%)
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
    INTO total_projects, completed_projects
    FROM project_assignments 
    WHERE assigned_to = intern_user_id;
    
    IF total_projects = 0 OR (completed_projects::DECIMAL / total_projects) < 0.8 THEN
        RETURN FALSE;
    END IF;
    
    -- Check overall attendance (should be >= 80%)
    SELECT AVG(days_present::DECIMAL / NULLIF(total_working_days, 0)) INTO attendance_rate
    FROM intern_performance 
    WHERE intern_id = intern_user_id;
    
    IF attendance_rate IS NULL OR attendance_rate < 0.8 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to generate certificate
CREATE OR REPLACE FUNCTION generate_intern_certificate(intern_user_id UUID)
RETURNS UUID AS $$
DECLARE
    intern_record RECORD;
    certificate_id UUID;
    cert_number VARCHAR(50);
    duration_days INTEGER;
    total_projects INTEGER;
    avg_rating DECIMAL;
    total_hours DECIMAL;
    attendance_pct DECIMAL;
BEGIN
    -- Check eligibility
    IF NOT check_certificate_eligibility(intern_user_id) THEN
        RAISE EXCEPTION 'Intern is not eligible for certificate';
    END IF;
    
    -- Get intern details
    SELECT * INTO intern_record FROM intern_users WHERE id = intern_user_id;
    
    -- Calculate metrics
    duration_days := intern_record.end_date - intern_record.start_date;
    
    SELECT COUNT(*) INTO total_projects
    FROM project_assignments 
    WHERE assigned_to = intern_user_id AND status = 'completed';
    
    SELECT AVG(mentor_rating) INTO avg_rating
    FROM project_completions pc
    JOIN project_assignments pa ON pc.project_id = pa.id
    WHERE pa.assigned_to = intern_user_id;
    
    SELECT SUM(average_daily_hours * days_present) INTO total_hours
    FROM intern_performance 
    WHERE intern_id = intern_user_id;
    
    SELECT AVG(days_present::DECIMAL / NULLIF(total_working_days, 0)) * 100 INTO attendance_pct
    FROM intern_performance 
    WHERE intern_id = intern_user_id;
    
    -- Generate certificate number
    cert_number := 'CERT-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || intern_record.department || '-' || 
                   LPAD((SELECT COUNT(*) + 1 FROM intern_certificates WHERE department = intern_record.department)::TEXT, 3, '0');
    
    -- Create certificate
    INSERT INTO intern_certificates (
        certificate_number, intern_id, department, internship_duration_days,
        total_projects_completed, average_project_rating, total_hours_worked,
        attendance_percentage, issued_by, verification_code
    ) VALUES (
        cert_number, intern_user_id, intern_record.department, duration_days,
        total_projects, avg_rating, total_hours, attendance_pct,
        intern_record.mentor_id, 
        'VER-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))
    ) RETURNING id INTO certificate_id;
    
    RETURN certificate_id;
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

CREATE TRIGGER update_intern_users_updated_at BEFORE UPDATE ON intern_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_work_reports_updated_at BEFORE UPDATE ON daily_work_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_assignments_updated_at BEFORE UPDATE ON project_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_completions_updated_at BEFORE UPDATE ON project_completions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intern_certificates_updated_at BEFORE UPDATE ON intern_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intern_performance_updated_at BEFORE UPDATE ON intern_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-calculate performance scores
CREATE OR REPLACE FUNCTION trigger_calculate_intern_performance()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_intern_performance_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intern_performance_calculate_score
    AFTER INSERT OR UPDATE ON intern_performance
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_intern_performance();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE intern_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_work_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intern_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE intern_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intern_users
CREATE POLICY "intern_users_select_policy" ON intern_users
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        auth.jwt() ->> 'user_id' = id::text OR
        mentor_id::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "intern_users_insert_policy" ON intern_users
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );

CREATE POLICY "intern_users_update_policy" ON intern_users
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        auth.jwt() ->> 'user_id' = id::text
    );

-- RLS Policies for daily_work_reports
CREATE POLICY "daily_work_reports_select_policy" ON daily_work_reports
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        intern_id::text = auth.jwt() ->> 'user_id' OR
        reviewed_by::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "daily_work_reports_insert_policy" ON daily_work_reports
    FOR INSERT WITH CHECK (
        intern_id::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "daily_work_reports_update_policy" ON daily_work_reports
    FOR UPDATE USING (
        (intern_id::text = auth.jwt() ->> 'user_id' AND status IN ('draft', 'submitted')) OR
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        reviewed_by::text = auth.jwt() ->> 'user_id'
    );

-- RLS Policies for project_assignments
CREATE POLICY "project_assignments_select_policy" ON project_assignments
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        assigned_to::text = auth.jwt() ->> 'user_id' OR
        assigned_by::text = auth.jwt() ->> 'user_id' OR
        mentor_id::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "project_assignments_insert_policy" ON project_assignments
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );

CREATE POLICY "project_assignments_update_policy" ON project_assignments
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        assigned_by::text = auth.jwt() ->> 'user_id' OR
        mentor_id::text = auth.jwt() ->> 'user_id'
    );

-- RLS Policies for project_completions
CREATE POLICY "project_completions_select_policy" ON project_completions
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        intern_id::text = auth.jwt() ->> 'user_id' OR
        reviewed_by::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "project_completions_insert_policy" ON project_completions
    FOR INSERT WITH CHECK (
        intern_id::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "project_completions_update_policy" ON project_completions
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        reviewed_by::text = auth.jwt() ->> 'user_id'
    );

-- RLS Policies for intern_certificates
CREATE POLICY "intern_certificates_select_policy" ON intern_certificates
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        intern_id::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "intern_certificates_insert_policy" ON intern_certificates
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );

CREATE POLICY "intern_certificates_update_policy" ON intern_certificates
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );

-- RLS Policies for intern_performance
CREATE POLICY "intern_performance_select_policy" ON intern_performance
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        intern_id::text = auth.jwt() ->> 'user_id' OR
        reviewed_by::text = auth.jwt() ->> 'user_id'
    );

CREATE POLICY "intern_performance_insert_policy" ON intern_performance
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'manager')
    );

CREATE POLICY "intern_performance_update_policy" ON intern_performance
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'manager') OR
        reviewed_by::text = auth.jwt() ->> 'user_id'
    );

-- =============================================
-- VIEWS
-- =============================================

-- Intern Dashboard View
CREATE OR REPLACE VIEW intern_dashboard AS
SELECT 
    iu.id as intern_id,
    iu.intern_id as intern_code,
    iu.name,
    iu.department,
    iu.start_date,
    iu.end_date,
    iu.status,
    
    -- Current Month Performance
    COALESCE(ip_current.overall_performance_score, 0) as current_month_score,
    ip_current.performance_grade as current_month_grade,
    
    -- Overall Performance
    COALESCE(AVG(ip_all.overall_performance_score), 0) as avg_performance_score,
    
    -- Project Statistics
    COUNT(DISTINCT pa.id) as total_projects_assigned,
    COUNT(DISTINCT pa.id) FILTER (WHERE pa.status = 'completed') as projects_completed,
    COUNT(DISTINCT pa.id) FILTER (WHERE pa.status = 'in_progress') as projects_in_progress,
    
    -- Daily Reports Statistics
    COUNT(DISTINCT dwr.id) as total_daily_reports,
    COUNT(DISTINCT dwr.id) FILTER (WHERE dwr.status = 'approved') as approved_daily_reports,
    
    -- Attendance
    COALESCE(AVG(ip_all.days_present::DECIMAL / NULLIF(ip_all.total_working_days, 0)) * 100, 0) as avg_attendance_percentage,
    
    -- Certificate Status
    CASE WHEN ic.id IS NOT NULL THEN 'issued' 
         WHEN check_certificate_eligibility(iu.id) THEN 'eligible' 
         ELSE 'not_eligible' END as certificate_status,
    ic.certificate_number,
    
    -- Mentor Info
    mentor.name as mentor_name
    
FROM intern_users iu
LEFT JOIN intern_performance ip_current ON iu.id = ip_current.intern_id 
    AND ip_current.evaluation_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
LEFT JOIN intern_performance ip_all ON iu.id = ip_all.intern_id
LEFT JOIN project_assignments pa ON iu.id = pa.assigned_to
LEFT JOIN daily_work_reports dwr ON iu.id = dwr.intern_id
LEFT JOIN intern_certificates ic ON iu.id = ic.intern_id
LEFT JOIN intern_users mentor ON iu.mentor_id = mentor.id
WHERE iu.status = 'active'
GROUP BY iu.id, iu.intern_id, iu.name, iu.department, iu.start_date, iu.end_date, iu.status,
         ip_current.overall_performance_score, ip_current.performance_grade,
         ic.id, ic.certificate_number, mentor.name;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_intern_users_intern_id ON intern_users(intern_id);
CREATE INDEX IF NOT EXISTS idx_intern_users_department ON intern_users(department);
CREATE INDEX IF NOT EXISTS idx_intern_users_mentor_id ON intern_users(mentor_id);
CREATE INDEX IF NOT EXISTS idx_intern_users_status ON intern_users(status);

CREATE INDEX IF NOT EXISTS idx_daily_work_reports_intern_id ON daily_work_reports(intern_id);
CREATE INDEX IF NOT EXISTS idx_daily_work_reports_date ON daily_work_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_work_reports_status ON daily_work_reports(status);
CREATE INDEX IF NOT EXISTS idx_daily_work_reports_intern_date ON daily_work_reports(intern_id, report_date);

CREATE INDEX IF NOT EXISTS idx_project_assignments_assigned_to ON project_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_assignments_department ON project_assignments(department);
CREATE INDEX IF NOT EXISTS idx_project_assignments_status ON project_assignments(status);
CREATE INDEX IF NOT EXISTS idx_project_assignments_mentor_id ON project_assignments(mentor_id);

CREATE INDEX IF NOT EXISTS idx_project_completions_project_id ON project_completions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_completions_intern_id ON project_completions(intern_id);

CREATE INDEX IF NOT EXISTS idx_intern_certificates_intern_id ON intern_certificates(intern_id);
CREATE INDEX IF NOT EXISTS idx_intern_certificates_department ON intern_certificates(department);
CREATE INDEX IF NOT EXISTS idx_intern_certificates_verification_code ON intern_certificates(verification_code);

CREATE INDEX IF NOT EXISTS idx_intern_performance_intern_id ON intern_performance(intern_id);
CREATE INDEX IF NOT EXISTS idx_intern_performance_month ON intern_performance(evaluation_month);
CREATE INDEX IF NOT EXISTS idx_intern_performance_intern_month ON intern_performance(intern_id, evaluation_month);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample intern users
INSERT INTO intern_users (intern_id, name, email, department, start_date, end_date, duration_months, stipend_amount, college_name, course, year_of_study, skills) VALUES
('INT001', 'Rahul Sharma', 'rahul.sharma.intern@company.com', 'AI', '2024-01-15', '2024-04-15', 3, 15000.00, 'IIT Delhi', 'Computer Science', 3, ARRAY['Python', 'Machine Learning', 'TensorFlow']),
('INT002', 'Priya Patel', 'priya.patel.intern@company.com', 'Marketing', '2024-01-20', '2024-04-20', 3, 12000.00, 'Delhi University', 'Business Administration', 2, ARRAY['Digital Marketing', 'Content Writing', 'Social Media']),
('INT003', 'Amit Kumar', 'amit.kumar.intern@company.com', 'Sales', '2024-02-01', '2024-05-01', 3, 13000.00, 'Symbiosis', 'Management', 3, ARRAY['Sales', 'Communication', 'CRM']),
('INT004', 'Sneha Gupta', 'sneha.gupta.intern@company.com', 'HR', '2024-02-10', '2024-05-10', 3, 11000.00, 'XLRI', 'Human Resources', 2, ARRAY['Recruitment', 'Employee Relations', 'HR Analytics'])
ON CONFLICT (intern_id) DO NOTHING;

-- Insert sample project assignments
INSERT INTO project_assignments (project_code, title, description, department, assigned_to, assigned_by, start_date, expected_end_date, objectives, deliverables, difficulty_level, required_skills) VALUES
('PROJ-AI-001', 'Customer Sentiment Analysis', 'Build a sentiment analysis model for customer reviews', 'AI', 
 (SELECT id FROM intern_users WHERE intern_id = 'INT001'), 
 (SELECT id FROM intern_users WHERE intern_id = 'INT001'), 
 '2024-01-20', '2024-03-20', 
 'Develop ML model to classify customer sentiment', 
 'Trained model, API endpoint, documentation', 
 'intermediate', 
 ARRAY['Python', 'NLP', 'Machine Learning']),
('PROJ-MKT-001', 'Social Media Campaign Analysis', 'Analyze performance of recent social media campaigns', 'Marketing', 
 (SELECT id FROM intern_users WHERE intern_id = 'INT002'), 
 (SELECT id FROM intern_users WHERE intern_id = 'INT002'), 
 '2024-01-25', '2024-03-25', 
 'Evaluate campaign effectiveness and ROI', 
 'Analysis report, recommendations, presentation', 
 'beginner', 
 ARRAY['Analytics', 'Social Media', 'Reporting'])
ON CONFLICT (project_code) DO NOTHING;

COMMIT;