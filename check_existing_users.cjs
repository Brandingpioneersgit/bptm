const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('Checking existing users in unified_users table...');
  
  try {
    const { data, error } = await supabase
      .from('unified_users')
      .select('*')
      .limit(20);
    
    if (error) {
      console.error('Error fetching users:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`Found ${data.length} existing users:`);
      data.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name || 'N/A'}, Phone: ${user.phone || 'N/A'}, Department: ${user.department || user.role || 'N/A'}`);
      });
    } else {
      console.log('No users found in the database.');
    }
    
    // Test login with first user if available
    if (data && data.length > 0) {
      const testUser = data[0];
      console.log(`\nTesting login with: ${testUser.name}, ${testUser.phone}`);
      
      const { data: loginData, error: loginError } = await supabase
        .from('unified_users')
        .select('*')
        .eq('name', testUser.name)
        .eq('phone', testUser.phone)
        .single();
      
      if (loginError) {
        console.log('Login test failed:', loginError.message);
      } else {
        console.log('✓ Login test successful! User found:', loginData.name);
      }
    }
    
  } catch (err) {
    console.error('Failed to check users:', err.message);
  }
}

checkUsers().catch(console.error);