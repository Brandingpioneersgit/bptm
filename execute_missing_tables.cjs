const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_ADMIN_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMissingTables() {
  try {
    console.log('Reading SQL script...');
    const sqlScript = fs.readFileSync('create_missing_backend_tables.sql', 'utf8');
    
    // Split the SQL script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt.length > 10);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
      console.log('Statement preview:', statement.substring(0, 100) + '...');
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });
      
      if (error) {
        console.error(`Error in statement ${i + 1}:`, error);
        // Try direct query execution as fallback
        const { data: directData, error: directError } = await supabase
          .from('information_schema.tables')
          .select('*')
          .limit(1);
        
        if (directError) {
          console.error('Direct query also failed:', directError);
        } else {
          console.log('Direct query works, but RPC failed. Manual execution required.');
        }
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('\n=== Checking created tables ===');
    
    // Check if tables were created
    const tablesToCheck = [
      'client_projects',
      'announcements', 
      'events',
      'system_updates',
      'project_tasks',
      'task_assignments',
      'time_tracking',
      'client_feedback',
      'notifications',
      'user_preferences'
    ];
    
    for (const tableName of tablesToCheck) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ Table '${tableName}' - Error: ${error.message}`);
      } else {
        console.log(`✅ Table '${tableName}' - Accessible`);
      }
    }
    
  } catch (error) {
    console.error('Script execution error:', error);
  }
}

executeMissingTables();