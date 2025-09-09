import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const serviceSupabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

console.log('🔧 Checking Foreign Key Relationship Status...');

async function checkForeignKeyStatus() {
  try {
    console.log('\n📊 Step 1: Checking submissions table structure...');
    
    // Try to fetch submissions with employee_id column
    const { data: submissions, error: submissionsError } = await serviceSupabase
      .from('submissions')
      .select('id, employee_name, employee_phone, employee_id')
      .limit(5);
    
    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError);
      if (submissionsError.message.includes('employee_id')) {
        console.log('⚠️  employee_id column does not exist in submissions table');
        console.log('\n📋 MANUAL STEPS REQUIRED:');
        console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
        console.log('2. Navigate to your project SQL Editor');
        console.log('3. Copy and paste the contents of: fix_submissions_employees_foreign_key.sql');
        console.log('4. Click "Run" to execute the SQL script');
        console.log('\n📄 SQL FILE LOCATION:');
        console.log('   /Users/taps/code/bptm/fix_submissions_employees_foreign_key.sql');
        return;
      }
      return;
    }
    
    console.log(`✅ Found ${submissions?.length || 0} submissions`);
    
    // Check if employee_id column exists and has data
    const submissionsWithEmployeeId = submissions?.filter(s => s.employee_id) || [];
    console.log(`   Submissions with employee_id: ${submissionsWithEmployeeId.length}`);
    
    if (submissions && submissions.length > 0 && submissionsWithEmployeeId.length === 0) {
      console.log('⚠️  employee_id column exists but is not populated');
      console.log('\n📋 MANUAL STEPS REQUIRED:');
      console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Navigate to your project SQL Editor');
      console.log('3. Copy and paste the contents of: fix_submissions_employees_foreign_key.sql');
      console.log('4. Click "Run" to execute the SQL script');
      return;
    }
    
    console.log('\n📊 Step 2: Testing foreign key relationship...');
    
    // Try to join submissions with employees
    const { data: joinTest, error: joinError } = await serviceSupabase
      .from('submissions')
      .select(`
        id,
        employee_name,
        employee_phone,
        employee_id,
        employees(
          id,
          name,
          phone
        )
      `)
      .limit(3);
    
    if (joinError) {
      console.error('❌ Foreign key relationship test failed:', joinError);
      console.log('\n📋 MANUAL STEPS REQUIRED:');
      console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Navigate to your project SQL Editor');
      console.log('3. Copy and paste the contents of: fix_submissions_employees_foreign_key.sql');
      console.log('4. Click "Run" to execute the SQL script');
      return;
    }
    
    console.log(`✅ Foreign key join test successful with ${joinTest?.length || 0} records`);
    
    console.log('\n📊 Step 3: Checking employees table...');
    
    const { data: employees, error: employeesError } = await serviceSupabase
      .from('employees')
      .select('id, name, phone')
      .limit(5);
    
    if (employeesError) {
      console.error('❌ Error fetching employees:', employeesError);
      return;
    }
    
    console.log(`✅ Found ${employees?.length || 0} employees`);
    
    console.log('\n📊 Data integrity summary:');
    console.log(`   • Submissions table: ${submissions?.length || 0} records`);
    console.log(`   • Employees table: ${employees?.length || 0} records`);
    console.log(`   • Submissions with employee_id: ${submissionsWithEmployeeId.length}`);
    console.log(`   • Foreign key joins working: ${joinTest?.length || 0} records`);
    
    if (submissionsWithEmployeeId.length > 0 && joinTest && joinTest.length > 0) {
      console.log('\n🎉 Foreign key relationship appears to be working correctly!');
      console.log('\n📋 Next steps:');
      console.log('   1. Run verification: node verify_foreign_key_fix.js');
      console.log('   2. Test the application to ensure submissions work correctly');
    } else {
      console.log('\n⚠️  Foreign key relationship needs to be established');
      console.log('\n📋 MANUAL STEPS REQUIRED:');
      console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Navigate to your project SQL Editor');
      console.log('3. Copy and paste the contents of: fix_submissions_employees_foreign_key.sql');
      console.log('4. Click "Run" to execute the SQL script');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.log('\n📋 FALLBACK - MANUAL STEPS REQUIRED:');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to your project SQL Editor');
    console.log('3. Copy and paste the contents of: fix_submissions_employees_foreign_key.sql');
    console.log('4. Click "Run" to execute the SQL script');
    console.log('\n📄 SQL FILE LOCATION:');
    console.log('   /Users/taps/code/bptm/fix_submissions_employees_foreign_key.sql');
  }
}

checkForeignKeyStatus();