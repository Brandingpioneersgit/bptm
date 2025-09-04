import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableExists(tableName) {
  try {
    const { error } = await supabase.from(tableName).select('*').limit(1);
    return !error || error.code !== '42P01';
  } catch {
    return false;
  }
}

async function dropTableIfExists(tableName) {
  try {
    const exists = await checkTableExists(tableName);
    if (exists) {
      console.log(`🔄 Attempting to drop ${tableName}...`);
      
      // Try to delete all data first
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (deleteError) {
        console.log(`⚠️  Could not clear data from ${tableName}: ${deleteError.message}`);
      } else {
        console.log(`✅ Cleared data from ${tableName}`);
      }
      
      console.log(`⚠️  Note: Cannot drop table ${tableName} via client - requires admin access`);
      console.log(`   Manual action needed: DROP TABLE IF EXISTS public.${tableName} CASCADE;`);
    } else {
      console.log(`✅ ${tableName} does not exist or already removed`);
    }
  } catch (error) {
    console.log(`⚠️  Error checking ${tableName}: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Manual table cleanup process...');
  console.log('This will clear data from redundant tables and provide manual DROP commands\n');
  
  // List of redundant authentication tables
  const authTables = ['user_accounts', 'login_tracking', 'login_attempts'];
  
  // List of module-specific user tables
  const moduleTables = [
    'ads_users', 'web_users', 'social_users', 'intern_users',
    'freelancer_users', 'sales_users', 'cs_users', 'af_users',
    'hr_users', 'yt_users', 'seo_users'
  ];
  
  console.log('📋 Checking redundant authentication tables...');
  for (const table of authTables) {
    await dropTableIfExists(table);
  }
  
  console.log('\n📋 Checking module-specific user tables...');
  for (const table of moduleTables) {
    await dropTableIfExists(table);
  }
  
  // Verify unified_users exists
  console.log('\n🔍 Verifying unified authentication system...');
  
  const { data: unifiedUsers, error: unifiedError } = await supabase
    .from('unified_users')
    .select('id, role, name')
    .limit(5);
  
  if (unifiedError) {
    console.log('❌ unified_users table issue:', unifiedError.message);
  } else {
    console.log(`✅ unified_users table exists with ${unifiedUsers.length} users`);
    if (unifiedUsers.length > 0) {
      const roles = [...new Set(unifiedUsers.map(u => u.role))];
      console.log(`   Available roles: ${roles.join(', ')}`);
    }
  }
  
  const { data: sessions, error: sessionsError } = await supabase
    .from('user_sessions')
    .select('id')
    .limit(1);
  
  if (sessionsError) {
    console.log('❌ user_sessions table issue:', sessionsError.message);
  } else {
    console.log('✅ user_sessions table exists and is accessible');
  }
  
  console.log('\n🎯 Manual cleanup required:');
  console.log('To complete the cleanup, run these SQL commands in Supabase SQL Editor:');
  console.log('\n-- Drop redundant authentication tables');
  authTables.forEach(table => {
    console.log(`DROP TABLE IF EXISTS public.${table} CASCADE;`);
  });
  
  console.log('\n-- Drop module-specific user tables');
  moduleTables.forEach(table => {
    console.log(`DROP TABLE IF EXISTS public.${table} CASCADE;`);
  });
  
  console.log('\n-- Drop related functions');
  console.log('DROP FUNCTION IF EXISTS authenticate_user CASCADE;');
  console.log('DROP FUNCTION IF EXISTS sync_employee_to_user_account CASCADE;');
  console.log('DROP FUNCTION IF EXISTS cleanup_old_login_attempts CASCADE;');
  
  console.log('\n✅ Manual cleanup process completed!');
}

main().catch(console.error);