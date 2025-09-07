const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

async function executeUserCreationSQL() {
  console.log('🔧 Executing user creation SQL script...');
  
  // Try to use service role key if available
  let adminSupabase = null;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('🔑 Using service role key for admin access...');
    adminSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  } else {
    console.log('⚠️ No service role key found in environment variables');
    console.log('\n📋 MANUAL EXECUTION REQUIRED:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of create_users_bypass_rls.sql');
    console.log('4. Execute the script');
    console.log('\n📄 SQL Script Location: /Users/taps/code/bptm/create_users_bypass_rls.sql');
    
    // Show the SQL content for easy copying
    try {
      const sqlContent = fs.readFileSync('/Users/taps/code/bptm/create_users_bypass_rls.sql', 'utf8');
      console.log('\n📝 SQL Script Content:');
      console.log('=' .repeat(80));
      console.log(sqlContent);
      console.log('=' .repeat(80));
    } catch (err) {
      console.log('❌ Could not read SQL file:', err.message);
    }
    
    return;
  }
  
  // If we have service role key, try to execute the SQL
  try {
    console.log('\n🔧 Step 1: Disabling RLS...');
    const { error: disableRLSError } = await adminSupabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.unified_users DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableRLSError) {
      console.log('❌ Failed to disable RLS:', disableRLSError.message);
      console.log('💡 Try executing the SQL script manually in Supabase Dashboard');
      return;
    }
    
    console.log('✅ RLS disabled');
    
    console.log('\n🧹 Step 2: Clearing existing users...');
    const { error: clearError } = await adminSupabase
      .from('unified_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (clearError) {
      console.log('⚠️ Clear warning:', clearError.message);
    } else {
      console.log('✅ Existing users cleared');
    }
    
    console.log('\n👥 Step 3: Creating test users...');
    
    const testUsers = [
      {
        user_id: 'USR001',
        name: 'John SEO',
        email: 'john.seo@agency.com',
        phone: '9876543210',
        password_hash: 'test123',
        role: 'SEO',
        user_category: 'employee',
        department: 'Marketing',
        employee_id: 'EMP001',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['SEO Optimization', 'Keyword Research'],
        status: 'active',
        dashboard_access: ['employee_dashboard', 'seo_dashboard'],
        permissions: { read: true, write: true },
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR002',
        name: 'Sarah Ads',
        email: 'sarah.ads@agency.com',
        phone: '9876543211',
        password_hash: 'test123',
        role: 'Ads',
        user_category: 'employee',
        department: 'Marketing',
        employee_id: 'EMP002',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['Google Ads', 'Facebook Ads'],
        status: 'active',
        dashboard_access: ['employee_dashboard', 'ads_dashboard'],
        permissions: { read: true, write: true },
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR003',
        name: 'Mike Social',
        email: 'mike.social@agency.com',
        phone: '9876543212',
        password_hash: 'test123',
        role: 'Social Media',
        user_category: 'employee',
        department: 'Marketing',
        employee_id: 'EMP003',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['Social Media Management', 'Content Creation'],
        status: 'active',
        dashboard_access: ['employee_dashboard', 'social_dashboard'],
        permissions: { read: true, write: true },
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR004',
        name: 'Lisa YouTube',
        email: 'lisa.youtube@agency.com',
        phone: '9876543213',
        password_hash: 'test123',
        role: 'YouTube SEO',
        user_category: 'employee',
        department: 'Marketing',
        employee_id: 'EMP004',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['YouTube Optimization', 'Video SEO'],
        status: 'active',
        dashboard_access: ['employee_dashboard', 'youtube_dashboard'],
        permissions: { read: true, write: true },
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR005',
        name: 'David Developer',
        email: 'david.dev@agency.com',
        phone: '9876543214',
        password_hash: 'test123',
        role: 'Web Developer',
        user_category: 'employee',
        department: 'Technology',
        employee_id: 'EMP005',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['React', 'Node.js', 'Database Design'],
        status: 'active',
        dashboard_access: ['employee_dashboard', 'dev_dashboard'],
        permissions: { read: true, write: true },
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR006',
        name: 'Emma Designer',
        email: 'emma.design@agency.com',
        phone: '9876543215',
        password_hash: 'test123',
        role: 'Graphic Designer',
        user_category: 'employee',
        department: 'Creative',
        employee_id: 'EMP006',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['Adobe Creative Suite', 'UI/UX Design'],
        status: 'active',
        dashboard_access: ['employee_dashboard', 'design_dashboard'],
        permissions: { read: true, write: true },
        account_locked: false,
        login_attempts: 0
      },
      {
        user_id: 'USR007',
        name: 'Admin Super',
        email: 'admin@agency.com',
        phone: '9876543225',
        password_hash: 'test123',
        role: 'Super Admin',
        user_category: 'super_admin',
        department: 'Administration',
        employee_id: 'ADM001',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['System Administration', 'Full Stack Development'],
        status: 'active',
        dashboard_access: ['all_dashboards', 'admin_dashboard', 'profile'],
        permissions: { full_access: true },
        account_locked: false,
        login_attempts: 0
      }
    ];
    
    // Insert users with service role
    const { data: insertedUsers, error: insertError } = await adminSupabase
      .from('unified_users')
      .insert(testUsers)
      .select();
    
    if (insertError) {
      console.log('❌ Failed to insert users:', insertError.message);
    } else {
      console.log(`✅ Successfully created ${insertedUsers?.length || 0} users`);
    }
    
    console.log('\n🔒 Step 4: Re-enabling RLS...');
    const { error: enableRLSError } = await adminSupabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.unified_users ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableRLSError) {
      console.log('⚠️ Failed to re-enable RLS:', enableRLSError.message);
    } else {
      console.log('✅ RLS re-enabled');
    }
    
    // Test the results
    console.log('\n🧪 Testing authentication...');
    await testAuthentication();
    
  } catch (error) {
    console.log('❌ Execution error:', error.message);
    console.log('💡 Please execute the SQL script manually in Supabase Dashboard');
  }
}

async function testAuthentication() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  
  const testCases = [
    { firstName: 'John', expectedPhone: '9876543210' },
    { firstName: 'Sarah', expectedPhone: '9876543211' },
    { firstName: 'Mike', expectedPhone: '9876543212' },
    { firstName: 'Lisa', expectedPhone: '9876543213' },
    { firstName: 'David', expectedPhone: '9876543214' },
    { firstName: 'Emma', expectedPhone: '9876543215' },
    { firstName: 'Admin', expectedPhone: '9876543225' }
  ];
  
  let successCount = 0;
  
  for (const testCase of testCases) {
    try {
      const { data: foundUsers, error } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testCase.firstName}%`)
        .eq('status', 'active');
      
      if (error) {
        console.log(`❌ ${testCase.firstName}: ${error.message}`);
      } else if (!foundUsers || foundUsers.length === 0) {
        console.log(`❌ ${testCase.firstName}: Not found`);
      } else {
        const user = foundUsers[0];
        if (user.phone === testCase.expectedPhone) {
          console.log(`✅ ${testCase.firstName}: Ready (${user.name})`);
          successCount++;
        } else {
          console.log(`❌ ${testCase.firstName}: Phone mismatch - expected ${testCase.expectedPhone}, got ${user.phone}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${testCase.firstName}: ${err.message}`);
    }
  }
  
  console.log(`\n🎯 Final Result: ${successCount}/7 users ready for authentication`);
  
  if (successCount === 7) {
    console.log('🎉 SUCCESS: All users are now ready for authentication!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run the application authentication tests');
    console.log('2. Test login functionality in the web interface');
    console.log('3. Verify role-based dashboard access');
  } else {
    console.log('⚠️ Some users still need attention');
  }
}

executeUserCreationSQL().catch(console.error);