import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://igwgryykglsetfvomhdj.supabase.co';
const supabaseKey = 'sb_publishable_SDqrksN-DTMdHP01p3z6wQ_OlX5bJ3o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDatabase() {
  try {
    console.log('🔍 Inspecting Supabase database structure...');
    
    // Try to get schema information using a simple query
    console.log('\n📋 Checking available tables...');
    
    const commonTables = [
      'unified_users',
      'clients',
      'submissions', 
      'employees',
      'performance_metrics',
      'monthly_rows',
      'users',
      'entities',
      'user_entity_mappings',
      'attendance_daily',
      'login_tracking',
      'user_sessions'
    ];
    
    const existingTables = [];
    
    for (const table of commonTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error) {
          existingTables.push(table);
          console.log(`✅ ${table} - exists`);
        } else {
          console.log(`❌ ${table} - ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ ${table} - ${err.message}`);
      }
    }
    
    console.log(`\n📊 Found ${existingTables.length} existing tables:`, existingTables);
    
    // Check the structure of existing tables
    if (existingTables.length > 0) {
      console.log('\n🔍 Inspecting table structures...');
      
      for (const table of existingTables.slice(0, 3)) { // Check first 3 tables
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!error && data && data.length > 0) {
            console.log(`\n📋 ${table} structure:`);
            console.log('Columns:', Object.keys(data[0]));
          } else {
            console.log(`\n📋 ${table}: Empty table or no data`);
          }
        } catch (err) {
          console.log(`❌ Error inspecting ${table}:`, err.message);
        }
      }
    }
    
    // Check if we can access the clients table (which seems to exist)
    console.log('\n🏢 Checking clients table data...');
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(3);
      
      if (clientsError) {
        console.log('❌ Error accessing clients:', clientsError.message);
      } else {
        console.log(`✅ Clients table has ${clientsData?.length || 0} records`);
        if (clientsData && clientsData.length > 0) {
          console.log('Sample client:', {
            name: clientsData[0].name,
            team: clientsData[0].team,
            status: clientsData[0].status
          });
        }
      }
    } catch (err) {
      console.log('❌ Exception accessing clients:', err.message);
    }
    
    console.log('\n💡 Recommendations:');
    console.log('1. Run the database migration scripts first');
    console.log('2. Check if the tables need to be created in Supabase');
    console.log('3. Verify RLS policies are properly configured');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

// Run the inspection
inspectDatabase();