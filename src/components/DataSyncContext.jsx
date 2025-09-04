import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';

const DataSyncContext = createContext();

export const DataSyncProvider = ({ children }) => {
  const { supabase } = useSupabase();
  const { notify } = useToast();
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch clients from client_onboarding table
  const fetchClients = async () => {
    if (!supabase) {
      console.log('No Supabase client - loading clients from localStorage');
      const localClients = JSON.parse(localStorage.getItem('clients') || '[]');
      setClients(localClients);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('client_onboarding')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map client_onboarding data to client format for directory
      const mappedClients = (data || []).map(record => ({
        id: record.id,
        name: record.company_name || record.business_name || 'Unnamed Client',
        description: record.business_description || record.company_description || 'No description available',
        type: record.business_type || 'Standard',
        industry: record.industry,
        services: record.services_selected ? 
          (Array.isArray(record.services_selected) ? record.services_selected : [record.services_selected]) : [],
        status: record.submission_status === 'submitted' ? 'active' : 'pending',
        assigned_employee: record.assigned_team,
        contact_person: record.contact_person,
        email: record.email,
        phone: record.phone,
        website: record.website,
        location: record.location || `${record.city || ''}, ${record.state || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
        created_at: record.created_at,
        updated_at: record.updated_at,
        // Additional fields from onboarding
        target_audience: record.target_audience,
        business_goals: record.business_goals,
        marketing_budget: record.marketing_budget,
        current_challenges: record.current_challenges
      }));
      
      setClients(mappedClients);
    } catch (error) {
      console.error('Error fetching clients from client_onboarding:', error);
      notify('Failed to fetch clients', 'error');
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    if (!supabase) {
      console.log('No Supabase client - loading employees from localStorage');
      const localEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
      setEmployees(localEmployees);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      notify('Failed to fetch employees', 'error');
    }
  };

  // Add client
  const addClient = (client) => {
    setClients(prev => [client, ...prev]);
  };

  // Update client
  const updateClient = (clientId, updates) => {
    setClients(prev => prev.map(client => 
      client.id === clientId ? { ...client, ...updates } : client
    ));
  };

  // Remove client
  const removeClient = (clientId) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
  };

  // Add employee
  const addEmployee = (employee) => {
    setEmployees(prev => [employee, ...prev]);
  };

  // Update employee
  const updateEmployee = (employeeId, updates) => {
    setEmployees(prev => prev.map(employee => 
      employee.id === employeeId ? { ...employee, ...updates } : employee
    ));
  };

  // Remove employee
  const removeEmployee = (employeeId) => {
    setEmployees(prev => prev.filter(employee => employee.id !== employeeId));
  };

  // Initial data fetch and real-time subscriptions
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchClients(), fetchEmployees()]);
      setLoading(false);
    };
    
    loadData();

    // Set up real-time subscriptions if supabase is available
    if (supabase) {
      // Subscribe to client_onboarding table changes
      const clientSubscription = supabase
        .channel('client_onboarding_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'client_onboarding'
        }, (payload) => {
          console.log('Client onboarding change detected:', payload);
          // Refresh clients data when changes occur
          fetchClients();
        })
        .subscribe();

      // Subscribe to employees table changes
      const employeeSubscription = supabase
        .channel('employees_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'employees'
        }, (payload) => {
          console.log('Employee change detected:', payload);
          // Refresh employees data when changes occur
          fetchEmployees();
        })
        .subscribe();

      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(clientSubscription);
        supabase.removeChannel(employeeSubscription);
      };
    }
  }, [supabase]);

  const value = {
    clients,
    employees,
    loading,
    fetchClients,
    fetchEmployees,
    addClient,
    updateClient,
    removeClient,
    addEmployee,
    updateEmployee,
    removeEmployee
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};