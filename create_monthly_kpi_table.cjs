const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createMonthlyKpiTable() {
  console.log('Creating monthly_kpi_reports table...');
  
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
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('Error creating table:', error);
      return false;
    }
    
    console.log('✅ monthly_kpi_reports table created successfully');
    return true;
  } catch (err) {
    console.error('Failed to create table:', err);
    return false;
  }
}

async function createUpdateTrigger() {
  console.log('Creating update trigger...');
  
  const triggerSQL = `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    CREATE TRIGGER update_monthly_kpi_reports_updated_at
      BEFORE UPDATE ON public.monthly_kpi_reports
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    
    if (error) {
      console.error('Error creating trigger:', error);
      return false;
    }
    
    console.log('✅ Update trigger created successfully');
    return true;
  } catch (err) {
    console.error('Failed to create trigger:', err);
    return false;
  }
}

async function enableRLS() {
  console.log('Enabling Row Level Security...');
  
  const rlsSQL = `
    ALTER TABLE public.monthly_kpi_reports ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Allow all operations" ON public.monthly_kpi_reports FOR ALL USING (true);
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    
    if (error) {
      console.error('Error enabling RLS:', error);
      return false;
    }
    
    console.log('✅ Row Level Security enabled successfully');
    return true;
  } catch (err) {
    console.error('Failed to enable RLS:', err);
    return false;
  }
}

async function createIndexes() {
  console.log('Creating indexes...');
  
  const indexSQL = `
    CREATE INDEX IF NOT EXISTS idx_monthly_kpi_employee_month ON public.monthly_kpi_reports(employee_id, month, year);
    CREATE INDEX IF NOT EXISTS idx_monthly_kpi_employee_id ON public.monthly_kpi_reports(employee_id);
    CREATE INDEX IF NOT EXISTS idx_monthly_kpi_month_year ON public.monthly_kpi_reports(month, year);
  `;
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: indexSQL });
    
    if (error) {
      console.error('Error creating indexes:', error);
      return false;
    }
    
    console.log('✅ Indexes created successfully');
    return true;
  } catch (err) {
    console.error('Failed to create indexes:', err);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up monthly_kpi_reports table...');
  
  const success = await createMonthlyKpiTable();
  if (!success) {
    console.error('❌ Failed to create table');
    process.exit(1);
  }
  
  await createUpdateTrigger();
  await enableRLS();
  await createIndexes();
  
  console.log('\n🎉 monthly_kpi_reports table setup completed successfully!');
  console.log('You can now run the comprehensive_6month_historical_data.sql script.');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createMonthlyKpiTable, createUpdateTrigger, enableRLS, createIndexes };