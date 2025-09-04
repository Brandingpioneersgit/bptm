import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createGrowthTables() {
  try {
    console.log('🚀 Creating Growth Reports tables directly...');
    
    // Test if tables already exist by trying to query them
    console.log('🔍 Checking if growth_reports table exists...');
    const { data: existingReports, error: reportsError } = await supabase
      .from('growth_reports')
      .select('id')
      .limit(1);
    
    if (!reportsError) {
      console.log('✅ growth_reports table already exists!');
    } else if (reportsError.code === '42P01') {
      console.log('❌ growth_reports table does not exist');
    }
    
    console.log('🔍 Checking if monthly_scores table exists...');
    const { data: existingScores, error: scoresError } = await supabase
      .from('monthly_scores')
      .select('id')
      .limit(1);
    
    if (!scoresError) {
      console.log('✅ monthly_scores table already exists!');
    } else if (scoresError.code === '42P01') {
      console.log('❌ monthly_scores table does not exist');
    }
    
    console.log('🔍 Checking if growth_report_templates table exists...');
    const { data: existingTemplates, error: templatesError } = await supabase
      .from('growth_report_templates')
      .select('id')
      .limit(1);
    
    if (!templatesError) {
      console.log('✅ growth_report_templates table already exists!');
    } else if (templatesError.code === '42P01') {
      console.log('❌ growth_report_templates table does not exist');
    }
    
    console.log('🔍 Checking if scoring_rules table exists...');
    const { data: existingRules, error: rulesError } = await supabase
      .from('scoring_rules')
      .select('id')
      .limit(1);
    
    if (!rulesError) {
      console.log('✅ scoring_rules table already exists!');
    } else if (rulesError.code === '42P01') {
      console.log('❌ scoring_rules table does not exist');
    }
    
    // Check if any tables are missing
    const missingTables = [];
    if (reportsError && reportsError.code === '42P01') missingTables.push('growth_reports');
    if (scoresError && scoresError.code === '42P01') missingTables.push('monthly_scores');
    if (templatesError && templatesError.code === '42P01') missingTables.push('growth_report_templates');
    if (rulesError && rulesError.code === '42P01') missingTables.push('scoring_rules');
    
    if (missingTables.length > 0) {
      console.log('\n📋 Missing tables detected:', missingTables.join(', '));
      console.log('\n🔧 Manual setup required:');
      console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and run the contents of: database/migrations/growth_reports_table.sql');
      console.log('\n💡 After running the SQL, the Growth Report Generator will be fully functional.');
    } else {
      console.log('\n🎉 All Growth Reports tables exist!');
      console.log('✅ Growth Report Generator is ready to use!');
    }
    
    // Test basic functionality
    console.log('\n🧪 Testing Growth Report Generator functionality...');
    
    // Try to insert a test record to verify write permissions
    const testReport = {
      user_id: 'test-user-id',
      report_type: 'individual',
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      report_data: { test: true },
      generated_by: 'system-test'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('growth_reports')
      .insert(testReport)
      .select();
    
    if (!insertError) {
      console.log('✅ Write test successful - Growth Reports table is functional');
      
      // Clean up test record
      await supabase
        .from('growth_reports')
        .delete()
        .eq('user_id', 'test-user-id');
      
      console.log('🧹 Test record cleaned up');
    } else {
      console.log('⚠️ Write test failed:', insertError.message);
      console.log('💡 This might be expected if tables don\'t exist yet');
    }
    
  } catch (error) {
    console.error('💥 Error checking Growth Reports tables:', error);
  }
}

// Run the check
createGrowthTables();