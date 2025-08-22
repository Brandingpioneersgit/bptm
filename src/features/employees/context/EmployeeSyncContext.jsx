import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { ensureEmployeesTableExists, getAllEmployees, getOrCreateEmployee, getEmployeeByIdentity } from '@/utils/createEmployeesTable.js';

const EmployeeSyncContext = createContext(null);

export const useEmployeeSync = () => {
  const context = useContext(EmployeeSyncContext);
  if (!context) {
    throw new Error('useEmployeeSync must be used within an EmployeeSyncProvider');
  }
  return context;
};

export const EmployeeSyncProvider = ({ children }) => {
  const supabase = useSupabase();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchEmployees = useCallback(async (force = false, retryCount = 0) => {
    if (!supabase) {
      // Running in local mode - load from localStorage
      try {
        const localData = localStorage.getItem('codex_employees') || '[]';
        const employees = JSON.parse(localData);
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
      setEmployees([]);
      setLoading(false);
      return [];
    }
  }, [supabase]);

  useEffect(() => {
    fetchEmployees(true);
  }, [fetchEmployees]);

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
    return employees.some(employee => 
      employee.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      employee.phone.trim() === phone.trim()
    );
  }, [employees]);

  const findEmployeeByIdentity = useCallback((name, phone) => {
    if (!name || !phone) return null;
    return employees.find(employee => 
      employee.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      employee.phone.trim() === phone.trim()
    );
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

  const value = {
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
  };

  return (
    <EmployeeSyncContext.Provider value={value}>
      {children}
    </EmployeeSyncContext.Provider>
  );
};