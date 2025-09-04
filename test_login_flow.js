// Test script to verify the login flow and role-based routing
import { AuthenticationService } from './src/features/auth/AuthenticationService.js';

// Test users from the database
const testUsers = [
  { firstName: 'John', phone: '9876543210', expectedRole: 'SEO', expectedRoute: '/employee' },
  { firstName: 'Sarah', phone: '9876543211', expectedRole: 'Ads', expectedRoute: '/employee' },
  { firstName: 'Mike', phone: '9876543212', expectedRole: 'Social Media', expectedRoute: '/employee' },
  { firstName: 'Lisa', phone: '9876543213', expectedRole: 'YouTube SEO', expectedRoute: '/employee' },
  { firstName: 'David', phone: '9876543214', expectedRole: 'Web Developer', expectedRoute: '/employee' },
  { firstName: 'Emma', phone: '9876543215', expectedRole: 'Graphic Designer', expectedRoute: '/employee' },
  { firstName: 'Jennifer', phone: '9876543221', expectedRole: 'Operations Head', expectedRoute: '/admin' },
  { firstName: 'Michael', phone: '9876543222', expectedRole: 'Accountant', expectedRoute: '/admin' },
  { firstName: 'Amanda', phone: '9876543223', expectedRole: 'Sales', expectedRoute: '/admin' },
  { firstName: 'Rachel', phone: '9876543224', expectedRole: 'HR', expectedRoute: '/admin' },
  { firstName: 'Admin', phone: '9876543225', expectedRole: 'Super Admin', expectedRoute: '/super-admin' }
];

async function testLoginFlow() {
  console.log('🧪 Testing Login Flow and Role-Based Routing\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testUser of testUsers) {
    try {
      console.log(`Testing: ${testUser.firstName} (${testUser.phone})`);
      
      // Test authentication
      const authResult = await AuthenticationService.authenticateUser(
        testUser.firstName, 
        testUser.phone
      );
      
      if (!authResult.success) {
        console.log(`❌ Authentication failed: ${authResult.error}`);
        failedTests++;
        continue;
      }
      
      // Verify role
      if (authResult.user.role !== testUser.expectedRole) {
        console.log(`❌ Role mismatch: expected ${testUser.expectedRole}, got ${authResult.user.role}`);
        failedTests++;
        continue;
      }
      
      // Verify dashboard route
      const dashboardRoute = AuthenticationService.getDashboardRoute(authResult.user.role);
      if (dashboardRoute !== testUser.expectedRoute) {
        console.log(`❌ Route mismatch: expected ${testUser.expectedRoute}, got ${dashboardRoute}`);
        failedTests++;
        continue;
      }
      
      console.log(`✅ Success: ${authResult.user.name} → ${authResult.user.role} → ${dashboardRoute}`);
      passedTests++;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      failedTests++;
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Login system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the database and user data.');
  }
}

// Test invalid credentials
async function testInvalidCredentials() {
  console.log('\n🔒 Testing Invalid Credentials\n');
  
  const invalidTests = [
    { firstName: 'NonExistent', phone: '0000000000', expectedError: 'User with first name "NonExistent" not found' },
    { firstName: 'John', phone: '1111111111', expectedError: 'Incorrect phone number. Please try again.' },
    { firstName: '', phone: '9876543210', expectedError: 'First name and phone number are required' },
    { firstName: 'John', phone: '', expectedError: 'First name and phone number are required' }
  ];
  
  for (const test of invalidTests) {
    try {
      console.log(`Testing invalid: "${test.firstName}" + "${test.phone}"`);
      
      const result = await AuthenticationService.authenticateUser(test.firstName, test.phone);
      
      if (result.success) {
        console.log(`❌ Expected failure but got success`);
      } else if (result.error === test.expectedError) {
        console.log(`✅ Correct error: ${result.error}`);
      } else {
        console.log(`⚠️  Different error: expected "${test.expectedError}", got "${result.error}"`);
      }
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run tests
if (typeof window === 'undefined') {
  // Running in Node.js
  console.log('⚠️  This test requires browser environment with Supabase connection.');
  console.log('Please run this test in the browser console or as part of the application.');
} else {
  // Running in browser
  testLoginFlow().then(() => {
    return testInvalidCredentials();
  }).catch(console.error);
}

export { testLoginFlow, testInvalidCredentials };