-- Step 10: Create employee incentives system tables
-- Run this after step9_create_performance_tables.sql

-- Create incentive_types table for different types of incentives
CREATE TABLE IF NOT EXISTS public.incentive_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    type_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    
    -- Incentive details
    base_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'INR',
    is_percentage BOOLEAN DEFAULT false, -- If true, base_amount is percentage of salary
    
    -- Eligibility criteria
    min_tenure_months INTEGER DEFAULT 0,
    eligible_departments TEXT[], -- Array of department names
    eligible_roles TEXT[], -- Array of role names
    max_claims_per_year INTEGER DEFAULT 1,
    
    -- Requirements
    requires_proof BOOLEAN DEFAULT true,
    proof_types TEXT[], -- e.g., ['document', 'video', 'testimonial']
    requires_manager_approval BOOLEAN DEFAULT true,
    requires_hr_approval BOOLEAN DEFAULT true,
    
    -- Status and settings
    is_active BOOLEAN DEFAULT true,
    auto_approve BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create employee_incentives table for tracking incentive applications
CREATE TABLE IF NOT EXISTS public.employee_incentives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    
    -- Incentive details
    incentive_type_id UUID NOT NULL,
    incentive_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Application details
    application_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    justification TEXT,
    
    -- Proof and documentation
    proof_submitted BOOLEAN DEFAULT false,
    proof_type VARCHAR(50), -- 'document', 'video', 'testimonial', etc.
    proof_url TEXT, -- URL to uploaded proof file
    proof_description TEXT,
    additional_documents JSONB, -- Array of document URLs/descriptions
    
    -- Approval workflow
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'manager_approved', 'hr_approved', 'approved', 
        'rejected', 'on_hold', 'cancelled', 'paid'
    )),
    
    -- Manager approval
    manager_id VARCHAR(255),
    manager_name VARCHAR(255),
    manager_approval_date DATE,
    manager_comments TEXT,
    
    -- HR approval
    hr_id VARCHAR(255),
    hr_name VARCHAR(255),
    hr_approval_date DATE,
    hr_comments TEXT,
    
    -- Payment details
    payment_method VARCHAR(20) CHECK (payment_method IN ('bank_transfer', 'razorpay', 'cash', 'salary_credit')),
    payment_reference VARCHAR(100),
    payment_date DATE,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled'
    )),
    
    -- Rejection details
    rejection_reason TEXT,
    rejection_date DATE,
    rejected_by VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_employee_incentives_employee FOREIGN KEY (employee_id) REFERENCES public.employees(id),
    CONSTRAINT fk_employee_incentives_type FOREIGN KEY (incentive_type_id) REFERENCES public.incentive_types(id)
);

-- Create incentive_approvals table for detailed approval tracking
CREATE TABLE IF NOT EXISTS public.incentive_approvals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incentive_id UUID NOT NULL,
    
    -- Approval details
    approver_id VARCHAR(255) NOT NULL,
    approver_name VARCHAR(255) NOT NULL,
    approver_role VARCHAR(50) NOT NULL, -- 'manager', 'hr', 'admin'
    
    -- Approval decision
    approval_status VARCHAR(20) NOT NULL CHECK (approval_status IN ('approved', 'rejected', 'on_hold')),
    approval_date DATE NOT NULL DEFAULT CURRENT_DATE,
    comments TEXT,
    
    -- Conditions or modifications
    modified_amount DECIMAL(10,2), -- If approver changes the amount
    conditions TEXT, -- Any conditions attached to approval
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_incentive_approvals_incentive FOREIGN KEY (incentive_id) REFERENCES public.employee_incentives(id)
);

-- Create incentive_payments table for payment tracking
CREATE TABLE IF NOT EXISTS public.incentive_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    incentive_id UUID NOT NULL,
    
    -- Payment details
    payment_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(20) NOT NULL,
    
    -- Transaction details
    transaction_id VARCHAR(100),
    payment_gateway VARCHAR(50), -- 'razorpay', 'bank', 'manual'
    gateway_response JSONB, -- Full response from payment gateway
    
    -- Status tracking
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN (
        'initiated', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
    )),
    
    -- Dates
    initiated_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_date DATE,
    failed_date DATE,
    
    -- Error handling
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Processing details
    processed_by VARCHAR(255),
    processing_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Foreign key constraint
    CONSTRAINT fk_incentive_payments_incentive FOREIGN KEY (incentive_id) REFERENCES public.employee_incentives(id)
);

-- Create triggers for updated_at columns
CREATE OR REPLACE TRIGGER update_incentive_types_updated_at
    BEFORE UPDATE ON public.incentive_types
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_employee_incentives_updated_at
    BEFORE UPDATE ON public.employee_incentives
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_incentive_payments_updated_at
    BEFORE UPDATE ON public.incentive_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_incentive_types_active ON public.incentive_types(is_active);
CREATE INDEX IF NOT EXISTS idx_incentive_types_code ON public.incentive_types(type_code);

CREATE INDEX IF NOT EXISTS idx_employee_incentives_employee_id ON public.employee_incentives(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_incentives_status ON public.employee_incentives(status);
CREATE INDEX IF NOT EXISTS idx_employee_incentives_type ON public.employee_incentives(incentive_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_incentives_application_date ON public.employee_incentives(application_date);
CREATE INDEX IF NOT EXISTS idx_employee_incentives_department ON public.employee_incentives(department);

CREATE INDEX IF NOT EXISTS idx_incentive_approvals_incentive_id ON public.incentive_approvals(incentive_id);
CREATE INDEX IF NOT EXISTS idx_incentive_approvals_approver ON public.incentive_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_incentive_approvals_status ON public.incentive_approvals(approval_status);

CREATE INDEX IF NOT EXISTS idx_incentive_payments_incentive_id ON public.incentive_payments(incentive_id);
CREATE INDEX IF NOT EXISTS idx_incentive_payments_status ON public.incentive_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_incentive_payments_method ON public.incentive_payments(payment_method);

-- Enable Row Level Security
ALTER TABLE public.incentive_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentive_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON public.incentive_types FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.employee_incentives FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.incentive_approvals FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.incentive_payments FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON public.incentive_types TO authenticated, anon;
GRANT ALL ON public.employee_incentives TO authenticated, anon;
GRANT ALL ON public.incentive_approvals TO authenticated, anon;
GRANT ALL ON public.incentive_payments TO authenticated, anon;

-- Insert default incentive types
INSERT INTO public.incentive_types (
    type_name, type_code, description, base_amount, requires_proof, proof_types
) VALUES
('Employee Referral Bonus', 'REFERRAL', 'Bonus for referring new employees who complete probation', 5000.00, true, ARRAY['document', 'testimonial']),
('Client Testimonial Reward', 'TESTIMONIAL', 'Reward for obtaining positive client testimonials', 2000.00, true, ARRAY['testimonial', 'document']),
('Training Video Creation', 'VIDEO', 'Incentive for creating training or promotional videos', 3000.00, true, ARRAY['video']),
('Performance Excellence Bonus', 'PERFORMANCE', 'Bonus for exceptional performance ratings', 10000.00, false, ARRAY['document']),
('Innovation Award', 'INNOVATION', 'Award for innovative ideas or process improvements', 7500.00, true, ARRAY['document', 'testimonial'])
ON CONFLICT (type_code) DO NOTHING;

-- Insert sample incentive applications
INSERT INTO public.employee_incentives (
    employee_id, employee_name, department, incentive_type_id, incentive_amount,
    description, status, application_date
) VALUES
((SELECT id FROM public.employees WHERE email = 'rahul.sharma@testcompany.com'), 'Rahul Sharma', 'Engineering', 
 (SELECT id FROM public.incentive_types WHERE type_code = 'REFERRAL'), 5000.00,
 'Referred Amit Kumar who joined as Software Engineer and completed 3 months probation', 'approved', CURRENT_DATE - INTERVAL '30 days'),
((SELECT id FROM public.employees WHERE email = 'priya.patel@testcompany.com'), 'Priya Patel', 'Engineering', 
 (SELECT id FROM public.incentive_types WHERE type_code = 'TESTIMONIAL'), 2000.00,
 'Received excellent testimonial from TechCorp client for project delivery', 'pending', CURRENT_DATE - INTERVAL '5 days'),
((SELECT id FROM public.employees WHERE email = 'sneha.gupta@testcompany.com'), 'Sneha Gupta', 'Marketing', 
 (SELECT id FROM public.incentive_types WHERE type_code = 'VIDEO'), 3000.00,
 'Created company introduction video for social media marketing', 'manager_approved', CURRENT_DATE - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

SELECT 'Employee incentives system tables created successfully!' as status;