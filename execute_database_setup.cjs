const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database tables...');
    
    // Read the SQL setup file
    const sqlScript = fs.readFileSync('setup_complete_database.sql', 'utf8');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlScript
    });
    
    if (error) {
      console.error('❌ Error executing SQL script:', error);
      
      // Try alternative approach - execute key table creation statements individually
      console.log('\n🔄 Trying alternative approach - creating tables individually...');
      
      // Create submissions table
      const submissionsSQL = `
        CREATE TABLE IF NOT EXISTS public.submissions (
          id BIGSERIAL PRIMARY KEY,
          employee_name TEXT NOT NULL,
          employee_phone TEXT,
          department TEXT,
          role TEXT[],
          month_key TEXT NOT NULL,
          submitted_at TIMESTAMPTZ DEFAULT NOW(),
          user_phone TEXT,
          attendance_wfo INTEGER DEFAULT 0,
          attendance_wfh INTEGER DEFAULT 0,
          tasks_completed INTEGER DEFAULT 0,
          ai_table_link TEXT,
          clients JSONB DEFAULT '[]'::jsonb,
          learning_activities JSONB DEFAULT '[]'::jsonb,
          overall_score DECIMAL(3,1) DEFAULT 0.0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      const { error: submissionsError } = await supabase.rpc('exec_sql', {
        sql_query: submissionsSQL
      });
      
      if (submissionsError) {
        console.log('\n📋 Please run this SQL manually in your Supabase SQL Editor:');
        console.log(submissionsSQL);
      } else {
        console.log('✅ Submissions table created successfully!');
      }
      
    } else {
      console.log('✅ Database setup completed successfully!');
      console.log('📊 Result:', data);
    }
    
    // Test table existence
    console.log('\n🔍 Checking table existence...');
    
    const tables = ['employees', 'clients', 'submissions', 'client_onboarding'];
    
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.log(`❌ Table '${table}' not accessible:`, tableError.message);
      } else {
        console.log(`✅ Table '${table}' exists and accessible`);
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupDatabase();