const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSessionSchema() {
  console.log('🔍 Testing user_sessions table schema...');
  
  try {
    // Test 1: Try session_token field
    console.log('\n1️⃣ Testing session_token field...');
    const testToken = await supabase
      .from('user_sessions')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        session_token: 'test_token_123',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select()
      .single();
    
    if (testToken.error) {
      console.log('❌ session_token failed:', testToken.error.message);
    } else {
      console.log('✅ session_token works!');
      // Clean up
      await supabase.from('user_sessions').delete().eq('session_token', 'test_token_123');
    }
    
    // Test 2: Try session_id field
    console.log('\n2️⃣ Testing session_id field...');
    const testId = await supabase
      .from('user_sessions')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        session_id: 'test_id_456',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select()
      .single();
    
    if (testId.error) {
      console.log('❌ session_id failed:', testId.error.message);
    } else {
      console.log('✅ session_id works!');
      // Clean up
      await supabase.from('user_sessions').delete().eq('session_id', 'test_id_456');
    }
    
    // Test 3: Check what fields are actually required
    console.log('\n3️⃣ Testing minimal required fields...');
    const minimal = await supabase
      .from('user_sessions')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000'
      })
      .select()
      .single();
    
    if (minimal.error) {
      console.log('❌ Minimal insert failed:', minimal.error.message);
      console.log('Details:', minimal.error.details);
    } else {
      console.log('✅ Minimal insert succeeded!');
      console.log('Created record:', minimal.data);
      // Clean up
      await supabase.from('user_sessions').delete().eq('id', minimal.data.id);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testSessionSchema().then(() => {
  console.log('\n🏁 Schema test completed');
}).catch(error => {
  console.error('💥 Test execution failed:', error);
});