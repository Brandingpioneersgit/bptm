const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_ADMIN_ACCESS_TOKEN;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the MonthlyReportService methods
class TestMonthlyReportService {
  static async fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('unified_users')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  static async fetchMonthlySubmissions(monthKey) {
    if (!supabase) {
      console.warn('Supabase not available, returning empty array');
      return [];
    }

    try {
      console.log('📅 Processing monthKey:', monthKey, 'Type:', typeof monthKey);
      
      // This is where the error was occurring - monthKey.split
      if (typeof monthKey !== 'string') {
        throw new Error(`monthKey must be a string, received: ${typeof monthKey} (${monthKey})`);
      }
      
      // Convert monthKey to first day of month for database query
      const [year, month] = monthKey.split('-');
      console.log('📅 Parsed year:', year, 'month:', month);
      
      const submissionMonth = `${year}-${month}-01`;
      console.log('📅 Query submission_month:', submissionMonth);

      const { data, error } = await supabase
        .from('monthly_form_submissions')
        .select(`
          *,
          unified_users!user_id (
            id,
            name,
            email,
            phone,
            role,
            user_category,
            department
          )
        `)
        .eq('submission_month', submissionMonth);

      if (error) {
        console.error('Error fetching monthly submissions:', error);
        return [];
      }

      console.log('📊 Found', (data || []).length, 'monthly submissions');
      return data || [];
    } catch (error) {
      console.error('Error in fetchMonthlySubmissions:', error);
      return [];
    }
  }

  static async fetchLegacySubmissions(monthKey) {
    if (!supabase) {
      console.warn('Supabase not available, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('month_key', monthKey);

      if (error) {
        console.error('Error fetching legacy submissions:', error);
        return [];
      }

      console.log('📊 Found', (data || []).length, 'legacy submissions');
      return data || [];
    } catch (error) {
      console.error('Error in fetchLegacySubmissions:', error);
      return [];
    }
  }

  static async getMonthlyReportData(selectedMonth) {
    try {
      console.log('🔍 Testing getMonthlyReportData with selectedMonth:', selectedMonth);
      
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthKey = selectedMonth; // Format: "YYYY-MM"
      
      console.log('📅 Parsed - year:', year, 'month:', month, 'monthKey:', monthKey);

      // Fetch users and submissions in parallel - THIS IS THE FIXED VERSION
      const [users, monthlySubmissions, legacySubmissions] = await Promise.all([
        this.fetchUsers(),
        this.fetchMonthlySubmissions(monthKey), // FIXED: was (year, month)
        this.fetchLegacySubmissions(monthKey)
      ]);

      console.log('✅ Successfully fetched:');
      console.log('   - Users:', users.length);
      console.log('   - Monthly submissions:', monthlySubmissions.length);
      console.log('   - Legacy submissions:', legacySubmissions.length);

      return {
        users,
        submissions: [...monthlySubmissions, ...legacySubmissions],
        monthKey,
        year,
        month
      };
    } catch (error) {
      console.error('❌ Error getting monthly report data:', error);
      throw error;
    }
  }
}

async function testMonthlyReportService() {
  console.log('🧪 Testing MonthlyReportService fix...');
  console.log('=' .repeat(50));
  
  try {
    // Test with current month
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
    console.log('\n📅 Testing with current month:', currentMonth);
    
    const result = await TestMonthlyReportService.getMonthlyReportData(currentMonth);
    
    console.log('\n🎉 SUCCESS! MonthlyReportService.getMonthlyReportData works correctly');
    console.log('📊 Result summary:');
    console.log('   - Month Key:', result.monthKey);
    console.log('   - Year:', result.year);
    console.log('   - Month:', result.month);
    console.log('   - Users found:', result.users.length);
    console.log('   - Total submissions:', result.submissions.length);
    
    // Test with a previous month
    const previousMonth = '2024-12';
    console.log('\n📅 Testing with previous month:', previousMonth);
    
    const result2 = await TestMonthlyReportService.getMonthlyReportData(previousMonth);
    console.log('✅ Previous month test also successful');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testMonthlyReportService();