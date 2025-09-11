import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN // This is the service role key
);

async function createTestUsers() {
  console.log('🔧 Creating test users for login testing...');
  
  // Test users as specified in the request
  const testUsers = [
    {
      user_id: 'USR_MARKETING_001',
      name: 'Marketing Manager',
      phone: '9876543210',
      email: 'marketing.manager@testcompany.com',
      password_hash: '$2b$10$hashedpassword_marketing',
      role: 'Manager',
      user_category: 'admin',
      department: 'Marketing',
      status: 'active',
      dashboard_access: ['admin_dashboard', 'management_dashboard'],
      permissions: { read: true, write: true, approve: true }
    },
    {
      user_id: 'USR_SUPER_001',
      name: 'Super Admin',
      phone: '9876543211',
      email: 'super.admin@testcompany.com',
      password_hash: '$2b$10$hashedpassword_super',
      role: 'Super Admin',
      user_category: 'super_admin',
      department: 'Administration',
      status: 'active',
      dashboard_access: ['super_admin_dashboard', 'all_dashboards'],
      permissions: { read: true, write: true, approve: true, admin: true }
    }
  ];
  
  // First, check if these users already exist
  console.log('🔍 Checking for existing users...');
  for (const user of testUsers) {
    const { data: existingUser, error } = await supabase
      .from('unified_users')
      .select('name, phone')
      .eq('phone', user.phone)
      .single();
    
    if (existingUser) {
      console.log(`⚠️ User with phone ${user.phone} already exists: ${existingUser.name}`);
    } else {
      console.log(`✅ User with phone ${user.phone} does not exist, will create`);
    }
  }
  
  // Insert users (this will fail if they already exist due to unique constraints)
  console.log('📝 Inserting test users...');
  const { data: insertedUsers, error: userError } = await supabase
    .from('unified_users')
    .upsert(testUsers, { onConflict: 'phone' })
    .select();
    
  if (userError) {
    console.error('❌ Error inserting users:', userError);
  } else {
    console.log(`✅ Successfully upserted ${insertedUsers?.length || 0} users`);
    insertedUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.phone}) - ${user.role}`);
    });
  }
  
  // Verify the users exist and can be found by the login logic
  console.log('\n🔍 Testing login logic for created users...');
  
  // Test Marketing Manager
  console.log('\n📋 Testing Marketing Manager login logic:');
  const { data: marketingUsers, error: marketingError } = await supabase
    .from('unified_users')
    .select('*')
    .ilike('name', '%Marketing%')
    .eq('status', 'active');
    
  if (marketingError) {
    console.error('❌ Error searching for Marketing users:', marketingError);
  } else {
    console.log(`✅ Found ${marketingUsers?.length || 0} users with "Marketing" in name:`);
    marketingUsers?.forEach(user => {
      console.log(`  - ${user.name} (${user.phone}) - ${user.role}`);
      
      // Test first name extraction
      const userFirstName = user.name.split(' ')[0].toLowerCase();
      const inputFirstName = 'marketing'.toLowerCase();
      const isMatch = userFirstName === inputFirstName;
      console.log(`    First name match: '${userFirstName}' === '${inputFirstName}' = ${isMatch}`);
    });
  }
  
  // Test Super Admin
  console.log('\n📋 Testing Super Admin login logic:');
  const { data: superUsers, error: superError } = await supabase
    .from('unified_users')
    .select('*')
    .ilike('name', '%Super%')
    .eq('status', 'active');
    
  if (superError) {
    console.error('❌ Error searching for Super users:', superError);
  } else {
    console.log(`✅ Found ${superUsers?.length || 0} users with "Super" in name:`);
    superUsers?.forEach(user => {
      console.log(`  - ${user.name} (${user.phone}) - ${user.role}`);
      
      // Test first name extraction
      const userFirstName = user.name.split(' ')[0].toLowerCase();
      const inputFirstName = 'super'.toLowerCase();
      const isMatch = userFirstName === inputFirstName;
      console.log(`    First name match: '${userFirstName}' === '${inputFirstName}' = ${isMatch}`);
    });
  }
  
  // List all users for verification
  console.log('\n📋 All users in database:');
  const { data: allUsers, error: fetchError } = await supabase
    .from('unified_users')
    .select('name, phone, role, status')
    .order('name');
    
  if (fetchError) {
    console.error('❌ Error fetching all users:', fetchError);
  } else {
    console.log(`Total users: ${allUsers?.length || 0}`);
    allUsers?.forEach(user => {
      console.log(`  - ${user.name} | ${user.phone} | ${user.role} | ${user.status}`);
    });
  }
}

createTestUsers().catch(console.error);