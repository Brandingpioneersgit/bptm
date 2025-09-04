import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('Service Key:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const demoUsers = [
  {
    email: 'admin@homapeg.com',
    password: 'admin123',
    full_name: 'Admin Super',
    role: 'Super Admin',
    category: 'admin',
    status: 'active'
  },
  {
    email: 'hr@homapeg.com',
    password: 'hr123',
    full_name: 'Sarah HR',
    role: 'HR',
    category: 'management',
    status: 'active'
  },
  {
    email: 'manager@homapeg.com',
    password: 'manager123',
    full_name: 'John Manager',
    role: 'Manager',
    category: 'management',
    status: 'active'
  },
  {
    email: 'employee@homapeg.com',
    password: 'employee123',
    full_name: 'Alice Employee',
    role: 'Employee',
    category: 'employee',
    status: 'active'
  },
  {
    email: 'freelancer@homapeg.com',
    password: 'freelancer123',
    full_name: 'Bob Freelancer',
    role: 'Freelancer',
    category: 'freelancer',
    status: 'active'
  },
  {
    email: 'intern@homapeg.com',
    password: 'intern123',
    full_name: 'Emma Intern',
    role: 'Intern',
    category: 'intern',
    status: 'active'
  }
];

async function createDemoUsers() {
  console.log('Creating demo users for Homapeg Agency Dashboard...');
  
  for (const userData of demoUsers) {
    try {
      console.log(`\nCreating user: ${userData.full_name} (${userData.email})`);
      
      // First, try to create the auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
          category: userData.category
        }
      });
      
      if (authError) {
        console.error(`Auth creation failed for ${userData.email}:`, authError.message);
        continue;
      }
      
      console.log(`✓ Auth user created for ${userData.email}`);
      
      // Then create the profile in unified_users table
      const { data: profileData, error: profileError } = await supabase
        .from('unified_users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          category: userData.category,
          status: userData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (profileError) {
        console.error(`Profile creation failed for ${userData.email}:`, profileError.message);
        // Try to clean up the auth user if profile creation failed
        await supabase.auth.admin.deleteUser(authData.user.id);
        continue;
      }
      
      console.log(`✓ Profile created for ${userData.email}`);
      console.log(`  Role: ${userData.role}`);
      console.log(`  Category: ${userData.category}`);
      
    } catch (error) {
      console.error(`Unexpected error creating ${userData.email}:`, error.message);
    }
  }
  
  console.log('\n=== Demo Users Creation Complete ===');
  console.log('\nYou can now login with:');
  demoUsers.forEach(user => {
    console.log(`${user.role}: ${user.email} / ${user.password}`);
  });
}

// Check if unified_users table exists and has proper structure
async function checkDatabase() {
  console.log('Checking database structure...');
  
  try {
    const { data, error } = await supabase
      .from('unified_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Database check failed:', error.message);
      return false;
    }
    
    console.log('✓ unified_users table is accessible');
    return true;
  } catch (error) {
    console.error('Database check error:', error.message);
    return false;
  }
}

async function main() {
  const dbOk = await checkDatabase();
  if (!dbOk) {
    console.log('\nPlease ensure the unified_users table exists and RLS policies allow inserts.');
    process.exit(1);
  }
  
  await createDemoUsers();
}

main().catch(console.error);