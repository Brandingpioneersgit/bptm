require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function checkAllUsers() {
  console.log('🔍 Checking all users in unified_users table...');
  
  try {
    const { data, error } = await supabase
      .from('unified_users')
      .select('*');
    
    if (error) {
      console.error('❌ Error querying users:', error);
      return;
    }
    
    console.log(`📊 Total users found: ${data.length}`);
    
    if (data.length > 0) {
      console.log('\n👥 Users in database:');
      data.forEach((user, index) => {
        console.log(`${index + 1}. Name: "${user.name}", Email: ${user.email}, Phone: ${user.phone}, Role: ${user.role}`);
      });
    } else {
      console.log('❌ No users found in unified_users table');
    }
    
  } catch (err) {
    console.error('💥 Exception:', err);
  }
}

checkAllUsers();