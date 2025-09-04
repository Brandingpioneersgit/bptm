const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_ADMIN_ACCESS_TOKEN;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
  console.log('Inspecting unified_users table schema...');
  
  try {
    const { data, error } = await supabase
      .rpc('get_table_definition', { table_name: 'unified_users' });
    
    if (error) {
      console.error('Error fetching schema:', error);
      return;
    }
    
    console.log('Table Schema:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to inspect schema:', err.message);
  }
}

inspectSchema().catch(console.error);