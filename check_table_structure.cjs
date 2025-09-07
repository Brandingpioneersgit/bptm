const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking database structure...');
  
  // Check if unified_users table exists
  try {
    const { data, error } = await supabase
      .from('unified_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ unified_users table error:', error.message);
      if (error.code === '42P01') {
        console.log('💡 The unified_users table does not exist!');
        
        // Check what tables do exist
        console.log('\n🔍 Checking available tables...');
        const tables = ['users', 'employees', 'user_accounts', 'profiles'];
        
        for (const table of tables) {
          try {
            const { data: tableData, error: tableError } = await supabase
              .from(table)
              .select('*')
              .limit(1);
            
            if (tableError) {
              console.log(`❌ ${table}: ${tableError.message}`);
            } else {
              console.log(`✅ ${table}: exists`);
              if (tableData && tableData.length > 0) {
                console.log(`   Sample columns:`, Object.keys(tableData[0]).join(', '));
              }
            }
          } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
          }
        }
        
        return;
      }
    } else {
      console.log('✅ unified_users table exists');
      if (data && data.length > 0) {
        console.log('   Columns:', Object.keys(data[0]).join(', '));
      } else {
        console.log('   Table is empty');
      }
    }
  } catch (err) {
    console.log('❌ Database connection error:', err.message);
  }
  
  // Check current user count
  try {
    const { count, error } = await supabase
      .from('unified_users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Count error:', error.message);
    } else {
      console.log(`📊 Current user count: ${count}`);
    }
  } catch (err) {
    console.log('❌ Count check error:', err.message);
  }
  
  // List existing users if any
  try {
    const { data: existingUsers, error } = await supabase
      .from('unified_users')
      .select('name, phone, role, user_category, status')
      .order('name');
    
    if (error) {
      console.log('❌ User list error:', error.message);
    } else if (existingUsers && existingUsers.length > 0) {
      console.log('\n👥 Existing users:');
      existingUsers.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name} (${user.phone}) - ${user.role} [${user.user_category}] - ${user.status}`);
      });
    } else {
      console.log('\n👥 No users found in unified_users table');
    }
  } catch (err) {
    console.log('❌ User listing error:', err.message);
  }
}

checkTableStructure().catch(console.error);