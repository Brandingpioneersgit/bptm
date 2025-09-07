// Import the centralized admin client to avoid multiple instances
import { adminSupabase } from './supabase';

// Re-export for backward compatibility
console.log('📦 Using centralized admin Supabase client');

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