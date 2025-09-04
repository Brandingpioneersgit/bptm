import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_ADMIN_ACCESS_TOKEN
);

async function syncUsersToEmployees() {
  console.log('Syncing users from unified_users to employees table...');
  
  try {
    // Get all users from unified_users
    const { data: unifiedUsers, error: usersError } = await supabase
      .from('unified_users')
      .select('id, name, role, department, phone, email');
      
    if (usersError) {
      console.error('Error fetching unified users:', usersError);
      return;
    }
    
    console.log(`Found ${unifiedUsers?.length || 0} users in unified_users`);
    
    if (!unifiedUsers || unifiedUsers.length === 0) {
      console.log('No users found in unified_users table');
      return;
    }
    
    // Get existing employees to avoid duplicates
    const { data: existingEmployees, error: empError } = await supabase
      .from('employees')
      .select('id, name, phone');
      
    if (empError) {
      console.error('Error fetching existing employees:', empError);
      return;
    }
    
    console.log(`Found ${existingEmployees?.length || 0} existing employees`);
    
    // Filter out users that already exist in employees table
    const newEmployees = unifiedUsers.filter(user => {
      return !existingEmployees?.some(emp => 
        emp.phone === user.phone || emp.name === user.name
      );
    });
    
    console.log(`${newEmployees.length} new employees to add`);
    
    if (newEmployees.length === 0) {
      console.log('All users already exist in employees table');
      
      // Check if IDs match between tables
      console.log('\nChecking ID alignment between tables...');
      for (const user of unifiedUsers) {
        const matchingEmployee = existingEmployees?.find(emp => 
          emp.phone === user.phone || emp.name === user.name
        );
        if (matchingEmployee && matchingEmployee.id !== user.id) {
          console.log(`⚠️  ID mismatch: ${user.name} - unified_users: ${user.id}, employees: ${matchingEmployee.id}`);
        }
      }
      
      return;
    }
    
    // Convert unified_users to employees format
    const employeesToInsert = newEmployees.map(user => ({
      id: user.id, // Use same ID to maintain relationship
      name: user.name,
      phone: user.phone,
      email: user.email,
      department: mapDepartment(user.department),
      role: Array.isArray(user.role) ? user.role : [user.role || 'Employee'],
      employee_type: 'Full-time',
      work_location: 'Office',
      status: 'Active',
      hire_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('Inserting new employees...');
    
    // Insert in batches
    const batchSize = 5;
    let insertedCount = 0;
    
    for (let i = 0; i < employeesToInsert.length; i += batchSize) {
      const batch = employeesToInsert.slice(i, i + batchSize);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('employees')
        .insert(batch)
        .select();
        
      if (insertError) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, insertError);
      } else {
        insertedCount += insertedData?.length || 0;
        console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}: ${insertedData?.length || 0} employees`);
      }
    }
    
    console.log(`\n✅ Total inserted: ${insertedCount} employees`);
    
    // Verify the sync
    const { data: finalEmployees, error: finalError } = await supabase
      .from('employees')
      .select('id, name, role, department')
      .limit(15);
      
    if (finalError) {
      console.error('Error verifying employees:', finalError);
    } else {
      console.log(`\n📊 Final employees count: ${finalEmployees?.length || 0}`);
      finalEmployees?.forEach(emp => {
        console.log(`- ${emp.name} (${Array.isArray(emp.role) ? emp.role.join(', ') : emp.role}) - ${emp.department}`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Helper function to map department names
function mapDepartment(department) {
  const departmentMap = {
    'Marketing': 'Marketing',
    'Web Development': 'Web',
    'Operations': 'Operations Head',
    'HR': 'HR',
    'Sales': 'Sales',
    'Accounts': 'Accounts',
    'Admin': 'Operations Head'
  };
  
  return departmentMap[department] || 'Marketing';
}

syncUsersToEmployees().catch(console.error);