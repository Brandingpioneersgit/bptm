const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTables() {
  const tables = ['unified_users', 'users', 'employees', 'clients'];
  
  for (const table of tables) {
    try {
      console.log(`\nChecking table: ${table}`);
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`  Error: ${error.message}`);
      } else {
        console.log(`  Columns: ${Object.keys(data?.[0] || {}).join(', ')}`);
        console.log(`  Sample records: ${data?.length || 0}`);
        
        // Get total count
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        console.log(`  Total records: ${count || 0}`);
      }
    } catch (err) {
      console.log(`  Exception: ${err.message}`);
    }
  }
}

checkTables();