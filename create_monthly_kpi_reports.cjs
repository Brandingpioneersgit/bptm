const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://igwgryykglsetfvomhdj.supabase.co';
const supabaseKey = 'sb_publishable_SDqrksN-DTMdHP01p3z6wQ_OlX5bJ3o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createMonthlyKpiReportsTable() {
  console.log('🚀 Creating monthly_kpi_reports table...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.monthly_kpi_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID REFERENCES employees(id) NOT NULL,
      month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
      year INTEGER NOT NULL CHECK (year >= 2020),
      
      -- Client Management KPIs
      meetings_with_clients INTEGER DEFAULT 0,
      client_satisfaction_score DECIMAL(3,1) DEFAULT 0,
      client_retention_rate DECIMAL(5,2) DEFAULT 0,
      new_clients_acquired INTEGER DEFAULT 0,
      
      -- Work Performance KPIs
      tasks_completed INTEGER DEFAULT 0,
      tasks_on_time INTEGER DEFAULT 0,
      quality_score DECIMAL(3,1) DEFAULT 0,
      productivity_score DECIMAL(3,1) DEFAULT 0,
      
      -- Learning & Growth KPIs
      learning_hours DECIMAL(5,2) DEFAULT 0,
      courses_completed INTEGER DEFAULT 0,
      certifications_earned INTEGER DEFAULT 0,
      skills_developed TEXT[],
      
      -- Attendance & Engagement KPIs
      attendance_rate DECIMAL(5,2) DEFAULT 0,
      punctuality_score DECIMAL(3,1) DEFAULT 0,
      team_collaboration_score DECIMAL(3,1) DEFAULT 0,
      initiative_score DECIMAL(3,1) DEFAULT 0,
      
      -- Additional Information
      achievements TEXT,
      challenges_faced TEXT,
      next_month_goals TEXT,
      
      -- Calculated Scores
      overall_score DECIMAL(3,1) DEFAULT 0,
      growth_percentage DECIMAL(5,2) DEFAULT 0,
      
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      UNIQUE(employee_id, month, year)
    );
  `;
  
  try {
    // Try to access the table first to see if it already exists
    const { data: testData, error: testError } = await supabase
      .from('monthly_kpi_reports')
      .select('*')
      .limit(1);
    
    if (!testError) {
      console.log('✅ monthly_kpi_reports table already exists!');
      return true;
    }
    
    // If table doesn't exist, we need to create it manually in Supabase SQL Editor
    console.log('❌ Table does not exist. Please create it manually in Supabase SQL Editor.');
    console.log('\n📋 SQL to execute in Supabase SQL Editor:');
    console.log('\n' + createTableSQL);
    console.log('\n🔗 Go to: https://supabase.com/dashboard/project/igwgryykglsetfvomhdj/sql');
    
    return false;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  try {
    const success = await createMonthlyKpiReportsTable();
    
    if (success) {
      console.log('\n🎉 monthly_kpi_reports table is ready!');
      console.log('You can now run comprehensive_6month_historical_data.sql');
    } else {
      console.log('\n❌ Failed to create monthly_kpi_reports table');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main();