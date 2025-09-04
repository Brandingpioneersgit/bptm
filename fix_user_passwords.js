import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixUserPasswords() {
  console.log('🔧 Fixing User Passwords...');
  
  try {
    // Get all users with null passwords
    console.log('\n📋 Checking users with null passwords...');
    const { data: users, error: fetchError } = await supabase
      .from('user_accounts')
      .select('*')
      .is('password_hash', null);
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }
    
    console.log(`✅ Found ${users.length} users with null passwords`);
    
    if (users.length === 0) {
      console.log('🎉 All users already have passwords!');
      return;
    }
    
    // Set default password for each user
    const defaultPassword = 'password123';
    console.log(`\n🔑 Setting default password '${defaultPassword}' for all users...`);
    
    for (const user of users) {
      console.log(`\n👤 Updating password for: ${user.full_name} (${user.email})`);
      
      const { data, error } = await supabase
        .from('user_accounts')
        .update({ password_hash: defaultPassword })
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error(`   ❌ Failed to update ${user.email}:`, error.message);
      } else {
        console.log(`   ✅ Password updated successfully`);
      }
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying password updates...');
    const { data: updatedUsers, error: verifyError } = await supabase
      .from('user_accounts')
      .select('email, full_name, password_hash, is_active')
      .eq('is_active', true);
    
    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError);
      return;
    }
    
    console.log('\n📊 Updated user status:');
    updatedUsers.forEach(user => {
      const passwordStatus = user.password_hash ? '✅ Set' : '❌ Still null';
      console.log(`- ${user.full_name} (${user.email}): ${passwordStatus}`);
    });
    
  } catch (error) {
    console.error('❌ Password fix failed:', error);
  }
}

// Test login after password fix
async function testLoginAfterFix() {
  console.log('\n🧪 Testing login after password fix...');
  
  const testCredentials = [
    { email: 'rahul.sharma@testcompany.com', name: 'Rahul Sharma' },
    { email: 'priya.patel@testcompany.com', name: 'Priya Patel' },
    { email: 'admin@testcompany.com', name: 'System Admin' }
  ];
  
  for (const cred of testCredentials) {
    try {
      console.log(`\n🔐 Testing login for: ${cred.name}`);
      
      const { data: user, error } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('email', cred.email)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.log(`   ❌ User not found: ${error.message}`);
        continue;
      }
      
      if (user.password_hash === 'password123') {
        console.log(`   ✅ Login would succeed with 'password123'`);
        console.log(`   👤 User: ${user.full_name} (${user.role})`);
      } else {
        console.log(`   ❌ Password still incorrect: ${user.password_hash}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Test failed for ${cred.email}:`, error.message);
    }
  }
}

// Run the password fix
async function runPasswordFix() {
  await fixUserPasswords();
  await testLoginAfterFix();
  
  console.log('\n🎉 Password fix complete!');
  console.log('\n📝 Summary:');
  console.log('- Updated all users with null passwords');
  console.log('- Set default password to "password123"');
  console.log('- Users can now log in with their email and "password123"');
  console.log('\n🚀 Next steps:');
  console.log('1. Test login through the web application');
  console.log('2. Users should change their passwords after first login');
  console.log('3. Consider implementing password reset functionality');
}

runPasswordFix().catch(console.error);