import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { ensureEmployeesTableExists, getAllEmployees, getOrCreateEmployee, getEmployeeByIdentity } from '@/utils/createEmployeesTable.js';
import { createErrorHandler } from '@/shared/utils/errorHandler';
import { useToast } from '@/shared/components/Toast';

const EmployeeSyncContext = createContext(null);

// Custom hook - must be exported before the component for Fast Refresh compatibility
export const useEmployeeSync = () => {
  const context = useContext(EmployeeSyncContext);
  if (!context) {
    throw new Error('useEmployeeSync must be used within an EmployeeSyncProvider');
  }
  return context;
};

export const EmployeeSyncProvider = React.memo(({ children }) => {
  const { supabase } = useSupabase();
  const { notify } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [errorHandler, setErrorHandler] = useState(null);
  
  // Initialize error handler when supabase is available
  useEffect(() => {
    if (supabase && notify) {
      setErrorHandler(createErrorHandler(supabase, notify));
    }
  }, [supabase, notify]);

  const fetchEmployees = useCallback(async (force = false, retryCount = 0) => {
    if (!supabase) {
      // Running in local mode - load from localStorage
      try {
        const localData = localStorage.getItem('codex_employees') || '[]';
        let employees = JSON.parse(localData);
        
        // If no employees found, populate with test data
        if (employees.length === 0) {
          console.log('No employees found in localStorage, populating with test data...');
          const testEmployees = [
            {
              id: 'emp_001',
              full_name: 'Jessica Martinez',
              name: 'Jessica Martinez',
              phone: '5551234567',
              email: 'jessica.martinez@company.com',
              department: 'Web',
              role: ['Developer', 'Designer'],
              status: 'Active',
              hire_date: '2023-01-15',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'emp_002',
              full_name: 'David Thompson',
              name: 'David Thompson',
              phone: '5551234568',
              email: 'david.thompson@company.com',
              department: 'Marketing',
              role: ['Marketing Manager', 'Content Creator'],
              status: 'Active',
                hire_date: '2023-02-20',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'emp_003',
              full_name: 'Sarah Chen',
              name: 'Sarah Chen',
              phone: '5551234569',
              email: 'sarah.chen@company.com',
              department: 'Sales',
              role: ['Sales Executive', 'Client Manager'],
              status: 'Active',
                hire_date: '2023-03-10',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'emp_004',
              full_name: 'Michael Rodriguez',
              name: 'Michael Rodriguez',
              phone: '5551234570',
              email: 'michael.rodriguez@company.com',
              department: 'HR',
              role: ['HR Manager'],
              status: 'Active',
                hire_date: '2023-04-05',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'emp_005',
              full_name: 'Emily Johnson',
              name: 'Emily Johnson',
              phone: '5551234571',
              email: 'emily.johnson@company.com',
              department: 'Web',
              role: ['Full Stack Developer'],
              status: 'Active',
                hire_date: '2023-05-12',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'emp_006',
              full_name: 'Alex Williams',
              name: 'Alex Williams',
              phone: '5551234572',
              email: 'alex.williams@company.com',
              department: 'Marketing',
              role: ['Digital Marketing Specialist'],
              status: 'Active',
                hire_date: '2023-06-18',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          
          localStorage.setItem('codex_employees', JSON.stringify(testEmployees));
          employees = testEmployees;
          console.log('✅ Populated localStorage with', testEmployees.length, 'test employees');
        }
        
        setEmployees(employees);
        setLoading(false);
        return employees;
      } catch (error) {
        console.error('Error loading local employees:', error);
        setEmployees([]);
        setLoading(false);
        return [];
      }
    }

    try {
      if (force) setLoading(true);
      
      // Ensure table exists first
      const tableExists = await ensureEmployeesTableExists(supabase);
      if (Array.isArray(tableExists)) {
        // Table doesn't exist, use empty array
        setEmployees(tableExists);
        setLoading(false);
        return tableExists;
      }
      
      const data = await getAllEmployees(supabase);
      setEmployees(data || []);
      setLastRefresh(Date.now());
      setLoading(false);
      return data || [];
      
    } catch (error) {
      console.error('Error fetching employees in sync context:', error);
      
      if (errorHandler) {
        await errorHandler.database.handleError(error, 'fetch employees');
      } else {
        console.warn('Error handler not available, using fallback');
      }
      
      setEmployees([]);
      setLoading(false);
      return [];
    }
  }, [supabase]);

  // Real-time subscription for employees table
  useEffect(() => {
    if (!supabase) {
      // In local mode, just fetch once
      fetchEmployees(true);
      return;
    }

    console.log('👥 Setting up real-time employee subscriptions...');

    // Subscribe to employees table changes
    const employeesSubscription = supabase
      .channel('employees_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        (payload) => {
          console.log('👥 Real-time employees update:', payload.eventType);
          // Refresh employees data when changes occur
          fetchEmployees(true);
        }
      )
      .subscribe();

    // Initial fetch
    fetchEmployees(true);

    return () => {
      console.log('👥 Cleaning up employee subscriptions...');
      employeesSubscription.unsubscribe();
    };
  }, [supabase, fetchEmployees]);

  const addEmployee = useCallback(async (employeeData) => {
    if (!supabase) {
      // Running in local mode - save to localStorage
      try {
        const localData = localStorage.getItem('codex_employees') || '[]';
        const employees = JSON.parse(localData);
        const newEmployee = {
          id: `local_${Date.now()}`,
          ...employeeData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const newEmployees = [newEmployee, ...employees];
        localStorage.setItem('codex_employees', JSON.stringify(newEmployees));
        setEmployees(newEmployees);
        return newEmployee;
      } catch (error) {
        console.error('Error saving employee to local storage:', error);
        return null;
      }
    }

    try {
      const employee = await getOrCreateEmployee(supabase, employeeData);
      
      // Update local state
      setEmployees(prev => {
        const existing = prev.find(e => e.id === employee.id);
        if (existing) {
          return prev.map(e => e.id === employee.id ? employee : e);
        } else {
          return [employee, ...prev];
        }
      });
      
      return employee;
    } catch (error) {
      console.error('Error adding employee:', error);
      
      if (errorHandler) {
        await errorHandler.database.handleError(error, 'add employee', { employeeData });
      } else {
        notify({
          type: 'error',
          title: 'Failed to Add Employee',
          message: 'Unable to add employee. Please try again.',
          duration: 5000
        });
      }
      
      return null;
    }
  }, [supabase]);

  const updateEmployee = useCallback(async (employeeData) => {
    if (!supabase) {
      // Running in local mode
      try {
        const localData = localStorage.getItem('codex_employees') || '[]';
        const employees = JSON.parse(localData);
        const updatedEmployees = employees.map(e => 
          e.id === employeeData.id ? { ...e, ...employeeData, updated_at: new Date().toISOString() } : e
        );
        localStorage.setItem('codex_employees', JSON.stringify(updatedEmployees));
        setEmployees(updatedEmployees);
        return employeeData;
      } catch (error) {
        console.error('Error updating employee in local storage:', error);
        return null;
      }
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('id', employeeData.id)
        .select('*')
        .single();

      if (error) throw error;

      setEmployees(prev => prev.map(e => e.id === data.id ? data : e));
      return data;
    } catch (error) {
      console.error('Error updating employee:', error);
      
      if (errorHandler) {
        await errorHandler.database.handleError(error, 'update employee', { employeeData });
      } else {
        notify({
          type: 'error',
          title: 'Failed to Update Employee',
          message: 'Unable to update employee. Please try again.',
          duration: 5000
        });
      }
      
      return null;
    }
  }, [supabase]);

  const removeEmployee = useCallback(async (employeeId) => {
    if (!supabase) {
      // Running in local mode
      try {
        const localData = localStorage.getItem('codex_employees') || '[]';
        const employees = JSON.parse(localData);
        const filteredEmployees = employees.filter(e => e.id !== employeeId);
        localStorage.setItem('codex_employees', JSON.stringify(filteredEmployees));
        setEmployees(filteredEmployees);
        return true;
      } catch (error) {
        console.error('Error removing employee from local storage:', error);
        return false;
      }
    }

    try {
      const { error } = await supabase
        .from('employees')
        .update({ status: 'Inactive' })
        .eq('id', employeeId);

      if (error) throw error;

      setEmployees(prev => prev.filter(e => e.id !== employeeId));
      return true;
    } catch (error) {
      console.error('Error removing employee:', error);
      return false;
    }
  }, [supabase]);

  const refreshEmployees = useCallback(() => fetchEmployees(true), [fetchEmployees]);

  const getEmployeesByDepartment = useCallback((department) => {
    if (department === 'All') return employees;
    return employees.filter(employee => employee.department === department);
  }, [employees]);

  const getEmployeesByStatus = useCallback((status) => {
    if (status === 'All') return employees;
    return employees.filter(employee => employee.status === status);
  }, [employees]);

  const getActiveEmployees = useCallback(() => {
    return employees.filter(employee => employee.status === 'Active');
  }, [employees]);

  const getEmployeeOptions = useCallback(() => {
    const activeEmployees = getActiveEmployees();
    return activeEmployees.map(employee => ({
      value: `${employee.name}|${employee.phone}`,
      label: `${employee.name} (${employee.department})`,
      name: employee.name,
      phone: employee.phone,
      department: employee.department,
      role: employee.role,
      id: employee.id
    }));
  }, [getActiveEmployees]);

  const employeeExists = useCallback((name, phone) => {
    if (!name || !phone) return false;
    
    // Normalize the input phone number (remove +91- prefix if present)
    const normalizedInputPhone = phone.trim().replace(/^\+91-?/, '');
    
    return employees.some(employee => {
      // Normalize the employee phone number for comparison
      const normalizedEmployeePhone = employee.phone.trim().replace(/^\+91-?/, '');
      
      return employee.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        (normalizedEmployeePhone === normalizedInputPhone ||
         employee.phone.trim() === phone.trim());
    });
  }, [employees]);

  const findEmployeeByIdentity = useCallback((name, phone) => {
    if (!name || !phone) return null;
    
    // Normalize the input phone number (remove +91- prefix if present)
    const normalizedInputPhone = phone.trim().replace(/^\+91-?/, '');
    
    return employees.find(employee => {
      // Normalize the employee phone number for comparison
      const normalizedEmployeePhone = employee.phone.trim().replace(/^\+91-?/, '');
      
      return employee.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        (normalizedEmployeePhone === normalizedInputPhone ||
         employee.phone.trim() === phone.trim());
    });
  }, [employees]);

  const getEmployeeByIdentity = useCallback(async (name, phone) => {
    // First check local cache
    const localEmployee = findEmployeeByIdentity(name, phone);
    if (localEmployee) {
      return localEmployee;
    }

    // If not in cache and we have supabase, fetch from database
    if (supabase) {
      try {
        const employee = await getEmployeeByIdentity(supabase, name, phone);
        if (employee) {
          // Add to local cache
          setEmployees(prev => {
            const exists = prev.find(e => e.id === employee.id);
            if (!exists) {
              return [employee, ...prev];
            }
            return prev;
          });
        }
        return employee;
      } catch (error) {
        console.error('Error fetching employee by identity:', error);
        return null;
      }
    }

    return null;
  }, [supabase, findEmployeeByIdentity]);

  const value = useMemo(() => ({
    employees,
    loading,
    lastRefresh,
    addEmployee,
    updateEmployee,
    removeEmployee,
    refreshEmployees,
    getEmployeesByDepartment,
    getEmployeesByStatus,
    getActiveEmployees,
    getEmployeeOptions,
    employeeExists,
    findEmployeeByIdentity,
    getEmployeeByIdentity
  }), [employees, loading, lastRefresh, addEmployee, updateEmployee, removeEmployee, refreshEmployees, getEmployeesByDepartment, getEmployeesByStatus, getActiveEmployees, getEmployeeOptions, employeeExists, findEmployeeByIdentity, getEmployeeByIdentity]);

  return (
    <EmployeeSyncContext.Provider value={value}>
      {children}
    </EmployeeSyncContext.Provider>
  );
});