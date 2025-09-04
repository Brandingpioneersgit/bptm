import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Test script to verify the login functionality with the same configuration as the browser
 */
async function testLoginBrowser() {
  console.log('🔍 Testing login with browser configuration...');
  
  // Get Supabase credentials from .env
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const adminAccessToken = process.env.VITE_ADMIN_ACCESS_TOKEN;
  
  console.log('Environment variables:');
  console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('- VITE_ADMIN_ACCESS_TOKEN:', adminAccessToken ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl) {
    console.error('❌ Missing Supabase URL in .env file');
    return;
  }
  
  // Create Supabase client with the same logic as the browser
  const authKey = adminAccessToken || supabaseAnonKey;
  console.log('🔑 Using auth key type:', adminAccessToken ? 'ADMIN_ACCESS_TOKEN' : 'SUPABASE_ANON_KEY');
  
  if (!authKey) {
    console.error('❌ Missing authentication key in .env file');
    return;
  }
  
  const supabase = createClient(supabaseUrl, authKey);
  
  // Test users
  const testUsers = [
    { name: 'John', phone: '9876543210' },
    { name: 'john', phone: '9876543210' },
    { name: 'John SEO', phone: '9876543210' },
    { name: 'Admin', phone: '9876543225' },
    { name: 'admin', phone: '9876543225' },
    { name: 'Sarah', phone: '9876543211' }
  ];
  
  for (const user of testUsers) {
    console.log(`\n🔄 Testing login for: ${user.name}`);
    
    try {
      // Step 1: Search for users matching the input pattern
      console.log(`Step 1: Searching for users with name like "${user.name}%"...`);
      
      const { data: users, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${user.name}%`)
        .eq('status', 'active');
        
      if (searchError) {
        console.error('❌ Search error:', searchError);
        continue;
      }
      
      console.log(`Found ${users?.length || 0} users matching "${user.name}%"`);
      
      if (!users || users.length === 0) {
        console.log('❌ No users found');
        continue;
      }
      
      // Log all found users for debugging
      console.log('Found users:', users.map(u => ({ id: u.id, name: u.name, phone: u.phone, role: u.role })));
      
      // Step 2: Find matching user (exact match or partial match)
      console.log('Step 2: Finding matching user...');
      
      // First try exact match (case-insensitive)
      let matchingUser = users.find(u => {
        const userFirstName = u.name.split(' ')[0].toLowerCase();
        const inputFirstName = user.name.split(' ')[0].toLowerCase();
        const isMatch = userFirstName === inputFirstName;
        console.log(`Comparing '${userFirstName}' with '${inputFirstName}' = ${isMatch}`);
        return isMatch;
      });
      
      // If no exact match, try to match with the first part of the name
      if (!matchingUser) {
        console.log('No exact match found, trying partial match...');
        matchingUser = users.find(u => {
          const userName = u.name.toLowerCase();
          const inputName = user.name.toLowerCase();
          const isPartialMatch = userName.startsWith(inputName);
          console.log(`Partial comparing '${userName}' with '${inputName}' = ${isPartialMatch}`);
          return isPartialMatch;
        });
      }
      
      if (!matchingUser) {
        console.log('❌ No matching user found');
        continue;
      }
      
      console.log(`✅ Found user: ${matchingUser.name} (${matchingUser.role})`);
      
      // Step 3: Validate phone number
      console.log('Step 3: Validating phone number...');
      
      const normalizePhone = (phone) => {
        return phone
          .replace(/^\+91-?/, '')
          .replace(/[\s\-\(\)]/g, '')
          .replace(/^0/, '');
      };
      
      const userPhone = normalizePhone(matchingUser.phone);
      const inputPhone = normalizePhone(user.phone);
      
      console.log('Phone comparison:', { userPhone, inputPhone, match: userPhone === inputPhone });
      
      if (userPhone !== inputPhone) {
        console.log(`❌ Phone mismatch: expected ${inputPhone}, got ${userPhone}`);
        continue;
      }
      
      console.log(`✅ Phone matches: ${matchingUser.phone}`);
      console.log(`✅ Login test PASSED for "${user.name}"`);
      
    } catch (error) {
      console.error(`❌ Error testing login for "${user.name}":`, error);
    }
  }
}

testLoginBrowser().catch(console.error);