require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminUser() {
  console.log('🔍 Checking for Admin Super user...');
  
  // Check exact name match
  const { data: exactMatch, error: exactError } = await supabase
    .from('unified_users')
    .select('*')
    .eq('name', 'Admin Super')
    .eq('status', 'active');
    
  console.log('Exact match for "Admin Super":', exactMatch?.length || 0, 'users');
  if (exactMatch?.length > 0) {
    console.log('Found user:', exactMatch[0]);
  }
  
  // Check pattern match like the auth logic does
  const { data: patternMatch, error: patternError } = await supabase
    .from('unified_users')
    .select('*')
    .ilike('name', 'Admin%')
    .eq('status', 'active');
    
  console.log('Pattern match for "Admin%":', patternMatch?.length || 0, 'users');
  if (patternMatch?.length > 0) {
    patternMatch.forEach(user => {
      console.log('- Found user:', user.name, 'Phone:', user.phone, 'Role:', user.role);
    });
  }
  
  // Test the exact authentication logic
  console.log('\n🧪 Testing authentication logic...');
  const firstName = 'Admin Super';
  const phone = '9876543225';
  
  const { data: users, error: searchError } = await supabase
    .from('unified_users')
    .select('*')
    .ilike('name', `${firstName}%`)
    .eq('status', 'active');
    
  console.log(`Query: .ilike('name', '${firstName}%')`);
  console.log('Results:', users?.length || 0, 'users');
  
  if (users && users.length > 0) {
    console.log('\nTrying to find exact match...');
    const matchingUser = users.find(user => {
      const userFirstName = user.name.split(' ')[0].toLowerCase();
      const inputFirstName = firstName.toLowerCase();
      const isMatch = userFirstName === inputFirstName;
      console.log(`Comparing '${userFirstName}' with '${inputFirstName}' = ${isMatch}`);
      return isMatch;
    });
    
    if (matchingUser) {
      console.log('✅ Found matching user:', matchingUser.name);
    } else {
      console.log('❌ No exact match found');
    }
  }
}

checkAdminUser().catch(console.error);