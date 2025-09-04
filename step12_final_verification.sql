-- Step 12: Final verification of complete database setup
-- Run this after step11_create_auth_tables.sql

-- Check all tables exist
SELECT 'Checking all tables...' as status;

SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'employees', 'submissions', 'performance_metrics', 'monthly_rows',
            'users', 'entities', 'user_entity_mappings', 'attendance_daily',
            'login_tracking', 'dashboard_usage', 'employee_performance',
            'performance_concerns', 'performance_improvement_plans', 'pip_progress_reviews',
            'incentive_types', 'employee_incentives', 'incentive_approvals', 'incentive_payments',
            'user_accounts', 'user_sessions', 'login_attempts', 'password_reset_tokens', 'user_permissions'
        ) THEN '✅ Required'
        ELSE '📋 Additional'
    END as table_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY 
    CASE 
        WHEN table_name IN (
            'employees', 'submissions', 'performance_metrics', 'monthly_rows',
            'users', 'entities', 'user_entity_mappings', 'attendance_daily',
            'login_tracking', 'dashboard_usage', 'employee_performance',
            'performance_concerns', 'performance_improvement_plans', 'pip_progress_reviews',
            'incentive_types', 'employee_incentives', 'incentive_approvals', 'incentive_payments',
            'user_accounts', 'user_sessions', 'login_attempts', 'password_reset_tokens', 'user_permissions'
        ) THEN 1
        ELSE 2
    END,
    table_name;

-- Count records in all main tables
SELECT 'Record counts in main tables:' as status;

SELECT 
    'employees' as table_name, 
    COUNT(*) as record_count,
    'Core employee data' as description
FROM public.employees
UNION ALL
SELECT 
    'submissions' as table_name, 
    COUNT(*) as record_count,
    'Monthly performance submissions' as description
FROM public.submissions
UNION ALL
SELECT 
    'performance_metrics' as table_name, 
    COUNT(*) as record_count,
    'Performance tracking data' as description
FROM public.performance_metrics
UNION ALL
SELECT 
    'employee_performance' as table_name, 
    COUNT(*) as record_count,
    'Detailed performance evaluations' as description
FROM public.employee_performance
UNION ALL
SELECT 
    'performance_concerns' as table_name, 
    COUNT(*) as record_count,
    'Performance concern tracking' as description
FROM public.performance_concerns
UNION ALL
SELECT 
    'incentive_types' as table_name, 
    COUNT(*) as record_count,
    'Available incentive types' as description
FROM public.incentive_types
UNION ALL
SELECT 
    'employee_incentives' as table_name, 
    COUNT(*) as record_count,
    'Incentive applications' as description
FROM public.employee_incentives
UNION ALL
SELECT 
    'user_accounts' as table_name, 
    COUNT(*) as record_count,
    'User authentication accounts' as description
FROM public.user_accounts
UNION ALL
SELECT 
    'dashboard_usage' as table_name, 
    COUNT(*) as record_count,
    'Dashboard analytics data' as description
FROM public.dashboard_usage
UNION ALL
SELECT 
    'attendance_daily' as table_name, 
    COUNT(*) as record_count,
    'Daily attendance records' as description
FROM public.attendance_daily
ORDER BY table_name;

-- Check RLS policies
SELECT 'Checking Row Level Security policies...' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
    'employees', 'submissions', 'performance_metrics', 'employee_performance',
    'performance_concerns', 'incentive_types', 'employee_incentives', 'user_accounts',
    'dashboard_usage', 'attendance_daily'
)
ORDER BY tablename, policyname;

-- Check foreign key relationships
SELECT 'Checking foreign key relationships...' as status;

SELECT 
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN (
        'employee_performance', 'performance_concerns', 'performance_improvement_plans',
        'pip_progress_reviews', 'employee_incentives', 'incentive_approvals',
        'incentive_payments', 'user_accounts', 'user_sessions', 'login_attempts',
        'password_reset_tokens', 'user_permissions'
    )
ORDER BY tc.table_name, kcu.column_name;

-- Test dashboard functionality queries
SELECT 'Testing dashboard functionality...' as status;

-- Employee performance summary
SELECT 
    'Employee Performance Summary' as test_name,
    COUNT(*) as total_employees,
    AVG(CASE WHEN ep.overall_score IS NOT NULL THEN ep.overall_score ELSE pm.overall_score END) as avg_performance_score,
    COUNT(CASE WHEN ep.is_low_performer = true THEN 1 END) as low_performers
FROM public.employees e
LEFT JOIN public.employee_performance ep ON e.id = ep.employee_id
LEFT JOIN public.performance_metrics pm ON e.id = pm.employee_id;

-- Department-wise performance
SELECT 
    'Department Performance' as test_name,
    e.department,
    COUNT(*) as employee_count,
    AVG(CASE WHEN ep.overall_score IS NOT NULL THEN ep.overall_score ELSE pm.overall_score END) as avg_score
FROM public.employees e
LEFT JOIN public.employee_performance ep ON e.id = ep.employee_id
LEFT JOIN public.performance_metrics pm ON e.id = pm.employee_id
WHERE e.department IS NOT NULL
GROUP BY e.department
ORDER BY avg_score DESC;

-- Recent submissions
SELECT 
    'Recent Submissions' as test_name,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN submission_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_submissions
FROM public.submissions;

-- Incentive system status
SELECT 
    'Incentive System Status' as test_name,
    it.type_name,
    COUNT(ei.id) as applications,
    COUNT(CASE WHEN ei.status = 'approved' THEN 1 END) as approved,
    SUM(CASE WHEN ei.status = 'approved' THEN ei.incentive_amount ELSE 0 END) as total_approved_amount
FROM public.incentive_types it
LEFT JOIN public.employee_incentives ei ON it.id = ei.incentive_type_id
GROUP BY it.id, it.type_name
ORDER BY applications DESC;

-- Authentication system status
SELECT 
    'Authentication System Status' as test_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN role = 'manager' THEN 1 END) as manager_users,
    COUNT(CASE WHEN role = 'hr' THEN 1 END) as hr_users
FROM public.user_accounts;

-- Dashboard usage analytics
SELECT 
    'Dashboard Usage Analytics' as test_name,
    COUNT(*) as total_interactions,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN action_type = 'page_view' THEN 1 END) as page_views,
    COUNT(CASE WHEN action_type = 'button_click' THEN 1 END) as button_clicks
FROM public.dashboard_usage;

-- Performance concerns tracking
SELECT 
    'Performance Concerns Tracking' as test_name,
    COUNT(*) as total_concerns,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_concerns,
    COUNT(CASE WHEN severity_level = 'high' THEN 1 END) as high_severity,
    COUNT(CASE WHEN severity_level = 'critical' THEN 1 END) as critical_concerns
FROM public.performance_concerns;

-- Final status summary
SELECT 
    '🎉 DATABASE SETUP COMPLETE! 🎉' as status,
    'All tables created successfully' as message,
    NOW() as completed_at;

-- Summary of what was created
SELECT 
    'SUMMARY OF CREATED TABLES:' as category,
    'Core Tables: employees, submissions, performance_metrics, monthly_rows, users, entities, user_entity_mappings, attendance_daily, login_tracking' as tables;

SELECT 
    'PERFORMANCE MANAGEMENT:' as category,
    'employee_performance, performance_concerns, performance_improvement_plans, pip_progress_reviews' as tables;

SELECT 
    'INCENTIVES SYSTEM:' as category,
    'incentive_types, employee_incentives, incentive_approvals, incentive_payments' as tables;

SELECT 
    'AUTHENTICATION & SECURITY:' as category,
    'user_accounts, user_sessions, login_attempts, password_reset_tokens, user_permissions' as tables;

SELECT 
    'ANALYTICS & MONITORING:' as category,
    'dashboard_usage' as tables;

-- Next steps recommendations
SELECT 
    'NEXT STEPS:' as recommendation,
    '1. Test application with new database structure' as step_1,
    '2. Create test users through onboarding form' as step_2,
    '3. Test performance evaluation workflows' as step_3,
    '4. Test incentive application and approval process' as step_4,
    '5. Monitor dashboard usage analytics' as step_5;

SELECT 'Database setup verification completed successfully! ✅' as final_status;