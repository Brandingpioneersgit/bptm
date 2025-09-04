const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://igwgryykglsetfvomhdj.supabase.co';
const supabaseKey = 'sb_publishable_SDqrksN-DTMdHP01p3z6wQ_OlX5bJ3o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUnifiedUsersSchema() {
  console.log('🚀 Fixing unified_users table schema...');
  
  try {
    // Check current table structure
    console.log('🔍 Checking current table structure...');
    const { data: currentData, error: currentError } = await supabase
      .from('unified_users')
      .select('*')
      .limit(1);
    
    if (currentData && currentData.length > 0) {
      console.log('📋 Current columns:', Object.keys(currentData[0]));
      
      // Check if is_active column exists
      if (currentData[0].hasOwnProperty('is_active')) {
        console.log('✅ is_active column already exists!');
        return true;
      }
    }
    
    // Column doesn't exist, provide manual SQL
    console.log('❌ is_active column is missing from unified_users table.');
    console.log('\n📋 The comprehensive_6month_historical_data.sql script expects this column.');
    console.log('\n🔧 SQL to execute in Supabase SQL Editor:');
    console.log('\n-- Add missing is_active column to unified_users table');
    console.log('ALTER TABLE public.unified_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
    console.log('\n-- Update existing records to have is_active = true');
    console.log('UPDATE public.unified_users SET is_active = true WHERE is_active IS NULL;');
    console.log('\n🔗 Go to: https://supabase.com/dashboard/project/igwgryykglsetfvomhdj/sql');
    
    return false;
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
    return false;
  }
}

async function main() {
  try {
    const success = await fixUnifiedUsersSchema();
    
    if (success) {
      console.log('\n🎉 unified_users table schema is ready!');
      console.log('You can now run comprehensive_6month_historical_data.sql');
    } else {
      console.log('\n❌ Please add the is_active column manually before running the data script');
      console.log('\n💡 After adding the column, you can run:');
      console.log('   psql -h <host> -U <user> -d <database> -f comprehensive_6month_historical_data.sql');
      console.log('   OR execute the SQL content in Supabase SQL Editor');
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main();