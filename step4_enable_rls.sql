-- Step 4: Enable Row Level Security and create policies
-- Run this after step3_create_triggers.sql

-- Enable Row Level Security for all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (Allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.submissions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.performance_metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.monthly_rows FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.entities FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.user_entity_mappings FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.attendance_daily FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.login_tracking FOR ALL USING (true);