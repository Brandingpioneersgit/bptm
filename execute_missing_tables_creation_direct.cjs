const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Required environment variables:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      console.error('SQL Error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception:', err.message);
    return false;
  }
}

async function createMissingTables() {
  console.log('🚀 Creating Missing Database Tables');
  console.log('===================================\n');
  
  const sqlFile = path.join(__dirname, 'create_missing_backend_tables.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ SQL file not found:', sqlFile);
    return;
  }
  
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  
  // Split SQL into individual statements
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    if (statement.includes('CREATE TABLE')) {
      const tableName = statement.match(/CREATE TABLE.*?([a-zA-Z_]+)\s*\(/)?.[1];
      console.log(`📋 Creating table: ${tableName}...`);
    } else if (statement.includes('CREATE INDEX')) {
      const indexName = statement.match(/CREATE INDEX.*?([a-zA-Z_]+)\s+ON/)?.[1];
      console.log(`🔍 Creating index: ${indexName}...`);
    } else if (statement.includes('CREATE POLICY')) {
      console.log(`🔒 Creating RLS policy...`);
    } else {
      console.log(`⚙️  Executing statement ${i + 1}...`);
    }
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Already exists (skipping)`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 EXECUTION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  // Verify tables were created
  console.log('\n🔍 Verifying created tables...');
  const tablesToCheck = [
    'client_projects',
    'announcements', 
    'events',
    'system_updates',
    'client_payments',
    'web_projects',
    'recurring_clients'
  ];
  
  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: Table exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Run application tests to verify 404 errors are resolved');
  console.log('2. Test API endpoints for the newly created tables');
  console.log('3. Update todo list to mark this task as completed');
}

createMissingTables().catch(console.error);