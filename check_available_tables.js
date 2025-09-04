import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAvailableTables() {
  try {
    console.log('🔍 Checking available tables...');
    
    // Try checking some common tables
    const tablesToCheck = [
      'client_onboarding',
      'client_feedback', 
      'employees',
      'clients',
      'users'
    ];
    
    console.log('\n📋 Checking common tables:');
    for (const table of tablesToCheck) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (tableError) {
          console.log(`❌ ${table}: ${tableError.message}`);
        } else {
          console.log(`✅ ${table}: exists (${tableData?.length || 0} records checked)`);
          if (tableData && tableData.length > 0) {
            console.log(`   Columns: ${Object.keys(tableData[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

// Run the check
checkAvailableTables();