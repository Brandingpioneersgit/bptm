import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  // Get Supabase credentials from .env
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.VITE_ADMIN_ACCESS_TOKEN;
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
  console.log('Service Key:', supabaseServiceKey ? '✅ Present' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    return;
  }
  
  try {
    // Create Supabase client with anon key
    console.log('\n🔄 Creating Supabase client with anon key...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test connection by querying a table
    console.log('🔄 Testing connection by querying unified_users table...');
    const { data: users, error } = await supabase
      .from('unified_users')
      .select('id, name, role')
      .limit(5);
      
    if (error) {
      console.error('❌ Connection test failed with anon key:', error);
    } else {
      console.log(`✅ Connection successful! Found ${users.length} users:`);
      users.forEach(user => console.log(`- ${user.name} (${user.role})`));
    }
    
    // Create Supabase client with service role key
    console.log('\n🔄 Creating Supabase client with service role key...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test connection with service role key
    console.log('🔄 Testing connection by querying unified_users table with service role...');
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('unified_users')
      .select('id, name, role')
      .limit(5);
      
    if (adminError) {
      console.error('❌ Connection test failed with service role key:', adminError);
    } else {
      console.log(`✅ Service role connection successful! Found ${adminUsers.length} users:`);
      adminUsers.forEach(user => console.log(`- ${user.name} (${user.role})`));
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
        
        // Check first name extraction
        const firstName = user.name.split(' ')[0].toLowerCase();
        console.log(`  First name extraction: "${user.name}" → "${firstName}"`);
        console.log(`  Comparison with "john": ${firstName === 'john' ? '✅ Match' : '❌ No match'}`);
      });
    }
    
    console.log('\n🔄 Testing authentication with exact first name match...');
    // Find users with exact first name match
    const testFirstName = 'John';
    const { data: exactUsers } = await supabase
      .from('unified_users')
      .select('*')
      .ilike('name', `${testFirstName}%`)
      .eq('status', 'active');
      
    if (exactUsers && exactUsers.length > 0) {
      const matchingUser = exactUsers.find(user => {
        const userFirstName = user.name.split(' ')[0].toLowerCase();
        return userFirstName === testFirstName.toLowerCase();
      });
      
      if (matchingUser) {
        console.log(`✅ Found exact match for "${testFirstName}": ${matchingUser.name}`);
      } else {
        console.log(`❌ No exact match found for "${testFirstName}"`);
      }
    } else {
      console.log(`❌ No users found matching "${testFirstName}%"`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error testing Supabase connection:', error);
  }
}

testSupabaseConnection().catch(console.error);