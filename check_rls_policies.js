import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_ADMIN_ACCESS_TOKEN;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkRLSPolicies() {
  try {
    // Test direct insert with service role
    console.log('\n🧪 Testing direct insert with service role...');
    const testUser = {
      user_id: 'test-' + Date.now(),
      name: 'Test Employee',
      email: 'test' + Date.now() + '@bptm.com',
      password_hash: '$2b$10$test.hash.value',
      role: 'SEO',
      user_category: 'employee',
      department: 'Marketing',
      status: 'active'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('unified_users')
      .insert(testUser)
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Insert successful:', insertData);
      
      // Clean up test user
      await supabase
        .from('unified_users')
        .delete()
        .eq('user_id', testUser.user_id);
      console.log('🧹 Test user cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRLSPolicies();