import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function testAdminToken() {
  console.log('🔍 Testing Supabase connection with admin token...');
  
  // Get Supabase credentials from .env
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const adminToken = process.env.VITE_ADMIN_ACCESS_TOKEN;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Admin Token:', adminToken ? '✅ Present (first 10 chars: ' + adminToken.substring(0, 10) + '...)' : '❌ Missing');
  
  if (!supabaseUrl || !adminToken) {
    console.error('❌ Missing Supabase credentials in .env file');
    return;
  }
  
  try {
    // Create Supabase client with admin token
    console.log('\n🔄 Creating Supabase client with admin token...');
    const supabase = createClient(supabaseUrl, adminToken);
    
    // Test connection by querying a table
    console.log('🔄 Testing connection by querying unified_users table...');
    const { data: users, error } = await supabase
      .from('unified_users')
      .select('id, name, role')
      .limit(5);
      
    if (error) {
      console.error('❌ Connection test failed with admin token:', error);
    } else {
      console.log(`✅ Connection successful! Found ${users.length} users:`);
      users.forEach(user => console.log(`- ${user.name} (${user.role})`));
    }
    
    // Test authentication with a known user
    console.log('\n🔄 Testing authentication with John SEO...');
    const { data: johnUsers, error: johnError } = await supabase
      .from('unified_users')
      .select('*')
      .ilike('name', 'John%')
      .eq('status', 'active');
      
    if (johnError) {
      console.error('❌ John SEO query failed:', johnError);
    } else if (!johnUsers || johnUsers.length === 0) {
      console.log('❌ No users found matching "John%"');
    } else {
      console.log(`✅ Found ${johnUsers.length} users matching "John%":`);
      johnUsers.forEach(user => {
        console.log(`- ${user.name} (${user.role}) - ${user.phone}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error testing Supabase connection:', error);
  }
}

testAdminToken().catch(console.error);