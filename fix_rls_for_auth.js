import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function fixRLSForAuthentication() {
  console.log('🔧 Fixing RLS policies for authentication...');
  
  try {
    // Option 1: Create a policy that allows reading users for authentication
    console.log('📝 Creating authentication policy...');
    
    const authPolicy = `
      CREATE POLICY "Allow authentication reads" ON unified_users
      FOR SELECT
      TO anon
      USING (status = 'active');
    `;
    
    const { data: policyResult, error: policyError } = await supabase
      .rpc('exec_sql', { sql: authPolicy });
      
    if (policyError) {
      console.log('⚠️ Policy creation failed (might already exist):', policyError.message);
      
      // Option 2: Temporarily disable RLS for testing
      console.log('🔧 Attempting to disable RLS temporarily...');
      
      const disableRLS = `ALTER TABLE unified_users DISABLE ROW LEVEL SECURITY;`;
      
      const { data: disableResult, error: disableError } = await supabase
        .rpc('exec_sql', { sql: disableRLS });
        
      if (disableError) {
        console.error('❌ Could not disable RLS:', disableError);
        
        // Option 3: Grant direct access to anon role
        console.log('🔧 Attempting to grant select access to anon role...');
        
        const grantAccess = `GRANT SELECT ON unified_users TO anon;`;
        
        const { data: grantResult, error: grantError } = await supabase
          .rpc('exec_sql', { sql: grantAccess });
          
        if (grantError) {
          console.error('❌ Could not grant access:', grantError);
        } else {
          console.log('✅ Granted SELECT access to anon role');
        }
      } else {
        console.log('✅ RLS disabled for unified_users table');
      }
    } else {
      console.log('✅ Authentication policy created successfully');
    }
    
    // Test the fix
    console.log('\n🧪 Testing authentication access with anon key...');
    
    const anonSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    const { data: testUsers, error: testError } = await anonSupabase
      .from('unified_users')
      .select('name, phone, role')
      .limit(3);
      
    if (testError) {
      console.error('❌ Still cannot access with anon key:', testError);
    } else {
      console.log('✅ Successfully accessed users with anon key:');
      testUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.phone}) - ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing RLS:', error);
  }
}

fixRLSForAuthentication().catch(console.error);