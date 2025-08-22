// Utility to handle employees table existence and operations
export async function ensureEmployeesTableExists(supabase) {
  if (!supabase) {
    console.log('No Supabase client available');
    return false;
  }

  try {
    // First, try to query the employees table to see if it exists
    const { data, error } = await supabase
      .from('employees')
      .select('count')
      .limit(1);

    if (!error) {
      console.log('Employees table already exists');
      return true;
    }

    if (error.code === 'PGRST205') {
      console.log('⚠️  Employees table does not exist in the database.');
      console.log('📋 Please create the employees table manually in your Supabase dashboard.');
      console.log('💡 You can use the SQL from /sql/create_employees_table.sql');
      
      // Return empty array instead of failing
      return [];
    }
    
    console.error('Unexpected error checking employees table:', error);
    return [];
    
  } catch (error) {
    console.error('Error in ensureEmployeesTableExists:', error);
    return [];
  }
}

// Get or create employee record
export async function getOrCreateEmployee(supabase, employeeData) {
  if (!supabase) {
    console.log('No Supabase client available - running in local mode');
    return employeeData;
  }

  try {
    const { name, phone, department, role } = employeeData;
    
    if (!name || !phone) {
      throw new Error('Employee name and phone are required');
    }

    // First, try to find existing employee
    const { data: existingEmployee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', name)
      .eq('phone', phone)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected for new employees
      throw fetchError;
    }

    if (existingEmployee) {
      // Employee exists, update if needed
      const needsUpdate = 
        existingEmployee.department !== department ||
        JSON.stringify(existingEmployee.role) !== JSON.stringify(role);

      if (needsUpdate) {
        const { data: updatedEmployee, error: updateError } = await supabase
          .from('employees')
          .update({
            department,
            role,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEmployee.id)
          .select('*')
          .single();

        if (updateError) throw updateError;
        console.log('✅ Employee updated:', updatedEmployee.name);
        return updatedEmployee;
      }

      console.log('✅ Employee found:', existingEmployee.name);
      return existingEmployee;
    }

    // Employee doesn't exist, create new one
    const { data: newEmployee, error: createError } = await supabase
      .from('employees')
      .insert({
        name,
        phone,
        email: `${phone}@company.com`, // Default email
        department,
        role,
        status: 'Active'
      })
      .select('*')
      .single();

    if (createError) throw createError;
    console.log('✅ Employee created:', newEmployee.name);
    return newEmployee;

  } catch (error) {
    console.error('Error in getOrCreateEmployee:', error);
    // Return the original data as fallback
    return employeeData;
  }
}

// Get all employees for dropdown
export async function getAllEmployees(supabase) {
  if (!supabase) {
    console.log('No Supabase client available - running in local mode');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'Active')
      .order('name');

    if (error) {
      if (error.code === 'PGRST205') {
        console.log('Employees table does not exist');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

// Get employee by name and phone
export async function getEmployeeByIdentity(supabase, name, phone) {
  if (!supabase || !name || !phone) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('name', name)
      .eq('phone', phone)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching employee by identity:', error);
    return null;
  }
}