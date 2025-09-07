import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function addMonthKeyColumn() {
  console.log('Adding month_key column to monthly_form_submissions table...');
  
  try {
    // First, let's check the current table structure
    console.log('\n1. Checking current table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('monthly_form_submissions')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking table:', tableError);
      return;
    }
    
    console.log('Current table columns:', Object.keys(tableData[0] || {}));
    
    // Check if month_key column already exists
    if (tableData[0] && 'month_key' in tableData[0]) {
      console.log('✅ month_key column already exists!');
    } else {
      console.log('❌ month_key column is missing');
    }
    
    // Check if is_submitted column already exists
    if (tableData[0] && 'is_submitted' in tableData[0]) {
      console.log('✅ is_submitted column already exists!');
    } else {
      console.log('❌ is_submitted column is missing');
    }
    
    console.log('\n2. Checking all records in monthly_form_submissions...');
    const { data: allData, error: allError } = await supabase
      .from('monthly_form_submissions')
      .select('*');
    
    if (allError) {
      console.error('Error fetching all records:', allError);
    } else {
      console.log(`Found ${allData.length} records in monthly_form_submissions`);
      if (allData.length > 0) {
        console.log('Sample record:', allData[0]);
      }
    }
    
    console.log('\n⚠️  Manual SQL execution required:');
    console.log('Please run the following SQL commands in your Supabase Dashboard:');
    console.log('\n-- Add month_key column');
    console.log('ALTER TABLE public.monthly_form_submissions ADD COLUMN IF NOT EXISTS month_key VARCHAR(7);');
    console.log('\n-- Update existing records');
    console.log('UPDATE public.monthly_form_submissions SET month_key = TO_CHAR(submission_month, \'YYYY-MM\') WHERE month_key IS NULL;');
    console.log('\n-- Add index');
    console.log('CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_month_key ON public.monthly_form_submissions(month_key);');
    console.log('\n-- Add is_submitted column');
    console.log('ALTER TABLE public.monthly_form_submissions ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT true;');
    console.log('\n-- Update is_submitted records');
    console.log('UPDATE public.monthly_form_submissions SET is_submitted = (status IN (\'submitted\', \'reviewed\', \'approved\')) WHERE is_submitted IS NULL;');
    console.log('\n-- Add is_submitted index');
    console.log('CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_is_submitted ON public.monthly_form_submissions(is_submitted);');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addMonthKeyColumn();