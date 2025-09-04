import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runCleanupScript(scriptPath, description) {
  try {
    console.log(`🔄 Running ${description}...`);
    
    // Read the SQL script
    const sqlScript = readFileSync(scriptPath, 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.includes('DROP TABLE') || statement.includes('DROP FUNCTION')) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error && !error.message.includes('does not exist')) {
            console.log(`⚠️  Warning executing statement: ${error.message}`);
          } else {
            console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
          }
        } catch (err) {
          console.log(`⚠️  Warning: ${err.message}`);
        }
      }
    }
    
    console.log(`✅ ${description} completed`);
    
  } catch (error) {
    console.error(`❌ Error running ${description}:`, error.message);
  }
}

async function verifyCleanup() {
  try {
    console.log('\n🔍 Verifying cleanup...');
    
    // Check if unified_users exists and has data
    const { data: unifiedUsers, error: unifiedError } = await supabase
      .from('unified_users')
      .select('id, role')
      .limit(5);
    
    if (unifiedError) {
      console.log('❌ unified_users table issue:', unifiedError.message);
    } else {
      console.log(`✅ unified_users table exists with ${unifiedUsers.length} users`);
      const roles = [...new Set(unifiedUsers.map(u => u.role))];
      console.log(`   Roles: ${roles.join(', ')}`);
    }
    
    // Check if user_sessions exists
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id')
      .limit(1);
    
    if (sessionsError) {
      console.log('❌ user_sessions table issue:', sessionsError.message);
    } else {
      console.log('✅ user_sessions table exists');
    }
    
    // Try to access old tables to confirm they're gone
    const oldTables = ['user_accounts', 'login_tracking', 'login_attempts', 'ads_users', 'web_users'];
    
    for (const table of oldTables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.code === '42P01') {
          console.log(`✅ ${table} successfully removed`);
        } else if (!error) {
          console.log(`⚠️  ${table} still exists`);
        }
      } catch (err) {
        console.log(`✅ ${table} successfully removed`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting database cleanup...');
  console.log('This will remove redundant authentication and module-specific user tables\n');
  
  // Step 1: Clean up redundant authentication tables
  await runCleanupScript(
    'database/cleanup_redundant_auth_tables.sql',
    'redundant authentication tables cleanup'
  );
  
  // Step 2: Clean up module-specific user tables
  await runCleanupScript(
    'database/cleanup_module_user_tables.sql', 
    'module-specific user tables cleanup'
  );
  
  // Step 3: Verify cleanup
  await verifyCleanup();
  
  console.log('\n🎉 Database cleanup completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Update any code references to use unified_users instead of module-specific tables');
  console.log('2. Update foreign key references in remaining tables');
  console.log('3. Test authentication and user management functionality');
}

main().catch(console.error);