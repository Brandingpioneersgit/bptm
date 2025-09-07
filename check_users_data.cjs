const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersData() {
  try {
    console.log('🔍 Checking unified_users table...');
    
    const { data: users, error } = await supabase
      .from('unified_users')
      .select('id, name, phone, role, status, account_locked, login_attempts, password_hash')
      .order('name');
    
    if (error) {
      console.error('❌ Error querying users:', error);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found in unified_users table');
      return;
    }
    
    console.log(`📊 Found ${users.length} users in database:`);
    console.log('=' .repeat(80));
    
    users.forEach((user, i) => {
      console.log(`${i+1}. Name: ${user.name}`);
      console.log(`   Phone: ${user.phone}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Account Locked: ${user.account_locked}`);
      console.log(`   Login Attempts: ${user.login_attempts}`);
      console.log(`   Has Password: ${user.password_hash ? 'Yes' : 'No'}`);
      console.log('   ' + '-'.repeat(40));
    });
    
    // Test specific users that are failing
    console.log('\n🧪 Testing specific failing users...');
    const testUsers = [
      { name: 'Sarah', expectedPhone: '9876543211' },
      { name: 'Mike', expectedPhone: '9876543212' },
      { name: 'Lisa', expectedPhone: '9876543213' },
      { name: 'David', expectedPhone: '9876543214' },
      { name: 'Emma', expectedPhone: '9876543215' }
    ];
    
    for (const testUser of testUsers) {
      console.log(`\n🔍 Searching for user: ${testUser.name}`);
      
      const { data: foundUsers, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testUser.name}%`);
      
      if (searchError) {
        console.log(`   ❌ Search error: ${searchError.message}`);
      } else if (!foundUsers || foundUsers.length === 0) {
        console.log(`   ❌ No users found matching "${testUser.name}%"`);
      } else {
        console.log(`   ✅ Found ${foundUsers.length} matching users:`);
        foundUsers.forEach(user => {
          console.log(`      - ${user.name} (${user.phone}) - ${user.role}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUsersData().catch(console.error);