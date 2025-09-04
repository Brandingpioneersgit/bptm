import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkMigrationStatus() {
  try {
    console.log('🔍 Checking if login_tracking table exists...');
    
    // Try to query the login_tracking table
    const { data, error } = await supabase
      .from('login_tracking')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ login_tracking table does not exist');
        console.log('\n📋 Manual migration required:');
        console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and run the following SQL:');
        console.log('\n' + '='.repeat(80));
        
        const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20240101000000_create_login_tracking.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        console.log(migrationSQL);
        console.log('='.repeat(80));
        
        console.log('\n4. After running the SQL, restart your application');
        console.log('\n💡 The login tracking feature will be active once the table is created.');
        return false;
      } else {
        throw error;
      }
    } else {
      console.log('✅ login_tracking table already exists!');
      console.log('🎉 Login tracking is ready to use.');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
    return false;
  }
}

// Check migration status
checkMigrationStatus().then(exists => {
  if (exists) {
    console.log('\n🚀 All set! Login tracking will now record:');
    console.log('  • User login attempts (success/failed)');
    console.log('  • IP addresses and geolocation');
    console.log('  • Device information');
    console.log('  • Session tracking');
  }
  process.exit(exists ? 0 : 1);
});