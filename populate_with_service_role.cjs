#!/usr/bin/env node

/**
 * Populate unified_users table using service role key
 * This bypasses RLS policies to insert test users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_ADMIN_ACCESS_TOKEN;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users matching the credentials file with valid schema roles
// Valid user_category values: 'employee', 'freelancer', 'intern', 'management', 'admin', 'super_admin'
const testUsers = [
  {
    user_id: 'USR001',
    name: 'John SEO',
    email: 'john.seo@bptm.com',
    phone: '+919876543210',
    password_hash: 'password123',
    role: 'SEO',
    user_category: 'employee',
    department: 'Marketing',
    status: 'active',
    dashboard_access: ['employee_dashboard', 'seo_dashboard']
  },
  {
    user_id: 'USR002', 
    name: 'Sarah Marketing Manager',
    email: 'sarah.marketing@bptm.com',
    phone: '+919876543211',
    password_hash: 'password123',
    role: 'Operations Head', // Valid role from schema
    user_category: 'management',
    department: 'Marketing',
    status: 'active',
    dashboard_access: ['manager_dashboard', 'marketing_dashboard']
  },
  {
    user_id: 'USR003',
    name: 'Mike Senior Developer',
    email: 'mike.dev@bptm.com', 
    phone: '+919876543212',
    password_hash: 'password123',
    role: 'Web Developer', // Valid role from schema
    user_category: 'employee',
    department: 'Engineering',
    status: 'active',
    dashboard_access: ['employee_dashboard', 'developer_dashboard']
  },
  {
    user_id: 'USR004',
    name: 'Lisa Finance Manager',
    email: 'lisa.finance@bptm.com',
    phone: '+919876543213', 
    password_hash: 'password123',
    role: 'Accountant', // Valid role from schema
    user_category: 'management',
    department: 'Finance',
    status: 'active',
    dashboard_access: ['manager_dashboard', 'finance_dashboard']
  },
  {
    user_id: 'USR005',
    name: 'Tom Operations Manager',
    email: 'tom.ops@bptm.com',
    phone: '+919876543214',
    password_hash: 'password123', 
    role: 'Operations Head', // Valid role from schema
    user_category: 'management',
    department: 'Operations',
    status: 'active',
    dashboard_access: ['manager_dashboard', 'operations_dashboard']
  },
  {
    user_id: 'USR006',
    name: 'Emma UI/UX Designer',
    email: 'emma.design@bptm.com',
    phone: '+919876543215',
    password_hash: 'password123',
    role: 'Graphic Designer', // Valid role from schema
    user_category: 'employee',
    department: 'Design',
    status: 'active',
    dashboard_access: ['employee_dashboard', 'design_dashboard']
  },
  {
    user_id: 'USR007',
    name: 'Alex Ads Team Lead',
    email: 'alex.ads@bptm.com',
    phone: '+919876543216',
    password_hash: 'password123',
    role: 'Ads', // Valid role from schema
    user_category: 'management', 
    department: 'Marketing',
    status: 'active',
    dashboard_access: ['manager_dashboard', 'ads_dashboard']
  },
  {
    user_id: 'USR008',
    name: 'Rachel Social Media Manager',
    email: 'rachel.social@bptm.com',
    phone: '+919876543217',
    password_hash: 'password123',
    role: 'Social Media', // Valid role from schema
    user_category: 'management',
    department: 'Marketing', 
    status: 'active',
    dashboard_access: ['manager_dashboard', 'social_dashboard']
  },
  {
    user_id: 'USR009',
    name: 'David Web Developer',
    email: 'david.web@bptm.com',
    phone: '+919876543218',
    password_hash: 'password123',
    role: 'Web Developer', // Valid role from schema
    user_category: 'employee',
    department: 'Engineering',
    status: 'active',
    dashboard_access: ['employee_dashboard', 'developer_dashboard']
  },
  {
    user_id: 'USR010',
    name: 'Admin Super',
    email: 'admin@agency.com',
    phone: '9876543225',
    password_hash: 'test123',
    role: 'Super Admin',
    user_category: 'super_admin',
    department: 'Administration',
    status: 'active',
    dashboard_access: ['super_admin_dashboard', 'all_dashboards']
  },
  {
    user_id: 'USR011',
    name: 'HRUser',
    email: 'hr@agency.com',
    phone: '9876543226',
    password_hash: 'test123',
    role: 'HR',
    user_category: 'admin',
    department: 'Human Resources',
    status: 'active',
    dashboard_access: ['hr_dashboard', 'admin_dashboard']
  },
  {
    user_id: 'USR012',
    name: 'Manager',
    email: 'manager@agency.com',
    phone: '9876543227',
    password_hash: 'test123',
    role: 'Operations Head',
    user_category: 'management',
    department: 'Management',
    status: 'active',
    dashboard_access: ['operations_dashboard', 'management_dashboard']
  },
  {
    user_id: 'USR013',
    name: 'Employee',
    email: 'employee@agency.com',
    phone: '9876543228',
    password_hash: 'test123',
    role: 'SEO',
    user_category: 'employee',
    department: 'Marketing',
    status: 'active',
    dashboard_access: ['seo_dashboard', 'employee_dashboard']
  }
];

async function populateUsers() {
  try {
    console.log('🔄 Starting user population with service role key...');
    
    // First, clear existing users using a different approach
    console.log('🧹 Clearing existing users...');
    const { error: deleteError } = await supabase
      .from('unified_users')
      .delete()
      .gte('id', 1); // Delete all records with id >= 1
    
    if (deleteError) {
      console.log('⚠️ Delete warning:', deleteError.message);
      // Try alternative: delete by user_id pattern
      console.log('🔄 Trying alternative delete method...');
      const { error: altDeleteError } = await supabase
        .from('unified_users')
        .delete()
        .like('user_id', 'USR%');
      
      if (altDeleteError) {
        console.log('⚠️ Alternative delete also failed:', altDeleteError.message);
        console.log('📝 Will use upsert instead of insert...');
      } else {
        console.log('✅ Users cleared with alternative method');
      }
    } else {
      console.log('✅ Existing users cleared');
    }
    
    // Insert new users (using upsert to handle existing records)
    console.log('📝 Inserting/updating test users...');
    const { data, error } = await supabase
      .from('unified_users')
      .upsert(testUsers, { onConflict: 'user_id' })
      .select();
    
    if (error) {
      console.error('❌ Insert error:', error);
      return;
    }
    
    console.log(`✅ Successfully inserted ${data.length} users`);
    
    // Verify insertion
    console.log('🔍 Verifying insertion...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('unified_users')
      .select('user_id, name, role, user_category, status')
      .eq('status', 'active');
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
      return;
    }
    
    console.log(`✅ Verification complete: ${verifyData.length} active users found`);
    verifyData.forEach(user => {
      console.log(`  - ${user.name} (${user.role}) - ${user.user_category}`);
    });
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

populateUsers();