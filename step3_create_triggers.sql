-- Step 3: Create triggers for updated_at columns
-- Run this after step2_create_tables.sql

-- Create trigger for employees updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for submissions updated_at
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for performance_metrics updated_at
CREATE TRIGGER update_performance_metrics_updated_at
  BEFORE UPDATE ON public.performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for monthly_rows updated_at
CREATE TRIGGER update_monthly_rows_updated_at
  BEFORE UPDATE ON public.monthly_rows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for users updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for entities updated_at
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON public.entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for user_entity_mappings updated_at
CREATE TRIGGER update_user_entity_mappings_updated_at
  BEFORE UPDATE ON public.user_entity_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for attendance_daily updated_at
CREATE TRIGGER update_attendance_daily_updated_at
  BEFORE UPDATE ON public.attendance_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();