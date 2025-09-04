import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Role mapping from user_accounts to unified_users format
const ROLE_MAPPING = {
  'employee': 'Web Developer', // Default for employees
  'manager': 'Operations Head',
  'hr': 'HR Manager',
  'admin': 'Super Admin'
};

// User category mapping
const USER_CATEGORY_MAPPING = {
  'Web Developer': 'employee',
  'SEO': 'employee',
  'Ads': 'employee',
  'Social Media': 'employee',
  'YouTube SEO': 'employee',
  'Graphic Designer': 'employee',
  'Freelancer': 'freelancer',
  'Intern': 'intern',
  'Operations Head': 'management',
  'HR Manager': 'management',
  'Super Admin': 'super_admin'
};

async function migrateUsersToUnified() {
  console.log('🔄 Starting migration from user_accounts to unified_users...');
  
  try {
    // First, get all users from user_accounts
    const { data: userAccounts, error: fetchError } = await supabase
      .from('user_accounts')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching user accounts:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${userAccounts.length} users in user_accounts table`);
    
    // Check if unified_users table exists and is empty
    const { data: existingUsers, error: checkError } = await supabase
      .from('unified_users')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking unified_users table:', checkError);
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️ unified_users table already has data. Skipping migration.');
      return;
    }
    
    // Migrate each user
    const migratedUsers = [];
    let userIdCounter = 1;
    
    for (const user of userAccounts) {
      // Map role from user_accounts to unified_users format
      const mappedRole = ROLE_MAPPING[user.role] || 'Web Developer';
      const userCategory = USER_CATEGORY_MAPPING[mappedRole] || 'employee';
      
      // Generate user_id in format USR001, USR002, etc.
      const userId = `USR${userIdCounter.toString().padStart(3, '0')}`;
      
      const unifiedUser = {
        user_id: userId,
        name: user.full_name || `${user.first_name} ${user.last_name}`,
        email: user.email,
        phone: user.phone || `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`, // Generate phone if missing
        password_hash: 'password123', // Default password for testing
        role: mappedRole,
        user_category: userCategory,
        department: user.department || 'Technology',
        status: user.is_active ? 'active' : 'inactive',
        login_attempts: user.failed_login_attempts || 0,
        account_locked: user.is_locked || false,
        permissions: {},
        dashboard_access: []
      };
      
      migratedUsers.push(unifiedUser);
      userIdCounter++;
    }
    
    console.log('📝 Inserting users into unified_users table...');
    
    // Insert all users into unified_users table
    const { data: insertedUsers, error: insertError } = await supabase
      .from('unified_users')
      .insert(migratedUsers)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting users:', insertError);
      return;
    }
    
    console.log(`✅ Successfully migrated ${insertedUsers.length} users to unified_users table`);
    
    // Display migrated users
    console.log('\n📋 Migrated Users:');
    insertedUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - Category: ${user.user_category}`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Test Login Credentials:');
    insertedUsers.forEach(user => {
      console.log(`Email: ${user.email} | Password: password123`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateUsersToUnified().catch(console.error);