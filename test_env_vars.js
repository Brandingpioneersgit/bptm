// Test script to verify environment variables are loaded correctly
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('===== ENVIRONMENT VARIABLES TEST =====');
console.log('Node.js environment:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_ADMIN_ACCESS_TOKEN:', process.env.VITE_ADMIN_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');

// Show first 10 chars of each value for verification
console.log('\nValues (first 10 chars):');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 
  process.env.VITE_SUPABASE_URL.substring(0, 10) + '...' : 'undefined');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 
  process.env.VITE_SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'undefined');
console.log('VITE_ADMIN_ACCESS_TOKEN:', process.env.VITE_ADMIN_ACCESS_TOKEN ? 
  process.env.VITE_ADMIN_ACCESS_TOKEN.substring(0, 10) + '...' : 'undefined');

// Test Supabase client creation
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_ACCESS_TOKEN = process.env.VITE_ADMIN_ACCESS_TOKEN;

console.log('\nTesting Supabase client creation:');

try {
  // Try with admin token first
  if (ADMIN_ACCESS_TOKEN) {
    console.log('Creating client with ADMIN_ACCESS_TOKEN...');
    const supabaseAdmin = createClient(SUPABASE_URL, ADMIN_ACCESS_TOKEN);
    console.log('✅ Supabase client created with admin token');
    
    // Test a simple query
    console.log('Testing query with admin token...');
    supabaseAdmin.from('unified_users').select('*').limit(1)
      .then(response => {
        if (response.error) {
          console.error('❌ Query failed with admin token:', response.error.message);
        } else {
          console.log('✅ Query succeeded with admin token');
          console.log(`Retrieved ${response.data.length} records`);
        }
      })
      .catch(error => {
        console.error('❌ Query failed with admin token:', error.message);
      });
  }
  
  // Try with anon key
  if (SUPABASE_ANON_KEY) {
    console.log('\nCreating client with SUPABASE_ANON_KEY...');
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client created with anon key');
    
    // Test a simple query
    console.log('Testing query with anon key...');
    supabaseAnon.from('unified_users').select('*').limit(1)
      .then(response => {
        if (response.error) {
          console.error('❌ Query failed with anon key:', response.error.message);
        } else {
          console.log('✅ Query succeeded with anon key');
          console.log(`Retrieved ${response.data.length} records`);
        }
      })
      .catch(error => {
        console.error('❌ Query failed with anon key:', error.message);
      });
  }
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error.message);
}