require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function testAdminAuth() {
  console.log('🧪 Testing Admin Super authentication logic...');
  
  const firstName = 'Admin';
  const phoneNumber = '9876543225';
  
  console.log(`\n🔍 Step 1: Search for users with name starting with '${firstName}'`);
  
  const { data: users, error } = await supabase
    .from('unified_users')
    .select('*')
    .ilike('name', `${firstName}%`)
    .eq('status', 'active');
  
  if (error) {
    console.error('❌ Database error:', error);
    return;
  }
  
  console.log(`📊 Found ${users.length} users:`);
  users.forEach((user, index) => {
    console.log(`  ${index + 1}. Name: "${user.name}", Phone: ${user.phone}, Status: ${user.status}`);
  });
  
  if (users.length === 0) {
    console.log('❌ No users found - this is the problem!');
    return;
  }
  
  console.log(`\n🔍 Step 2: Look for exact first name match...`);
  
  // First try exact match (case-insensitive)
  let matchingUser = users.find(user => {
    const userFirstName = user.name.split(' ')[0].toLowerCase();
    const inputFirstName = firstName.toLowerCase();
    const isMatch = userFirstName === inputFirstName;
    console.log(`  Comparing '${userFirstName}' with '${inputFirstName}' = ${isMatch}`);
    return isMatch;
  });
  
  if (matchingUser) {
    console.log(`✅ Found exact match: ${matchingUser.name}`);
  } else {
    console.log('❌ No exact match found, trying partial match...');
    
    matchingUser = users.find(user => {
      const userName = user.name.toLowerCase();
      const inputName = firstName.toLowerCase();
      const isPartialMatch = userName.startsWith(inputName);
      console.log(`  Partial comparing '${userName}' with '${inputName}' = ${isPartialMatch}`);
      return isPartialMatch;
    });
    
    if (matchingUser) {
      console.log(`✅ Found partial match: ${matchingUser.name}`);
    } else {
      console.log('❌ No matching user found');
      return;
    }
  }
  
  console.log(`\n🔍 Step 3: Validate phone number...`);
  console.log(`  User phone: '${matchingUser.phone}'`);
  console.log(`  Input phone: '${phoneNumber}'`);
  
  // Simple phone comparison (normalize by removing +91 and spaces)
  const normalizePhone = (phone) => {
    return phone.replace(/[\+\-\s]/g, '').replace(/^91/, '');
  };
  
  const userPhone = normalizePhone(matchingUser.phone);
  const inputPhone = normalizePhone(phoneNumber);
  
  console.log(`  Normalized user phone: '${userPhone}'`);
  console.log(`  Normalized input phone: '${inputPhone}'`);
  
  const phoneMatch = userPhone === inputPhone;
  console.log(`  Phone match: ${phoneMatch}`);
  
  if (phoneMatch) {
    console.log('\n🎉 Authentication should succeed!');
    console.log(`User: ${matchingUser.name} (${matchingUser.role})`);
  } else {
    console.log('\n❌ Phone number mismatch - authentication should fail');
  }
}

testAdminAuth().catch(console.error);