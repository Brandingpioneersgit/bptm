import { supabase } from './src/shared/lib/supabase.js';

/**
 * Test script to verify the login functionality directly
 */
async function testLoginApi() {
  console.log('🔍 Testing login API directly...');
  
  // Test users
  const testUsers = [
    { firstName: 'John', phone: '9876543210', expectedRole: 'SEO' },
    { firstName: 'Sarah', phone: '9876543211', expectedRole: 'Ads' },
    { firstName: 'Admin', phone: '9876543225', expectedRole: 'Super Admin' }
  ];
  
  for (const testUser of testUsers) {
    console.log(`\n🔄 Testing login for ${testUser.firstName}...`);
    
    try {
      // Step 1: Search for user by first name
      console.log(`Step 1: Searching for user with first name "${testUser.firstName}"...`);
      
      const { data: users, error: searchError } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testUser.firstName}%`)
        .eq('status', 'active');
        
      if (searchError) {
        console.error('❌ Search error:', searchError);
        continue;
      }
      
      console.log(`Found ${users?.length || 0} users matching "${testUser.firstName}%"`);
      
      if (!users || users.length === 0) {
        console.log('❌ No users found');
        continue;
      }
      
      // Step 2: Find exact match by first name
      console.log('Step 2: Finding exact first name match...');
      
      const matchingUser = users.find(user => {
        const userFirstName = user.name.split(' ')[0].toLowerCase();
        return userFirstName === testUser.firstName.toLowerCase();
      });
      
      if (!matchingUser) {
        console.log('❌ No exact first name match found');
        continue;
      }
      
      console.log(`✅ Found user: ${matchingUser.name} (${matchingUser.role})`);
      
      // Step 3: Validate phone number
      console.log('Step 3: Validating phone number...');
      
      const normalizePhone = (phone) => {
        return phone
          .replace(/^\+91-?/, '')
          .replace(/[\s\-\(\)]/g, '')
          .replace(/^0/, '');
      };
      
      const userPhone = normalizePhone(matchingUser.phone);
      const inputPhone = normalizePhone(testUser.phone);
      
      console.log(`User phone: ${matchingUser.phone} → ${userPhone}`);
      console.log(`Input phone: ${testUser.phone} → ${inputPhone}`);
      
      if (userPhone !== inputPhone) {
        console.log('❌ Phone number mismatch');
        continue;
      }
      
      console.log('✅ Phone number matches');
      
      // Step 4: Validate role
      console.log('Step 4: Validating role...');
      
      if (matchingUser.role !== testUser.expectedRole) {
        console.log(`❌ Role mismatch: expected ${testUser.expectedRole}, got ${matchingUser.role}`);
        continue;
      }
      
      console.log(`✅ Role matches: ${matchingUser.role}`);
      
      // Step 5: Generate session token
      console.log('Step 5: Generating session token...');
      
      const generateSessionToken = (userId) => {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2);
        return `${userId}_${timestamp}_${randomString}`;
      };
      
      const sessionToken = generateSessionToken(matchingUser.id);
      console.log(`✅ Session token generated: ${sessionToken.substring(0, 20)}...`);
      
      // Step 6: Create session data
      console.log('Step 6: Creating session data...');
      
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      const sessionData = {
        sessionId: sessionToken,
        userId: matchingUser.id,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      };
      
      console.log('✅ Session data created');
      
      // Step 7: Determine dashboard route
      console.log('Step 7: Determining dashboard route...');
      
      const getDashboardRoute = (role) => {
        const roleRoutes = {
          'Super Admin': '/super-admin',
          'Operations Head': '/admin',
          'Manager': '/admin',
          'HR': '/admin',
          'Accountant': '/admin',
          'Sales': '/admin',
          'SEO': '/employee',
          'Ads': '/employee',
          'Social Media': '/employee',
          'YouTube SEO': '/employee',
          'Web Developer': '/employee',
          'Graphic Designer': '/employee',
          'Freelancer': '/employee',
          'Intern': '/employee',
          'Client': '/client'
        };
      
        return roleRoutes[role] || '/dashboard';
      };
      
      const dashboardRoute = getDashboardRoute(matchingUser.role);
      console.log(`✅ Dashboard route: ${dashboardRoute}`);
      
      console.log(`\n✅ Login test PASSED for ${testUser.firstName}`);
      
    } catch (error) {
      console.error(`❌ Error testing login for ${testUser.firstName}:`, error);
    }
  }
}

testLoginApi().catch(console.error);