import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN // This is the service role key
);

async function populateTestUsers() {
  console.log('Populating test users and performance data...');
  
  // First, let's check if we need to clear existing users
  console.log('Checking existing users...');
  const { data: existingUsers, error: checkError } = await supabase
    .from('unified_users')
    .select('name')
    .limit(5);
    
  if (checkError) {
    console.error('Error checking existing users:', checkError);
    return;
  }
  
  console.log('Existing users count:', existingUsers?.length || 0);
  
  const testUsers = [
    {
      user_id: 'USR002',
      name: 'John SEO',
      phone: '+91-9876543210',
      email: 'john.seo@testcompany.com',
      password_hash: '$2b$10$hashedpassword2',
      role: 'SEO',
      user_category: 'employee',
      department: 'Marketing',
      status: 'active',
      dashboard_access: ['seo_dashboard', 'employee_dashboard'],
      permissions: { read: true, write: true }
    },
    {
      user_id: 'USR003',
      name: 'Sarah Ads',
      phone: '+91-9876543211',
      email: 'sarah.ads@testcompany.com',
      password_hash: '$2b$10$hashedpassword3',
      role: 'Ads',
      user_category: 'employee',
      department: 'Marketing',
      status: 'active',
      dashboard_access: ['ads_dashboard', 'employee_dashboard'],
      permissions: { read: true, write: true }
    },
    {
      user_id: 'USR004',
      name: 'Mike Social',
      phone: '+91-9876543212',
      email: 'mike.social@testcompany.com',
      password_hash: '$2b$10$hashedpassword4',
      role: 'Social Media',
      user_category: 'employee',
      department: 'Marketing',
      status: 'active',
      dashboard_access: ['social_dashboard', 'employee_dashboard'],
      permissions: { read: true, write: true }
    },
    {
      user_id: 'USR005',
      name: 'Lisa YouTube',
      phone: '+91-9876543213',
      email: 'lisa.youtube@testcompany.com',
      password_hash: '$2b$10$hashedpassword5',
      role: 'YouTube SEO',
      user_category: 'employee',
      department: 'Marketing',
      status: 'active',
      dashboard_access: ['youtube_dashboard', 'employee_dashboard'],
      permissions: { read: true, write: true }
    },
    {
      user_id: 'USR006',
      name: 'David Dev',
      phone: '+91-9876543214',
      email: 'david.dev@testcompany.com',
      password_hash: '$2b$10$hashedpassword6',
      role: 'Web Developer',
      user_category: 'employee',
      department: 'Technology',
      status: 'active',
      dashboard_access: ['dev_dashboard', 'employee_dashboard'],
      permissions: { read: true, write: true }
    },
    {
      user_id: 'USR007',
      name: 'Emma Design',
      phone: '+91-9876543215',
      email: 'emma.design@testcompany.com',
      password_hash: '$2b$10$hashedpassword7',
      role: 'Graphic Designer',
      user_category: 'employee',
      department: 'Creative',
      status: 'active',
      dashboard_access: ['design_dashboard', 'employee_dashboard'],
      permissions: { read: true, write: true }
    }
  ];
  
  // Insert users
  console.log('Inserting test users...');
  const { data: insertedUsers, error: userError } = await supabase
    .from('unified_users')
    .insert(testUsers)
    .select();
    
  if (userError) {
    console.error('Error inserting users:', userError);
  } else {
    console.log(`✅ Successfully inserted ${insertedUsers?.length || 0} users`);
  }
  
  // Now create performance data for these users
  if (insertedUsers && insertedUsers.length > 0) {
    console.log('Creating performance data...');
    
    const performanceData = insertedUsers.map((user, index) => ({
      employee_id: user.id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      overall_score: 8.5 + (Math.random() * 1.5), // Random score between 8.5-10
      growth_percentage: (Math.random() * 20) - 10, // Random growth between -10% to +10%
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data: perfData, error: perfError } = await supabase
      .from('monthly_kpi_reports')
      .insert(performanceData)
      .select();
      
    if (perfError) {
      console.error('Error inserting performance data:', perfError);
    } else {
      console.log(`✅ Successfully inserted ${perfData?.length || 0} performance records`);
    }
  }
  
  // Verify the insertion
  console.log('\nVerifying inserted users:');
  const { data: allUsers, error: fetchError } = await supabase
    .from('unified_users')
    .select('name, role, department')
    .order('name');
    
  if (fetchError) {
    console.error('Error fetching users:', fetchError);
  } else {
    console.log('Total users in unified_users:', allUsers?.length || 0);
    console.log('Users:', allUsers);
  }
  
  // Test the leaderboard query
  console.log('\nTesting leaderboard query:');
  const { data: leaderboardData, error: leaderboardError } = await supabase
    .from('monthly_kpi_reports')
    .select(`
      overall_score,
      growth_percentage,
      unified_users!inner(name, role, department)
    `)
    .not('overall_score', 'is', null)
    .order('overall_score', { ascending: false })
    .limit(10);
    
  if (leaderboardError) {
    console.error('Error with leaderboard query:', leaderboardError);
  } else {
    console.log('Leaderboard data:', leaderboardData);
  }
}

populateTestUsers().catch(console.error);