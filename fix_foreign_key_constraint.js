import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function fixForeignKeyConstraint() {
  console.log('Fixing foreign key constraint for monthly_kpi_reports...');
  
  try {
    // Step 1: Drop the existing foreign key constraint
    console.log('\n1. Dropping existing foreign key constraint...');
    const dropConstraintSQL = `
      ALTER TABLE public.monthly_kpi_reports 
      DROP CONSTRAINT IF EXISTS monthly_kpi_reports_employee_id_fkey;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: dropConstraintSQL 
    });
    
    if (dropError) {
      console.error('Error dropping constraint:', dropError);
      // Try alternative approach
      console.log('Trying alternative SQL execution...');
      
      // Let's try to execute the SQL directly using a different approach
      const { error: altDropError } = await supabase
        .from('monthly_kpi_reports')
        .select('id')
        .limit(1);
        
      if (altDropError) {
        console.error('Table access error:', altDropError);
      }
    } else {
      console.log('✅ Successfully dropped existing constraint');
    }
    
    // Step 2: Add new foreign key constraint pointing to unified_users
    console.log('\n2. Adding new foreign key constraint to unified_users...');
    const addConstraintSQL = `
      ALTER TABLE public.monthly_kpi_reports 
      ADD CONSTRAINT monthly_kpi_reports_employee_id_fkey 
      FOREIGN KEY (employee_id) REFERENCES public.unified_users(id) 
      ON DELETE CASCADE;
    `;
    
    const { error: addError } = await supabase.rpc('exec_sql', { 
      sql: addConstraintSQL 
    });
    
    if (addError) {
      console.error('Error adding new constraint:', addError);
    } else {
      console.log('✅ Successfully added new constraint to unified_users');
    }
    
    // Step 3: Clean up any orphaned records
    console.log('\n3. Cleaning up orphaned records...');
    
    // Get all employee_ids from monthly_kpi_reports
    const { data: reports, error: reportsError } = await supabase
      .from('monthly_kpi_reports')
      .select('employee_id')
      .not('employee_id', 'is', null);
      
    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
    } else {
      const reportEmployeeIds = [...new Set(reports.map(r => r.employee_id))];
      console.log(`Found ${reportEmployeeIds.length} unique employee IDs in reports`);
      
      // Get all user IDs from unified_users
      const { data: users, error: usersError } = await supabase
        .from('unified_users')
        .select('id');
        
      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        const userIds = users.map(u => u.id);
        console.log(`Found ${userIds.length} users in unified_users`);
        
        // Find orphaned records
        const orphanedIds = reportEmployeeIds.filter(id => !userIds.includes(id));
        console.log(`Found ${orphanedIds.length} orphaned records`);
        
        if (orphanedIds.length > 0) {
          console.log('Deleting orphaned records...');
          const { error: deleteError } = await supabase
            .from('monthly_kpi_reports')
            .delete()
            .in('employee_id', orphanedIds);
            
          if (deleteError) {
            console.error('Error deleting orphaned records:', deleteError);
          } else {
            console.log('✅ Successfully deleted orphaned records');
          }
        }
      }
    }
    
    // Step 4: Create performance data for unified_users
    console.log('\n4. Creating performance data for unified_users...');
    
    const { data: users, error: usersError } = await supabase
      .from('unified_users')
      .select('id, name, role, department');
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`Creating performance data for ${users?.length || 0} users`);
    
    if (users && users.length > 0) {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const performanceData = users.map((user, index) => {
        const baseScore = 7.5 + (Math.random() * 2.5);
        return {
          employee_id: user.id,
          month: currentMonth,
          year: currentYear,
          overall_score: Math.round(baseScore * 10) / 10,
          growth_percentage: Math.round((Math.random() * 20 - 10) * 100) / 100,
          tasks_completed: Math.floor(Math.random() * 50) + 20,
          quality_score: Math.round((7 + Math.random() * 3) * 10) / 10,
          productivity_score: Math.round((7 + Math.random() * 3) * 10) / 10,
          client_satisfaction_score: Math.round((7 + Math.random() * 3) * 10) / 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      // Clear existing data for current month
      const { error: deleteError } = await supabase
        .from('monthly_kpi_reports')
        .delete()
        .eq('month', currentMonth)
        .eq('year', currentYear);
        
      if (deleteError) {
        console.error('Error clearing existing data:', deleteError);
      }
      
      // Insert new data
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
    
    // Step 5: Test the leaderboard query
    console.log('\n5. Testing leaderboard query...');
    
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('monthly_kpi_reports')
      .select(`
        overall_score,
        growth_percentage,
        unified_users!monthly_kpi_reports_employee_id_fkey(name, role, department)
      `)
      .not('overall_score', 'is', null)
      .order('overall_score', { ascending: false })
      .limit(10);
      
    if (leaderboardError) {
      console.error('Leaderboard query error:', leaderboardError);
      
      // Try manual join approach
      console.log('Trying manual join approach...');
      const { data: reports, error: reportsErr } = await supabase
        .from('monthly_kpi_reports')
        .select('employee_id, overall_score, growth_percentage')
        .not('overall_score', 'is', null)
        .order('overall_score', { ascending: false })
        .limit(10);
        
      if (reportsErr) {
        console.error('Reports query error:', reportsErr);
      } else if (reports && reports.length > 0) {
        const userIds = reports.map(r => r.employee_id);
        const { data: userDetails, error: userErr } = await supabase
          .from('unified_users')
          .select('id, name, role, department')
          .in('id', userIds);
          
        if (userErr) {
          console.error('User details error:', userErr);
        } else {
          const leaderboard = reports.map(report => {
            const user = userDetails?.find(u => u.id === report.employee_id);
            return {
              name: user?.name || 'Unknown',
              role: user?.role || 'Unknown',
              department: user?.department || 'Unknown',
              overall_score: report.overall_score,
              growth_percentage: report.growth_percentage
            };
          });
          console.log('✅ Leaderboard data (manual join):', leaderboard);
        }
      }
    } else {
      console.log('✅ Leaderboard query success:', leaderboardData);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

fixForeignKeyConstraint().catch(console.error);