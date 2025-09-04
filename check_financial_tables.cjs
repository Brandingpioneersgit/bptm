const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinancialTables() {
  try {
    const tables = ['financial_metrics', 'financial_transactions', 'client_accounts', 'expense_categories'];
    
    console.log('Checking financial tables in Supabase...');
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}': NOT EXISTS (${error.message})`);
        } else {
          console.log(`✅ Table '${table}': EXISTS (${data.length} records found)`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ERROR (${err.message})`);
      }
    }
    
  } catch (error) {
    console.error('Error checking tables:', error.message);
  }
}

checkFinancialTables();