import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkLeaderboardData() {
  console.log('Checking Performance Leaderboard Data...');
  
  // Check what tables actually exist
  console.log('\n1. Checking existing tables:');
  const { data: tables, error: tablesError } = await supabase.rpc('get_table_names');
  if (tablesError) {
    console.log('Cannot get table names via RPC, checking manually...');
    // Try to query some expected tables
    const tablesToCheck = ['unified_users', 'performance_metrics', 'monthly_kpi_reports', 'submissions'];
    for (const table of tablesToCheck) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table '${table}' - Error: ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }
  }
  
  // Check unified_users table content
  console.log('\n2. Checking unified_users table:');
  const { data: allUsers, error: usersError } = await supabase
    .from('unified_users')
    .select('id, name, role, department')
    .limit(20);
    
  if (usersError) {
    console.error('Error fetching users:', usersError);
  } else {
    console.log('Total users found:', allUsers?.length || 0);
    if (allUsers && allUsers.length > 0) {
      console.log('Sample users:', allUsers.slice(0, 5));
    }
  }
  
  // Check performance_metrics table
  console.log('\n3. Checking performance_metrics table:');
  const { data: perfMetrics, error: perfError } = await supabase
    .from('performance_metrics')
    .select('*')
    .limit(5);
    
  if (perfError) {
    console.error('Error fetching performance metrics:', perfError);
  } else {
    console.log('Performance metrics count:', perfMetrics?.length || 0);
    if (perfMetrics && perfMetrics.length > 0) {
      console.log('Sample performance metric:', perfMetrics[0]);
    }
  }
  
  // Check submissions table
  console.log('\n4. Checking submissions table:');
  const { data: submissions, error: submError } = await supabase
    .from('submissions')
    .select('employee_name, department, overall_score')
    .not('overall_score', 'is', null)
    .limit(10);
    
  if (submError) {
    console.error('Error fetching submissions:', submError);
  } else {
    console.log('Submissions with scores:', submissions?.length || 0);
    if (submissions && submissions.length > 0) {
      console.log('Sample submissions:', submissions);
    }
  }
}

checkLeaderboardData().catch(console.error);