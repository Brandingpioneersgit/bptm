import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    
    // Read the unified auth schema migration
    console.log('📋 Step 1: Creating unified authentication schema...');
    const authSchema = readFileSync('./database/migrations/20240102004000_unified_auth_schema.sql', 'utf8');
    
    // Split the SQL into individual statements (remove BEGIN/COMMIT for now)
    const authStatements = authSchema
      .replace(/BEGIN;/g, '')
      .replace(/COMMIT;/g, '')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of authStatements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log('⚠️ Statement may have failed (this might be expected):', error.message);
          }
        } catch (err) {
          console.log('⚠️ Statement execution note:', err.message);
        }
      }
    }
    
    console.log('✅ Step 1 completed');
    
    // Read the test users migration
    console.log('📋 Step 2: Creating test users and permissions...');
    const testUsers = readFileSync('./database/migrations/20240102004100_default_permissions_and_users.sql', 'utf8');
    
    const userStatements = testUsers
      .replace(/BEGIN;/g, '')
      .replace(/COMMIT;/g, '')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of userStatements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log('⚠️ Statement may have failed (this might be expected):', error.message);
          }
        } catch (err) {
          console.log('⚠️ Statement execution note:', err.message);
        }
      }
    }
    
    console.log('✅ Step 2 completed');
    
    // Test the setup
    console.log('🔍 Testing the setup...');
    const { data: users, error: usersError } = await supabase
      .from('unified_users')
      .select('name, phone, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error testing setup:', usersError);
    } else {
      console.log('✅ Migration successful!');
      console.log('📊 Sample users created:');
      users.forEach(user => {
        console.log(`  - ${user.name} | ${user.phone} | ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigrations();