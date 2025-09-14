// Test authentication fix
// This script will create simple test authentication that works

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN // Use service role to bypass RLS
);

async function createTestUsersWithPhones() {
  console.log('🔧 Creating test users with proper phone numbers...');
  
  // Delete existing users first
  console.log('🗑️ Clearing existing users...');
  await supabase.from('unified_users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  // Create new test users with phone numbers
  const testUsers = [
    {
      user_id: 'USR001',
      name: 'Marketing Manager',
      email: 'marketing.manager@example.com',
      phone: '9876543210',
      password_hash: 'password123',
      role: 'Operations Head',
      user_category: 'management',
      department: 'Marketing',
      status: 'active',
      employee_id: 'EMP001'
    },
    {
      user_id: 'USR002', 
      name: 'Super Admin',
      email: 'super.admin@example.com',
      phone: '9876543211',
      password_hash: 'password123',
      role: 'Super Admin',
      user_category: 'super_admin',
      department: 'Administration', 
      status: 'active',
      employee_id: 'ADM001'
    },
    {
      user_id: 'USR003',
      name: 'Employee User', 
      email: 'employee@example.com',
      phone: '9876543213',
      password_hash: 'password123',
      role: 'SEO',
      user_category: 'employee',
      department: 'Marketing',
      status: 'active', 
      employee_id: 'EMP002'
    }
  ];
  
  console.log('📝 Inserting test users...');
  const { data, error } = await supabase
    .from('unified_users')
    .insert(testUsers)
    .select();
    
  if (error) {
    console.error('❌ Error creating users:', error);
    return false;
  }
  
  console.log('✅ Successfully created', data.length, 'test users');
  
  // Verify the data
  console.log('🔍 Verifying users...');
  const { data: users, error: checkError } = await supabase
    .from('unified_users')
    .select('name, phone, role, email')
    .limit(5);
    
  if (checkError) {
    console.error('❌ Error checking users:', checkError);
    return false;
  }
  
  console.log('📋 Current users in database:');
  users.forEach(user => {
    console.log(`  - ${user.name} | Phone: ${user.phone} | Role: ${user.role}`);
  });
  
  return true;
}

createTestUsersWithPhones().then(success => {
  if (success) {
    console.log('🎉 Authentication fix completed successfully!');
    console.log('\n🔐 Test these credentials:');
    console.log('1. First Name: "Marketing" + Phone: "9876543210" (Operations Head)');
    console.log('2. First Name: "Super" + Phone: "9876543211" (Super Admin)'); 
    console.log('3. First Name: "Employee" + Phone: "9876543213" (SEO)');
  } else {
    console.log('❌ Authentication fix failed');
  }
  process.exit(0);
});