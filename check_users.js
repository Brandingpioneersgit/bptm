// Check existing users in the database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkUsers() {
  console.log('🔍 Checking existing users in unified_users table...\n');
  
  try {
    const { data: users, error } = await supabase
      .from('unified_users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.log('❌ Error fetching users:', error.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('📭 No users found in unified_users table');
      console.log('\n💡 You may need to run the test data creation scripts:');
      console.log('   - node create_test_users.js');
      console.log('   - node populate_unified_users.js');
      return;
    }
    
    console.log(`📊 Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name || 'No Name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Category: ${user.user_category}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('   ---');
    });
    
    // Group by role for summary
    const roleCount = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Users by Role:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkUsers().catch(console.error);