-- Step 5: Grant permissions and create indexes
-- Run this after step4_enable_rls.sql

-- Grant permissions to authenticated and anonymous users
GRANT ALL ON public.employees TO authenticated, anon;
GRANT ALL ON public.submissions TO authenticated, anon;
GRANT ALL ON public.performance_metrics TO authenticated, anon;
GRANT ALL ON public.monthly_rows TO authenticated, anon;
GRANT ALL ON public.users TO authenticated, anon;
GRANT ALL ON public.entities TO authenticated, anon;
GRANT ALL ON public.user_entity_mappings TO authenticated, anon;
GRANT ALL ON public.attendance_daily TO authenticated, anon;
GRANT ALL ON public.login_tracking TO authenticated, anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_phone ON public.employees(phone);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);

CREATE INDEX IF NOT EXISTS idx_submissions_employee_phone ON public.submissions(employee_phone);
CREATE INDEX IF NOT EXISTS idx_submissions_month_key ON public.submissions(month_key);
CREATE INDEX IF NOT EXISTS idx_submissions_department ON public.submissions(department);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_employee_phone ON public.performance_metrics(employee_phone);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_month_key ON public.performance_metrics(month_key);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_department ON public.performance_metrics(department);

CREATE INDEX IF NOT EXISTS idx_monthly_rows_employee_phone ON public.monthly_rows(employee_phone);
CREATE INDEX IF NOT EXISTS idx_monthly_rows_month_key ON public.monthly_rows(month_key);
CREATE INDEX IF NOT EXISTS idx_monthly_rows_department ON public.monthly_rows(department);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);

CREATE INDEX IF NOT EXISTS idx_entities_type ON public.entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_name ON public.entities(name);

CREATE INDEX IF NOT EXISTS idx_user_entity_mappings_user_id ON public.user_entity_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_entity_mappings_entity_id ON public.user_entity_mappings(entity_id);

CREATE INDEX IF NOT EXISTS idx_attendance_daily_employee_phone ON public.attendance_daily(employee_phone);
CREATE INDEX IF NOT EXISTS idx_attendance_daily_date ON public.attendance_daily(date);
CREATE INDEX IF NOT EXISTS idx_attendance_daily_status ON public.attendance_daily(status);

CREATE INDEX IF NOT EXISTS idx_login_tracking_user_id ON public.login_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_login_tracking_email ON public.login_tracking(email);
CREATE INDEX IF NOT EXISTS idx_login_tracking_timestamp ON public.login_tracking(login_timestamp);