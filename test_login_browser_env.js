// Test script to simulate the login process in the browser environment
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Simulate browser environment variables
const importMetaEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  VITE_ADMIN_ACCESS_TOKEN: process.env.VITE_ADMIN_ACCESS_TOKEN
};

console.log('===== BROWSER LOGIN SIMULATION TEST =====');
console.log('Environment variables:');
console.log('VITE_SUPABASE_URL:', importMetaEnv.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', importMetaEnv.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_ADMIN_ACCESS_TOKEN:', importMetaEnv.VITE_ADMIN_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');

// Create Supabase client with admin token (simulating our updated configuration)
const supabaseUrl = importMetaEnv.VITE_SUPABASE_URL;
const authKey = importMetaEnv.VITE_ADMIN_ACCESS_TOKEN || importMetaEnv.VITE_SUPABASE_ANON_KEY;

console.log('\nCreating Supabase client with:', authKey === importMetaEnv.VITE_ADMIN_ACCESS_TOKEN ? 'ADMIN_ACCESS_TOKEN' : 'SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, authKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Simulate the authenticateUser function from authApi.js
async function authenticateUser(firstName, phoneNumber) {
  try {
    console.log('🔐 Authenticating user:', { firstName, phoneNumber });
    
    if (!firstName || !phoneNumber) {
      return {
        success: false,
        error: 'First name and phone number are required'
      };
    }

    // Normalize inputs
    const normalizedFirstName = firstName.trim();
    const normalizedPhone = phoneNumber.trim();
    
    console.log('🔐 Normalized inputs:', { firstName: normalizedFirstName, phone: normalizedPhone });

    // First, get all users with names starting with the first name (case-insensitive)
    console.log(`🔍 Executing query: .from('unified_users').select('*').ilike('name', '${normalizedFirstName}%').eq('status', 'active')`);
    
    try {
      const { data: users, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${normalizedFirstName}%`) // Case-insensitive search starting with first name
        .eq('status', 'active');

      if (searchError) {
        console.error('❌ Database search error:', searchError);
        return {
          success: false,
          error: 'Database error occurred during authentication'
        };
      }

      console.log(`🔍 Query returned ${users?.length || 0} users`);
      if (users && users.length > 0) {
        console.log('🔍 Users found:', users.map(u => ({ id: u.id, name: u.name, role: u.role })));
      }

      if (!users || users.length === 0) {
        return {
          success: false,
          error: 'No user found with that name'
        };
      }

      // Find exact match for first name (case-insensitive)
      let matchedUser = users.find(user => 
        user.name.toLowerCase().startsWith(normalizedFirstName.toLowerCase())
      );

      // If no exact match, try partial match
      if (!matchedUser && users.length > 0) {
        matchedUser = users[0]; // Take the first user as a fallback
      }

      if (!matchedUser) {
        return {
          success: false,
          error: 'No matching user found'
        };
      }

      console.log('✅ User authenticated successfully:', { 
        id: matchedUser.id,
        name: matchedUser.name,
        role: matchedUser.role
      });

      return {
        success: true,
        user: matchedUser,
        token: 'simulated-session-token'
      };
    } catch (queryError) {
      console.error('❌ Error executing query:', queryError);
      return {
        success: false,
        error: 'Database error occurred during authentication'
      };
    }
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during authentication'
    };
  }
}

// Test with different users
async function runTests() {
  const testCases = [
    { firstName: 'John', phoneNumber: '+91-9876543210' },
    { firstName: 'Admin', phoneNumber: '+91-9876543225' },
    { firstName: 'Sarah', phoneNumber: '+91-9876543211' }
  ];

  for (const testCase of testCases) {
    console.log('\n==================================');
    console.log(`Testing login for: ${testCase.firstName} / ${testCase.phoneNumber}`);
    const result = await authenticateUser(testCase.firstName, testCase.phoneNumber);
    console.log('Login result:', result);
  }
}

runTests();