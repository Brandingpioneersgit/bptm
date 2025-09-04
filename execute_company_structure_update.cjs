const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function executeCompanyStructureUpdate() {
  try {
    console.log('Starting company structure update...');

    // 1. Create departments table
    console.log('1. Creating departments table...');
    const { error: deptError } = await supabase
      .from('departments')
      .select('id')
      .limit(1);
    
    if (deptError && deptError.code === 'PGRST116') {
      // Table doesn't exist, create it using raw SQL
      const createDeptSQL = `
        CREATE TABLE departments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          head_employee_id UUID,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      // Since we can't use exec_sql, we'll use the SQL editor approach
      console.log('Please run this SQL in Supabase SQL Editor:');
      console.log(createDeptSQL);
    }

    // 2. Insert departments data
    console.log('2. Inserting departments...');
    const departments = [
      { name: 'Web', description: 'Web development and design team' },
      { name: 'Marketing', description: 'SEO and digital marketing team' },
      { name: 'Social Media', description: 'Social media management and content creation' },
      { name: 'Performance Ads', description: 'Paid advertising and performance marketing' },
      { name: 'AI', description: 'Artificial intelligence and automation team' },
      { name: 'Management', description: 'Management, Accounting, Sales, and HR' }
    ];

    for (const dept of departments) {
      const { error } = await supabase
        .from('departments')
        .upsert(dept, { onConflict: 'name' });
      
      if (error) {
        console.log(`Department ${dept.name} may already exist or table not created yet`);
      } else {
        console.log(`✓ Department ${dept.name} created/updated`);
      }
    }

    // 3. Update employees table with new department values
    console.log('3. Updating existing employees with new department structure...');
    
    // Get current employees and update their departments to match new structure
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, department');
    
    if (empError) {
      console.error('Error fetching employees:', empError);
    } else {
      console.log(`Found ${employees.length} employees to update`);
      
      // Map old departments to new ones
      const departmentMapping = {
        'Engineering': 'Web',
        'Marketing': 'Marketing',
        'Operations Head': 'Management',
        'Web Head': 'Web',
        'HR': 'Management',
        'Sales': 'Management',
        'Accounts': 'Management',
        'Blended (HR + Sales)': 'Management'
      };
      
      for (const employee of employees) {
        const newDepartment = departmentMapping[employee.department] || 'Management';
        
        if (newDepartment !== employee.department) {
          const { error: updateError } = await supabase
            .from('employees')
            .update({ department: newDepartment })
            .eq('id', employee.id);
          
          if (updateError) {
            console.error(`Error updating ${employee.name}:`, updateError);
          } else {
            console.log(`✓ Updated ${employee.name}: ${employee.department} → ${newDepartment}`);
          }
        }
      }
    }

    // 4. Add management team
    console.log('4. Adding management team...');
    
    const managementTeam = [
      {
        name: 'Arush Thapar',
        phone: '+91-9999999001',
        email: 'arush@company.com',
        department: 'Web',
        employee_type: 'Full-time',
        status: 'Active',
        hire_date: '2023-01-01',
        role: ['Web Team Lead', 'SEO Team Lead']
      },
      {
        name: 'Nishu Sharma',
        phone: '+91-9999999002',
        email: 'nishu@company.com',
        department: 'Performance Ads',
        employee_type: 'Full-time',
        status: 'Active',
        hire_date: '2023-01-01',
        role: ['Ads Team Lead', 'Social Media Manager']
      }
    ];

    for (const manager of managementTeam) {
      const { error } = await supabase
        .from('employees')
        .upsert(manager, { onConflict: 'phone' });
      
      if (error) {
        console.error(`Error adding ${manager.name}:`, error);
      } else {
        console.log(`✓ Added/updated manager: ${manager.name}`);
      }
    }

    // 5. Verify the updates
    console.log('5. Verifying updates...');
    
    const { data: updatedEmployees, error: verifyError } = await supabase
      .from('employees')
      .select('name, department, role')
      .order('name');
    
    if (verifyError) {
      console.error('Error verifying updates:', verifyError);
    } else {
      console.log('\n=== UPDATED EMPLOYEE STRUCTURE ===');
      const departmentGroups = {};
      
      updatedEmployees.forEach(emp => {
        if (!departmentGroups[emp.department]) {
          departmentGroups[emp.department] = [];
        }
        departmentGroups[emp.department].push(emp);
      });
      
      Object.keys(departmentGroups).sort().forEach(dept => {
        console.log(`\n${dept} Department:`);
        departmentGroups[dept].forEach(emp => {
          const roles = Array.isArray(emp.role) ? emp.role.join(', ') : emp.role || 'No role assigned';
          console.log(`  - ${emp.name} (${roles})`);
        });
      });
    }

    console.log('\n✅ Company structure update completed!');
    
  } catch (error) {
    console.error('Error during company structure update:', error);
  }
}

executeCompanyStructureUpdate();