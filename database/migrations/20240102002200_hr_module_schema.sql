-- HR Module Schema Migration
-- Comprehensive HR performance tracking system with role-based access
-- Created: 2024-01-02

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Create HR users table (extends base users if needed)
CREATE TABLE IF NOT EXISTS public.hr_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'HR Lead', 'Manager', 'Employee')),
  department TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  hire_date DATE,
  manager_id UUID REFERENCES public.hr_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HR monthly entries table
CREATE TABLE IF NOT EXISTS public.hr_monthly_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.hr_users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: YYYY-MM
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'returned')),
  reviewed_by UUID REFERENCES public.hr_users(id),
  reviewed_at TIMESTAMPTZ,
  review_comment TEXT,
  
  -- Core Performance Metrics (0-100)
  myzen_performance DECIMAL(5,2) CHECK (myzen_performance >= 0 AND myzen_performance <= 100),
  attendance_pct DECIMAL(5,2) CHECK (attendance_pct >= 0 AND attendance_pct <= 100),
  role_adjusted_performance_pct DECIMAL(5,2) CHECK (role_adjusted_performance_pct >= 0 AND role_adjusted_performance_pct <= 100),
  
  -- Behavior & Values (Boolean flags)
  attention_to_work BOOLEAN DEFAULT FALSE,
  quality_of_work BOOLEAN DEFAULT FALSE,
  skill BOOLEAN DEFAULT FALSE,
  speed BOOLEAN DEFAULT FALSE,
  consistency BOOLEAN DEFAULT FALSE,
  pressure_handling BOOLEAN DEFAULT FALSE,
  supervision_need_low BOOLEAN DEFAULT FALSE,
  discipline BOOLEAN DEFAULT FALSE,
  professionalism BOOLEAN DEFAULT FALSE,
  esteemable_acts BOOLEAN DEFAULT FALSE,
  punctuality BOOLEAN DEFAULT FALSE,
  teamwork BOOLEAN DEFAULT FALSE,
  ownership BOOLEAN DEFAULT FALSE,
  knowledgeable_smart BOOLEAN DEFAULT FALSE,
  commitment BOOLEAN DEFAULT FALSE,
  communication BOOLEAN DEFAULT FALSE,
  capacity_capability BOOLEAN DEFAULT FALSE,
  omniedure BOOLEAN DEFAULT FALSE, -- multi-role versatility
  updated_with_industry_trends BOOLEAN DEFAULT FALSE,
  personal_development BOOLEAN DEFAULT FALSE,
  knowledge_sharing BOOLEAN DEFAULT FALSE,
  code_integrity BOOLEAN DEFAULT FALSE, -- for tech roles
  client_control BOOLEAN DEFAULT FALSE,
  focus_on_kpis_deadlines BOOLEAN DEFAULT FALSE,
  keeps_it_simple BOOLEAN DEFAULT FALSE,
  aligned_with_company_values BOOLEAN DEFAULT FALSE,
  
  -- Manager notes
  manager_notes TEXT,
  
  -- System calculated scores
  behavior_values_score DECIMAL(4,2) DEFAULT 0 CHECK (behavior_values_score >= 0 AND behavior_values_score <= 30),
  capability_score DECIMAL(4,2) DEFAULT 0 CHECK (capability_score >= 0 AND capability_score <= 15),
  delivery_ownership_score DECIMAL(4,2) DEFAULT 0 CHECK (delivery_ownership_score >= 0 AND delivery_ownership_score <= 15),
  wellness_score DECIMAL(4,2) DEFAULT 0 CHECK (wellness_score >= 0 AND wellness_score <= 10),
  core_perf_score DECIMAL(4,2) DEFAULT 0 CHECK (core_perf_score >= 0 AND core_perf_score <= 30),
  month_score DECIMAL(5,2) DEFAULT 0 CHECK (month_score >= 0 AND month_score <= 100),
  
  -- Penalties and adjustments
  chronic_absenteeism_penalty DECIMAL(4,2) DEFAULT 0,
  behavior_breach_penalty DECIMAL(4,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for employee-month combination
  UNIQUE(employee_id, month)
);

-- Create HR daily habits table (optional daily tracking)
CREATE TABLE IF NOT EXISTS public.hr_daily_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.hr_users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Daily wellness tracking
  meditation BOOLEAN DEFAULT FALSE,
  workout BOOLEAN DEFAULT FALSE,
  water_intake BOOLEAN DEFAULT FALSE,
  diet_plan BOOLEAN DEFAULT FALSE,
  affirmations BOOLEAN DEFAULT FALSE,
  learnings BOOLEAN DEFAULT FALSE,
  reading BOOLEAN DEFAULT FALSE,
  task_uploaded_to_ai_table BOOLEAN DEFAULT FALSE,
  attendance BOOLEAN DEFAULT FALSE,
  
  -- Daily remarks
  remarks TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for employee-date combination
  UNIQUE(employee_id, date)
);

-- Create HR appraisal table
CREATE TABLE IF NOT EXISTS public.hr_appraisal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.hr_users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  avg_month_score DECIMAL(5,2),
  final_rating_band TEXT CHECK (final_rating_band IN ('A', 'B', 'C', 'D')),
  eligible_increment_pct DECIMAL(5,2),
  notes TEXT,
  appraiser_id UUID REFERENCES public.hr_users(id),
  appraisal_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hr_users_role ON public.hr_users(role);
CREATE INDEX IF NOT EXISTS idx_hr_users_department ON public.hr_users(department);
CREATE INDEX IF NOT EXISTS idx_hr_users_manager ON public.hr_users(manager_id);
CREATE INDEX IF NOT EXISTS idx_hr_monthly_entries_employee ON public.hr_monthly_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_monthly_entries_month ON public.hr_monthly_entries(month);
CREATE INDEX IF NOT EXISTS idx_hr_monthly_entries_status ON public.hr_monthly_entries(status);
CREATE INDEX IF NOT EXISTS idx_hr_daily_habits_employee ON public.hr_daily_habits(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_daily_habits_date ON public.hr_daily_habits(date);
CREATE INDEX IF NOT EXISTS idx_hr_appraisal_employee ON public.hr_appraisal(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_appraisal_period ON public.hr_appraisal(period_start, period_end);

-- Function to calculate monthly scores
CREATE OR REPLACE FUNCTION calculate_hr_monthly_score(entry_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  entry_record RECORD;
  core_score DECIMAL(4,2) := 0;
  behavior_score DECIMAL(4,2) := 0;
  capability_score DECIMAL(4,2) := 0;
  delivery_score DECIMAL(4,2) := 0;
  wellness_score DECIMAL(4,2) := 0;
  total_score DECIMAL(5,2) := 0;
  penalty_total DECIMAL(4,2) := 0;
BEGIN
  -- Get the entry record
  SELECT * INTO entry_record FROM public.hr_monthly_entries WHERE id = entry_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- A) Core Performance Score (30 points)
  -- MyZen Performance (0-15 points)
  IF entry_record.myzen_performance >= 95 THEN
    core_score := core_score + 15;
  ELSIF entry_record.myzen_performance >= 85 THEN
    core_score := core_score + 13;
  ELSIF entry_record.myzen_performance >= 75 THEN
    core_score := core_score + 11;
  ELSIF entry_record.myzen_performance >= 65 THEN
    core_score := core_score + 8;
  ELSIF entry_record.myzen_performance >= 50 THEN
    core_score := core_score + 5;
  ELSE
    core_score := core_score + 2;
  END IF;
  
  -- Attendance (0-10 points)
  IF entry_record.attendance_pct >= 98 THEN
    core_score := core_score + 10;
  ELSIF entry_record.attendance_pct >= 95 THEN
    core_score := core_score + 9;
  ELSIF entry_record.attendance_pct >= 92 THEN
    core_score := core_score + 7;
  ELSIF entry_record.attendance_pct >= 88 THEN
    core_score := core_score + 5;
  ELSIF entry_record.attendance_pct >= 85 THEN
    core_score := core_score + 3;
  ELSE
    core_score := core_score + 0;
  END IF;
  
  -- Role-adjusted performance (0-5 points)
  core_score := core_score + ROUND((COALESCE(entry_record.role_adjusted_performance_pct, 0) / 100) * 5, 2);
  
  -- B) Behavior & Values Score (30 points max)
  behavior_score := (
    (CASE WHEN entry_record.quality_of_work THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.consistency THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.discipline THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.professionalism THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.teamwork THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.ownership THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.commitment THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.communication THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.updated_with_industry_trends THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.personal_development THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.knowledge_sharing THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.punctuality THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.pressure_handling THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.keeps_it_simple THEN 2 ELSE 0 END) +
    (CASE WHEN entry_record.aligned_with_company_values THEN 2 ELSE 0 END)
  );
  
  -- Cap at 30 points
  behavior_score := LEAST(behavior_score, 30);
  
  -- C) Capability Score (15 points)
  capability_score := (
    (CASE WHEN entry_record.skill THEN 3 ELSE 0 END) +
    (CASE WHEN entry_record.knowledgeable_smart THEN 3 ELSE 0 END) +
    (CASE WHEN entry_record.capacity_capability THEN 3 ELSE 0 END) +
    (CASE WHEN entry_record.omniedure THEN 3 ELSE 0 END) +
    (CASE WHEN entry_record.code_integrity THEN 3 ELSE 0 END)
  );
  
  -- D) Delivery & Ownership Score (15 points)
  delivery_score := (
    (CASE WHEN entry_record.focus_on_kpis_deadlines THEN 3 ELSE 0 END) +
    (CASE WHEN entry_record.attention_to_work THEN 3 ELSE 0 END) +
    (CASE WHEN entry_record.speed THEN 3 ELSE 0 END) +
    (CASE WHEN entry_record.client_control THEN 3 ELSE 0 END) +
    (CASE WHEN entry_record.supervision_need_low THEN 3 ELSE 0 END)
  );
  
  -- E) Wellness Score (10 points) - from daily habits or monthly self-report
  wellness_score := COALESCE(entry_record.wellness_score, 0);
  
  -- Calculate total before penalties
  total_score := core_score + behavior_score + capability_score + delivery_score + wellness_score;
  
  -- Apply penalties
  penalty_total := COALESCE(entry_record.chronic_absenteeism_penalty, 0) + 
                   COALESCE(entry_record.behavior_breach_penalty, 0);
  
  total_score := GREATEST(total_score - penalty_total, 0);
  
  -- Update the entry with calculated scores
  UPDATE public.hr_monthly_entries 
  SET 
    core_perf_score = core_score,
    behavior_values_score = behavior_score,
    capability_score = capability_score,
    delivery_ownership_score = delivery_score,
    wellness_score = wellness_score,
    month_score = total_score,
    updated_at = NOW()
  WHERE id = entry_id;
  
  RETURN total_score;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate wellness score from daily habits
CREATE OR REPLACE FUNCTION calculate_monthly_wellness_score(emp_id UUID, target_month TEXT)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  total_days INTEGER;
  completed_habits INTEGER;
  wellness_pct DECIMAL(5,2);
  wellness_score DECIMAL(4,2);
BEGIN
  -- Count total days in month for employee
  SELECT COUNT(*) INTO total_days
  FROM public.hr_daily_habits
  WHERE employee_id = emp_id 
    AND TO_CHAR(date, 'YYYY-MM') = target_month;
  
  IF total_days = 0 THEN
    RETURN 0;
  END IF;
  
  -- Count completed habits (assuming 8 habits per day)
  SELECT 
    SUM(
      (CASE WHEN meditation THEN 1 ELSE 0 END) +
      (CASE WHEN workout THEN 1 ELSE 0 END) +
      (CASE WHEN water_intake THEN 1 ELSE 0 END) +
      (CASE WHEN diet_plan THEN 1 ELSE 0 END) +
      (CASE WHEN affirmations THEN 1 ELSE 0 END) +
      (CASE WHEN learnings THEN 1 ELSE 0 END) +
      (CASE WHEN reading THEN 1 ELSE 0 END) +
      (CASE WHEN task_uploaded_to_ai_table THEN 1 ELSE 0 END)
    ) INTO completed_habits
  FROM public.hr_daily_habits
  WHERE employee_id = emp_id 
    AND TO_CHAR(date, 'YYYY-MM') = target_month;
  
  -- Calculate percentage
  wellness_pct := (completed_habits::DECIMAL / (total_days * 8)) * 100;
  
  -- Map to score
  IF wellness_pct >= 90 THEN
    wellness_score := 10;
  ELSIF wellness_pct >= 80 THEN
    wellness_score := 8;
  ELSIF wellness_pct >= 70 THEN
    wellness_score := 6;
  ELSIF wellness_pct >= 60 THEN
    wellness_score := 4;
  ELSIF wellness_pct >= 50 THEN
    wellness_score := 2;
  ELSE
    wellness_score := 0;
  END IF;
  
  RETURN wellness_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate scores when entry is updated
CREATE OR REPLACE FUNCTION trigger_calculate_hr_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate wellness score from daily habits if not manually set
  IF NEW.wellness_score IS NULL OR NEW.wellness_score = 0 THEN
    NEW.wellness_score := calculate_monthly_wellness_score(NEW.employee_id, NEW.month);
  END IF;
  
  -- Calculate total score
  PERFORM calculate_hr_monthly_score(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hr_monthly_scores
  AFTER INSERT OR UPDATE ON public.hr_monthly_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_hr_scores();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_hr_users_updated_at
  BEFORE UPDATE ON public.hr_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_monthly_entries_updated_at
  BEFORE UPDATE ON public.hr_monthly_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_daily_habits_updated_at
  BEFORE UPDATE ON public.hr_daily_habits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_appraisal_updated_at
  BEFORE UPDATE ON public.hr_appraisal
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.hr_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_monthly_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_appraisal ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- HR Users policies
CREATE POLICY "Users can view their own profile" ON public.hr_users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Managers can view their team" ON public.hr_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.hr_users manager 
      WHERE manager.id::text = auth.uid()::text 
        AND manager.role IN ('Manager', 'HR Lead', 'Admin')
        AND (public.hr_users.manager_id = manager.id OR manager.role IN ('HR Lead', 'Admin'))
    )
  );

CREATE POLICY "HR and Admin can manage users" ON public.hr_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hr_users 
      WHERE id::text = auth.uid()::text 
        AND role IN ('HR Lead', 'Admin')
    )
  );

-- HR Monthly Entries policies
CREATE POLICY "Employees can view and edit their own entries" ON public.hr_monthly_entries
  FOR ALL USING (
    employee_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.hr_users 
      WHERE id::text = auth.uid()::text 
        AND role IN ('Manager', 'HR Lead', 'Admin')
        AND (
          role IN ('HR Lead', 'Admin') OR
          id = (SELECT manager_id FROM public.hr_users WHERE id = hr_monthly_entries.employee_id)
        )
    )
  );

-- HR Daily Habits policies
CREATE POLICY "Employees can manage their own daily habits" ON public.hr_daily_habits
  FOR ALL USING (
    employee_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.hr_users 
      WHERE id::text = auth.uid()::text 
        AND role IN ('HR Lead', 'Admin')
    )
  );

-- HR Appraisal policies
CREATE POLICY "Employees can view their appraisals" ON public.hr_appraisal
  FOR SELECT USING (
    employee_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM public.hr_users 
      WHERE id::text = auth.uid()::text 
        AND role IN ('Manager', 'HR Lead', 'Admin')
        AND (
          role IN ('HR Lead', 'Admin') OR
          id = (SELECT manager_id FROM public.hr_users WHERE id = hr_appraisal.employee_id)
        )
    )
  );

CREATE POLICY "Managers and HR can create appraisals" ON public.hr_appraisal
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hr_users 
      WHERE id::text = auth.uid()::text 
        AND role IN ('Manager', 'HR Lead', 'Admin')
    )
  );

-- Create views for dashboard
CREATE OR REPLACE VIEW hr_employee_dashboard AS
SELECT 
  u.id,
  u.name,
  u.department,
  u.role,
  -- YTD Average Score
  ROUND(AVG(CASE WHEN e.status = 'approved' THEN e.month_score END), 2) as ytd_avg_score,
  -- Last Month Score
  (
    SELECT month_score 
    FROM hr_monthly_entries 
    WHERE employee_id = u.id 
      AND status = 'approved'
    ORDER BY month DESC 
    LIMIT 1
  ) as last_month_score,
  -- YTD Attendance
  ROUND(AVG(CASE WHEN e.status = 'approved' THEN e.attendance_pct END), 2) as ytd_attendance,
  -- Last 30 days wellness (simplified)
  (
    SELECT ROUND(AVG(
      (CASE WHEN meditation THEN 1 ELSE 0 END) +
      (CASE WHEN workout THEN 1 ELSE 0 END) +
      (CASE WHEN water_intake THEN 1 ELSE 0 END) +
      (CASE WHEN diet_plan THEN 1 ELSE 0 END)
    ) * 25, 2)
    FROM hr_daily_habits 
    WHERE employee_id = u.id 
      AND date >= CURRENT_DATE - INTERVAL '30 days'
  ) as wellness_score_30d,
  -- Aligned with values badge
  (
    SELECT aligned_with_company_values 
    FROM hr_monthly_entries 
    WHERE employee_id = u.id 
      AND status = 'approved'
    ORDER BY month DESC 
    LIMIT 1
  ) as aligned_with_values
FROM hr_users u
LEFT JOIN hr_monthly_entries e ON u.id = e.employee_id
WHERE u.status = 'active'
GROUP BY u.id, u.name, u.department, u.role;

-- Grant permissions
GRANT ALL ON public.hr_users TO authenticated;
GRANT ALL ON public.hr_monthly_entries TO authenticated;
GRANT ALL ON public.hr_daily_habits TO authenticated;
GRANT ALL ON public.hr_appraisal TO authenticated;
GRANT SELECT ON hr_employee_dashboard TO authenticated;

-- Insert sample data for testing
INSERT INTO public.hr_users (name, email, role, department, status) VALUES
('John Doe', 'john.doe@company.com', 'Employee', 'Engineering', 'active'),
('Jane Smith', 'jane.smith@company.com', 'Manager', 'Engineering', 'active'),
('Bob Johnson', 'bob.johnson@company.com', 'HR Lead', 'Human Resources', 'active'),
('Alice Brown', 'alice.brown@company.com', 'Admin', 'Administration', 'active')
ON CONFLICT (email) DO NOTHING;

-- Success message
-- SELECT 'HR Module schema created successfully!' as message;