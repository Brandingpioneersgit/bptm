const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createTestSpriteUser() {
  try {
    console.log('🔧 Creating TestSprite test user...');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.VITE_ADMIN_ACCESS_TOKEN;
    
    if (!supabaseUrl || !serviceKey) {
      console.error('❌ Missing environment variables');
      console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.log('VITE_ADMIN_ACCESS_TOKEN:', serviceKey ? 'Set' : 'Missing');
      return;
    }
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Use plain text password (as per current auth system)
    const plainPassword = 'password123';
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('unified_users')
      .select('*')
      .eq('email', 'marketing.manager@example.com')
      .single();
    
    if (existingUser) {
      console.log('✅ TestSprite user already exists:', existingUser.name, existingUser.email);
      return;
    }
    
    // Create the user
    const { data, error } = await supabase
      .from('unified_users')
      .insert([{
        user_id: 'USR999',
        name: 'Marketing Manager',
        email: 'marketing.manager@example.com',
        phone: '9876543230',
        role: 'Operations Head',
        password_hash: plainPassword,
        department: 'Marketing',
        user_category: 'employee',
        employee_id: 'EMP999'
      }])
      .select();
    
    if (error) {
      console.error('❌ Error creating TestSprite user:', error);
    } else {
      console.log('✅ TestSprite user created successfully:');
      console.log('   Name:', data[0].name);
      console.log('   Email:', data[0].email);
      console.log('   Phone:', data[0].phone);
      console.log('   Role:', data[0].role);
      console.log('   Password: password123');
    }
    
  } catch (err) {
    console.error('❌ Failed to create TestSprite user:', err.message);
  }
}

createTestSpriteUser();