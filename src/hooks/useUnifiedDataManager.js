import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';

/**
 * Unified Data Manager Hook
 * 
 * Centralizes all data fetching and synchronization to eliminate conflicts
 * between multiple data sources. Provides a single source of truth for:
 * - Employee data
 * - Submission data
 * - Client data
 * - Performance metrics
 */
export function useUnifiedDataManager() {
  const [state, setState] = useState({
    employees: [],
    submissions: [],
    clients: [],
    loading: {
      employees: true,
      submissions: true,
      clients: true
    },
    error: null,
    lastUpdated: null,
    syncStatus: 'idle' // 'idle', 'syncing', 'error', 'success'
  });

  const { supabase } = useSupabase();
  const { user } = useUnifiedAuth();
  const { notify } = useToast();
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  const syncInProgressRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Safe state updates only when component is mounted
  const safeSetState = useCallback((updater) => {
    if (isMountedRef.current) {
      setState(updater);
    }
  }, []);

  // Load employees data
  const loadEmployees = useCallback(async () => {
    try {
      safeSetState(prev => ({
        ...prev,
        loading: { ...prev.loading, employees: true },
        error: null
      }));

      let employeesData = [];

      if (supabase) {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        employeesData = data || [];
      } else {
        // Fallback to localStorage
        const cached = localStorage.getItem('unified_employees_data');
        if (cached) {
          employeesData = JSON.parse(cached);
        } else {
          // Create default employees for demo
          employeesData = createDefaultEmployees();
          localStorage.setItem('unified_employees_data', JSON.stringify(employeesData));
        }
      }

      safeSetState(prev => ({
        ...prev,
        employees: employeesData,
        loading: { ...prev.loading, employees: false },
        lastUpdated: new Date().toISOString()
      }));

      return employeesData;
    } catch (error) {
      console.error('Error loading employees:', error);
      safeSetState(prev => ({
        ...prev,
        loading: { ...prev.loading, employees: false },
        error: error.message
      }));
      return [];
    }
  }, [supabase, safeSetState]);

  // Load submissions data
  const loadSubmissions = useCallback(async () => {
    try {
      safeSetState(prev => ({
        ...prev,
        loading: { ...prev.loading, submissions: true },
        error: null
      }));

      let submissionsData = [];

      if (supabase) {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        submissionsData = data || [];
      } else {
        // Fallback to localStorage
        const cached = localStorage.getItem('unified_submissions_data');
        if (cached) {
          submissionsData = JSON.parse(cached);
        } else {
          // Create default submissions for demo
          submissionsData = createDefaultSubmissions();
          localStorage.setItem('unified_submissions_data', JSON.stringify(submissionsData));
        }
      }

      safeSetState(prev => ({
        ...prev,
        submissions: submissionsData,
        loading: { ...prev.loading, submissions: false },
        lastUpdated: new Date().toISOString()
      }));

      return submissionsData;
    } catch (error) {
      console.error('Error loading submissions:', error);
      safeSetState(prev => ({
        ...prev,
        loading: { ...prev.loading, submissions: false },
        error: error.message
      }));
      return [];
    }
  }, [supabase, safeSetState]);

  // Load clients data
  const loadClients = useCallback(async () => {
    try {
      safeSetState(prev => ({
        ...prev,
        loading: { ...prev.loading, clients: true },
        error: null
      }));

      let clientsData = [];

      if (supabase) {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;
        clientsData = data || [];
      } else {
        // Fallback to localStorage
        const cached = localStorage.getItem('unified_clients_data');
        if (cached) {
          clientsData = JSON.parse(cached);
        } else {
          // Create default clients for demo
          clientsData = createDefaultClients();
          localStorage.setItem('unified_clients_data', JSON.stringify(clientsData));
        }
      }

      safeSetState(prev => ({
        ...prev,
        clients: clientsData,
        loading: { ...prev.loading, clients: false },
        lastUpdated: new Date().toISOString()
      }));

      return clientsData;
    } catch (error) {
      console.error('Error loading clients:', error);
      safeSetState(prev => ({
        ...prev,
        loading: { ...prev.loading, clients: false },
        error: error.message
      }));
      return [];
    }
  }, [supabase, safeSetState]);

  // Sync all data
  const syncAllData = useCallback(async (showNotification = false) => {
    if (syncInProgressRef.current) {
      return; // Prevent concurrent syncs
    }

    try {
      syncInProgressRef.current = true;
      safeSetState(prev => ({
        ...prev,
        syncStatus: 'syncing',
        error: null
      }));

      const [employees, submissions, clients] = await Promise.all([
        loadEmployees(),
        loadSubmissions(),
        loadClients()
      ]);

      safeSetState(prev => ({
        ...prev,
        syncStatus: 'success',
        lastUpdated: new Date().toISOString()
      }));

      if (showNotification) {
        notify({
          type: 'success',
          title: 'Data Synced',
          message: 'All dashboard data has been updated successfully.'
        });
      }

      return { employees, submissions, clients };
    } catch (error) {
      console.error('Error syncing data:', error);
      safeSetState(prev => ({
        ...prev,
        syncStatus: 'error',
        error: error.message
      }));

      if (showNotification) {
        notify({
          type: 'error',
          title: 'Sync Failed',
          message: 'Failed to sync dashboard data. Please try again.'
        });
      }

      throw error;
    } finally {
      syncInProgressRef.current = false;
    }
  }, [loadEmployees, loadSubmissions, loadClients, safeSetState, notify]);

  // Initial data load
  useEffect(() => {
    if (user) {
      syncAllData();
    }
  }, [user, syncAllData]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      syncAllData(false); // Silent sync
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, syncAllData]);

  // Update employee
  const updateEmployee = useCallback(async (employeeId, updates) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('employees')
          .update(updates)
          .eq('id', employeeId);

        if (error) throw error;
      } else {
        // Update localStorage
        const currentEmployees = state.employees;
        const updatedEmployees = currentEmployees.map(emp => 
          emp.id === employeeId ? { ...emp, ...updates } : emp
        );
        localStorage.setItem('unified_employees_data', JSON.stringify(updatedEmployees));
      }

      // Update local state
      safeSetState(prev => ({
        ...prev,
        employees: prev.employees.map(emp => 
          emp.id === employeeId ? { ...emp, ...updates } : emp
        ),
        lastUpdated: new Date().toISOString()
      }));

      notify({
        type: 'success',
        title: 'Employee Updated',
        message: 'Employee information has been updated successfully.'
      });

      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      notify({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update employee information.'
      });
      return false;
    }
  }, [supabase, state.employees, safeSetState, notify]);

  // Update submission
  const updateSubmission = useCallback(async (submissionId, updates) => {
    try {
      if (supabase) {
        const { error } = await supabase
          .from('submissions')
          .update(updates)
          .eq('id', submissionId);

        if (error) throw error;
      } else {
        // Update localStorage
        const currentSubmissions = state.submissions;
        const updatedSubmissions = currentSubmissions.map(sub => 
          sub.id === submissionId ? { ...sub, ...updates } : sub
        );
        localStorage.setItem('unified_submissions_data', JSON.stringify(updatedSubmissions));
      }

      // Update local state
      safeSetState(prev => ({
        ...prev,
        submissions: prev.submissions.map(sub => 
          sub.id === submissionId ? { ...sub, ...updates } : sub
        ),
        lastUpdated: new Date().toISOString()
      }));

      notify({
        type: 'success',
        title: 'Submission Updated',
        message: 'Submission has been updated successfully.'
      });

      return true;
    } catch (error) {
      console.error('Error updating submission:', error);
      notify({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update submission.'
      });
      return false;
    }
  }, [supabase, state.submissions, safeSetState, notify]);

  // Get employee by ID
  const getEmployee = useCallback((employeeId) => {
    return state.employees.find(emp => emp.id === employeeId);
  }, [state.employees]);

  // Get submissions by employee
  const getEmployeeSubmissions = useCallback((employeeId) => {
    return state.submissions.filter(sub => 
      sub.employeeId === employeeId || 
      sub.employee?.id === employeeId ||
      (sub.employee?.name && sub.employee?.phone && 
       state.employees.find(emp => emp.id === employeeId && 
         emp.name === sub.employee.name && emp.phone === sub.employee.phone))
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [state.submissions, state.employees]);

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentMonthSubmissions = state.submissions.filter(sub => 
      sub.monthKey === currentMonth || 
      new Date(sub.created_at).toISOString().slice(0, 7) === currentMonth
    );

    return {
      totalEmployees: state.employees.length,
      activeEmployees: state.employees.filter(emp => emp.status === 'active').length,
      currentMonthSubmissions: currentMonthSubmissions.length,
      pendingReviews: currentMonthSubmissions.filter(sub => !sub.manager?.reviewed).length,
      averageScore: currentMonthSubmissions.length > 0 
        ? currentMonthSubmissions.reduce((sum, sub) => sum + (sub.scores?.overall || 0), 0) / currentMonthSubmissions.length
        : 0,
      totalClients: state.clients.length,
      activeClients: state.clients.filter(client => client.status === 'active').length
    };
  }, [state.employees, state.submissions, state.clients]);

  return {
    // Data
    employees: state.employees,
    submissions: state.submissions,
    clients: state.clients,
    
    // Loading states
    loading: state.loading,
    isLoading: Object.values(state.loading).some(Boolean),
    
    // Error state
    error: state.error,
    
    // Sync status
    syncStatus: state.syncStatus,
    lastUpdated: state.lastUpdated,
    
    // Actions
    syncAllData,
    updateEmployee,
    updateSubmission,
    
    // Utilities
    getEmployee,
    getEmployeeSubmissions,
    getPerformanceMetrics,
    
    // Refresh individual data types
    refreshEmployees: loadEmployees,
    refreshSubmissions: loadSubmissions,
    refreshClients: loadClients
  };
}

// Default data creators
function createDefaultEmployees() {
  return [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@company.com',
      phone: '+1234567890',
      role: 'SEO Specialist',
      department: 'Marketing',
      status: 'active',
      joiningDate: '2024-01-15',
      manager: 'Sarah Johnson'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      phone: '+1234567891',
      role: 'Marketing Manager',
      department: 'Marketing',
      status: 'active',
      joiningDate: '2023-06-01',
      manager: 'Mike Wilson'
    },
    {
      id: 3,
      name: 'Mike Wilson',
      email: 'mike.wilson@company.com',
      phone: '+1234567892',
      role: 'Content Creator',
      department: 'Marketing',
      status: 'active',
      joiningDate: '2023-08-10',
      manager: 'Sarah Johnson'
    }
  ];
}

function createDefaultSubmissions() {
  const currentMonth = new Date().toISOString().slice(0, 7);
  return [
    {
      id: 1,
      employeeId: 1,
      monthKey: currentMonth,
      employee: {
        name: 'John Smith',
        phone: '+1234567890',
        department: 'Marketing'
      },
      scores: {
        overall: 8.5,
        kpiScore: 8.0,
        learningScore: 9.0,
        relationshipScore: 8.5
      },
      created_at: new Date().toISOString(),
      manager: {
        reviewed: false
      }
    },
    {
      id: 2,
      employeeId: 3,
      monthKey: currentMonth,
      employee: {
        name: 'Mike Wilson',
        phone: '+1234567892',
        department: 'Marketing'
      },
      scores: {
        overall: 7.5,
        kpiScore: 7.0,
        learningScore: 8.0,
        relationshipScore: 7.5
      },
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      manager: {
        reviewed: true,
        remarks: 'Good progress this month. Keep up the consistent performance.'
      }
    }
  ];
}

function createDefaultClients() {
  return [
    {
      id: 1,
      name: 'Tech Corp Solutions',
      email: 'contact@techcorp.com',
      status: 'active',
      industry: 'Technology',
      created_at: '2024-01-15'
    },
    {
      id: 2,
      name: 'Green Energy Co',
      email: 'info@greenenergy.com',
      status: 'active',
      industry: 'Energy',
      created_at: '2024-02-01'
    }
  ];
}