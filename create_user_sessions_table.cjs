const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function createUserSessionsTable() {
  console.log('🔧 Creating user_sessions table...');
  
  try {
    // Drop existing table if it exists
    const dropResult = await supabase
      .from('user_sessions')
      .delete()
      .neq('id', 'dummy');
    
    console.log('Cleared existing sessions:', dropResult.error ? dropResult.error.message : 'Success');
    
    // Test insert to see current schema
    const testInsert = await supabase
      .from('user_sessions')
      .insert({
        session_id: 'test_session_123',
        user_id: 'test_user',
        user_type: 'employee',
        user_name: 'Test User',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select()
      .single();
    
    if (testInsert.error) {
      console.log('❌ Insert failed:', testInsert.error.message);
      console.log('Details:', testInsert.error.details);
      
      // Try with different field names
      console.log('\n🔄 Trying alternative field names...');
      const altInsert = await supabase
        .from('user_sessions')
        .insert({
          session_token: 'test_session_456',
          user_id: 'test_user',
          user_type: 'employee',
          user_name: 'Test User',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_active: true
        })
        .select()
        .single();
      
      if (altInsert.error) {
        console.log('❌ Alternative insert also failed:', altInsert.error.message);
      } else {
        console.log('✅ Alternative insert succeeded! Table uses session_token field.');
        // Clean up test data
        await supabase.from('user_sessions').delete().eq('session_token', 'test_session_456');
      }
    } else {
      console.log('✅ Insert succeeded! Table uses session_id field.');
      // Clean up test data
      await supabase.from('user_sessions').delete().eq('session_id', 'test_session_123');
    }
    
    // Check table structure by querying empty result
    const structureCheck = await supabase
      .from('user_sessions')
      .select('*')
      .limit(0);
    
    console.log('\n📋 Table structure check:');
    console.log('Error:', structureCheck.error);
    console.log('Status:', structureCheck.status);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createUserSessionsTable().then(() => {
  console.log('\n🏁 Table creation test completed');
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});