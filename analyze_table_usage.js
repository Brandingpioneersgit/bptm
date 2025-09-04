const existingTables = [
  'client_onboarding', 'client_feedback', 'employees', 'clients', 'users', 
  'unified_users', 'submissions', 'performance_metrics', 'monthly_rows', 
  'entities', 'user_entity_mappings', 'attendance_daily', 'login_tracking', 'user_sessions'
];

const usedTables = [
  'ad_campaigns', 'announcements', 'annual_fees', 'appraisal_delays', 'arcade_activities',
  'arcade_audit_log', 'arcade_employee_summary', 'arcade_escalations', 'arcade_points',
  'arcade_redemptions', 'arcade_rewards', 'attendance_daily', 'attendance_monthly_cache',
  'calendar_config', 'change_audit', 'client_feedback', 'client_onboarding',
  'client_onboarding_comments', 'client_onboarding_files', 'client_projects', 'clients',
  'company_feedback', 'compliance_tracking', 'daily_attendance', 'dashboard_configurations',
  'dashboard_usage', 'design_metrics', 'design_projects', 'dynamic_content',
  'employee_appreciation', 'employee_attendance', 'employee_client_relationships',
  'employee_communications', 'employee_exits', 'employee_feedback', 'employee_goals',
  'employee_kpis', 'employee_learning_goals', 'employee_meetings', 'employee_nps',
  'employee_performance', 'employee_signups', 'employee_targets', 'employee_testimonials',
  'employees', 'entities', 'events', 'expenses_ledger', 'freelancer_earnings',
  'freelancer_kpis', 'freelancer_projects', 'freelancer_task_reports', 'freelancer_tasks',
  'freelancer_users', 'growth_reports', 'hr_incentive_approvals', 'incentive_applications',
  'intern_academic_progress', 'intern_certificates', 'intern_daily_reports', 'intern_kpis',
  'intern_learning_goals', 'intern_profiles', 'intern_projects', 'intern_skills',
  'intern_weekly_reports', 'interns', 'job_openings', 'learning_entries',
  'leave_applications', 'leave_requests', 'login_sessions', 'mentor_feedback',
  'monthly_attendance_cache', 'monthly_form_submissions', 'monthly_kpi_reports',
  'monthly_rows', 'navigation_configurations', 'notification_history', 'notifications',
  'operations_kpis', 'performance_concerns', 'performance_metrics', 'razorpay_reimbursements',
  'recruitment_activities', 'recurring_clients', 'recurring_payments', 'seo_accounts',
  'seo_config', 'seo_monthly_entries', 'submissions', 'system_metrics',
  'system_notifications', 'system_settings', 'system_updates', 'theme_configurations',
  'tools', 'ui_component_settings', 'unified_users', 'unlock_requests', 'user_accounts',
  'user_entity_mappings', 'user_notifications', 'user_preferences', 'user_profiles',
  'user_projects', 'user_sessions', 'user_tasks', 'users', 'web_projects', 'workspace_usage'
];

console.log('=== EXISTING TABLES IN DATABASE ===');
existingTables.forEach(t => console.log('✓ ' + t));

console.log('\n=== TABLES USED IN CODE BUT NOT IN DATABASE ===');
const missingTables = usedTables.filter(t => !existingTables.includes(t));
missingTables.forEach(t => console.log('✗ ' + t));

console.log('\n=== EXISTING TABLES NOT USED IN CODE ===');
const unusedTables = existingTables.filter(t => !usedTables.includes(t));
unusedTables.forEach(t => console.log('? ' + t));

console.log('\n=== SUMMARY ===');
console.log('Existing tables: ' + existingTables.length);
console.log('Tables used in code: ' + usedTables.length);
console.log('Missing tables: ' + missingTables.length);
console.log('Unused tables: ' + unusedTables.length);

if (missingTables.length > 0) {
  console.log('\n=== RECOMMENDATIONS ===');
  console.log('1. Create missing tables in Supabase or remove references from code');
  console.log('2. Focus on core tables that are actively used');
  console.log('3. Consider if unused existing tables should be removed');
}