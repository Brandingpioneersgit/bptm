const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTables() {
  console.log('🔍 Checking database tables...');
  
  const tables = ['employees', 'unified_users', 'user_sessions'];
  
  for (const table of tables) {
    try {
      const {data, error} = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK - ${data?.length || 0} records found`);
        if (data && data.length > 0) {
          console.log(`   Sample record keys: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch(e) {
      console.log(`💥 ${table}: EXCEPTION - ${e.message}`);
    }
  }
  
  // Check employees table specifically
  console.log('\n📋 Checking employees table in detail...');
  try {
    const {data: employees, error} = await supabase
      .from('employees')
      .select('id, name, phone, role, status')
      .limit(3);
    
    if (error) {
      console.log('❌ Employees query failed:', error.message);
    } else {
      console.log(`✅ Found ${employees?.length || 0} employees`);
      employees?.forEach((emp, i) => {
        console.log(`   ${i+1}. ${emp.name} - ${emp.role} (${emp.status})`);
      });
    }
  } catch(e) {
    console.log('💥 Employees check failed:', e.message);
  }
}

checkTables().then(() => {
  console.log('\n🏁 Database check completed');
}).catch(error => {
  console.error('💥 Check failed:', error);
});