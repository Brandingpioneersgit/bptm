const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createUsersWithCorrectSchema() {
  console.log('🔧 Creating users with correct schema structure...');
  
  // Test users with exact schema fields from migration
  const testUsers = [
    {
      user_id: 'USR001',
      name: 'John SEO',
      email: 'john.seo@agency.com',
      phone: '9876543210', // Without +91 prefix
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
      phone: '9876543225', // Note: This matches the expected phone from tests
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
  
  // Clear existing users first
  console.log('🧹 Clearing existing users...');
  try {
    const { error: deleteError } = await supabase
      .from('unified_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.log('⚠️ Delete warning:', deleteError.message);
    } else {
      console.log('✅ Existing users cleared');
    }
  } catch (err) {
    console.log('⚠️ Delete error:', err.message);
  }
  
  // Insert users one by one to see individual results
  console.log('\n👥 Creating test users...');
  let successCount = 0;
  let failCount = 0;
  
  for (const user of testUsers) {
    try {
      const { data, error } = await supabase
        .from('unified_users')
        .insert(user)
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Failed to create ${user.name}: ${error.message}`);
        failCount++;
      } else {
        console.log(`✅ Created ${user.name} (${user.role})`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ Error creating ${user.name}: ${err.message}`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Results: ${successCount} created, ${failCount} failed`);
  
  // Test authentication for the created users
  console.log('\n🧪 Testing authentication...');
  await testAuthentication();
}

async function testAuthentication() {
  const testCases = [
    { firstName: 'John', expectedPhone: '9876543210' },
    { firstName: 'Sarah', expectedPhone: '9876543211' },
    { firstName: 'Mike', expectedPhone: '9876543212' },
    { firstName: 'Lisa', expectedPhone: '9876543213' },
    { firstName: 'David', expectedPhone: '9876543214' },
    { firstName: 'Emma', expectedPhone: '9876543215' },
    { firstName: 'Admin', expectedPhone: '9876543225' }
  ];
  
  let authSuccessCount = 0;
  let authFailCount = 0;
  
  for (const testCase of testCases) {
    try {
      // Search for user by name (partial match)
      const { data: foundUsers, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testCase.firstName}%`)
        .eq('status', 'active')
        .eq('account_locked', false);
      
      if (searchError) {
        console.log(`❌ ${testCase.firstName}: Search error - ${searchError.message}`);
        authFailCount++;
      } else if (!foundUsers || foundUsers.length === 0) {
        console.log(`❌ ${testCase.firstName}: User not found`);
        authFailCount++;
      } else {
        const user = foundUsers[0];
        if (user.phone === testCase.expectedPhone) {
          console.log(`✅ ${testCase.firstName}: Authentication ready (${user.name})`);
          authSuccessCount++;
        } else {
          console.log(`❌ ${testCase.firstName}: Phone mismatch - expected ${testCase.expectedPhone}, got ${user.phone}`);
          authFailCount++;
        }
      }
    } catch (error) {
      console.log(`❌ ${testCase.firstName}: Test error - ${error.message}`);
      authFailCount++;
    }
  }
  
  console.log(`\n🎯 Authentication Test Results: ${authSuccessCount}/7 users ready for login`);
  
  if (authSuccessCount === 7) {
    console.log('🎉 All users are ready for authentication!');
  } else {
    console.log('⚠️ Some users still have authentication issues');
  }
}

createUsersWithCorrectSchema().catch(console.error);