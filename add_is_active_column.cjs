const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://igwgryykglsetfvomhdj.supabase.co';
const supabaseKey = 'sb_publishable_SDqrksN-DTMdHP01p3z6wQ_OlX5bJ3o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addIsActiveColumn() {
  console.log('🚀 Adding is_active column to unified_users table...');
  
  try {
    // First, let's check if the column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('unified_users')
      .select('is_active')
      .limit(1);
    
    if (!testError) {
      console.log('✅ is_active column already exists!');
      return true;
    }
    
    if (testError.message.includes('does not exist')) {
      console.log('❌ is_active column is missing. Please add it manually in Supabase SQL Editor.');
      console.log('\n📋 SQL to execute in Supabase SQL Editor:');
      console.log('\nALTER TABLE public.unified_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
      console.log('\n🔗 Go to: https://supabase.com/dashboard/project/igwgryykglsetfvomhdj/sql');
      
      // Also check what columns do exist
      console.log('\n🔍 Checking existing table structure...');
      const { data: allData, error: allError } = await supabase
        .from('unified_users')
        .select('*')
        .limit(1);
      
      if (allData && allData.length > 0) {
        console.log('📋 Existing columns:', Object.keys(allData[0]));
      } else if (allError) {
        console.log('❌ Error checking table structure:', allError.message);
      } else {
        console.log('📋 Table exists but is empty');
      }
      
      return false;
    }
    
    console.log('❌ Unexpected error:', testError.message);
    return false;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  try {
    const success = await addIsActiveColumn();
    
    if (success) {
      console.log('\n🎉 is_active column is ready!');
      console.log('You can now run comprehensive_6month_historical_data.sql');
    } else {
      console.log('\n❌ Please add the is_active column manually before proceeding');
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

main();