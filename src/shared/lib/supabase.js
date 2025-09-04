import { createClient } from '@supabase/supabase-js';

// Log all environment variables for debugging
console.log('Environment variables in browser:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
  VITE_ADMIN_ACCESS_TOKEN: import.meta.env.VITE_ADMIN_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_ACCESS_TOKEN = import.meta.env.VITE_ADMIN_ACCESS_TOKEN;

// Log the actual values (first 10 chars only for security)
console.log('Auth keys (first 10 chars):', {
  SUPABASE_URL: SUPABASE_URL ? SUPABASE_URL.substring(0, 10) + '...' : 'undefined',
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 10) + '...' : 'undefined',
  ADMIN_ACCESS_TOKEN: ADMIN_ACCESS_TOKEN ? ADMIN_ACCESS_TOKEN.substring(0, 10) + '...' : 'undefined'
});

// Check if we're using placeholder credentials
const isPlaceholderConfig = 
  !SUPABASE_URL || 
  (!SUPABASE_ANON_KEY && !ADMIN_ACCESS_TOKEN) || 
  SUPABASE_URL.includes('placeholder') || 
  (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.includes('placeholder') && 
   (!ADMIN_ACCESS_TOKEN || ADMIN_ACCESS_TOKEN.includes('placeholder')));

console.log('🔍 Placeholder config check:', { isPlaceholderConfig });

let supabase = null;

if (!isPlaceholderConfig && SUPABASE_URL) {
  try {
    // Prefer admin token for authentication to bypass RLS policies
    const authKey = ADMIN_ACCESS_TOKEN || SUPABASE_ANON_KEY;
    console.log('🔑 Using auth key type:', ADMIN_ACCESS_TOKEN ? 'ADMIN_ACCESS_TOKEN' : 'SUPABASE_ANON_KEY');
    console.log('🔑 Auth key starts with:', authKey ? authKey.substring(0, 10) + '...' : 'undefined');
    
    if (!authKey) {
      console.error('❌ No valid authentication key available!');
      throw new Error('No valid authentication key available');
    }
    
    supabase = createClient(SUPABASE_URL, authKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'bptm-dashboard'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    supabase = null;
  }
} else {
  console.log('🔧 Running in LOCAL MODE - Supabase credentials not configured');
}

export { supabase };
export default supabase;