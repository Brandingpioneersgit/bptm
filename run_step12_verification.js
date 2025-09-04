import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTable(tableName, description) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
      return false;
    } else {
      console.log(`✅ ${tableName}: ${count || 0} records - ${description}`);
      return true;
    }
  } catch (err) {
    console.log(`❌ ${tableName}: ${err.message}`);
    return false;
  }
}

async function runStep12Verification() {
  try {
    console.log('🚀 Running Step 12 Database Verification...');
    console.log('=' .repeat(60));
    
    console.log('\n📋 Checking Core Tables:');
    await checkTable('employees', 'Core employee data');
    await checkTable('submissions', 'Monthly performance submissions');
    await checkTable('performance_metrics', 'Performance tracking data');
    await checkTable('monthly_rows', 'Monthly data rows');
    await checkTable('users', 'User accounts');
    await checkTable('entities', 'Entity data');
    await checkTable('user_entity_mappings', 'User-entity relationships');
    await checkTable('attendance_daily', 'Daily attendance records');
    await checkTable('login_tracking', 'Login tracking data');
    await checkTable('dashboard_usage', 'Dashboard analytics data');
    
    console.log('\n📋 Checking Performance Management Tables:');
    await checkTable('employee_performance', 'Detailed performance evaluations');
    await checkTable('performance_concerns', 'Performance concern tracking');
    await checkTable('performance_improvement_plans', 'Performance improvement plans');
    await checkTable('pip_progress_reviews', 'PIP progress reviews');
    
    console.log('\n📋 Checking Incentives System Tables:');
    await checkTable('incentive_types', 'Available incentive types');
    await checkTable('employee_incentives', 'Incentive applications');
    await checkTable('incentive_approvals', 'Incentive approvals');
    await checkTable('incentive_payments', 'Incentive payments');
    
    console.log('\n📋 Checking Authentication & Security Tables:');
    await checkTable('user_accounts', 'User authentication accounts');
    await checkTable('user_sessions', 'User sessions');
    await checkTable('login_attempts', 'Login attempts');
    await checkTable('password_reset_tokens', 'Password reset tokens');
    await checkTable('user_permissions', 'User permissions');
    
    console.log('\n🔍 Testing Dashboard Functionality:');
    
    // Test employee performance summary
    try {
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, name, department')
        .limit(5);
      
      if (!empError && employees) {
        console.log(`✅ Employee Performance Summary: Found ${employees.length} employees`);
        employees.forEach(emp => {
          console.log(`   - ${emp.name} (${emp.department})`);
        });
      } else {
        console.log(`❌ Employee Performance Summary: ${empError?.message || 'No data'}`);
      }
    } catch (err) {
      console.log(`❌ Employee Performance Summary: ${err.message}`);
    }
    
    // Test performance metrics
    try {
      const { data: metrics, error: metricsError } = await supabase
        .from('performance_metrics')
        .select('employee_name, department, overall_score')
        .limit(5);
      
      if (!metricsError && metrics) {
        console.log(`✅ Performance Metrics: Found ${metrics.length} records`);
        metrics.forEach(metric => {
          console.log(`   - ${metric.employee_name}: ${metric.overall_score || 'N/A'} (${metric.department})`);
        });
      } else {
        console.log(`❌ Performance Metrics: ${metricsError?.message || 'No data'}`);
      }
    } catch (err) {
      console.log(`❌ Performance Metrics: ${err.message}`);
    }
    
    // Test incentive system
    try {
      const { data: incentives, error: incError } = await supabase
        .from('incentive_types')
        .select('type_name, description')
        .limit(5);
      
      if (!incError && incentives) {
        console.log(`✅ Incentive System: Found ${incentives.length} incentive types`);
        incentives.forEach(inc => {
          console.log(`   - ${inc.type_name}: ${inc.description}`);
        });
      } else {
        console.log(`❌ Incentive System: ${incError?.message || 'No data'}`);
      }
    } catch (err) {
      console.log(`❌ Incentive System: ${err.message}`);
    }
    
    // Test authentication system
    try {
      const { data: userAccounts, error: userError } = await supabase
        .from('user_accounts')
        .select('username, role, is_active')
        .limit(5);
      
      if (!userError && userAccounts) {
        console.log(`✅ Authentication System: Found ${userAccounts.length} user accounts`);
        userAccounts.forEach(user => {
          console.log(`   - ${user.username} (${user.role}) - ${user.is_active ? 'Active' : 'Inactive'}`);
        });
      } else {
        console.log(`❌ Authentication System: ${userError?.message || 'No data'}`);
      }
    } catch (err) {
      console.log(`❌ Authentication System: ${err.message}`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 DATABASE SETUP VERIFICATION COMPLETE! 🎉');
    console.log('✅ All core tables have been checked');
    console.log('✅ Dashboard functionality tests completed');
    console.log('\n📋 Next Steps:');
    console.log('1. Test application with new database structure');
    console.log('2. Create test users through onboarding form');
    console.log('3. Test performance evaluation workflows');
    console.log('4. Test incentive application and approval process');
    console.log('5. Monitor dashboard usage analytics');
    
  } catch (error) {
    console.error('💥 Error running verification:', error.message);
  }
}

// Run the verification
runStep12Verification();