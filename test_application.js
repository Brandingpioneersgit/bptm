/**
 * Comprehensive Test Script for BP Agency Dashboard
 * 
 * This script tests the core functionality of the application, including:
 * - Authentication system
 * - Role-based access control
 * - Dashboard rendering
 * - Navigation between pages
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ADMIN_ACCESS_TOKEN = process.env.VITE_ADMIN_ACCESS_TOKEN;

// Initialize Supabase client with admin token
const supabase = createClient(SUPABASE_URL, ADMIN_ACCESS_TOKEN);

// Test users for different roles
const TEST_USERS = [
  { role: 'Super Admin', name: 'Admin', phone: '9876543225' },
  { role: 'SEO', name: 'John SEO', phone: '9876543210' },
  { role: 'Ads', name: 'Sarah Ads', phone: '9876543211' },
  { role: 'Social Media', name: 'Mike Social', phone: '9876543212' },
  { role: 'YouTube SEO', name: 'Lisa YouTube', phone: '9876543213' },
  { role: 'Web Developer', name: 'David Developer', phone: '9876543214' },
  { role: 'Graphic Designer', name: 'Emma Designer', phone: '9876543215' },
];

// Helper function to normalize phone number
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  
  return phone
    .replace(/^\+91-?/, '') // Remove +91 country code
    .replace(/[\s\-\(\)]/g, '') // Remove spaces, dashes, parentheses
    .replace(/^0/, ''); // Remove leading zero if present
}

// Test authentication
async function testAuthentication() {
  console.log('\n🔐 TESTING AUTHENTICATION SYSTEM');
  console.log('==============================');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const user of TEST_USERS) {
    try {
      console.log(`\nTesting login for ${user.name} (${user.role})...`);
      
      // Query the user from the database
      const { data: users, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${user.name}%`)
        .eq('status', 'active');
      
      if (searchError) {
        console.error('❌ Database search error:', searchError);
        failureCount++;
        continue;
      }
      
      if (!users || users.length === 0) {
        console.error(`❌ No user found with name starting with "${user.name}"`);
        failureCount++;
        continue;
      }
      
      // Find matching user
      const matchingUser = users.find(u => {
        const userFirstName = u.name.split(' ')[0].toLowerCase();
        const inputFirstName = user.name.split(' ')[0].toLowerCase();
        return userFirstName === inputFirstName;
      });
      
      if (!matchingUser) {
        console.error(`❌ No exact match found for "${user.name}"`);
        failureCount++;
        continue;
      }
      
      // Validate phone number
      const userPhone = normalizePhoneNumber(matchingUser.phone);
      const inputPhone = normalizePhoneNumber(user.phone);
      
      if (userPhone !== inputPhone) {
        console.error(`❌ Phone number mismatch for ${user.name}:`, { 
          expected: userPhone, 
          provided: inputPhone 
        });
        failureCount++;
        continue;
      }
      
      console.log(`✅ Authentication successful for ${user.name}`);
      console.log(`   Role: ${matchingUser.role}`);
      console.log(`   Dashboard access: ${matchingUser.dashboard_access || 'Not specified'}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error testing authentication for ${user.name}:`, error);
      failureCount++;
    }
  }
  
  console.log('\n📊 AUTHENTICATION TEST SUMMARY');
  console.log(`✅ Successful: ${successCount}/${TEST_USERS.length}`);
  console.log(`❌ Failed: ${failureCount}/${TEST_USERS.length}`);
  
  return { successCount, failureCount };
}

// Test role-based access control
async function testRoleBasedAccess() {
  console.log('\n🔒 TESTING ROLE-BASED ACCESS CONTROL');
  console.log('===================================');
  
  // Define expected dashboard access for each role
  const EXPECTED_ACCESS = {
    'Super Admin': ['super_admin_dashboard', 'all_dashboards', 'profile'],
    'SEO': ['seo_dashboard', 'employee_dashboard', 'profile'],
    'Ads': ['ads_dashboard', 'employee_dashboard', 'profile'],
    'Social Media': ['social_dashboard', 'employee_dashboard', 'profile'],
    'YouTube SEO': ['youtube_dashboard', 'employee_dashboard', 'profile'],
    'Web Developer': ['dev_dashboard', 'employee_dashboard', 'profile'],
    'Graphic Designer': ['design_dashboard', 'employee_dashboard', 'profile']
  };
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const user of TEST_USERS) {
    try {
      console.log(`\nTesting access control for ${user.name} (${user.role})...`);
      
      // Query the user from the database
      const { data: users, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${user.name}%`)
        .eq('status', 'active');
      
      if (searchError || !users || users.length === 0) {
        console.error(`❌ Could not find user ${user.name}`);
        failureCount++;
        continue;
      }
      
      // Find matching user
      const matchingUser = users.find(u => {
        const userFirstName = u.name.split(' ')[0].toLowerCase();
        const inputFirstName = user.name.split(' ')[0].toLowerCase();
        return userFirstName === inputFirstName;
      });
      
      if (!matchingUser) {
        console.error(`❌ No exact match found for "${user.name}"`);
        failureCount++;
        continue;
      }
      
      // Check if user has expected dashboard access
      const expectedAccess = EXPECTED_ACCESS[matchingUser.role];
      const actualAccess = matchingUser.dashboard_access || [];
      
      if (!expectedAccess) {
        console.error(`❌ No expected dashboard access defined for role ${matchingUser.role}`);
        failureCount++;
        continue;
      }
      
      // Check if all expected dashboards are accessible
      const missingAccess = expectedAccess.filter(dashboard => !actualAccess.includes(dashboard));
      
      if (missingAccess.length > 0) {
        console.error(`❌ Missing dashboard access for ${user.name}:`, missingAccess);
        failureCount++;
        continue;
      }
      
      console.log(`✅ Access control verified for ${user.name}`);
      console.log(`   Role: ${matchingUser.role}`);
      console.log(`   Dashboard access: ${actualAccess.join(', ')}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error testing access control for ${user.name}:`, error);
      failureCount++;
    }
  }
  
  console.log('\n📊 ACCESS CONTROL TEST SUMMARY');
  console.log(`✅ Successful: ${successCount}/${TEST_USERS.length}`);
  console.log(`❌ Failed: ${failureCount}/${TEST_USERS.length}`);
  
  return { successCount, failureCount };
}

// Run all tests
async function runAllTests() {
  console.log('🧪 STARTING COMPREHENSIVE APPLICATION TESTING');
  console.log('===========================================');
  
  const authResults = await testAuthentication();
  const accessResults = await testRoleBasedAccess();
  
  console.log('\n📋 OVERALL TEST SUMMARY');
  console.log('=======================');
  console.log(`Authentication: ${authResults.successCount}/${TEST_USERS.length} passed`);
  console.log(`Access Control: ${accessResults.successCount}/${TEST_USERS.length} passed`);
  
  const totalSuccess = authResults.successCount + accessResults.successCount;
  const totalTests = TEST_USERS.length * 2;
  const successRate = Math.round((totalSuccess / totalTests) * 100);
  
  console.log(`\nOverall Success Rate: ${successRate}%`);
  
  if (successRate === 100) {
    console.log('\n✅ ALL TESTS PASSED! The application is functioning correctly.');
  } else {
    console.log(`\n⚠️ SOME TESTS FAILED. Please review the logs and fix the issues.`);
  }
}

// Execute tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
});