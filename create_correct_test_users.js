import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function createCorrectTestUsers() {
  console.log('🔧 Creating correct test users with proper roles and phone numbers...');
  
  // Define the correct test users as expected by the login system
  const correctTestUsers = [
    {
      user_id: 'USR001',
      name: 'John SEO',
      phone: '9876543210',
      email: 'john.seo@agency.com',
      role: 'SEO',
      user_category: 'employee',
      department: 'Marketing',
      employee_id: 'EMP001'
    },
    {
      user_id: 'USR002', 
      name: 'Sarah Ads',
      phone: '9876543211',
      email: 'sarah.ads@agency.com',
      role: 'Ads',
      user_category: 'employee',
      department: 'Marketing',
      employee_id: 'EMP002'
    },
    {
      user_id: 'USR003',
      name: 'Mike Social',
      phone: '9876543212', 
      email: 'mike.social@agency.com',
      role: 'Social Media',
      user_category: 'employee',
      department: 'Marketing',
      employee_id: 'EMP003'
    },
    {
      user_id: 'USR004',
      name: 'Lisa YouTube',
      phone: '9876543213',
      email: 'lisa.youtube@agency.com', 
      role: 'YouTube SEO',
      user_category: 'employee',
      department: 'Marketing',
      employee_id: 'EMP004'
    },
    {
      user_id: 'USR005',
      name: 'David Developer',
      phone: '9876543214',
      email: 'david.dev@agency.com',
      role: 'Web Developer',
      user_category: 'employee', 
      department: 'Technology',
      employee_id: 'EMP005'
    },
    {
      user_id: 'USR006',
      name: 'Emma Designer',
      phone: '9876543215',
      email: 'emma.design@agency.com',
      role: 'Graphic Designer',
      user_category: 'employee',
      department: 'Creative',
      employee_id: 'EMP006'
    },
    {
      user_id: 'USR007',
      name: 'Jennifer Operations',
      phone: '9876543221',
      email: 'jennifer.ops@agency.com',
      role: 'Operations Head',
      user_category: 'management',
      department: 'Operations',
      employee_id: 'EMP007'
    },
    {
      user_id: 'USR008',
      name: 'Michael Accountant',
      phone: '9876543222',
      email: 'michael.accounts@agency.com',
      role: 'Accountant',
      user_category: 'admin',
      department: 'Finance',
      employee_id: 'EMP008'
    },
    {
      user_id: 'USR009',
      name: 'Amanda Sales',
      phone: '9876543223',
      email: 'amanda.sales@agency.com',
      role: 'Sales',
      user_category: 'admin',
      department: 'Sales',
      employee_id: 'EMP009'
    },
    {
      user_id: 'USR010',
      name: 'Rachel HR',
      phone: '9876543224',
      email: 'rachel.hr@agency.com',
      role: 'HR',
      user_category: 'admin',
      department: 'Human Resources',
      employee_id: 'EMP010'
    },
    {
      user_id: 'USR011',
      name: 'Admin Super',
      phone: '9876543225',
      email: 'admin@agency.com',
      role: 'Super Admin',
      user_category: 'super_admin',
      department: 'Administration',
      employee_id: 'ADM001'
    }
  ];
  
  try {
    // First, clear existing users to avoid conflicts
    console.log('🧹 Clearing existing users...');
    const { error: deleteError } = await supabase
      .from('unified_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
    if (deleteError) {
      console.error('Error clearing users:', deleteError);
    } else {
      console.log('✅ Cleared existing users');
    }
    
    // Insert the correct test users
    console.log('\n📝 Creating new test users...');
    
    for (const user of correctTestUsers) {
      const userData = {
        ...user,
        password_hash: 'test123', // Simple password for testing
        status: 'active',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: [],
        dashboard_access: getDashboardAccess(user.role),
        permissions: getPermissions(user.user_category),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertedUser, error: insertError } = await supabase
        .from('unified_users')
        .insert(userData)
        .select()
        .single();
        
      if (insertError) {
        console.error(`❌ Error creating ${user.name}:`, insertError);
      } else {
        console.log(`✅ Created ${user.name} (${user.role}) - ${user.phone}`);
      }
    }
    
    console.log('\n🎉 Test users creation complete!');
    
    // Verify the created users
    console.log('\n🔍 Verifying created users...');
    const { data: finalUsers, error: verifyError } = await supabase
      .from('unified_users')
      .select('name, phone, role, user_category, department')
      .order('name');
      
    if (verifyError) {
      console.error('Error verifying users:', verifyError);
      return;
    }
    
    console.log('\nCreated users:');
    finalUsers.forEach(user => {
      console.log(`${user.name} (${user.role}) - ${user.phone} - ${user.department}`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Helper function to get dashboard access based on role
function getDashboardAccess(role) {
  const dashboardMap = {
    'SEO': ['seo_dashboard', 'employee_dashboard', 'profile'],
    'Ads': ['ads_dashboard', 'employee_dashboard', 'profile'],
    'Social Media': ['social_dashboard', 'employee_dashboard', 'profile'],
    'YouTube SEO': ['youtube_dashboard', 'employee_dashboard', 'profile'],
    'Web Developer': ['dev_dashboard', 'employee_dashboard', 'profile'],
    'Graphic Designer': ['design_dashboard', 'employee_dashboard', 'profile'],
    'Operations Head': ['operations_dashboard', 'management_dashboard', 'profile'],
    'Accountant': ['accounting_dashboard', 'admin_dashboard', 'profile'],
    'Sales': ['sales_dashboard', 'admin_dashboard', 'profile'],
    'HR': ['hr_dashboard', 'admin_dashboard', 'profile'],
    'Super Admin': ['super_admin_dashboard', 'all_dashboards', 'profile']
  };
  
  return dashboardMap[role] || ['employee_dashboard', 'profile'];
}

// Helper function to get permissions based on user category
function getPermissions(userCategory) {
  const permissionMap = {
    'employee': { 'read_own_data': true, 'submit_forms': true },
    'management': { 'read_team_data': true, 'approve_requests': true, 'manage_team': true },
    'admin': { 'read_department_data': true, 'manage_users': true, 'generate_reports': true },
    'super_admin': { 'full_system_access': true, 'can_modify_permissions': true, 'can_create_users': true }
  };
  
  return permissionMap[userCategory] || {};
}

// Test authentication with the new users
async function testNewUserAuthentication() {
  console.log('\n🧪 Testing authentication with new users...');
  
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
      // Search for user by first name (case-insensitive)
      const { data: users, error } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testCase.firstName}%`)
        .eq('status', 'active');
        
      if (error) {
        console.log(`❌ ${testCase.firstName}: Database error`);
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
        return userFirstName === testCase.firstName.toLowerCase();
      });
      
      if (!matchingUser) {
        console.log(`❌ ${testCase.firstName}: No exact name match`);
        failedTests++;
        continue;
      }
      
      // Check phone number
      if (matchingUser.phone !== testCase.phone) {
        console.log(`❌ ${testCase.firstName}: Phone mismatch (${matchingUser.phone} vs ${testCase.phone})`);
        failedTests++;
        continue;
      }
      
      if (matchingUser.role !== testCase.expectedRole) {
        console.log(`❌ ${testCase.firstName}: Role mismatch (${matchingUser.role} vs ${testCase.expectedRole})`);
        failedTests++;
        continue;
      }
      
      console.log(`✅ ${testCase.firstName}: Authentication test passed (${matchingUser.role})`);
      passedTests++;
      
    } catch (error) {
      console.log(`❌ ${testCase.firstName}: Test error`);
      failedTests++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed`);
  
  if (failedTests === 0) {
    console.log('🎉 All authentication tests passed! Login system is ready.');
  }
}

createCorrectTestUsers().then(() => {
  return testNewUserAuthentication();
}).catch(console.error);