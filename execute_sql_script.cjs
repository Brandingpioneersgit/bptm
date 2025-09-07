/**
 * Execute SQL script to populate unified_users table
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function executeSQLScript() {
  try {
    console.log('🚀 Executing SQL script to populate unified_users...');
    
    // First, let's try to disable RLS and clear the table
    console.log('🧹 Clearing existing data...');
    
    const { error: deleteError } = await supabase
      .from('unified_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.log('⚠️ Delete error (might be empty):', deleteError.message);
    }
    
    // Insert users one by one to avoid batch issues
    const users = [
      {
        user_id: 'USR001',
        name: 'Admin Super',
        email: 'admin@testcompany.com',
        phone: '+91-9876543225',
        password_hash: 'temp123',
        role: 'Super Admin',
        user_category: 'super_admin',
        department: 'Administration',
        status: 'active',
        dashboard_access: ['all_dashboards'],
        permissions: { full_access: true }
      },
      {
        user_id: 'USR002',
        name: 'John SEO',
        email: 'john.seo@testcompany.com',
        phone: '+91-9876543210',
        password_hash: 'temp123',
        role: 'SEO',
        user_category: 'employee',
        department: 'Marketing',
        status: 'active',
        dashboard_access: ['seo_dashboard', 'employee_dashboard'],
        permissions: { read: true, write: true }
      },
      {
        user_id: 'USR003',
        name: 'Priya Sharma',
        email: 'priya.sharma@testcompany.com',
        phone: '+91-9876543211',
        password_hash: 'temp123',
        role: 'SEO',
        user_category: 'management',
        department: 'Marketing',
        status: 'active',
        dashboard_access: ['seo_dashboard', 'management_dashboard'],
        permissions: { read: true, write: true }
      },
      {
        user_id: 'USR004',
        name: 'Sarah Ads',
        email: 'sarah.ads@testcompany.com',
        phone: '+91-9876543212',
        password_hash: 'temp123',
        role: 'Ads',
        user_category: 'employee',
        department: 'Marketing',
        status: 'active',
        dashboard_access: ['ads_dashboard', 'employee_dashboard'],
        permissions: { read: true, write: true }
      },
      {
        user_id: 'USR005',
        name: 'Mike Ads Manager',
        email: 'mike.ads@testcompany.com',
        phone: '+91-9876543213',
        password_hash: 'temp123',
        role: 'Ads',
        user_category: 'management',
        department: 'Marketing',
        status: 'active',
        dashboard_access: ['ads_dashboard', 'management_dashboard'],
        permissions: { read: true, write: true }
      },
      {
        user_id: 'USR006',
        name: 'Lisa Social',
        email: 'lisa.social@testcompany.com',
        phone: '+91-9876543214',
        password_hash: 'temp123',
        role: 'Social Media',
        user_category: 'employee',
        department: 'Marketing',
        status: 'active',
        dashboard_access: ['social_dashboard', 'employee_dashboard'],
        permissions: { read: true, write: true }
      },
      {
        user_id: 'USR007',
        name: 'Arjun Patel',
        email: 'arjun.patel@testcompany.com',
        phone: '+91-9876543215',
        password_hash: 'temp123',
        role: 'Web Developer',
        user_category: 'employee',
        department: 'Engineering',
        status: 'active',
        dashboard_access: ['dev_dashboard', 'employee_dashboard'],
        permissions: { read: true, write: true }
      },
      {
        user_id: 'USR008',
        name: 'Dev Manager',
        email: 'dev.manager@testcompany.com',
        phone: '+91-9876543216',
        password_hash: 'temp123',
        role: 'Web Developer',
        user_category: 'management',
        department: 'Engineering',
        status: 'active',
        dashboard_access: ['dev_dashboard', 'management_dashboard'],
        permissions: { read: true, write: true }
      },
      {
        user_id: 'USR009',
        name: 'Kiran Joshi',
        email: 'kiran.joshi@testcompany.com',
        phone: '+91-9876543217',
        password_hash: 'temp123',
        role: 'Operations Head',
        user_category: 'management',
        department: 'Operations',
        status: 'active',
        dashboard_access: ['operations_dashboard', 'management_dashboard'],
        permissions: { read: true, write: true, manage_team: true }
      },
      {
        user_id: 'USR010',
        name: 'Design Pro',
        email: 'design.pro@testcompany.com',
        phone: '+91-9876543218',
        password_hash: 'temp123',
        role: 'Graphic Designer',
        user_category: 'employee',
        department: 'Creative',
        status: 'active',
        dashboard_access: ['design_dashboard', 'employee_dashboard'],
        permissions: { read: true, write: true }
      }
    ];
    
    console.log(`📝 Inserting ${users.length} users...`);
    
    // Insert users one by one
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`📤 Inserting user ${i + 1}/${users.length}: ${user.name}`);
      
      const { error: insertError } = await supabase
        .from('unified_users')
        .insert([user]);
      
      if (insertError) {
        console.error(`❌ Error inserting ${user.name}:`, insertError.message);
        // Continue with other users
      } else {
        console.log(`✅ Successfully inserted ${user.name}`);
      }
    }
    
    // Verify the insertion
    console.log('\n🔍 Verifying insertion...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('unified_users')
      .select('user_id, name, phone, role, user_category')
      .eq('status', 'active')
      .order('user_id');
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError.message);
    } else {
      console.log(`✅ Verification successful: ${verifyData.length} users found`);
      verifyData.forEach(user => {
        console.log(`  ${user.user_id}: ${user.name} | ${user.role} | ${user.user_category}`);
      });
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the script
executeSQLScript().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});