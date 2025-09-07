import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://igwgryykglsetfvomhdj.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA'
);

console.log('🔧 Fixing Foreign Key Relationship Between Submissions and Employees Tables...');

async function fixForeignKeyRelationship() {
  const results = {
    steps: [],
    errors: [],
    warnings: []
  };

  try {
    // Step 1: Check current state
    console.log('\n📊 Step 1: Analyzing current database state...');
    
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('id, employee_name, employee_phone')
      .limit(5);
    
    if (submissionsError) {
      results.errors.push(`Failed to query submissions: ${submissionsError.message}`);
      return results;
    }
    
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, phone')
      .limit(5);
    
    if (employeesError) {
      results.errors.push(`Failed to query employees: ${employeesError.message}`);
      return results;
    }
    
    console.log(`   ✅ Found ${submissions?.length || 0} submissions (sample)`);
    console.log(`   ✅ Found ${employees?.length || 0} employees (sample)`);
    results.steps.push('Database state analyzed successfully');
    
    // Step 2: Check if employee_id column exists
    console.log('\n🔍 Step 2: Checking if employee_id column exists...');
    
    const { data: columnCheck, error: columnError } = await supabase
      .from('submissions')
      .select('employee_id')
      .limit(1);
    
    let hasEmployeeIdColumn = !columnError;
    
    if (hasEmployeeIdColumn) {
      console.log('   ✅ employee_id column already exists');
      results.steps.push('employee_id column exists');
    } else {
      console.log('   ❌ employee_id column does not exist');
      results.warnings.push('employee_id column needs to be added manually via SQL Editor');
    }
    
    // Step 3: Provide manual instructions since we can't execute DDL
    console.log('\n⚠️  IMPORTANT: Manual Database Schema Fix Required');
    console.log('=' .repeat(60));
    
    console.log('\n📋 MANUAL STEPS TO FIX FOREIGN KEY RELATIONSHIP:');
    console.log('\n1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to your project: igwgryykglsetfvomhdj');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the contents of: fix_submissions_employees_foreign_key.sql');
    console.log('5. Click "Run" to execute the SQL script');
    
    console.log('\n📄 SQL FILE LOCATION:');
    console.log('   /Users/taps/code/bptm/fix_submissions_employees_foreign_key.sql');
    
    console.log('\n🎯 WHAT THIS FIX WILL DO:');
    console.log('   ✓ Add employee_id column to submissions table');
    console.log('   ✓ Create foreign key constraint to employees table');
    console.log('   ✓ Populate employee_id for existing submissions');
    console.log('   ✓ Create trigger to auto-populate employee_id for new submissions');
    console.log('   ✓ Add indexes for better performance');
    console.log('   ✓ Create helpful views for easier querying');
    
    // Step 4: Analyze potential data matching issues
    console.log('\n🔍 Step 4: Analyzing potential data matching issues...');
    
    if (submissions && employees) {
      // Check for potential matching issues
      const submissionNames = submissions.map(s => s.employee_name?.toLowerCase().trim()).filter(Boolean);
      const employeeNames = employees.map(e => e.name?.toLowerCase().trim()).filter(Boolean);
      
      const unmatchedSubmissions = submissionNames.filter(name => 
        !employeeNames.some(empName => empName === name)
      );
      
      if (unmatchedSubmissions.length > 0) {
        console.log(`   ⚠️  Found ${unmatchedSubmissions.length} potentially unmatched submission names`);
        console.log('   📝 These may need manual review after running the SQL script');
        results.warnings.push(`${unmatchedSubmissions.length} submissions may not match employees`);
      } else {
        console.log('   ✅ All sample submissions appear to have matching employees');
        results.steps.push('Data matching analysis completed - no issues found');
      }
    }
    
    // Step 5: Verification instructions
    console.log('\n🔍 Step 5: Post-Fix Verification Instructions');
    console.log('\nAfter running the SQL script, verify the fix by running:');
    console.log('   node verify_foreign_key_fix.js');
    
    console.log('\n🧪 TESTING:');
    console.log('Once the foreign key is established:');
    console.log('1. Submissions will have proper referential integrity');
    console.log('2. Joins between submissions and employees will be more efficient');
    console.log('3. Data consistency will be enforced at the database level');
    
    results.steps.push('Manual fix instructions provided');
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
    results.errors.push(`Unexpected error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Steps completed: ${results.steps.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Run the SQL script in Supabase Dashboard SQL Editor');
  console.log('2. Verify the fix with: node verify_foreign_key_fix.js');
  console.log('3. Test the application to ensure submissions work correctly');
  console.log('4. Update the todo list to mark this task as completed');
  
  return results;
}

async function main() {
  const results = await fixForeignKeyRelationship();
  
  if (results.errors.length === 0) {
    console.log('\n🎉 Foreign key fix analysis completed successfully!');
    console.log('Please follow the manual steps to complete the database schema fix.');
  } else {
    console.log('\n💥 Foreign key fix analysis completed with errors.');
    console.log('Please review the errors above and try again.');
  }
}

main().catch(console.error);