import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', SUPABASE_URL);
  console.error('VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test 1: Check if unified_users table exists
    console.log('\n📋 Checking unified_users table...');
    const { data: users, error: usersError } = await supabase
      .from('unified_users')
      .select('name, phone, role')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error querying unified_users:', usersError);
      if (usersError.code === '42P01') {
        console.log('💡 The unified_users table does not exist. Migrations need to be run.');
      }
      return;
    }
    
    console.log('✅ unified_users table exists!');
    console.log('📊 Sample users:', users);
    
    // Test 2: Try to login with a known test user
    console.log('\n🔐 Testing login with test credentials...');
    const testCredentials = {
      name: 'John SEO',
      phone: '+91-9876543210',
      role: 'SEO'
    };
    
    const { data: loginUser, error: loginError } = await supabase
      .from('unified_users')
      .select('*')
      .eq('name', testCredentials.name.trim())
      .eq('phone', testCredentials.phone.trim())
      .eq('status', 'active')
      .single();
    
    if (loginError) {
      console.error('❌ Login test failed:', loginError);
      if (loginError.code === 'PGRST116') {
        console.log('💡 No user found with these credentials');
        console.log('🔍 Let\'s check what users actually exist...');
        
        const { data: allUsers, error: allError } = await supabase
          .from('unified_users')
          .select('name, phone, role, status')
          .limit(10);
        
        if (!allError) {
          console.log('📋 Available users:');
          allUsers.forEach(user => {
            console.log(`  - ${user.name} | ${user.phone} | ${user.role} | ${user.status}`);
          });
        }
      }
    } else {
      console.log('✅ Login test successful!');
      console.log('👤 Found user:', {
        name: loginUser.name,
        phone: loginUser.phone,
        role: loginUser.role,
        status: loginUser.status
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDatabase();