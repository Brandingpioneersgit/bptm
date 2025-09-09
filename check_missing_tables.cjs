const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_ADMIN_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingTables() {
  console.log('🔍 Checking for missing backend tables...\n');
  
  const requiredTables = [
    'client_projects',
    'announcements', 
    'events',
    'system_updates',
    'client_payments',
    'web_projects',
    'recurring_clients',
    'project_tasks',
    'task_assignments',
    'time_tracking',
    'user_preferences'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  for (const tableName of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        missingTables.push(tableName);
        console.log(`❌ ${tableName} - Missing`);
      } else {
        existingTables.push(tableName);
        console.log(`✅ ${tableName} - Exists`);
      }
    } catch (err) {
      missingTables.push(tableName);
      console.log(`❌ ${tableName} - Error: ${err.message}`);
    }
  }
  
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n🚨 MISSING TABLES:');
    missingTables.forEach(table => console.log(`   - ${table}`));
    
    console.log('\n📋 MANUAL ACTION REQUIRED:');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Execute the contents of: create_missing_backend_tables.sql');
    console.log('4. Run this script again to verify');
    
    console.log('\n📄 Instructions file: CREATE_MISSING_TABLES_INSTRUCTIONS.md');
  } else {
    console.log('\n🎉 All required tables exist!');
  }
}

checkMissingTables();