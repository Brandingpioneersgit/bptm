const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://igwgryykglsetfvomhdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createSimplifiedUserSystem() {
  console.log('🏗️ Creating simplified user system...');
  
  try {
    // First, let's check what tables currently exist
    console.log('🔍 Checking existing tables...');
    
    // Check if unified_users exists
    const { data: unifiedUsers, error: unifiedError } = await supabase
      .from('unified_users')
      .select('*')
      .limit(1);
    
    if (unifiedError) {
      console.log('❌ unified_users table not found:', unifiedError.message);
    } else {
      console.log('✅ unified_users table exists');
    }
    
    // Since we can't create tables via the client API, let's create test users
    // using the existing unified_users structure but with simplified data
    console.log('\n📝 Creating test users with simplified structure...');
    
    const testUsers = [
      {
        user_id: 'USR001',
        name: 'John',
        email: 'john@company.com',
        phone: '9876543210',
        password_hash: 'password123',
        role: 'Marketing',
        user_category: 'employee',
        department: 'Marketing',
        employee_id: 'EMP001',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['Digital Marketing'],
        dashboard_access: ['employee_dashboard'],
        permissions: {},
        status: 'active'
      },
      {
        user_id: 'USR002',
        name: 'Sarah',
        email: 'sarah@company.com',
        phone: '9876543211',
        password_hash: 'password123',
        role: 'Development',
        user_category: 'employee',
        department: 'Development',
        employee_id: 'EMP002',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['Web Development'],
        dashboard_access: ['employee_dashboard'],
        permissions: {},
        status: 'active'
      },
      {
        user_id: 'USR003',
        name: 'Mike',
        email: 'mike@company.com',
        phone: '9876543212',
        password_hash: 'password123',
        role: 'Design',
        user_category: 'employee',
        department: 'Design',
        employee_id: 'EMP003',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['Graphic Design'],
        dashboard_access: ['employee_dashboard'],
        permissions: {},
        status: 'active'
      },
      {
        user_id: 'USR004',
        name: 'Lisa',
        email: 'lisa@company.com',
        phone: '9876543213',
        password_hash: 'password123',
        role: 'Operations',
        user_category: 'employee',
        department: 'Operations',
        employee_id: 'EMP004',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['Operations Management'],
        dashboard_access: ['employee_dashboard'],
        permissions: {},
        status: 'active'
      },
      {
        user_id: 'USR005',
        name: 'Admin',
        email: 'admin@company.com',
        phone: '9876543214',
        password_hash: 'password123',
        role: 'HR',
        user_category: 'admin',
        department: 'HR',
        employee_id: 'EMP005',
        hire_date: '2024-01-01',
        employment_type: 'full_time',
        skills: ['HR Management'],
        dashboard_access: ['admin_dashboard'],
        permissions: { admin: true },
        status: 'active'
      }
    ];
    
    // Insert test users
    for (const user of testUsers) {
      console.log(`📝 Creating user: ${user.name} (${user.phone})`);
      
      const { data, error } = await supabase
        .from('unified_users')
        .insert([user])
        .select();
      
      if (error) {
        console.error(`❌ Error creating ${user.name}:`, error.message);
      } else {
        console.log(`✅ Created ${user.name} successfully`);
      }
    }
    
    console.log('\n🎉 Simplified user system created!');
    console.log('\n📋 Test Login Credentials:');
    console.log('Format: firstname | phone (10 digits) | password | department');
    console.log('----------------------------------------');
    testUsers.forEach(user => {
      console.log(`${user.name} | ${user.phone} | password123 | ${user.department}`);
    });
    
    console.log('\n🌐 You can now test the simplified login system!');
    
  } catch (error) {
    console.error('❌ Error creating simplified user system:', error);
  }
}

// Run the function
createSimplifiedUserSystem().catch(console.error);