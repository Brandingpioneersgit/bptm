import { createClient } from '@supabase/supabase-js';

// Get environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ADMIN_ACCESS_TOKEN = import.meta.env.VITE_ADMIN_ACCESS_TOKEN;

// Log environment variables for debugging
console.log('adminSupabase.js - Environment variables:');
console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Present' : '❌ Missing');
console.log('ADMIN_ACCESS_TOKEN:', ADMIN_ACCESS_TOKEN ? '✅ Present' : '❌ Missing');

// Create a Supabase client with admin token
let adminSupabase = null;

try {
  if (SUPABASE_URL && ADMIN_ACCESS_TOKEN) {
    console.log('Creating admin Supabase client...');
    adminSupabase = createClient(SUPABASE_URL, ADMIN_ACCESS_TOKEN, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    });
    console.log('Admin Supabase client created successfully');
  } else {
    console.error('Missing Supabase credentials for admin client');
  }
} catch (error) {
  console.error('Error creating admin Supabase client:', error);
}

// Test the connection
if (adminSupabase) {
  adminSupabase
    .from('unified_users')
    .select('count')
    .then(({ count, error }) => {
      if (error) {
        console.error('Admin Supabase connection test failed:', error);
      } else {
        console.log('Admin Supabase connection test successful');
      }
    })
    .catch(error => {
      console.error('Admin Supabase connection test error:', error);
    });
}

export { adminSupabase };
export default adminSupabase;