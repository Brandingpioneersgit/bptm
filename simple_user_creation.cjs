const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create admin client if service role key is available
let adminSupabase = null;
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  adminSupabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Regular client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createUsersDirectly() {
  console.log('🔧 Creating users with different approaches...');
  
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
  
  // Approach 1: Try with admin client if available
  if (adminSupabase) {
    console.log('\n🔑 Trying with service role key...');
    
    for (const user of testUsers) {
      try {
        const { data, error } = await adminSupabase
          .from('unified_users')
          .upsert(user, { onConflict: 'user_id' })
          .select()
          .single();
        
        if (error) {
          console.log(`❌ Admin insert failed for ${user.name}: ${error.message}`);
        } else {
          console.log(`✅ Admin created ${user.name}`);
        }
      } catch (err) {
        console.log(`❌ Admin error for ${user.name}: ${err.message}`);
      }
    }
  } else {
    console.log('⚠️ No service role key available, skipping admin approach');
  }
  
  // Approach 2: Try with RPC function
  console.log('\n🔧 Trying with RPC function...');
  
  for (const user of testUsers) {
    try {
      const { data, error } = await supabase.rpc('create_test_user', {
        user_data: user
      });
      
      if (error) {
        console.log(`❌ RPC failed for ${user.name}: ${error.message}`);
      } else {
        console.log(`✅ RPC created ${user.name}`);
      }
    } catch (err) {
      console.log(`❌ RPC error for ${user.name}: ${err.message}`);
    }
  }
  
  // Approach 3: Try direct insert with anon key
  console.log('\n🔧 Trying direct insert with anon key...');
  
  try {
    const { data, error } = await supabase
      .from('unified_users')
      .insert(testUsers)
      .select();
    
    if (error) {
      console.log(`❌ Bulk insert failed: ${error.message}`);
    } else {
      console.log(`✅ Bulk insert created ${data?.length || 0} users`);
    }
  } catch (err) {
    console.log(`❌ Bulk insert error: ${err.message}`);
  }
  
  // Test the results
  console.log('\n🧪 Testing final results...');
  await testResults();
}

async function testResults() {
  try {
    const { data: users, error } = await supabase
      .from('unified_users')
      .select('name, phone, role, user_category')
      .order('name');
    
    if (error) {
      console.log('❌ Failed to query users:', error.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found in unified_users table');
      
      // Try to understand the table structure
      console.log('\n🔍 Checking table structure...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('unified_users')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.log('❌ Table query error:', tableError.message);
        if (tableError.code === '42P01') {
          console.log('💡 The unified_users table does not exist!');
        }
      }
      return;
    }
    
    console.log(`\n✅ Found ${users.length} users in unified_users table:`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.phone}) - ${user.role} [${user.user_category}]`);
    });
    
    // Test authentication for a few users
    console.log('\n🧪 Testing authentication...');
    const testCases = [
      { firstName: 'John', expectedPhone: '9876543210' },
      { firstName: 'Sarah', expectedPhone: '9876543211' },
      { firstName: 'Admin', expectedPhone: '9876543225' }
    ];
    
    for (const testCase of testCases) {
      const { data: foundUsers, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testCase.firstName}%`)
        .eq('status', 'active');
      
      if (searchError) {
        console.log(`❌ ${testCase.firstName}: Search error - ${searchError.message}`);
      } else if (!foundUsers || foundUsers.length === 0) {
        console.log(`❌ ${testCase.firstName}: Not found`);
      } else {
        const user = foundUsers[0];
        if (user.phone === testCase.expectedPhone) {
          console.log(`✅ ${testCase.firstName}: Authentication ready`);
        } else {
          console.log(`❌ ${testCase.firstName}: Phone mismatch - expected ${testCase.expectedPhone}, got ${user.phone}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

createUsersDirectly().catch(console.error);