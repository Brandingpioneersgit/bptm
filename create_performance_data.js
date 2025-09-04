import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function createPerformanceData() {
  console.log('Creating performance data for leaderboard...');
  
  try {
    // Get all users from unified_users
    const { data: users, error: usersError } = await supabase
      .from('unified_users')
      .select('id, name, role, department');
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Found ${users?.length || 0} users in unified_users`);
    
    if (!users || users.length === 0) {
      console.log('No users found in unified_users table');
      return;
    }
    
    // Clear existing performance data for current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    console.log(`Clearing existing data for ${currentMonth}/${currentYear}...`);
    const { error: deleteError } = await supabase
      .from('monthly_kpi_reports')
      .delete()
      .eq('month', currentMonth)
      .eq('year', currentYear);
      
    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
    } else {
      console.log('✅ Cleared existing performance data');
    }
    
    // Create performance data for each user
    const performanceData = users.map((user, index) => {
      // Generate realistic scores based on role
      const baseScore = getBaseScoreForRole(user.role);
      const variation = (Math.random() - 0.5) * 2; // -1 to +1 variation
      const finalScore = Math.max(6.0, Math.min(10.0, baseScore + variation));
      
      return {
        employee_id: user.id,
        month: currentMonth,
        year: currentYear,
        overall_score: Math.round(finalScore * 10) / 10,
        growth_percentage: Math.round((Math.random() * 20 - 10) * 100) / 100, // -10% to +10%
        tasks_completed: Math.floor(Math.random() * 30) + 15, // 15-45 tasks
        quality_score: Math.round((7 + Math.random() * 3) * 10) / 10, // 7.0-10.0
        productivity_score: Math.round((7 + Math.random() * 3) * 10) / 10,
        client_satisfaction_score: Math.round((7 + Math.random() * 3) * 10) / 10,
        meetings_with_clients: Math.floor(Math.random() * 15) + 5, // 5-20 meetings
        learning_hours: Math.round((Math.random() * 25 + 10) * 10) / 10, // 10-35 hours
        attendance_rate: Math.round((90 + Math.random() * 10) * 100) / 100, // 90-100%
        punctuality_score: Math.round((8 + Math.random() * 2) * 10) / 10, // 8.0-10.0
        team_collaboration_score: Math.round((7 + Math.random() * 3) * 10) / 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    
    console.log(`Creating performance records for ${performanceData.length} users...`);
    
    // Insert performance data in batches to avoid timeout
    const batchSize = 5;
    let insertedCount = 0;
    
    for (let i = 0; i < performanceData.length; i += batchSize) {
      const batch = performanceData.slice(i, i + batchSize);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('monthly_kpi_reports')
        .insert(batch)
        .select();
        
      if (insertError) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
      } else {
        insertedCount += insertedData?.length || 0;
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${insertedData?.length || 0} records`);
      }
    }
    
    console.log(`\n✅ Total inserted: ${insertedCount} performance records`);
    
    // Test the leaderboard query
    console.log('\nTesting leaderboard query...');
    
    const { data: leaderboardTest, error: testError } = await supabase
      .from('monthly_kpi_reports')
      .select('employee_id, overall_score, growth_percentage')
      .not('overall_score', 'is', null)
      .order('overall_score', { ascending: false })
      .limit(10);
      
    if (testError) {
      console.error('Leaderboard test error:', testError);
    } else {
      console.log(`Found ${leaderboardTest?.length || 0} performance records for leaderboard`);
      
      if (leaderboardTest && leaderboardTest.length > 0) {
        // Get user details
        const employeeIds = leaderboardTest.map(p => p.employee_id);
        const { data: userDetails, error: userError } = await supabase
          .from('unified_users')
          .select('id, name, role, department')
          .in('id', employeeIds);
          
        if (userError) {
          console.error('User details error:', userError);
        } else {
          console.log('\n🏆 TOP PERFORMERS:');
          leaderboardTest.forEach((perf, index) => {
            const user = userDetails?.find(u => u.id === perf.employee_id);
            console.log(`${index + 1}. ${user?.name || 'Unknown'} (${user?.role || 'Unknown'}) - Score: ${perf.overall_score}`);
          });
        }
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Helper function to get base score based on role
function getBaseScoreForRole(role) {
  const roleScores = {
    'Super Admin': 9.0,
    'Operations Head': 8.8,
    'HR': 8.5,
    'SEO': 8.2,
    'Ads': 8.0,
    'Social Media': 7.8,
    'YouTube SEO': 8.1,
    'Web Developer': 8.3,
    'Graphic Designer': 7.9,
    'Sales': 8.0,
    'Accountant': 8.4,
    'Freelancer': 7.5,
    'Intern': 7.2
  };
  
  return roleScores[role] || 8.0;
}

createPerformanceData().catch(console.error);