require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function checkUserEmails() {
  try {
    const { data, error } = await supabase
      .from('unified_users')
      .select('name, email, role, user_category')
      .order('name');
    
    if (error) {
      console.log('Error:', error.message);
      return;
    }
    
    console.log('📧 Actual user emails in database:');
    console.log('=' .repeat(60));
    data.forEach(user => {
      console.log(`${user.email.padEnd(25)} - ${user.name.padEnd(20)} (${user.role})`);
    });
    
    console.log('\n🔑 Test these credentials:');
    data.slice(0, 5).forEach(user => {
      console.log(`{ email: '${user.email}', password: 'password123', expectedRole: '${user.role}' },`);
    });
  } catch (err) {
    console.log('Error:', err.message);
  }
}

checkUserEmails();