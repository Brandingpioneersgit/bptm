import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://igwgryykglsetfvomhdj.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA'
);

console.log('🔍 Checking all tables that are causing 404 errors...');

// Tables that are causing 404 errors based on test reports
const tablesToCheck = [
  'client_projects',
  'announcements', 
  'events',
  'system_updates',
  'submissions',
  'employees',
  'monthly_form_submissions',
  'client_payments',
  'web_projects',
  'recurring_clients',
  'dashboard_configurations',
  'dashboard_usage',
  'monthly_kpi_reports',
  'employee_performance',
  'employee_kpis',
  'employee_attendance',
  'notifications',
  'system_notifications'
];

async function checkAllTables() {
  const results = {
    existing: [],
    missing: [],
    errors: []
  };

  for (const tableName of tablesToCheck) {
    try {
      console.log(`\n📋 Checking ${tableName} table...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('Could not find the table')) {
          console.log(`❌ ${tableName}: TABLE MISSING`);
          results.missing.push(tableName);
        } else {
          console.log(`⚠️ ${tableName}: ERROR - ${error.message}`);
          results.errors.push({ table: tableName, error: error.message });
        }
      } else {
        console.log(`✅ ${tableName}: EXISTS (${data?.length || 0} sample records)`);
        results.existing.push(tableName);
      }
    } catch (err) {
      console.log(`💥 ${tableName}: EXCEPTION - ${err.message}`);
      results.errors.push({ table: tableName, error: err.message });
    }
  }

  // Summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n✅ EXISTING TABLES (${results.existing.length}):`);
  results.existing.forEach(table => console.log(`   - ${table}`));
  
  console.log(`\n❌ MISSING TABLES (${results.missing.length}):`);
  results.missing.forEach(table => console.log(`   - ${table}`));
  
  if (results.errors.length > 0) {
    console.log(`\n⚠️ TABLES WITH ERRORS (${results.errors.length}):`);
    results.errors.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 NEXT STEPS:');
  console.log('='.repeat(60));
  
  if (results.missing.length > 0) {
    console.log('\n1. Create the missing tables in Supabase SQL Editor:');
    results.missing.forEach(table => {
      console.log(`   - CREATE TABLE ${table} (...);`);
    });
  }
  
  if (results.errors.length > 0) {
    console.log('\n2. Fix schema/permission issues for tables with errors');
  }
  
  console.log('\n3. Re-run tests to verify 404 errors are resolved');
  
  return results;
}

checkAllTables().catch(console.error);