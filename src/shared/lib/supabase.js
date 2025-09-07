import { createClient } from '@supabase/supabase-js';

// Singleton pattern to ensure only one Supabase client instance
let supabaseInstance = null;
let adminSupabaseInstance = null;

// Get environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_ACCESS_TOKEN = import.meta.env.VITE_ADMIN_ACCESS_TOKEN;

// Log environment variables for debugging (only once)
if (!supabaseInstance) {
  console.log('🔧 Supabase Client Initialization:', {
    SUPABASE_URL: SUPABASE_URL ? '✅ Set' : '❌ Missing',
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    ADMIN_ACCESS_TOKEN: ADMIN_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'
  });
}

// Check if we're using placeholder credentials
const isPlaceholderConfig = 
  !SUPABASE_URL || 
  (!SUPABASE_ANON_KEY && !ADMIN_ACCESS_TOKEN) || 
  SUPABASE_URL.includes('placeholder') || 
  (SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.includes('placeholder') && 
   (!ADMIN_ACCESS_TOKEN || ADMIN_ACCESS_TOKEN.includes('placeholder')));

// Create regular Supabase client (singleton)
function createSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  if (isPlaceholderConfig || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('🔧 Running in LOCAL MODE - Supabase credentials not configured');
    return null;
  }

  try {
    console.log('🔑 Creating Supabase client with ANON key');
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
    console.log('✅ Supabase client created successfully');
    return supabaseInstance;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    return null;
  }
}

// Create admin Supabase client (singleton)
function createAdminSupabaseClient() {
  if (adminSupabaseInstance) {
    return adminSupabaseInstance;
  }

  if (!SUPABASE_URL || !ADMIN_ACCESS_TOKEN) {
    console.log('🔧 Admin Supabase client not available - missing credentials');
    return null;
  }

  try {
    console.log('🔑 Creating Admin Supabase client');
    adminSupabaseInstance = createClient(SUPABASE_URL, ADMIN_ACCESS_TOKEN, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-client-info': 'bptm-dashboard-admin'
        }
      }
    });
    console.log('✅ Admin Supabase client created successfully');
    return adminSupabaseInstance;
  } catch (error) {
    console.error('❌ Failed to create Admin Supabase client:', error);
    return null;
  }
}

// Initialize the default client
const supabase = createSupabaseClient();
const adminSupabase = createAdminSupabaseClient();

// Export both clients
export { supabase, adminSupabase, createSupabaseClient, createAdminSupabaseClient };
export default supabase;