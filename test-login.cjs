// Simple login test script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testLogin(firstName, phone) {
  console.log(`🔐 Testing login: ${firstName} + ${phone}`);
  
  try {
    // Search for users with name containing the first name
    const { data: users, error } = await supabase
      .from('unified_users')
      .select('*')
      .ilike('name', `%${firstName}%`)
      .eq('status', 'active');
      
    if (error) {
      console.error('❌ Database error:', error);
      return false;
    }
    
    console.log(`🔍 Found ${users.length} users matching "${firstName}"`);
    
    if (users.length === 0) {
      console.log('❌ No users found');
      return false;
    }
    
    // Find user with matching first name and phone
    const matchingUser = users.find(user => {
      const userFirstName = user.name.split(' ')[0].toLowerCase();
      const inputFirstName = firstName.toLowerCase();
      const phoneMatch = user.phone === phone;
      const nameMatch = userFirstName === inputFirstName;
      
      console.log(`  - Checking ${user.name}:`);
      console.log(`    First name match: "${userFirstName}" === "${inputFirstName}" = ${nameMatch}`);
      console.log(`    Phone match: "${user.phone}" === "${phone}" = ${phoneMatch}`);
      
      return nameMatch && phoneMatch;
    });
    
    if (matchingUser) {
      console.log('✅ Authentication successful!');
      console.log(`   User: ${matchingUser.name}`);
      console.log(`   Role: ${matchingUser.role}`); 
      console.log(`   Email: ${matchingUser.email}`);
      return true;
    } else {
      console.log('❌ No matching user found');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Running authentication tests...\n');
  
  const testCases = [
    { firstName: 'Marketing', phone: '9876543210' },
    { firstName: 'Super', phone: '9876543211' },
    { firstName: 'Employee', phone: '9876543213' },
    // Test wrong credentials
    { firstName: 'Marketing', phone: '1234567890' }, // Wrong phone
    { firstName: 'Wrong', phone: '9876543210' },     // Wrong name
  ];
  
  for (const testCase of testCases) {
    const success = await testLogin(testCase.firstName, testCase.phone);
    console.log(success ? '✅ PASS\n' : '❌ FAIL\n');
  }
}

runTests().then(() => {
  console.log('🎉 Authentication tests completed');
  process.exit(0);
});