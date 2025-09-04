-- Step 7: Verify database setup
-- Run this after step6_insert_test_data.sql to verify everything is working

-- Check if all tables exist and have data
SELECT 'unified_users' as table_name, COUNT(*) as record_count FROM public.unified_users
UNION ALL
SELECT 'clients' as table_name, COUNT(*) as record_count FROM public.clients
UNION ALL
SELECT 'employees' as table_name, COUNT(*) as record_count FROM public.employees
UNION ALL
SELECT 'submissions' as table_name, COUNT(*) as record_count FROM public.submissions
UNION ALL
SELECT 'performance_metrics' as table_name, COUNT(*) as record_count FROM public.performance_metrics
UNION ALL
SELECT 'monthly_rows' as table_name, COUNT(*) as record_count FROM public.monthly_rows
UNION ALL
SELECT 'users' as table_name, COUNT(*) as record_count FROM public.users
UNION ALL
SELECT 'entities' as table_name, COUNT(*) as record_count FROM public.entities
UNION ALL
SELECT 'user_entity_mappings' as table_name, COUNT(*) as record_count FROM public.user_entity_mappings
UNION ALL
SELECT 'attendance_daily' as table_name, COUNT(*) as record_count FROM public.attendance_daily
UNION ALL
SELECT 'login_tracking' as table_name, COUNT(*) as record_count FROM public.login_tracking
ORDER BY table_name;

-- Test dashboard functionality with sample queries
-- 1. Employee performance overview
SELECT 
  e.name,
  e.department,
  e.role,
  pm.overall_score,
  pm.attendance_percentage,
  pm.tasks_completed
FROM public.employees e
LEFT JOIN public.performance_metrics pm ON e.phone = pm.employee_phone
WHERE e.status = 'Active'
ORDER BY pm.overall_score DESC NULLS LAST;

-- 2. Department-wise performance summary
SELECT 
  department,
  COUNT(*) as employee_count,
  ROUND(AVG(overall_score), 2) as avg_performance,
  ROUND(AVG(attendance_percentage), 2) as avg_attendance
FROM public.performance_metrics
GROUP BY department
ORDER BY avg_performance DESC;

-- 3. Recent submissions
SELECT 
  employee_name,
  department,
  month_key,
  overall_score,
  status,
  submission_date
FROM public.submissions
ORDER BY submission_date DESC
LIMIT 10;

-- 4. Attendance summary
SELECT 
  employee_name,
  COUNT(*) as days_logged,
  COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
  COUNT(CASE WHEN work_type = 'wfo' THEN 1 END) as wfo_days,
  COUNT(CASE WHEN work_type = 'wfh' THEN 1 END) as wfh_days,
  ROUND(AVG(hours_worked), 2) as avg_hours_per_day
FROM public.attendance_daily
GROUP BY employee_name
ORDER BY employee_name;

-- Success message
SELECT 'Database setup completed successfully! All tables created and test data inserted.' as status;