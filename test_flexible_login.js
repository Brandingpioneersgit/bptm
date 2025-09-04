import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Test script to verify the flexible login functionality
 */
async function testFlexibleLogin() {
  console.log('🔍 Testing flexible login with various input formats...');
  
  // Get Supabase credentials from .env
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_ADMIN_ACCESS_TOKEN;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    return;
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Test cases with various input formats
  const testCases = [
    // Exact first name
    { input: 'John', phone: '9876543210', expectedName: 'John SEO' },
    { input: 'Sarah', phone: '9876543211', expectedName: 'Sarah Ads' },
    { input: 'Admin', phone: '9876543225', expectedName: 'Admin Super' },
    
    // Lowercase first name
    { input: 'john', phone: '9876543210', expectedName: 'John SEO' },
    { input: 'sarah', phone: '9876543211', expectedName: 'Sarah Ads' },
    { input: 'admin', phone: '9876543225', expectedName: 'Admin Super' },
    
    // Full name
    { input: 'John SEO', phone: '9876543210', expectedName: 'John SEO' },
    { input: 'Sarah Ads', phone: '9876543211', expectedName: 'Sarah Ads' },
    { input: 'Admin Super', phone: '9876543225', expectedName: 'Admin Super' },
    
    // Lowercase full name
    { input: 'john seo', phone: '9876543210', expectedName: 'John SEO' },
    { input: 'sarah ads', phone: '9876543211', expectedName: 'Sarah Ads' },
    { input: 'admin super', phone: '9876543225', expectedName: 'Admin Super' },
    
    // Partial name
    { input: 'Jo', phone: '9876543210', expectedName: 'John SEO' },
    { input: 'Sar', phone: '9876543211', expectedName: 'Sarah Ads' },
    { input: 'Adm', phone: '9876543225', expectedName: 'Admin Super' }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testCase of testCases) {
    console.log(`\n🔄 Testing login with input: "${testCase.input}"...`);
    
    try {
      // Step 1: Search for users matching the input pattern
      console.log(`Step 1: Searching for users with name like "${testCase.input}%"...`);
      
      const { data: users, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testCase.input}%`)
        .eq('status', 'active');
        
      if (searchError) {
        console.error('❌ Search error:', searchError);
        failedTests++;
        continue;
      }
      
      console.log(`Found ${users?.length || 0} users matching "${testCase.input}%"`);
      
      if (!users || users.length === 0) {
        console.log('❌ No users found');
        failedTests++;
        continue;
      }
      
      // Step 2: Find matching user
      console.log('Step 2: Finding matching user...');
      
      // First try exact match (case-insensitive)
      let matchingUser = users.find(user => {
        const userFirstName = user.name.split(' ')[0].toLowerCase();
        const inputFirstName = testCase.input.split(' ')[0].toLowerCase();
        return userFirstName === inputFirstName;
      });
      
      // If no exact match, try to match with the first part of the name
      if (!matchingUser) {
        console.log('No exact match found, trying partial match...');
        matchingUser = users.find(user => {
          const userName = user.name.toLowerCase();
          const inputName = testCase.input.toLowerCase();
          return userName.startsWith(inputName);
        });
      }
      
      if (!matchingUser) {
        console.log('❌ No matching user found');
        failedTests++;
        continue;
      }
      
      console.log(`✅ Found user: ${matchingUser.name} (${matchingUser.role})`);
      
      // Step 3: Validate expected name
      console.log('Step 3: Validating expected name...');
      
      if (matchingUser.name !== testCase.expectedName) {
        console.log(`❌ Name mismatch: expected ${testCase.expectedName}, got ${matchingUser.name}`);
        failedTests++;
        continue;
      }
      
      console.log(`✅ Name matches: ${matchingUser.name}`);
      
      // Step 4: Validate phone number
      console.log('Step 4: Validating phone number...');
      
      const normalizePhone = (phone) => {
        return phone
          .replace(/^\+91-?/, '')
          .replace(/[\s\-\(\)]/g, '')
          .replace(/^0/, '');
      };
      
      const userPhone = normalizePhone(matchingUser.phone);
      const inputPhone = normalizePhone(testCase.phone);
      
      if (userPhone !== inputPhone) {
        console.log(`❌ Phone mismatch: expected ${inputPhone}, got ${userPhone}`);
        failedTests++;
        continue;
      }
      
      console.log(`✅ Phone matches: ${matchingUser.phone}`);
      console.log(`✅ Login test PASSED for "${testCase.input}"`);
      passedTests++;
      
    } catch (error) {
      console.error(`❌ Error testing login for "${testCase.input}":`, error);
      failedTests++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed`);
  
  if (failedTests === 0) {
    console.log('🎉 All login tests passed! Flexible login system is working correctly.');
  } else {
    console.log(`⚠️ ${failedTests} login tests failed. Some input formats may not work correctly.`);
  }
}

testFlexibleLogin().catch(console.error);