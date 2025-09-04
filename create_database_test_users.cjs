const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Test users to add to the database
const testUsers = [
  // Employees table users
  {
    name: 'Sarah Marketing',
    phone: '9876543230',
    email: 'sarah.marketing@company.com',
    department: 'Marketing',
    role: ['Marketing Manager'],
    employee_type: 'Full-time',
    work_location: 'Office',
    status: 'Active',
    hire_date: '2023-01-15',
    direct_manager: 'John Manager',
    performance_rating: 4.5,
    appraisal_date: '2023-12-15',
    personal_info: {},
    contact_info: {},
    professional_info: {},
    financial_info: {},
    is_active: true
  },
  {
    name: 'David Developer',
    phone: '9876543231',
    email: 'david.dev@company.com',
    department: 'Technology',
    role: ['Senior Developer'],
    employee_type: 'Full-time',
    work_location: 'Remote',
    status: 'Active',
    hire_date: '2022-08-20',
    direct_manager: 'Tech Lead',
    performance_rating: 4.8,
    appraisal_date: '2023-12-15',
    personal_info: {},
    contact_info: {},
    professional_info: {},
    financial_info: {},
    is_active: true
  },
  {
    name: 'Lisa Finance',
    phone: '9876543232',
    email: 'lisa.finance@company.com',
    department: 'Finance',
    role: ['Finance Manager'],
    employee_type: 'Full-time',
    work_location: 'Office',
    status: 'Active',
    hire_date: '2023-03-10',
    direct_manager: 'CFO',
    performance_rating: 4.3,
    appraisal_date: '2023-12-15',
    personal_info: {},
    contact_info: {},
    professional_info: {},
    financial_info: {},
    is_active: true
  },
  {
    name: 'Tom Operations',
    phone: '9876543233',
    email: 'tom.ops@company.com',
    department: 'Operations',
    role: ['Operations Manager'],
    employee_type: 'Full-time',
    work_location: 'Office',
    status: 'Active',
    hire_date: '2022-11-05',
    direct_manager: 'COO',
    performance_rating: 4.6,
    appraisal_date: '2023-12-15',
    personal_info: {},
    contact_info: {},
    professional_info: {},
    financial_info: {},
    is_active: true
  },
  {
    name: 'Emma Designer',
    phone: '9876543234',
    email: 'emma.design@company.com',
    department: 'Creative',
    role: ['UI/UX Designer'],
    employee_type: 'Full-time',
    work_location: 'Hybrid',
    status: 'Active',
    hire_date: '2023-06-01',
    direct_manager: 'Design Lead',
    performance_rating: 4.4,
    appraisal_date: '2023-12-15',
    personal_info: {},
    contact_info: {},
    professional_info: {},
    financial_info: {},
    is_active: true
  }
];

// Users table entries (simpler structure)
const simpleUsers = [
  {
    name: 'Kevin Sales',
    email: 'kevin.sales@company.com',
    phone: '9876543235',
    role: 'Sales Manager',
    department: 'Sales',
    is_active: true
  },
  {
    name: 'Nina Support',
    email: 'nina.support@company.com',
    phone: '9876543236',
    role: 'Customer Support',
    department: 'Support',
    is_active: true
  },
  {
    name: 'Ryan Analytics',
    email: 'ryan.analytics@company.com',
    phone: '9876543237',
    role: 'Data Analyst',
    department: 'Analytics',
    is_active: true
  }
];

async function clearExistingTestUsers() {
  console.log('🧹 Clearing existing test users...');
  
  // Clear from employees table
  const { error: empError } = await supabase
    .from('employees')
    .delete()
    .in('phone', testUsers.map(u => u.phone));
  
  if (empError) {
    console.log('⚠️ Note: Could not clear employees:', empError.message);
  }
  
  // Clear from users table
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .in('phone', simpleUsers.map(u => u.phone));
  
  if (userError) {
    console.log('⚠️ Note: Could not clear users:', userError.message);
  }
}

async function createEmployees() {
  console.log('👥 Creating employees...');
  
  const { data, error } = await supabase
    .from('employees')
    .insert(testUsers)
    .select();
  
  if (error) {
    console.error('❌ Error creating employees:', error);
    return false;
  }
  
  console.log(`✅ Created ${data.length} employees successfully`);
  return true;
}

async function createUsers() {
  console.log('👤 Creating users...');
  
  const { data, error } = await supabase
    .from('users')
    .insert(simpleUsers)
    .select();
  
  if (error) {
    console.error('❌ Error creating users:', error);
    return false;
  }
  
  console.log(`✅ Created ${data.length} users successfully`);
  return true;
}

async function testLogin(name, phone) {
  // Normalize phone number
  const normalizedPhone = phone.startsWith('+91-') ? phone : `+91-${phone}`;
  
  // Check employees table
  const { data: empData } = await supabase
    .from('employees')
    .select('*')
    .eq('name', name)
    .eq('phone', phone)
    .single();
  
  // Check users table
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('name', name)
    .eq('phone', phone)
    .single();
  
  return empData || userData;
}

async function testAllCredentials() {
  console.log('\n🧪 Testing all database credentials...');
  console.log('=' .repeat(50));
  
  let passCount = 0;
  let totalCount = 0;
  
  // Test employees
  for (const user of testUsers) {
    totalCount++;
    const result = await testLogin(user.name, user.phone);
    if (result) {
      console.log(`✅ ${user.name} - PASS (${user.role})`);
      passCount++;
    } else {
      console.log(`❌ ${user.name} - FAIL`);
    }
  }
  
  // Test users
  for (const user of simpleUsers) {
    totalCount++;
    const result = await testLogin(user.name, user.phone);
    if (result) {
      console.log(`✅ ${user.name} - PASS (${user.role})`);
      passCount++;
    } else {
      console.log(`❌ ${user.name} - FAIL`);
    }
  }
  
  console.log('\n📊 Database Test Results:');
  console.log(`${passCount}/${totalCount} credentials work in database`);
  
  return passCount === totalCount;
}

async function main() {
  console.log('🎯 Database Test User Creation');
  console.log('=' .repeat(60));
  
  try {
    await clearExistingTestUsers();
    
    const empSuccess = await createEmployees();
    const userSuccess = await createUsers();
    
    if (empSuccess || userSuccess) {
      const allPass = await testAllCredentials();
      
      if (allPass) {
        console.log('\n🎉 All database users created and tested successfully!');
        console.log('\n📋 Database Login Instructions:');
        console.log('1. Use any of the created names and phone numbers');
        console.log('2. The system will find them in the database');
        console.log('3. If database fails, local fallback will be used');
        
        console.log('\n🔑 Quick Test Credentials (Database):');
        console.log('- Name: "Sarah Marketing", Phone: "9876543230"');
        console.log('- Name: "David Developer", Phone: "9876543231"');
        console.log('- Name: "Kevin Sales", Phone: "9876543235"');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testUsers, simpleUsers, testAllCredentials };