const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test database connection with provided environment variables
const DATABASE_URL = "postgresql://postgres.igwgryykglsetfvomhdj:BPtools@4321@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
const DIRECT_URL = "postgresql://postgres.igwgryykglsetfvomhdj:BPtools@4321@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";

// Create Supabase client using existing env vars
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testDatabaseConnection() {
  console.log('🔗 Testing database connection...');
  console.log('📊 Database URLs provided:');
  console.log('   Pooled:', DATABASE_URL.replace(/:[^:@]*@/, ':****@'));
  console.log('   Direct:', DIRECT_URL.replace(/:[^:@]*@/, ':****@'));
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('unified_users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log(`📊 Current user count: ${data || 0}`);
    
    // Test a simple query
    const { data: users, error: userError } = await supabase
      .from('unified_users')
      .select('name, role, status')
      .limit(3);
    
    if (userError) {
      console.log('❌ User query failed:', userError.message);
    } else {
      console.log('✅ Sample users query successful:');
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.name} - ${user.role} (${user.status})`);
      });
    }
    
    return true;
  } catch (err) {
    console.log('❌ Database connection error:', err.message);
    return false;
  }
}

testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database connection test completed successfully!');
      console.log('✅ Ready to proceed with remaining tasks.');
    } else {
      console.log('\n❌ Database connection test failed.');
      console.log('🔧 Please check your environment variables and database configuration.');
    }
  })
  .catch(console.error);