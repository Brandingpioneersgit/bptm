/**
 * Create Missing Test Users
 * 
 * This script creates the missing test users identified in the comprehensive test script.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ADMIN_ACCESS_TOKEN = process.env.VITE_ADMIN_ACCESS_TOKEN;

// Initialize Supabase client with admin token
const supabase = createClient(SUPABASE_URL, ADMIN_ACCESS_TOKEN);

// Missing test users to create
const MISSING_USERS = [
  { 
    name: 'Lisa Social', 
    phone: '9876543212', 
    email: 'lisa.social@example.com',
    role: 'Social Media',
    user_category: 'employee',
    department: 'Marketing',
    dashboard_access: ['social_dashboard', 'employee_dashboard', 'profile'],
    status: 'active'
  },
  { 
    name: 'Mike YouTube', 
    phone: '9876543213', 
    email: 'mike.youtube@example.com',
    role: 'YouTube SEO',
    user_category: 'employee',
    department: 'Marketing',
    dashboard_access: ['youtube_dashboard', 'employee_dashboard', 'profile'],
    status: 'active'
  },
  { 
    name: 'HR Manager', 
    phone: '9876543214', 
    email: 'hr.manager@example.com',
    role: 'HR',
    user_category: 'admin',
    department: 'Human Resources',
    dashboard_access: ['hr_dashboard', 'admin_dashboard', 'profile'],
    status: 'active'
  },
  { 
    name: 'Finance Manager', 
    phone: '9876543215', 
    email: 'finance.manager@example.com',
    role: 'Accountant',
    user_category: 'admin',
    department: 'Finance',
    dashboard_access: ['accounting_dashboard', 'admin_dashboard', 'profile'],
    status: 'active'
  }
];

// Create missing users
async function createMissingUsers() {
  console.log('🔧 CREATING MISSING TEST USERS');
  console.log('=============================');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const user of MISSING_USERS) {
    try {
      console.log(`\nCreating user: ${user.name} (${user.role})...`);
      
      // Check if user already exists
      const { data: existingUsers, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${user.name}%`);
      
      if (searchError) {
        console.error('❌ Error checking for existing user:', searchError);
        failureCount++;
        continue;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log(`⚠️ User with similar name already exists: ${existingUsers[0].name}`);
        console.log('   Skipping creation...');
        continue;
      }
      
      // Generate a short user_id (format: USRxxx)
      const userId = `USR${Math.floor(100 + Math.random() * 900)}`; // 3-digit random number
      
      // Insert new user
      const { data, error } = await supabase
        .from('unified_users')
        .insert([
          {
            user_id: userId,
            name: user.name,
            phone: user.phone,
            email: user.email,
            password_hash: 'test123', // Default password for testing
            role: user.role,
            user_category: user.user_category,
            department: user.department,
            dashboard_access: user.dashboard_access,
            status: user.status,
            employment_type: 'full_time',
            permissions: { submit_forms: true, read_own_data: true },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) {
        console.error(`❌ Error creating user ${user.name}:`, error);
        failureCount++;
        continue;
      }
      
      console.log(`✅ Successfully created user: ${user.name}`);
      console.log(`   ID: ${data[0].id}`);
      console.log(`   Role: ${data[0].role}`);
      console.log(`   Dashboard access: ${data[0].dashboard_access}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Unexpected error creating user ${user.name}:`, error);
      failureCount++;
    }
  }
  
  console.log('\n📊 USER CREATION SUMMARY');
  console.log(`✅ Successfully created: ${successCount}/${MISSING_USERS.length}`);
  console.log(`❌ Failed: ${failureCount}/${MISSING_USERS.length}`);
  
  return { successCount, failureCount };
}

// Run the script
createMissingUsers().catch(error => {
  console.error('Error running script:', error);
});