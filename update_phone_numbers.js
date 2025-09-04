import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function updatePhoneNumbers() {
  console.log('🔍 Checking current phone numbers in database...');
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('unified_users')
      .select('id, name, phone')
      .order('name');
      
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('\nCurrent phone numbers:');
    users.forEach(user => {
      console.log(`${user.name}: ${user.phone}`);
    });
    
    // Check if any phone numbers have +91 prefix
    const usersWithPrefix = users.filter(user => user.phone && user.phone.startsWith('+91'));
    
    if (usersWithPrefix.length === 0) {
      console.log('\n✅ All phone numbers are already in correct format (no +91 prefix)');
      return;
    }
    
    console.log(`\n🔧 Found ${usersWithPrefix.length} users with +91 prefix. Updating...`);
    
    // Update phone numbers to remove +91 prefix
    for (const user of usersWithPrefix) {
      const normalizedPhone = user.phone.replace(/^\+91-?/, '');
      
      const { error: updateError } = await supabase
        .from('unified_users')
        .update({ phone: normalizedPhone })
        .eq('id', user.id);
        
      if (updateError) {
        console.error(`❌ Error updating ${user.name}:`, updateError);
      } else {
        console.log(`✅ Updated ${user.name}: ${user.phone} → ${normalizedPhone}`);
      }
    }
    
    console.log('\n🎉 Phone number update complete!');
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const { data: updatedUsers, error: verifyError } = await supabase
      .from('unified_users')
      .select('id, name, phone')
      .order('name');
      
    if (verifyError) {
      console.error('Error verifying updates:', verifyError);
      return;
    }
    
    console.log('\nUpdated phone numbers:');
    updatedUsers.forEach(user => {
      console.log(`${user.name}: ${user.phone}`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Test authentication with updated phone numbers
async function testAuthentication() {
  console.log('\n🧪 Testing authentication with updated phone numbers...');
  
  const testCases = [
    { firstName: 'John', phone: '9876543210' },
    { firstName: 'Sarah', phone: '9876543211' },
    { firstName: 'Admin', phone: '9876543225' }
  ];
  
  for (const testCase of testCases) {
    try {
      // Search for user by first name (case-insensitive)
      const { data: users, error } = await supabase
        .from('unified_users')
        .select('*')
        .ilike('name', `${testCase.firstName}%`)
        .eq('status', 'active');
        
      if (error) {
        console.error(`❌ Database error for ${testCase.firstName}:`, error);
        continue;
      }
      
      if (!users || users.length === 0) {
        console.log(`❌ User not found: ${testCase.firstName}`);
        continue;
      }
      
      // Find exact match by first name
      const matchingUser = users.find(user => {
        const userFirstName = user.name.split(' ')[0].toLowerCase();
        return userFirstName === testCase.firstName.toLowerCase();
      });
      
      if (!matchingUser) {
        console.log(`❌ No exact match for: ${testCase.firstName}`);
        continue;
      }
      
      // Check phone number
      const normalizedUserPhone = matchingUser.phone.replace(/^\+91-?/, '').replace(/[\s\-\(\)]/g, '');
      const normalizedInputPhone = testCase.phone.replace(/^\+91-?/, '').replace(/[\s\-\(\)]/g, '');
      
      if (normalizedUserPhone === normalizedInputPhone) {
        console.log(`✅ ${testCase.firstName} authentication would succeed`);
        console.log(`   Name: ${matchingUser.name}, Role: ${matchingUser.role}`);
      } else {
        console.log(`❌ ${testCase.firstName} phone mismatch: expected ${normalizedInputPhone}, got ${normalizedUserPhone}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${testCase.firstName}:`, error);
    }
  }
}

updatePhoneNumbers().then(() => {
  return testAuthentication();
}).catch(console.error);