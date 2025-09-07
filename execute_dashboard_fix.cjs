const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function fixDashboardAccess() {
  console.log('🔧 Fixing Dashboard Access Permissions...');
  
  try {
    // Update Admin user to include super_admin_dashboard and profile access
    console.log('\n1. Updating Admin user permissions...');
    const { data: adminUpdate, error: adminError } = await supabase
      .from('unified_users')
      .update({ 
        dashboard_access: ['super_admin_dashboard', 'all_dashboards', 'profile']
      })
      .ilike('name', 'Admin%')
      .eq('role', 'Super Admin');
    
    if (adminError) {
      console.error('❌ Admin update error:', adminError);
    } else {
      console.log('✅ Admin permissions updated');
    }
    
    // Get all non-admin users who don't have profile access
    console.log('\n2. Getting users without profile access...');
    const { data: usersWithoutProfile, error: fetchError } = await supabase
      .from('unified_users')
      .select('id, name, role, dashboard_access')
      .neq('role', 'Super Admin')
      .eq('status', 'active');
    
    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return;
    }
    
    // Update each user to add profile access
    console.log('\n3. Adding profile access to all users...');
    for (const user of usersWithoutProfile) {
      const currentAccess = user.dashboard_access || [];
      if (!currentAccess.includes('profile')) {
        const updatedAccess = [...currentAccess, 'profile'];
        
        const { error: updateError } = await supabase
          .from('unified_users')
          .update({ dashboard_access: updatedAccess })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`❌ Error updating ${user.name}:`, updateError);
        } else {
          console.log(`✅ Updated ${user.name} - added profile access`);
        }
      } else {
        console.log(`✅ ${user.name} already has profile access`);
      }
    }
    
    // Verify the updates
    console.log('\n4. Verifying updates...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('unified_users')
      .select('name, role, dashboard_access')
      .eq('status', 'active')
      .order('name');
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
      return;
    }
    
    console.log('\n📊 UPDATED USER PERMISSIONS:');
    console.log('============================');
    
    let profileCount = 0;
    let adminCount = 0;
    
    verifyData.forEach(user => {
      const hasProfile = user.dashboard_access?.includes('profile');
      const hasAdminAccess = user.role === 'Super Admin' && user.dashboard_access?.includes('super_admin_dashboard');
      
      if (hasProfile) profileCount++;
      if (user.role === 'Super Admin' && hasAdminAccess) adminCount++;
      
      console.log(`${user.name} (${user.role}):`);
      console.log(`  Dashboard Access: ${user.dashboard_access?.join(', ') || 'None'}`);
      console.log(`  Profile Access: ${hasProfile ? '✅' : '❌'}`);
      if (user.role === 'Super Admin') {
        console.log(`  Admin Access: ${hasAdminAccess ? '✅' : '❌'}`);
      }
      console.log('');
    });
    
    console.log('\n📈 SUMMARY:');
    console.log(`Users with profile access: ${profileCount}/${verifyData.length}`);
    console.log(`Super Admin with admin access: ${adminCount}/1`);
    
    if (profileCount === verifyData.length && adminCount === 1) {
      console.log('\n🎉 ALL DASHBOARD ACCESS PERMISSIONS FIXED!');
      console.log('You can now run the test script to verify 100% success rate.');
    } else {
      console.log('\n⚠️ Some permissions still need fixing. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Execute the fix
fixDashboardAccess().catch(console.error);