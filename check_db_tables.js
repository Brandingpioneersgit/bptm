import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://igwgryykglsetfvomhdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking database tables...');
  
  // Check for employees table
  try {
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .limit(1);
    
    if (empError) {
      console.log('❌ employees table error:', empError.message);
    } else {
      console.log('✅ employees table exists, sample record:', employees?.[0] || 'No records');
    }
  } catch (error) {
    console.log('❌ employees table check failed:', error.message);
  }
  
  // Check for clients table
  try {
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientError) {
      console.log('❌ clients table error:', clientError.message);
    } else {
      console.log('✅ clients table exists, sample record:', clients?.[0] || 'No records');
    }
  } catch (error) {
    console.log('❌ clients table check failed:', error.message);
  }
  
  // Check for unified_users table
  try {
    const { data: users, error: usersError } = await supabase
      .from('unified_users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ unified_users table error:', usersError.message);
    } else {
      console.log('✅ unified_users table exists, sample record:', users?.[0] || 'No records');
    }
  } catch (error) {
    console.log('❌ unified_users table check failed:', error.message);
  }
  
  // Check for users table
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.log('❌ users table error:', usersError.message);
    } else {
      console.log('✅ users table exists, sample record:', users?.[0] || 'No records');
    }
  } catch (error) {
    console.log('❌ users table check failed:', error.message);
  }
  
  // List all tables using information_schema
  try {
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list');
    
    if (tablesError) {
      console.log('❌ Could not list tables:', tablesError.message);
    } else {
      console.log('📋 Available tables:', tables);
    }
  } catch (error) {
    console.log('❌ Table listing failed:', error.message);
  }
}

checkTables().catch(console.error);