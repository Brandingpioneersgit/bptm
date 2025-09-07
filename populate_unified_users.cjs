/**
 * Script to populate unified_users table from existing employees and users tables
 * This will fix the authentication issue where only SEO users can login
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

// Function to normalize phone numbers
function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/^\+91-?/, '').replace(/[\s\-\(\)]/g, '');
}

// Function to determine user category based on role
function getUserCategory(role) {
  const roleStr = Array.isArray(role) ? role.join(', ').toLowerCase() : role.toLowerCase();
  
  if (roleStr.includes('super admin') || roleStr.includes('admin')) return 'admin';
  if (roleStr.includes('manager') || roleStr.includes('head') || roleStr.includes('lead')) return 'management';
  if (roleStr.includes('intern')) return 'intern';
  if (roleStr.includes('freelancer')) return 'freelancer';
  return 'employee';
}

// Function to map roles to valid schema roles
function mapToValidRole(role) {
  const roleStr = Array.isArray(role) ? role.join(', ').toLowerCase() : role.toLowerCase();
  
  // Map to valid roles from schema
  if (roleStr.includes('seo')) return 'SEO';
  if (roleStr.includes('ads')) return 'Ads';
  if (roleStr.includes('social')) return 'Social Media';
  if (roleStr.includes('youtube')) return 'YouTube SEO';
  if (roleStr.includes('developer') || roleStr.includes('engineering')) return 'Web Developer';
  if (roleStr.includes('designer') || roleStr.includes('ui') || roleStr.includes('ux')) return 'Graphic Designer';
  if (roleStr.includes('freelancer')) return 'Freelancer';
  if (roleStr.includes('intern')) return 'Intern';
  if (roleStr.includes('super admin')) return 'Super Admin';
  if (roleStr.includes('operations head')) return 'Operations Head';
  if (roleStr.includes('manager') || roleStr.includes('head') || roleStr.includes('lead')) return 'Operations Head';
  
  // Default fallback
  return 'SEO'; // Use SEO as default since it works
}

// Function to get dashboard access based on role
function getDashboardAccess(role, category) {
  const dashboards = [];
  const roleStr = Array.isArray(role) ? role.join(', ').toLowerCase() : role.toLowerCase();
  
  // Add role-specific dashboards
  if (roleStr.includes('seo')) dashboards.push('seo');
  if (roleStr.includes('ads')) dashboards.push('ads');
  if (roleStr.includes('social')) dashboards.push('social');
  if (roleStr.includes('youtube')) dashboards.push('youtube');
  if (roleStr.includes('hr')) dashboards.push('hr');
  if (roleStr.includes('sales')) dashboards.push('sales');
  if (roleStr.includes('accountant') || roleStr.includes('finance')) dashboards.push('accounting');
  if (roleStr.includes('operations')) dashboards.push('operations');
  
  // Add category-based dashboards
  dashboards.push(category);
  
  return dashboards;
}

async function populateUnifiedUsers() {
  try {
    console.log('🚀 Starting unified_users population...');
    
    // First, clear existing unified_users data
    console.log('🧹 Clearing existing unified_users data...');
    const { error: deleteError } = await supabase
      .from('unified_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.log('⚠️ Note: Could not clear existing data (table might be empty):', deleteError.message);
    }
    
    // Get all employees
    console.log('📋 Fetching employees...');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*');
    
    if (empError) {
      console.error('❌ Error fetching employees:', empError);
      return;
    }
    
    // Get all users
    console.log('📋 Fetching users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`📊 Found ${employees?.length || 0} employees and ${users?.length || 0} users`);
    
    const unifiedUsers = [];
    const processedPhones = new Set(); // To avoid duplicates
    
    // Process employees
    if (employees) {
      for (const emp of employees) {
        if (!emp.name || !emp.phone) continue;
        
        const normalizedPhone = normalizePhone(emp.phone);
        if (processedPhones.has(normalizedPhone)) continue;
        processedPhones.add(normalizedPhone);
        
        const role = Array.isArray(emp.role) ? emp.role[0] : emp.role;
        const category = getUserCategory(role);
        
        const userId = `USR${String(unifiedUsers.length + 1).padStart(3, '0')}`;
        
        unifiedUsers.push({
          user_id: userId,
          name: emp.name,
          email: emp.email || `${emp.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          phone: emp.phone,
          password_hash: 'temp123', // Temporary password
          role: mapToValidRole(role),
          user_category: category,
          department: emp.department || 'General',
          status: 'active',
          login_attempts: 0,
          permissions: {},
          dashboard_access: getDashboardAccess(role, category),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    // Process users (avoid duplicates)
    if (users) {
      for (const user of users) {
        if (!user.name || !user.phone) continue;
        
        const normalizedPhone = normalizePhone(user.phone);
        if (processedPhones.has(normalizedPhone)) continue;
        processedPhones.add(normalizedPhone);
        
        const category = getUserCategory(user.role);
        
        const userId = `USR${String(unifiedUsers.length + 1).padStart(3, '0')}`;
        
        unifiedUsers.push({
          user_id: userId,
          name: user.name,
          email: user.email || `${user.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          phone: user.phone,
          password_hash: 'temp123', // Temporary password
          role: mapToValidRole(user.role),
          user_category: category,
          department: user.department || 'General',
          status: 'active',
          login_attempts: 0,
          permissions: {},
          dashboard_access: getDashboardAccess(user.role, category),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    console.log(`📝 Prepared ${unifiedUsers.length} unified users`);
    
    // Insert in batches to avoid timeout
    const batchSize = 10;
    for (let i = 0; i < unifiedUsers.length; i += batchSize) {
      const batch = unifiedUsers.slice(i, i + batchSize);
      console.log(`📤 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(unifiedUsers.length/batchSize)}...`);
      
      const { error: insertError } = await supabase
        .from('unified_users')
        .insert(batch);
      
      if (insertError) {
        console.error('❌ Error inserting batch:', insertError);
        console.log('Batch data:', JSON.stringify(batch, null, 2));
        return;
      }
    }
    
    console.log('✅ Successfully populated unified_users table!');
    
    // Verify the data
    const { data: verifyData, error: verifyError } = await supabase
      .from('unified_users')
      .select('name, phone, role, user_category')
      .eq('status', 'active');
    
    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
    } else {
      console.log(`🔍 Verification: ${verifyData.length} active users in unified_users table`);
      console.log('Sample users:');
      verifyData.slice(0, 5).forEach(user => {
        console.log(`  - ${user.name} | ${user.phone} | ${user.role} | ${user.user_category}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the population
populateUnifiedUsers().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});