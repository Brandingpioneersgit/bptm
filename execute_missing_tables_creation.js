import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://igwgryykglsetfvomhdj.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA'
);

console.log('🚀 Creating missing backend tables to fix 404 errors...');

// Since we can't execute raw SQL directly with the anon key,
// we'll create the tables one by one using the Supabase client

async function createMissingTables() {
  const results = {
    created: [],
    errors: [],
    skipped: []
  };

  // We'll create the tables by inserting a dummy record and letting Supabase handle the schema
  // This is a workaround since we can't execute DDL with anon key
  
  console.log('\n⚠️  IMPORTANT NOTICE:');
  console.log('Due to Supabase security restrictions, we cannot create tables programmatically.');
  console.log('Please follow these steps to create the missing tables:');
  console.log('\n📋 MANUAL STEPS REQUIRED:');
  console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Navigate to your project: igwgryykglsetfvomhdj');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste the contents of: create_missing_backend_tables.sql');
  console.log('5. Click "Run" to execute the SQL script');
  
  console.log('\n📄 SQL FILE LOCATION:');
  console.log('   /Users/taps/code/bptm/create_missing_backend_tables.sql');
  
  console.log('\n🎯 TABLES TO BE CREATED:');
  const missingTables = [
    'client_projects',
    'announcements', 
    'events',
    'system_updates',
    'client_payments',
    'web_projects',
    'recurring_clients'
  ];
  
  missingTables.forEach(table => {
    console.log(`   ✓ ${table}`);
  });
  
  console.log('\n🔍 VERIFICATION:');
  console.log('After running the SQL script, you can verify the tables were created by running:');
  console.log('   node check_all_missing_tables.js');
  
  console.log('\n🧪 TESTING:');
  console.log('Once tables are created, the 404 errors should be resolved.');
  console.log('You can test this by running the application and checking the browser console.');
  
  // Let's also check if we can at least verify the current state
  console.log('\n📊 CURRENT TABLE STATUS:');
  
  for (const tableName of missingTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('Could not find the table')) {
          console.log(`   ❌ ${tableName}: MISSING (will be created by SQL script)`);
        } else {
          console.log(`   ⚠️ ${tableName}: ERROR - ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${tableName}: ALREADY EXISTS`);
        results.skipped.push(tableName);
      }
    } catch (err) {
      console.log(`   💥 ${tableName}: EXCEPTION - ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 NEXT STEPS SUMMARY:');
  console.log('='.repeat(60));
  console.log('1. Run the SQL script in Supabase Dashboard SQL Editor');
  console.log('2. Verify tables with: node check_all_missing_tables.js');
  console.log('3. Test the application to confirm 404 errors are resolved');
  console.log('4. Run the test suite to verify all endpoints are working');
  
  return results;
}

// Also create a simple verification function
async function quickVerification() {
  console.log('\n🔍 Quick verification of critical tables...');
  
  const criticalTables = ['clients', 'unified_users', 'submissions', 'employees'];
  
  for (const table of criticalTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: OK`);
      }
    } catch (err) {
      console.log(`   💥 ${table}: ${err.message}`);
    }
  }
}

async function main() {
  await quickVerification();
  await createMissingTables();
}

main().catch(console.error);