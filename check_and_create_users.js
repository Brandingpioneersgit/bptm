import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function checkAndCreateUsers() {
  console.log('🔍 Checking for users in the database...');
  
  try {
    // Check if users exist
    const { data: users, error } = await supabase
      .from('unified_users')
      .select('id, name, phone, role, user_category, department')
      .order('name');
      
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    if (users && users.length > 0) {
      console.log(`\n✅ Found ${users.length} users in database:`);
      users.forEach(user => {
        console.log(`${user.name} (${user.role}) - ${user.phone} - ${user.department}`);
      });
    } else {
      console.log('\n❌ No users found in database. Creating test users...');
      await createTestUsers();
    }
    
    // Test authentication
    await testAuthentication();
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

async function createTestUsers() {
  // Define the correct test users as expected by the login system
  const correctTestUsers = [
    {
      name: 'John SEO',
      phone: '9876543210',
      email: 'john.seo@agency.com',
      role: 'SEO',
      user_category: 'employee',
      department: 'Marketing',
      employee_id: 'EMP001'
    },
    {
      name: 'Sarah Ads',
      phone: '9876543211',
      email: 'sarah.ads@agency.com',
      role: 'Ads',
      user_category: 'employee',
      department: 'Marketing',
      employee_id: 'EMP002'
    },
    {
      name: 'Mike Social',
      phone: '9876543212', 
      email: 'mike.social@agency.com',
      role: 'Social Media',
      user_category: 'employee',
      department: 'Marketing',
      employee_id: 'EMP003'
    },
    {
      name: 'Lisa YouTube',
      phone: '9876543213',
      email: 'lisa.youtube@agency.com', 
      role: 'YouTube SEO',
      user_category: 'employee',
      department: 'Marketing',
      employee_id: 'EMP004'
    },
    {
      name: 'David Developer',
      phone: '9876543214',
      email: 'david.dev@agency.com',
      role: 'Web Developer',
      user_category: 'employee', 
      department: 'Technology',
      employee_id: 'EMP005'
    },
    {
      name: 'Emma Designer',
      phone: '9876543215',
      email: 'emma.design@agency.com',
      role: 'Graphic Designer',
      user_category: 'employee',
      department: 'Creative',
      employee_id: 'EMP006'
    },
    {
      name: 'Jennifer Operations',
      phone: '9876543221',
      email: 'jennifer.ops@agency.com',
      role: 'Operations Head',
      user_category: 'management',
      department: 'Operations',
      employee_id: 'EMP007'
    },
    {
      name: 'Michael Accountant',
      phone: '9876543222',
      email: 'michael.accounts@agency.com',
      role: 'Accountant',
      user_category: 'admin',
      department: 'Finance',
      employee_id: 'EMP008'
    },
    {
      name: 'Amanda Sales',
      phone: '9876543223',
      email: 'amanda.sales@agency.com',
      role: 'Sales',
      user_category: 'admin',
      department: 'Sales',
      employee_id: 'EMP009'
    },
    {
      name: 'Rachel HR',
      phone: '9876543224',
      email: 'rachel.hr@agency.com',
      role: 'HR',
      user_category: 'admin',
      department: 'Human Resources',
      employee_id: 'EMP010'
    },
    {
      name: 'Admin Super',
      phone: '9876543225',
      email: 'admin@agency.com',
      role: 'Super Admin',
      user_category: 'super_admin',
      department: 'Administration',
      employee_id: 'ADM001'
    }
  ];
  
  console.log(`Creating ${correctTestUsers.length} test users...`);
  
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
async function testAuthentication() {
  console.log('\n🧪 Testing authentication logic...');
  
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
      console.log(`\nTesting authentication for ${testCase.firstName}:`);
      
      // Search for user by first name (case-insensitive)
      const { data: users, error } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testCase.firstName}%`)
        .eq('status', 'active');
        
      console.log(`- Database query: .ilike('name', '${testCase.firstName}%')`);
      console.log(`- Found ${users?.length || 0} users matching pattern`);
      
      if (error) {
        console.log(`❌ Database error: ${error.message}`);
        failedTests++;
        continue;
      }
      
      if (!users || users.length === 0) {
        console.log(`❌ No users found matching '${testCase.firstName}%'`);
        failedTests++;
        continue;
      }
      
      // Log all found users for debugging
      users.forEach(user => {
        console.log(`  - Found: ${user.name} (${user.role}) - ${user.phone}`);
      });
      
      // Find exact match by first name
      const matchingUser = users.find(user => {
        const userFirstName = user.name.split(' ')[0].toLowerCase();
        const testFirstName = testCase.firstName.toLowerCase();
        const isMatch = userFirstName === testFirstName;
        console.log(`  - Comparing: '${userFirstName}' vs '${testFirstName}' = ${isMatch}`);
        return isMatch;
      });
      
      if (!matchingUser) {
        console.log(`❌ No exact first name match found for '${testCase.firstName}'`);
        failedTests++;
        continue;
      }
      
      console.log(`✅ Found exact match: ${matchingUser.name}`);
      
      // Check phone number
      if (matchingUser.phone !== testCase.phone) {
        console.log(`❌ Phone mismatch: expected '${testCase.phone}', got '${matchingUser.phone}'`);
        failedTests++;
        continue;
      }
      
      console.log(`✅ Phone number matches: ${matchingUser.phone}`);
      
      if (matchingUser.role !== testCase.expectedRole) {
        console.log(`❌ Role mismatch: expected '${testCase.expectedRole}', got '${matchingUser.role}'`);
        failedTests++;
        continue;
      }
      
      console.log(`✅ Role matches: ${matchingUser.role}`);
      console.log(`✅ Authentication test PASSED for ${testCase.firstName}`);
      passedTests++;
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
      failedTests++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests} passed, ${failedTests} failed`);
  
  if (failedTests === 0) {
    console.log('🎉 All authentication tests passed! Login system should work correctly.');
  } else {
    console.log('⚠️ Some authentication tests failed. Login system may not work correctly.');
  }
}

checkAndCreateUsers().catch(console.error);