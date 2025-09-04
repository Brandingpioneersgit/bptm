import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function fixLeaderboardSchema() {
  console.log('Fixing leaderboard schema and relationships...');
  
  // First, check the current structure of monthly_kpi_reports
  console.log('\n1. Checking monthly_kpi_reports structure:');
  const { data: tableInfo, error: tableError } = await supabase
    .rpc('get_table_info', { table_name: 'monthly_kpi_reports' })
    .single();
    
  if (tableError) {
    console.log('Could not get table info via RPC, checking manually...');
    
    // Check if the table exists and what columns it has
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'monthly_kpi_reports')
      .eq('table_schema', 'public');
      
    if (colError) {
      console.error('Error checking columns:', colError);
    } else {
      console.log('Current columns:', columns);
    }
  }
  
  // Check if there are any existing records
  console.log('\n2. Checking existing monthly_kpi_reports data:');
  const { data: existingReports, error: reportsError } = await supabase
    .from('monthly_kpi_reports')
    .select('*')
    .limit(5);
    
  if (reportsError) {
    console.error('Error checking existing reports:', reportsError);
  } else {
    console.log('Existing reports count:', existingReports?.length || 0);
    if (existingReports && existingReports.length > 0) {
      console.log('Sample record:', existingReports[0]);
    }
  }
  
  // Now let's create performance data that links to unified_users
  console.log('\n3. Creating performance data for unified_users:');
  
  // Get all users from unified_users
  const { data: users, error: usersError } = await supabase
    .from('unified_users')
    .select('id, name, role, department');
    
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }
  
  console.log(`Found ${users?.length || 0} users in unified_users`);
  
  if (users && users.length > 0) {
    // Create performance data for each user
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const performanceData = users.map((user, index) => {
      const baseScore = 7.5 + (Math.random() * 2.5); // Random score between 7.5-10
      return {
        employee_id: user.id, // This should match the foreign key
        month: currentMonth,
        year: currentYear,
        overall_score: Math.round(baseScore * 10) / 10,
        growth_percentage: Math.round((Math.random() * 20 - 10) * 100) / 100, // -10% to +10%
        tasks_completed: Math.floor(Math.random() * 50) + 20,
        quality_score: Math.round((7 + Math.random() * 3) * 10) / 10,
        productivity_score: Math.round((7 + Math.random() * 3) * 10) / 10,
        client_satisfaction_score: Math.round((7 + Math.random() * 3) * 10) / 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    // Clear existing data for this month/year first
    console.log('Clearing existing performance data for current month...');
    const { error: deleteError } = await supabase
      .from('monthly_kpi_reports')
      .delete()
      .eq('month', currentMonth)
      .eq('year', currentYear);
      
    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
    }
    
    // Insert new performance data
    console.log('Inserting new performance data...');
    const { data: insertedData, error: insertError } = await supabase
      .from('monthly_kpi_reports')
      .insert(performanceData)
      .select();
      
    if (insertError) {
      console.error('Error inserting performance data:', insertError);
    } else {
      console.log(`✅ Successfully inserted ${insertedData?.length || 0} performance records`);
    }
  }
  
  // Test different leaderboard query approaches
  console.log('\n4. Testing leaderboard queries:');
  
  // Approach 1: Try with explicit join
  console.log('\nTesting explicit join query...');
  const { data: joinData, error: joinError } = await supabase
    .from('monthly_kpi_reports')
    .select(`
      overall_score,
      growth_percentage,
      employee_id,
      unified_users!monthly_kpi_reports_employee_id_fkey(name, role, department)
    `)
    .not('overall_score', 'is', null)
    .order('overall_score', { ascending: false })
    .limit(10);
    
  if (joinError) {
    console.error('Join query error:', joinError);
  } else {
    console.log('Join query success! Data:', joinData);
  }
  
  // Approach 2: Try with manual join using employee_id
  console.log('\nTesting manual join approach...');
  const { data: reportsData, error: reportsErr } = await supabase
    .from('monthly_kpi_reports')
    .select('employee_id, overall_score, growth_percentage')
    .not('overall_score', 'is', null)
    .order('overall_score', { ascending: false })
    .limit(10);
    
  if (reportsErr) {
    console.error('Reports query error:', reportsErr);
  } else if (reportsData && reportsData.length > 0) {
    console.log('Reports data found, fetching user details...');
    
    const userIds = reportsData.map(r => r.employee_id);
    const { data: userDetails, error: userErr } = await supabase
      .from('unified_users')
      .select('id, name, role, department')
      .in('id', userIds);
      
    if (userErr) {
      console.error('User details error:', userErr);
    } else {
      const leaderboardData = reportsData.map(report => {
        const user = userDetails?.find(u => u.id === report.employee_id);
        return {
          ...report,
          user_name: user?.name || 'Unknown',
          user_role: user?.role || 'Unknown',
          user_department: user?.department || 'Unknown'
        };
      });
      console.log('Manual join success! Leaderboard data:', leaderboardData);
    }
  }
}

fixLeaderboardSchema().catch(console.error);