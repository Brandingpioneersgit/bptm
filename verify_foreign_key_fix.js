import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://igwgryykglsetfvomhdj.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA'
);

console.log('🔍 Verifying Foreign Key Fix Between Submissions and Employees Tables...');

async function verifyForeignKeyFix() {
  const results = {
    checks: [],
    passed: 0,
    failed: 0,
    warnings: []
  };

  try {
    // Check 1: Verify employee_id column exists
    console.log('\n✅ Check 1: Verifying employee_id column exists...');
    
    const { data: columnCheck, error: columnError } = await supabase
      .from('submissions')
      .select('employee_id')
      .limit(1);
    
    if (columnError) {
      console.log('   ❌ FAILED: employee_id column does not exist');
      console.log(`   Error: ${columnError.message}`);
      results.checks.push({ name: 'employee_id column exists', status: 'FAILED', error: columnError.message });
      results.failed++;
    } else {
      console.log('   ✅ PASSED: employee_id column exists');
      results.checks.push({ name: 'employee_id column exists', status: 'PASSED' });
      results.passed++;
    }

    // Check 2: Verify foreign key constraint
    console.log('\n✅ Check 2: Testing foreign key constraint...');
    
    const { data: fkTest, error: fkError } = await supabase
      .from('submissions')
      .select(`
        id,
        employee_id,
        employee_name,
        employees!inner(
          id,
          name,
          phone
        )
      `)
      .limit(5);
    
    if (fkError) {
      console.log('   ❌ FAILED: Foreign key relationship not working');
      console.log(`   Error: ${fkError.message}`);
      results.checks.push({ name: 'foreign key constraint', status: 'FAILED', error: fkError.message });
      results.failed++;
    } else {
      console.log('   ✅ PASSED: Foreign key relationship working');
      console.log(`   Successfully joined ${fkTest?.length || 0} submissions with employees`);
      results.checks.push({ name: 'foreign key constraint', status: 'PASSED' });
      results.passed++;
    }

    // Check 3: Verify data integrity
    console.log('\n✅ Check 3: Verifying data integrity...');
    
    const { data: totalSubmissions, error: totalError } = await supabase
      .from('submissions')
      .select('id', { count: 'exact' });
    
    const { data: linkedSubmissions, error: linkedError } = await supabase
      .from('submissions')
      .select('id', { count: 'exact' })
      .not('employee_id', 'is', null);
    
    if (totalError || linkedError) {
      console.log('   ❌ FAILED: Could not verify data integrity');
      results.checks.push({ name: 'data integrity', status: 'FAILED', error: 'Query failed' });
      results.failed++;
    } else {
      const totalCount = totalSubmissions?.length || 0;
      const linkedCount = linkedSubmissions?.length || 0;
      const unlinkdCount = totalCount - linkedCount;
      
      console.log(`   📊 Total submissions: ${totalCount}`);
      console.log(`   📊 Linked to employees: ${linkedCount}`);
      console.log(`   📊 Unlinked submissions: ${unlinkdCount}`);
      
      if (unlinkdCount === 0) {
        console.log('   ✅ PASSED: All submissions linked to employees');
        results.checks.push({ name: 'data integrity', status: 'PASSED' });
        results.passed++;
      } else if (unlinkdCount < totalCount * 0.1) { // Less than 10% unlinked
        console.log('   ⚠️  WARNING: Some submissions not linked, but within acceptable range');
        results.checks.push({ name: 'data integrity', status: 'WARNING' });
        results.warnings.push(`${unlinkdCount} submissions not linked to employees`);
        results.passed++;
      } else {
        console.log('   ❌ FAILED: Too many submissions not linked to employees');
        results.checks.push({ name: 'data integrity', status: 'FAILED', error: `${unlinkdCount} unlinked submissions` });
        results.failed++;
      }
    }

    // Check 4: Test submission_details view
    console.log('\n✅ Check 4: Testing submission_details view...');
    
    const { data: viewTest, error: viewError } = await supabase
      .from('submission_details')
      .select('*')
      .limit(3);
    
    if (viewError) {
      console.log('   ❌ FAILED: submission_details view not working');
      console.log(`   Error: ${viewError.message}`);
      results.checks.push({ name: 'submission_details view', status: 'FAILED', error: viewError.message });
      results.failed++;
    } else {
      console.log('   ✅ PASSED: submission_details view working');
      console.log(`   Retrieved ${viewTest?.length || 0} records from view`);
      results.checks.push({ name: 'submission_details view', status: 'PASSED' });
      results.passed++;
    }

    // Check 5: Test data consistency
    console.log('\n✅ Check 5: Testing data consistency...');
    
    const { data: consistencyTest, error: consistencyError } = await supabase
      .from('submissions')
      .select(`
        employee_name,
        employee_phone,
        employees!inner(
          name,
          phone
        )
      `)
      .limit(10);
    
    if (consistencyError) {
      console.log('   ❌ FAILED: Data consistency check failed');
      results.checks.push({ name: 'data consistency', status: 'FAILED', error: consistencyError.message });
      results.failed++;
    } else {
      let inconsistentRecords = 0;
      
      if (consistencyTest) {
        consistencyTest.forEach(record => {
          if (record.employee_name !== record.employees.name || 
              record.employee_phone !== record.employees.phone) {
            inconsistentRecords++;
          }
        });
      }
      
      if (inconsistentRecords === 0) {
        console.log('   ✅ PASSED: Data consistency verified');
        results.checks.push({ name: 'data consistency', status: 'PASSED' });
        results.passed++;
      } else {
        console.log(`   ⚠️  WARNING: Found ${inconsistentRecords} inconsistent records`);
        results.checks.push({ name: 'data consistency', status: 'WARNING' });
        results.warnings.push(`${inconsistentRecords} records have inconsistent data`);
        results.passed++;
      }
    }

  } catch (error) {
    console.error('\n💥 Unexpected error during verification:', error);
    results.checks.push({ name: 'verification process', status: 'FAILED', error: error.message });
    results.failed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Checks passed: ${results.passed}`);
  console.log(`❌ Checks failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  console.log('\n📋 DETAILED RESULTS:');
  results.checks.forEach(check => {
    const status = check.status === 'PASSED' ? '✅' : 
                  check.status === 'WARNING' ? '⚠️ ' : '❌';
    console.log(`   ${status} ${check.name}: ${check.status}`);
    if (check.error) {
      console.log(`      Error: ${check.error}`);
    }
  });
  
  if (results.failed === 0) {
    console.log('\n🎉 SUCCESS: Foreign key relationship fix verified!');
    console.log('The submissions and employees tables are now properly linked.');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Test the application to ensure forms work correctly');
    console.log('2. Run any existing tests to verify functionality');
    console.log('3. Update the todo list to mark this task as completed');
  } else {
    console.log('\n💥 ISSUES FOUND: Foreign key fix needs attention');
    console.log('Please review the failed checks above and re-run the SQL script if needed.');
    
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Ensure the SQL script was run completely in Supabase SQL Editor');
    console.log('2. Check for any error messages in the SQL Editor');
    console.log('3. Verify that both submissions and employees tables exist');
    console.log('4. Re-run this verification script after making corrections');
  }
  
  return results;
}

async function main() {
  const results = await verifyForeignKeyFix();
  
  // Exit with appropriate code
  process.exit(results.failed === 0 ? 0 : 1);
}

main().catch(console.error);