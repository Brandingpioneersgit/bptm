const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_ADMIN_ACCESS_TOKEN;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials');
  console.log('URL:', supabaseUrl ? 'Present' : 'Missing');
  console.log('Service Key:', serviceRoleKey ? 'Present' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeMigration() {
  try {
    console.log('Starting month_key column migration...');
    
    // First, let's check the current table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('monthly_form_submissions')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking table:', tableError);
      return;
    }
    
    console.log('Current table structure checked successfully');
    
    // Since we can't use DDL commands directly, let's create a new migration file
    // and suggest manual execution
    console.log('\n=== MANUAL MIGRATION REQUIRED ===');
    console.log('Please execute the following SQL commands in your Supabase SQL editor:');
    console.log('');
    console.log('-- Add month_key column');
    console.log('ALTER TABLE public.monthly_form_submissions');
    console.log('ADD COLUMN IF NOT EXISTS month_key VARCHAR(7);');
    console.log('');
    console.log('-- Update existing records');
    console.log('UPDATE public.monthly_form_submissions');
    console.log('SET month_key = TO_CHAR(submission_month, \'YYYY-MM\')') ;
    console.log('WHERE month_key IS NULL;');
    console.log('');
    console.log('-- Add is_submitted column');
    console.log('ALTER TABLE public.monthly_form_submissions');
    console.log('ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT true;');
    console.log('');
    console.log('-- Update is_submitted values');
    console.log('UPDATE public.monthly_form_submissions');
    console.log('SET is_submitted = (status IN (\'submitted\', \'reviewed\', \'approved\'))') ;
    console.log('WHERE is_submitted IS NULL;');
    console.log('');
    console.log('-- Add indexes');
    console.log('CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_month_key');
    console.log('ON public.monthly_form_submissions(month_key);');
    console.log('');
    console.log('CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_is_submitted');
    console.log('ON public.monthly_form_submissions(is_submitted);');
    console.log('');
    console.log('=== END MANUAL MIGRATION ===\n');
    
    console.log('Migration script completed. Please execute the SQL commands above manually.');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

executeMigration();