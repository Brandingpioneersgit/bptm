import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://igwgryykglsetfvomhdj.supabase.co';
const supabaseKey = 'sb_publishable_SDqrksN-DTMdHP01p3z6wQ_OlX5bJ3o';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to create missing tables using direct table operations
async function createMissingTables() {
  console.log('🚀 Creating missing tables for comprehensive test data...');
  
  try {
    // Create employees table by inserting a dummy record and letting Supabase infer schema
    console.log('🔄 Creating employees table...');
    const { error: employeesError } = await supabase
      .from('employees')
      .upsert({
        name: 'Test Employee',
        phone: '0000000000',
        email: 'test@test.com',
        department: 'Test',
        role: ['Test Role'],
        employee_type: 'Full-time',
        work_location: 'Office',
        status: 'Active',
        hire_date: '2024-01-01',
        direct_manager: 'Test Manager',
        performance_rating: 4.0,
        appraisal_date: '2024-01-01',
        personal_info: {},
        contact_info: {},
        professional_info: {},
        financial_info: {},
        is_active: true
      }, { onConflict: 'phone' });
    
    if (employeesError && !employeesError.message.includes('does not exist')) {
      console.log('❌ Error creating employees table:', employeesError.message);
    } else if (!employeesError) {
      console.log('✅ Employees table created/verified');
      // Clean up test record
      await supabase.from('employees').delete().eq('phone', '0000000000');
    } else {
      console.log('⚠️ Employees table does not exist in schema');
    }
    
    // Create submissions table
    console.log('🔄 Creating submissions table...');
    const { error: submissionsError } = await supabase
      .from('submissions')
      .upsert({
        employee_name: 'Test Employee',
        employee_phone: '0000000001',
        department: 'Test',
        role: 'Test Role',
        month_key: '2024-01',
        attendance_wfo: 20,
        attendance_wfh: 5,
        tasks_completed: 'Test tasks',
        ai_table_link: 'https://test.com',
        clients: 'Test Client',
        learning_activities: 'Test learning',
        ai_usage_notes: 'Test AI usage',
        feedback_company: 'Good',
        feedback_hr: 'Good',
        feedback_management: 'Good',
        kpi_score: 4.0,
        learning_score: 4.0,
        relationship_score: 4.0,
        overall_score: 4.0,
        status: 'submitted'
      }, { onConflict: 'employee_phone,month_key' });
    
    if (submissionsError && !submissionsError.message.includes('does not exist')) {
      console.log('❌ Error creating submissions table:', submissionsError.message);
    } else if (!submissionsError) {
      console.log('✅ Submissions table created/verified');
      // Clean up test record
      await supabase.from('submissions').delete().eq('employee_phone', '0000000001');
    } else {
      console.log('⚠️ Submissions table does not exist in schema');
    }
    
    // Create performance_metrics table
    console.log('🔄 Creating performance_metrics table...');
    const { error: performanceError } = await supabase
      .from('performance_metrics')
      .upsert({
        employee_name: 'Test Employee',
        employee_phone: '0000000002',
        department: 'Test',
        month_key: '2024-01',
        kpi_score: 4.0,
        learning_score: 4.0,
        relationship_score: 4.0,
        overall_score: 4.0,
        attendance_percentage: 95.0,
        tasks_completed: 10,
        client_satisfaction: 4.5
      }, { onConflict: 'employee_phone,month_key' });
    
    if (performanceError && !performanceError.message.includes('does not exist')) {
      console.log('❌ Error creating performance_metrics table:', performanceError.message);
    } else if (!performanceError) {
      console.log('✅ Performance_metrics table created/verified');
      // Clean up test record
      await supabase.from('performance_metrics').delete().eq('employee_phone', '0000000002');
    } else {
      console.log('⚠️ Performance_metrics table does not exist in schema');
    }
    
    // Create monthly_rows table
    console.log('🔄 Creating monthly_rows table...');
    const { error: monthlyError } = await supabase
      .from('monthly_rows')
      .upsert({
        employee_name: 'Test Employee',
        employee_phone: '0000000003',
        department: 'Test',
        month_key: '2024-01',
        submission_data: {},
        status: 'submitted'
      }, { onConflict: 'employee_phone,month_key' });
    
    if (monthlyError && !monthlyError.message.includes('does not exist')) {
      console.log('❌ Error creating monthly_rows table:', monthlyError.message);
    } else if (!monthlyError) {
      console.log('✅ Monthly_rows table created/verified');
      // Clean up test record
      await supabase.from('monthly_rows').delete().eq('employee_phone', '0000000003');
    } else {
      console.log('⚠️ Monthly_rows table does not exist in schema');
    }
    
    // Create users table
    console.log('🔄 Creating users table...');
    const { error: usersError } = await supabase
      .from('users')
      .upsert({
        name: 'Test User',
        email: 'testuser@test.com',
        phone: '0000000004',
        role: 'Test Role',
        department: 'Test',
        is_active: true
      }, { onConflict: 'email' });
    
    if (usersError && !usersError.message.includes('does not exist')) {
      console.log('❌ Error creating users table:', usersError.message);
    } else if (!usersError) {
      console.log('✅ Users table created/verified');
      // Clean up test record
      await supabase.from('users').delete().eq('email', 'testuser@test.com');
    } else {
      console.log('⚠️ Users table does not exist in schema');
    }
    
    // Create entities table
    console.log('🔄 Creating entities table...');
    const { error: entitiesError } = await supabase
      .from('entities')
      .upsert({
        name: 'Test Entity',
        type: 'Test Type',
        description: 'Test Description',
        metadata: {},
        is_active: true
      });
    
    if (entitiesError && !entitiesError.message.includes('does not exist')) {
      console.log('❌ Error creating entities table:', entitiesError.message);
    } else if (!entitiesError) {
      console.log('✅ Entities table created/verified');
      // Clean up test record
      await supabase.from('entities').delete().eq('name', 'Test Entity');
    } else {
      console.log('⚠️ Entities table does not exist in schema');
    }
    
    // Create attendance_daily table
    console.log('🔄 Creating attendance_daily table...');
    const { error: attendanceError } = await supabase
      .from('attendance_daily')
      .upsert({
        employee_name: 'Test Employee',
        employee_phone: '0000000005',
        date: '2024-01-01',
        status: 'present',
        work_type: 'wfo',
        check_in_time: '09:00:00',
        check_out_time: '18:00:00',
        hours_worked: 8.0,
        notes: 'Test attendance'
      }, { onConflict: 'employee_phone,date' });
    
    if (attendanceError && !attendanceError.message.includes('does not exist')) {
      console.log('❌ Error creating attendance_daily table:', attendanceError.message);
    } else if (!attendanceError) {
      console.log('✅ Attendance_daily table created/verified');
      // Clean up test record
      await supabase.from('attendance_daily').delete().eq('employee_phone', '0000000005');
    } else {
      console.log('⚠️ Attendance_daily table does not exist in schema');
    }
    
    // Create login_tracking table
    console.log('🔄 Creating login_tracking table...');
    const { error: loginError } = await supabase
      .from('login_tracking')
      .upsert({
        email: 'testlogin@test.com',
        phone: '0000000006',
        login_timestamp: new Date().toISOString(),
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        login_method: 'email',
        success: true
      });
    
    if (loginError && !loginError.message.includes('does not exist')) {
      console.log('❌ Error creating login_tracking table:', loginError.message);
    } else if (!loginError) {
      console.log('✅ Login_tracking table created/verified');
      // Clean up test record
      await supabase.from('login_tracking').delete().eq('email', 'testlogin@test.com');
    } else {
      console.log('⚠️ Login_tracking table does not exist in schema');
    }
    
    console.log('\n✅ Table verification completed!');
    
  } catch (error) {
    console.error('💥 Error in table creation:', error);
  }
}

// Function to check existing tables
async function checkExistingTables() {
  console.log('🔍 Checking existing tables...');
  
  const tables = [
    'unified_users', 'clients', 'user_sessions', 'employees', 'submissions',
    'performance_metrics', 'monthly_rows', 'users', 'entities', 
    'user_entity_mappings', 'attendance_daily', 'login_tracking'
  ];
  
  const existingTables = [];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        existingTables.push(table);
        console.log(`✅ ${table} - exists`);
      } else {
        console.log(`❌ ${table} - ${error.message}`);
      }
    } catch (err) {
      console.log(`❌ ${table} - ${err.message}`);
    }
  }
  
  console.log(`\n📊 Found ${existingTables.length} existing tables:`, existingTables);
  return existingTables;
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting database setup...');
    
    // Check existing tables
    const existingTables = await checkExistingTables();
    
    // Try to create missing tables
    await createMissingTables();
    
    // Check again after creation attempts
    console.log('\n🔄 Rechecking tables after creation attempts...');
    await checkExistingTables();
    
    console.log('\n🎉 Database setup completed!');
    console.log('📋 Next steps:');
    console.log('1. Manually create missing tables in Supabase SQL Editor if needed');
    console.log('2. Run upload_test_data.js to insert test data');
    console.log('3. Test dashboard functionality');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Run the setup
main();