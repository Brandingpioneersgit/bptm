import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test users data
const testUsers = [
  {
    name: 'Admin Super',
    phone: '+91-9876543225',
    email: 'admin@testcompany.com',
    role: 'Super Admin',
    user_category: 'super_admin',
    department: 'Administration',
    status: 'active',
    dashboard_access: ['super_admin_dashboard', 'all_dashboards'],
    permissions: { all: true }
  },
  {
    name: 'John SEO',
    phone: '+91-9876543210',
    email: 'john.seo@testcompany.com',
    role: 'SEO',
    user_category: 'employee',
    department: 'Marketing',
    status: 'active',
    dashboard_access: ['seo_dashboard', 'employee_dashboard'],
    permissions: { read: true, write: true }
  },
  {
    name: 'Sarah Ads',
    phone: '+91-9876543211',
    email: 'sarah.ads@testcompany.com',
    role: 'Ads',
    user_category: 'employee',
    department: 'Marketing',
    status: 'active',
    dashboard_access: ['ads_dashboard', 'employee_dashboard'],
    permissions: { read: true, write: true }
  },
  {
    name: 'Mike Social',
    phone: '+91-9876543212',
    email: 'mike.social@testcompany.com',
    role: 'Social Media',
    user_category: 'employee',
    department: 'Marketing',
    status: 'active',
    dashboard_access: ['social_dashboard', 'employee_dashboard'],
    permissions: { read: true, write: true }
  },
  {
    name: 'Lisa YouTube',
    phone: '+91-9876543213',
    email: 'lisa.youtube@testcompany.com',
    role: 'YouTube SEO',
    user_category: 'employee',
    department: 'Marketing',
    status: 'active',
    dashboard_access: ['youtube_dashboard', 'employee_dashboard'],
    permissions: { read: true, write: true }
  },
  {
    name: 'David Dev',
    phone: '+91-9876543214',
    email: 'david.dev@testcompany.com',
    role: 'Web Developer',
    user_category: 'employee',
    department: 'Technology',
    status: 'active',
    dashboard_access: ['dev_dashboard', 'employee_dashboard'],
    permissions: { read: true, write: true }
  },
  {
    name: 'Emma Design',
    phone: '+91-9876543215',
    email: 'emma.design@testcompany.com',
    role: 'Graphic Designer',
    user_category: 'employee',
    department: 'Creative',
    status: 'active',
    dashboard_access: ['design_dashboard', 'employee_dashboard'],
    permissions: { read: true, write: true }
  },
  {
    name: 'Alex Freelancer',
    phone: '+91-9876543216',
    email: 'alex.freelancer@testcompany.com',
    role: 'Freelancer',
    user_category: 'freelancer',
    department: null,
    status: 'active',
    dashboard_access: ['freelancer_dashboard'],
    permissions: { read: true, write: true }
  },
  {
    name: 'Priya Intern',
    phone: '+91-9876543218',
    email: 'priya.intern@testcompany.com',
    role: 'Intern',
    user_category: 'intern',
    department: null,
    status: 'active',
    dashboard_access: ['intern_dashboard'],
    permissions: { read: true }
  },
  {
    name: 'Jennifer Operations',
    phone: '+91-9876543221',
    email: 'jennifer.operations@testcompany.com',
    role: 'Operations Head',
    user_category: 'management',
    department: 'Operations',
    status: 'active',
    dashboard_access: ['operations_dashboard', 'management_dashboard'],
    permissions: { read: true, write: true, approve: true }
  },
  {
    name: 'Michael Accountant',
    phone: '+91-9876543222',
    email: 'michael.accountant@testcompany.com',
    role: 'Accountant',
    user_category: 'admin',
    department: 'Finance',
    status: 'active',
    dashboard_access: ['accounting_dashboard', 'admin_dashboard'],
    permissions: { read: true, write: true, approve: true }
  },
  {
    name: 'Amanda Sales',
    phone: '+91-9876543223',
    email: 'amanda.sales@testcompany.com',
    role: 'Sales',
    user_category: 'admin',
    department: 'Sales',
    status: 'active',
    dashboard_access: ['sales_dashboard', 'admin_dashboard'],
    permissions: { read: true, write: true, approve: true }
  },
  {
    name: 'Rachel HR',
    phone: '+91-9876543224',
    email: 'rachel.hr@testcompany.com',
    role: 'HR',
    user_category: 'admin',
    department: 'Human Resources',
    status: 'active',
    dashboard_access: ['hr_dashboard', 'admin_dashboard'],
    permissions: { read: true, write: true, approve: true }
  }
];

async function insertUsers() {
  try {
    console.log('🔄 Inserting users into unified_users table...');
    
    // Try inserting users one by one to handle RLS better
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of testUsers) {
      try {
        const { data, error } = await supabase
          .from('unified_users')
          .insert([user])
          .select();
        
        if (error) {
          console.error(`❌ Error inserting ${user.name}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Successfully inserted ${user.name} (${user.role})`);
          successCount++;
        }
      } catch (err) {
        console.error(`💥 Exception inserting ${user.name}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary: ${successCount} successful, ${errorCount} failed`);
    
    if (errorCount > 0) {
      console.log('\n💡 If RLS is blocking inserts, you can manually run these SQL commands in Supabase SQL editor:');
      console.log('\n-- Temporarily disable RLS');
      console.log('ALTER TABLE public.unified_users DISABLE ROW LEVEL SECURITY;');
      console.log('\n-- Insert statements');
      testUsers.forEach(user => {
        const dashboardAccessArray = user.dashboard_access.map(d => `'${d}'`).join(', ');
        const permissionsJson = JSON.stringify(user.permissions).replace(/"/g, '\\"');
        const dept = user.department ? `'${user.department}'` : 'NULL';
        console.log(`INSERT INTO public.unified_users (name, phone, email, role, user_category, department, status, dashboard_access, permissions) VALUES ('${user.name}', '${user.phone}', '${user.email}', '${user.role}', '${user.user_category}', ${dept}, '${user.status}', ARRAY[${dashboardAccessArray}], '${permissionsJson}');`);
      });
      console.log('\n-- Re-enable RLS');
      console.log('ALTER TABLE public.unified_users ENABLE ROW LEVEL SECURITY;');
    }
    
    // Verify final count
    const { data: allUsers, error: countError } = await supabase
      .from('unified_users')
      .select('name, role, user_category');
    
    if (!countError && allUsers) {
      console.log(`\n🎯 Total users in unified_users table: ${allUsers.length}`);
      if (allUsers.length > 0) {
        console.log('\n👥 Current users:');
        allUsers.forEach(user => {
          console.log(`  - ${user.name} (${user.role})`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

insertUsers();