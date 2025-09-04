-- Create HR Tables for HR Dashboard
-- This script creates the necessary tables for the HR Department Dashboard

-- Create hr_employees table (extended employee information)
CREATE TABLE IF NOT EXISTS public.hr_employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_number TEXT UNIQUE,
    hire_date DATE NOT NULL,
    probation_end_date DATE,
    employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern', 'freelancer')),
    work_location TEXT DEFAULT 'office' CHECK (work_location IN ('office', 'remote', 'hybrid')),
    salary DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    pay_frequency TEXT DEFAULT 'monthly' CHECK (pay_frequency IN ('weekly', 'bi_weekly', 'monthly', 'annually')),
    benefits_eligible BOOLEAN DEFAULT true,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'United States',
    tax_id TEXT,
    bank_account_number TEXT,
    bank_routing_number TEXT,
    performance_rating DECIMAL(3,2) DEFAULT 0,
    last_review_date DATE,
    next_review_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave')),
    termination_date DATE,
    termination_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_documents table
CREATE TABLE IF NOT EXISTS public.employee_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'id_copy', 'resume', 'certificate', 'performance_review', 'disciplinary', 'other')),
    document_name TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    mime_type TEXT,
    upload_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_required BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    uploaded_by UUID REFERENCES public.employees(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_reviews table
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.employees(id),
    review_period_start DATE NOT NULL,
    review_period_end DATE NOT NULL,
    review_type TEXT DEFAULT 'annual' CHECK (review_type IN ('probation', 'quarterly', 'annual', 'special')),
    overall_rating DECIMAL(3,2) DEFAULT 0,
    goals_achievement DECIMAL(3,2) DEFAULT 0,
    technical_skills DECIMAL(3,2) DEFAULT 0,
    communication_skills DECIMAL(3,2) DEFAULT 0,
    teamwork DECIMAL(3,2) DEFAULT 0,
    leadership DECIMAL(3,2) DEFAULT 0,
    punctuality DECIMAL(3,2) DEFAULT 0,
    strengths TEXT,
    areas_for_improvement TEXT,
    goals_next_period TEXT,
    employee_comments TEXT,
    reviewer_comments TEXT,
    hr_comments TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_employee', 'pending_manager', 'completed', 'archived')),
    due_date DATE,
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_training table
CREATE TABLE IF NOT EXISTS public.employee_training (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    training_name TEXT NOT NULL,
    training_type TEXT CHECK (training_type IN ('onboarding', 'technical', 'soft_skills', 'compliance', 'leadership', 'safety', 'other')),
    provider TEXT,
    start_date DATE,
    end_date DATE,
    duration_hours DECIMAL(5,2),
    cost DECIMAL(8,2),
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    certificate_url TEXT,
    expiry_date DATE,
    mandatory BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_attendance table
CREATE TABLE IF NOT EXISTS public.employee_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    break_duration_minutes INTEGER DEFAULT 0,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    attendance_type TEXT DEFAULT 'present' CHECK (attendance_type IN ('present', 'absent', 'late', 'half_day', 'work_from_home', 'sick_leave', 'vacation', 'holiday')),
    location TEXT,
    notes TEXT,
    approved_by UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(4,1) NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    applied_date DATE DEFAULT CURRENT_DATE,
    approved_by UUID REFERENCES public.employees(id),
    approved_date DATE,
    rejection_reason TEXT,
    emergency_contact TEXT,
    work_handover TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create disciplinary_actions table
CREATE TABLE IF NOT EXISTS public.disciplinary_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('verbal_warning', 'written_warning', 'final_warning', 'suspension', 'termination', 'other')),
    incident_date DATE NOT NULL,
    description TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    issued_by UUID REFERENCES public.employees(id),
    witness_1 UUID REFERENCES public.employees(id),
    witness_2 UUID REFERENCES public.employees(id),
    employee_acknowledgment BOOLEAN DEFAULT false,
    employee_comments TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'appealed', 'overturned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hr_employees_status ON public.hr_employees(status);
CREATE INDEX IF NOT EXISTS idx_hr_employees_hire_date ON public.hr_employees(hire_date);
CREATE INDEX IF NOT EXISTS idx_employee_documents_type ON public.employee_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_employee_documents_status ON public.employee_documents(status);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON public.performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON public.performance_reviews(status);
CREATE INDEX IF NOT EXISTS idx_employee_training_employee ON public.employee_training(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_training_status ON public.employee_training(status);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON public.employee_attendance(date);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee ON public.employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_employee ON public.disciplinary_actions(employee_id);

-- Enable Row Level Security
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplinary_actions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all access for now)
CREATE POLICY "Users can view all HR data" ON public.hr_employees FOR SELECT USING (true);
CREATE POLICY "Users can insert HR data" ON public.hr_employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update HR data" ON public.hr_employees FOR UPDATE USING (true);

CREATE POLICY "Users can view all documents" ON public.employee_documents FOR SELECT USING (true);
CREATE POLICY "Users can insert documents" ON public.employee_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update documents" ON public.employee_documents FOR UPDATE USING (true);

CREATE POLICY "Users can view all reviews" ON public.performance_reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert reviews" ON public.performance_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update reviews" ON public.performance_reviews FOR UPDATE USING (true);

CREATE POLICY "Users can view all training" ON public.employee_training FOR SELECT USING (true);
CREATE POLICY "Users can insert training" ON public.employee_training FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update training" ON public.employee_training FOR UPDATE USING (true);

CREATE POLICY "Users can view all attendance" ON public.employee_attendance FOR SELECT USING (true);
CREATE POLICY "Users can insert attendance" ON public.employee_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update attendance" ON public.employee_attendance FOR UPDATE USING (true);

CREATE POLICY "Users can view all leave requests" ON public.leave_requests FOR SELECT USING (true);
CREATE POLICY "Users can insert leave requests" ON public.leave_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update leave requests" ON public.leave_requests FOR UPDATE USING (true);

CREATE POLICY "Users can view all disciplinary actions" ON public.disciplinary_actions FOR SELECT USING (true);
CREATE POLICY "Users can insert disciplinary actions" ON public.disciplinary_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update disciplinary actions" ON public.disciplinary_actions FOR UPDATE USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_hr_employees_updated_at BEFORE UPDATE ON public.hr_employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON public.employee_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_training_updated_at BEFORE UPDATE ON public.employee_training FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_attendance_updated_at BEFORE UPDATE ON public.employee_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disciplinary_actions_updated_at BEFORE UPDATE ON public.disciplinary_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
-- Insert HR employee records for existing employees
INSERT INTO public.hr_employees (employee_id, employee_number, hire_date, employment_type, salary, performance_rating, status)
SELECT 
    e.id,
    'EMP' || LPAD(ROW_NUMBER() OVER (ORDER BY e.created_at)::TEXT, 4, '0'),
    CURRENT_DATE - INTERVAL '1 year' * RANDOM(),
    CASE (ROW_NUMBER() OVER (ORDER BY e.created_at) % 4)
        WHEN 0 THEN 'full_time'
        WHEN 1 THEN 'part_time'
        WHEN 2 THEN 'contract'
        ELSE 'full_time'
    END,
    40000 + RANDOM() * 80000,
    3.0 + RANDOM() * 2.0,
    'active'
FROM public.employees e
LIMIT 10;

-- Insert sample leave requests
INSERT INTO public.leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason, status)
SELECT 
    e.id,
    CASE (RANDOM() * 4)::INTEGER
        WHEN 0 THEN 'vacation'
        WHEN 1 THEN 'sick'
        WHEN 2 THEN 'personal'
        ELSE 'vacation'
    END,
    CURRENT_DATE + INTERVAL '7 days' * RANDOM(),
    CURRENT_DATE + INTERVAL '14 days' * RANDOM(),
    1 + RANDOM() * 10,
    'Sample leave request',
    CASE (RANDOM() * 3)::INTEGER
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'approved'
        ELSE 'pending'
    END
FROM public.employees e
LIMIT 15;

-- Insert sample training records
INSERT INTO public.employee_training (employee_id, training_name, training_type, duration_hours, status, completion_percentage)
SELECT 
    e.id,
    CASE (RANDOM() * 5)::INTEGER
        WHEN 0 THEN 'New Employee Orientation'
        WHEN 1 THEN 'Technical Skills Development'
        WHEN 2 THEN 'Leadership Training'
        WHEN 3 THEN 'Safety Compliance'
        ELSE 'Communication Skills'
    END,
    CASE (RANDOM() * 4)::INTEGER
        WHEN 0 THEN 'onboarding'
        WHEN 1 THEN 'technical'
        WHEN 2 THEN 'soft_skills'
        ELSE 'compliance'
    END,
    8 + RANDOM() * 32,
    CASE (RANDOM() * 3)::INTEGER
        WHEN 0 THEN 'completed'
        WHEN 1 THEN 'in_progress'
        ELSE 'planned'
    END,
    RANDOM() * 100
FROM public.employees e
LIMIT 20;

COMMIT;