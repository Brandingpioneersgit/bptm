-- Create leave_applications table
CREATE TABLE IF NOT EXISTS public.leave_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_name VARCHAR(255) NOT NULL,
  employee_email VARCHAR(255) NOT NULL,
  employee_id UUID,
  leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('sick', 'vacation', 'personal', 'wfh', 'emergency', 'maternity', 'paternity')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  total_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  is_half_day BOOLEAN DEFAULT false,
  emergency_contact VARCHAR(255),
  backup_person VARCHAR(255),
  work_handover TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_applications_employee_email ON public.leave_applications(employee_email);
CREATE INDEX IF NOT EXISTS idx_leave_applications_status ON public.leave_applications(status);
CREATE INDEX IF NOT EXISTS idx_leave_applications_dates ON public.leave_applications(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_applications_leave_type ON public.leave_applications(leave_type);

-- Add RLS policies
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for leave applications
CREATE POLICY "Public read access for leave applications" ON public.leave_applications
  FOR SELECT USING (true);

-- Policy: Public insert access (for demo purposes)
CREATE POLICY "Public insert access for leave applications" ON public.leave_applications
  FOR INSERT WITH CHECK (true);

-- Policy: Public update access (for demo purposes)
CREATE POLICY "Public update access for leave applications" ON public.leave_applications
  FOR UPDATE USING (true);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leave_applications_updated_at
  BEFORE UPDATE ON public.leave_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.leave_applications (employee_name, employee_email, leave_type, start_date, end_date, reason, status, is_half_day) VALUES
('Rahul Sharma', 'rahul.sharma@testcompany.com', 'vacation', '2024-02-15', '2024-02-17', 'Family vacation to Goa', 'approved', false),
('Priya Patel', 'priya.patel@testcompany.com', 'sick', '2024-02-10', '2024-02-10', 'Fever and cold', 'approved', true),
('Amit Kumar', 'amit.kumar@testcompany.com', 'wfh', '2024-02-12', '2024-02-14', 'Home renovation work', 'pending', false),
('Sneha Reddy', 'sneha.reddy@testcompany.com', 'personal', '2024-02-20', '2024-02-21', 'Wedding in family', 'pending', false),
('Vikram Singh', 'vikram.singh@testcompany.com', 'sick', '2024-02-08', '2024-02-09', 'Medical checkup', 'approved', false)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.leave_applications IS 'Table to store employee leave and work from home applications';
COMMENT ON COLUMN public.leave_applications.leave_type IS 'Type of leave: sick, vacation, personal, wfh, emergency, maternity, paternity';
COMMENT ON COLUMN public.leave_applications.status IS 'Application status: pending, approved, rejected, cancelled';
COMMENT ON COLUMN public.leave_applications.total_days IS 'Automatically calculated total days of leave';
COMMENT ON COLUMN public.leave_applications.is_half_day IS 'Whether this is a half-day leave application';