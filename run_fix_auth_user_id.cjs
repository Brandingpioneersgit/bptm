const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function fixAuthUserId() {
  try {
    console.log('🔧 Adding auth_user_id column to unified_users table...');
    
    // Add the auth_user_id column
    const { data: addColumn, error: addError } = await supabase.rpc('query', {
      query_text: 'ALTER TABLE public.unified_users ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;'
    });
    
    if (addError) {
      console.log('❌ Error adding column:', addError.message);
    } else {
      console.log('✅ auth_user_id column added successfully');
    }
    
    // Create index
    const { data: indexResult, error: indexError } = await supabase.rpc('query', {
      query_text: 'CREATE INDEX IF NOT EXISTS idx_unified_users_auth_user_id ON public.unified_users(auth_user_id);'
    });
    
    if (indexError) {
      console.log('❌ Error creating index:', indexError.message);
    } else {
      console.log('✅ Index created successfully');
    }
    
    // Verify the column exists
    console.log('\n🔍 Verifying auth_user_id column...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('unified_users')
      .select('auth_user_id')
      .limit(1);
    
    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ auth_user_id column is now accessible!');
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

fixAuthUserId();