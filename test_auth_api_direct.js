import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Test the authentication API directly
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAuthenticationAPI() {
  console.log('🔐 Testing Authentication API directly...');
  
  // Test credentials from the request
  const testCases = [
    {
      name: 'Marketing Manager',
      firstName: 'Marketing',
      phone: '9876543210'
    },
    {
      name: 'Super Admin', 
      firstName: 'Super',
      phone: '9876543211'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing ${testCase.name} login...`);
    console.log(`   Input: firstName="${testCase.firstName}", phone="${testCase.phone}"`);
    
    try {
      // Simulate the authentication logic from authApi.js
      const normalizedFirstName = testCase.firstName.trim();
      const normalizedPhone = testCase.phone.trim();
      
      console.log(`   Normalized: firstName="${normalizedFirstName}", phone="${normalizedPhone}"`);
      
      // Search for users with names containing the first name (case-insensitive)
      console.log(`   Query: .from('unified_users').select('*').ilike('name', '%${normalizedFirstName}%').eq('status', 'active')`);
      
      const { data: users, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `%${normalizedFirstName}%`)
        .eq('status', 'active');

      if (searchError) {
        console.error('   ❌ Database search error:', searchError);
        continue;
      }
      
      console.log(`   📊 Query returned ${users?.length || 0} users`);
      if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`     - ${user.name} (${user.phone}) - ${user.role}`);
        });
      }

      if (!users || users.length === 0) {
        console.log(`   ❌ No users found matching pattern: ${normalizedFirstName}`);
        continue;
      }

      // Find exact match by extracting first name from full name
      console.log('   🔍 Looking for exact first name match...');
      
      let matchingUser = users.find(user => {
        const userFirstName = user.name.split(' ')[0].toLowerCase();
        const inputFirstName = normalizedFirstName.toLowerCase();
        const isMatch = userFirstName === inputFirstName;
        console.log(`     Comparing '${userFirstName}' with '${inputFirstName}' = ${isMatch}`);
        return isMatch;
      });
      
      if (!matchingUser) {
        console.log('   🔍 No exact match found, trying partial match...');
        matchingUser = users.find(user => {
          const userName = user.name.toLowerCase();
          const inputName = normalizedFirstName.toLowerCase();
          const isPartialMatch = userName.startsWith(inputName);
          console.log(`     Partial comparing '${userName}' with '${inputName}' = ${isPartialMatch}`);
          return isPartialMatch;
        });
      }

      if (!matchingUser) {
        console.log('   ❌ No matching user found');
        continue;
      }
      
      console.log(`   ✅ Found matching user: ${matchingUser.name}`);

      // Validate phone number
      const userPhone = normalizePhoneNumber(matchingUser.phone);
      const inputPhone = normalizePhoneNumber(normalizedPhone);
      
      console.log(`   📞 Phone validation:`, { 
        original: { user: matchingUser.phone, input: normalizedPhone },
        normalized: { user: userPhone, input: inputPhone },
        match: userPhone === inputPhone
      });

      if (userPhone !== inputPhone) {
        console.log(`   ❌ Phone number mismatch: expected ${userPhone}, provided ${inputPhone}`);
        continue;
      }
      
      console.log(`   ✅ Phone number validated successfully`);
      console.log(`   🎉 Authentication would succeed for ${matchingUser.name}!`);
      
    } catch (error) {
      console.error(`   ❌ Error testing ${testCase.name}:`, error);
    }
  }
}

// Normalize phone number for comparison (from authApi.js)
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  
  return phone
    .replace(/^\+91-?/, '') // Remove +91 country code
    .replace(/[\s\-\(\)]/g, '') // Remove spaces, dashes, parentheses
    .replace(/^0/, ''); // Remove leading zero if present
}

testAuthenticationAPI().catch(console.error);