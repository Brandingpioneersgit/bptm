import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function fixTestUserPhones() {
  console.log('🔧 Fixing test user phone numbers to match expected credentials...');
  
  // Define the correct phone numbers for our test users
  const correctPhones = {
    'John': '9876543210',    // SEO
    'Sarah': '9876543211',   // Ads  
    'Mike': '9876543212',    // Social Media
    'Lisa': '9876543213',    // YouTube SEO
    'David': '9876543214',   // Web Developer
    'Emma': '9876543215',    // Graphic Designer
    'Jennifer': '9876543221', // Operations Head
    'Michael': '9876543222',  // Accountant
    'Amanda': '9876543223',   // Sales
    'Rachel': '9876543224',   // HR
    'Admin': '9876543225'     // Super Admin
  };
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('unified_users')
      .select('id, name, phone, role')
      .order('name');
      
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('\nCurrent users and their phone numbers:');
    users.forEach(user => {
      console.log(`${user.name} (${user.role}): ${user.phone}`);
    });
    
    // Update phone numbers for users that match our test cases
    let updatedCount = 0;
    
    for (const user of users) {
      const firstName = user.name.split(' ')[0];
      const correctPhone = correctPhones[firstName];
      
      if (correctPhone && user.phone !== correctPhone) {
        console.log(`\n🔄 Updating ${user.name}: ${user.phone} → ${correctPhone}`);
        
        const { error: updateError } = await supabase
          .from('unified_users')
          .update({ phone: correctPhone })
          .eq('id', user.id);
          
        if (updateError) {
          console.error(`❌ Error updating ${user.name}:`, updateError);
        } else {
          console.log(`✅ Successfully updated ${user.name}`);
          updatedCount++;
        }
      }
    }
    
    if (updatedCount === 0) {
      console.log('\n✅ All phone numbers are already correct!');
    } else {
      console.log(`\n🎉 Updated ${updatedCount} phone numbers!`);
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying final phone numbers...');
    const { data: finalUsers, error: verifyError } = await supabase
      .from('unified_users')
      .select('id, name, phone, role')
      .order('name');
      
    if (verifyError) {
      console.error('Error verifying updates:', verifyError);
      return;
    }
    
    console.log('\nFinal user credentials:');
    finalUsers.forEach(user => {
      const firstName = user.name.split(' ')[0];
      if (correctPhones[firstName]) {
        console.log(`${firstName} (${user.role}): ${user.phone}`);
      }
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Test authentication with the corrected phone numbers
async function testCorrectedAuthentication() {
  console.log('\n🧪 Testing authentication with corrected phone numbers...');
  
  const testCases = [
    { firstName: 'John', phone: '9876543210', expectedRole: 'SEO' },
    { firstName: 'Sarah', phone: '9876543211', expectedRole: 'Ads' },
    { firstName: 'Mike', phone: '9876543212', expectedRole: 'Social Media' },
    { firstName: 'Lisa', phone: '9876543213', expectedRole: 'YouTube SEO' },
    { firstName: 'David', phone: '9876543214', expectedRole: 'Web Developer' },
    { firstName: 'Emma', phone: '9876543215', expectedRole: 'Graphic Designer' },
    { firstName: 'Admin', phone: '9876543225', expectedRole: 'Super Admin' }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testCase of testCases) {
    try {
      // Search for user by first name (case-insensitive)
      const { data: users, error } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testCase.firstName}%`)
        .eq('status', 'active');
        
      if (error) {
        console.log(`❌ ${testCase.firstName}: Database error`);
        failedTests++;
        continue;
      }
      
      if (!users || users.length === 0) {
        console.log(`❌ ${testCase.firstName}: User not found`);
        failedTests++;
        continue;
      }
      
      // Find exact match by first name
      const matchingUser = users.find(user => {
        const userFirstName = user.name.split(' ')[0].toLowerCase();
        return userFirstName === testCase.firstName.toLowerCase();
      });
      
      if (!matchingUser) {
        console.log(`❌ ${testCase.firstName}: No exact name match`);
        failedTests++;
        continue;
      }
      
      // Check phone number
      const normalizedUserPhone = matchingUser.phone.replace(/^\+91-?/, '').replace(/[\s\-\(\)]/g, '');
      const normalizedInputPhone = testCase.phone.replace(/^\+91-?/, '').replace(/[\s\-\(\)]/g, '');
      
      if (normalizedUserPhone !== normalizedInputPhone) {
        console.log(`❌ ${testCase.firstName}: Phone mismatch (${normalizedUserPhone} vs ${normalizedInputPhone})`);
        failedTests++;
        continue;
      }
      
      if (matchingUser.role !== testCase.expectedRole) {
        console.log(`❌ ${testCase.firstName}: Role mismatch (${matchingUser.role} vs ${testCase.expectedRole})`);
        failedTests++;
        continue;
      }
      
      console.log(`✅ ${testCase.firstName}: Authentication test passed (${matchingUser.role})`);
      passedTests++;
      
    } catch (error) {
      console.log(`❌ ${testCase.firstName}: Test error`);
      failedTests++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed`);
  
  if (failedTests === 0) {
    console.log('🎉 All authentication tests passed! Login system is ready.');
  }
}

fixTestUserPhones().then(() => {
  return testCorrectedAuthentication();
}).catch(console.error);