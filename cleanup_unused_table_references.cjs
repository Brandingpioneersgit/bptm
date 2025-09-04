const fs = require('fs');
const path = require('path');

// Tables that exist in the database
const existingTables = [
  'client_onboarding', 'client_feedback', 'employees', 'clients', 'users',
  'unified_users', 'submissions', 'performance_metrics', 'monthly_rows',
  'entities', 'user_entity_mappings', 'attendance_daily', 'login_tracking', 'user_sessions'
];

// Tables that will be created by the essential missing tables script
const essentialTables = [
  'monthly_kpi_reports', 'employee_performance', 'monthly_form_submissions',
  'employee_kpis', 'employee_attendance', 'notifications', 'user_accounts',
  'system_notifications', 'dashboard_configurations', 'tools'
];

// Combined list of available tables
const availableTables = [...existingTables, ...essentialTables];

// Tables that are referenced in code but don't exist and aren't essential
const unnecessaryTables = [
  'ad_campaigns', 'announcements', 'annual_fees', 'appraisal_delays',
  'arcade_activities', 'arcade_audit_log', 'arcade_employee_summary',
  'arcade_escalations', 'arcade_points', 'arcade_redemptions', 'arcade_rewards',
  'attendance_monthly_cache', 'calendar_config', 'change_audit', 'client_onboarding_comments',
  'client_onboarding_files', 'client_projects', 'company_feedback', 'compliance_tracking',
  'daily_attendance', 'dashboard_usage', 'design_metrics', 'design_projects',
  'dynamic_content', 'employee_appreciation', 'employee_client_relationships',
  'employee_communications', 'employee_exits', 'employee_feedback', 'employee_goals',
  'employee_learning_goals', 'employee_meetings', 'employee_nps', 'employee_signups',
  'employee_targets', 'employee_testimonials', 'events', 'expenses_ledger',
  'freelancer_earnings', 'freelancer_kpis', 'freelancer_projects', 'freelancer_task_reports',
  'freelancer_tasks', 'freelancer_users', 'growth_reports', 'hr_incentive_approvals',
  'incentive_applications', 'intern_academic_progress', 'intern_certificates',
  'intern_daily_reports', 'intern_kpis', 'intern_learning_goals', 'intern_profiles',
  'intern_projects', 'intern_skills', 'intern_weekly_reports', 'interns',
  'job_openings', 'learning_entries', 'leave_applications', 'leave_requests',
  'login_sessions', 'mentor_feedback', 'monthly_attendance_cache',
  'navigation_configurations', 'notification_history', 'operations_kpis',
  'performance_concerns', 'razorpay_reimbursements', 'recruitment_activities',
  'recurring_clients', 'recurring_payments', 'seo_accounts', 'seo_config',
  'seo_monthly_entries', 'system_metrics', 'system_settings', 'system_updates',
  'theme_configurations', 'ui_component_settings', 'unlock_requests',
  'user_notifications', 'user_preferences', 'user_profiles', 'user_projects',
  'user_tasks', 'web_projects', 'workspace_usage'
];

function findFilesWithTableReferences(directory, tableNames) {
  const results = [];
  
  function searchDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        searchDirectory(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          for (const tableName of tableNames) {
            const regex = new RegExp(`\\.from\\(['"]${tableName}['"]\\)`, 'g');
            const matches = content.match(regex);
            
            if (matches) {
              results.push({
                file: filePath,
                table: tableName,
                matches: matches.length,
                lines: content.split('\n').map((line, index) => {
                  if (line.includes(`.from('${tableName}')`) || line.includes(`.from("${tableName}")`)) {
                    return index + 1;
                  }
                  return null;
                }).filter(line => line !== null)
              });
            }
          }
        } catch (error) {
          console.warn(`Warning: Could not read file ${filePath}:`, error.message);
        }
      }
    }
  }
  
  searchDirectory(directory);
  return results;
}

function analyzeTableUsage() {
  console.log('🔍 Analyzing table usage in the application...');
  console.log('=' .repeat(60));
  
  const srcDirectory = path.join(__dirname, 'src');
  
  // Find references to unnecessary tables
  const unnecessaryReferences = findFilesWithTableReferences(srcDirectory, unnecessaryTables);
  
  console.log('\n📊 ANALYSIS RESULTS:');
  console.log(`✅ Available tables: ${availableTables.length}`);
  console.log(`❌ Unnecessary table references: ${unnecessaryReferences.length}`);
  
  if (unnecessaryReferences.length > 0) {
    console.log('\n🚨 FILES WITH UNNECESSARY TABLE REFERENCES:');
    console.log('=' .repeat(60));
    
    const groupedByTable = {};
    unnecessaryReferences.forEach(ref => {
      if (!groupedByTable[ref.table]) {
        groupedByTable[ref.table] = [];
      }
      groupedByTable[ref.table].push(ref);
    });
    
    Object.keys(groupedByTable).sort().forEach(tableName => {
      console.log(`\n📋 Table: ${tableName}`);
      groupedByTable[tableName].forEach(ref => {
        console.log(`   📄 ${ref.file.replace(__dirname + '/', '')}`);
        console.log(`      Lines: ${ref.lines.join(', ')}`);
      });
    });
    
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log('1. Review each file and determine if the table reference is needed');
    console.log('2. Either create the missing table or remove/comment out the reference');
    console.log('3. For features not currently in use, consider removing the entire component');
    console.log('4. Focus on core functionality first (employees, clients, submissions, etc.)');
  }
  
  // Check for unused existing tables
  const usedExistingTables = [];
  const allReferences = findFilesWithTableReferences(srcDirectory, availableTables);
  allReferences.forEach(ref => {
    if (!usedExistingTables.includes(ref.table)) {
      usedExistingTables.push(ref.table);
    }
  });
  
  const unusedExistingTables = existingTables.filter(table => !usedExistingTables.includes(table));
  
  if (unusedExistingTables.length > 0) {
    console.log('\n⚠️  UNUSED EXISTING TABLES:');
    unusedExistingTables.forEach(table => {
      console.log(`   - ${table}`);
    });
    console.log('\nConsider if these tables should be removed from the database.');
  }
  
  console.log('\n✅ NEXT STEPS:');
  console.log('1. Run the create_essential_missing_tables.sql script in Supabase');
  console.log('2. Review and clean up unnecessary table references');
  console.log('3. Test the application to ensure core functionality works');
  console.log('4. Remove or create additional tables as needed');
}

if (require.main === module) {
  analyzeTableUsage();
}

module.exports = { analyzeTableUsage, findFilesWithTableReferences, unnecessaryTables, availableTables };