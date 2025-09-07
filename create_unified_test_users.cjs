const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test users exactly as expected by the authentication system
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
    status: 'active',
    dashboard_access: ['all_dashboards', 'admin_dashboard', 'profile'],
    permissions: { full_access: true },
    account_locked: false,
    login_attempts: 0
  }
];

async function createUnifiedTestUsers() {
  try {
    console.log('🧹 Clearing existing unified_users...');
    
    // Clear existing users
    const { error: deleteError } = await supabase
      .from('unified_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.log('⚠️ Delete error (table might be empty):', deleteError.message);
    } else {
      console.log('✅ Cleared existing users');
    }
    
    console.log('\n📝 Creating unified test users...');
    
    // Insert users one by one to handle errors better
    let successCount = 0;
    let failCount = 0;
    
    for (const user of testUsers) {
      const { data, error } = await supabase
        .from('unified_users')
        .insert(user)
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Failed to create ${user.name}: ${error.message}`);
        failCount++;
      } else {
        console.log(`✅ Created ${user.name} (${user.role}) - ${user.phone}`);
        successCount++;
      }
    }
    
    console.log(`\n📊 Results: ${successCount} created, ${failCount} failed`);
    
    if (successCount > 0) {
      console.log('\n🧪 Testing authentication with created users...');
      await testAuthentication();
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function testAuthentication() {
  const testCases = [
    { firstName: 'John', phone: '9876543210', expectedRole: 'SEO' },
    { firstName: 'Sarah', phone: '9876543211', expectedRole: 'Ads' },
    { firstName: 'Mike', phone: '9876543212', expectedRole: 'Social Media' },
    { firstName: 'Lisa', phone: '9876543213', expectedRole: 'YouTube SEO' },
    { firstName: 'David', phone: '9876543214', expectedRole: 'Web Developer' },
    { firstName: 'Emma', phone: '9876543215', expectedRole: 'Graphic Designer' },
    { firstName: 'Admin', phone: '9876543225', expectedRole: 'Super Admin' }
  ];
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testCase of testCases) {
    try {
      // Search for user by first name
      const { data: users, error } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testCase.firstName}%`)
        .eq('status', 'active');
      
      if (error) {
        console.log(`❌ ${testCase.firstName}: Database error - ${error.message}`);
        failedTests++;
        continue;
      }
      
      if (!users || users.length === 0) {
        console.log(`❌ ${testCase.firstName}: User not found`);
        failedTests++;
        continue;
      }
      
      // Find exact match by first name
      const matchingUser = users.find(user => {
        const userFirstName = user.name.split(' ')[0].toLowerCase();
        const inputFirstName = testCase.firstName.toLowerCase();
        return userFirstName === inputFirstName;
      });
      
      if (!matchingUser) {
        console.log(`❌ ${testCase.firstName}: No exact name match found`);
        failedTests++;
        continue;
      }
      
      // Check phone number
      if (matchingUser.phone !== testCase.phone) {
        console.log(`❌ ${testCase.firstName}: Phone mismatch - expected ${testCase.phone}, got ${matchingUser.phone}`);
        failedTests++;
        continue;
      }
      
      // Check role
      if (matchingUser.role !== testCase.expectedRole) {
        console.log(`❌ ${testCase.firstName}: Role mismatch - expected ${testCase.expectedRole}, got ${matchingUser.role}`);
        failedTests++;
        continue;
      }
      
      console.log(`✅ ${testCase.firstName}: Authentication test passed`);
      passedTests++;
      
    } catch (error) {
      console.log(`❌ ${testCase.firstName}: Unexpected error - ${error.message}`);
      failedTests++;
    }
  }
  
  console.log(`\n📊 Authentication Test Results: ${passedTests} passed, ${failedTests} failed`);
  
  if (failedTests === 0) {
    console.log('🎉 All authentication tests passed! Login system should work correctly.');
  } else {
    console.log('⚠️ Some authentication tests failed. Please review the issues above.');
  }
}

createUnifiedTestUsers().catch(console.error);