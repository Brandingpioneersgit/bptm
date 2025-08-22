/**
 * DataSyncContext - Global Data Synchronization System
 * 
 * Provides centralized data management with automatic synchronization
 * across all components to prevent display inconsistencies.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSupabase } from './SupabaseProvider';

const DataSyncContext = createContext(null);

export const useDataSync = () => {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within a DataSyncProvider');
  }
  return context;
};

export const DataSyncProvider = ({ children }) => {
  const supabase = useSupabase();
  const [data, setData] = useState({
    submissions: [],
    clients: [],
    lastRefresh: {
      submissions: null,
      clients: null
    }
  });
  const [loading, setLoading] = useState({
    submissions: false,
    clients: false
  });
  const [error, setError] = useState({
    submissions: null,
    clients: null
  });

  // Track pending operations to avoid conflicts
  const pendingOperations = useRef(new Set());
  const refreshCallbacks = useRef({
    submissions: [],
    clients: []
  });

  // Register callback for data changes
  const onDataChange = useCallback((dataType, callback) => {
    if (refreshCallbacks.current[dataType]) {
      refreshCallbacks.current[dataType].push(callback);
    }
    
    // Return cleanup function
    return () => {
      if (refreshCallbacks.current[dataType]) {
        refreshCallbacks.current[dataType] = refreshCallbacks.current[dataType].filter(cb => cb !== callback);
      }
    };
  }, []);

  // Notify all registered callbacks
  const notifyDataChange = useCallback((dataType, data) => {
    refreshCallbacks.current[dataType]?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Data change callback failed:', error);
      }
    });
  }, []);

  // Fetch submissions with caching and error handling
  const fetchSubmissions = useCallback(async (force = false) => {
    if (!supabase) {
      // Running in local mode - load from localStorage
      try {
        const localData = localStorage.getItem('codex_submissions') || '[]';
        const submissions = JSON.parse(localData);
        setData(prev => ({
          ...prev,
          submissions: submissions,
          lastRefresh: {
            ...prev.lastRefresh,
            submissions: Date.now()
          }
        }));
        setError(prev => ({ ...prev, submissions: null }));
        notifyDataChange('submissions', submissions);
      } catch (error) {
        console.error('Error loading local submissions:', error);
        setError(prev => ({ ...prev, submissions: error.message }));
      }
      return;
    }
    
    // Prevent duplicate operations
    if (!force && pendingOperations.current.has('fetch-submissions')) {
      console.log('📋 Submissions fetch already in progress, skipping...');
      return;
    }
    
    pendingOperations.current.add('fetch-submissions');
    
    try {
      setLoading(prev => ({ ...prev, submissions: true }));
      setError(prev => ({ ...prev, submissions: null }));
      
      console.log('📋 Fetching submissions data...');
      
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (submissionsError) throw submissionsError;
      
      setData(prev => ({
        ...prev,
        submissions: submissionsData || [],
        lastRefresh: {
          ...prev.lastRefresh,
          submissions: Date.now()
        }
      }));
      
      console.log('✅ Submissions data synced:', submissionsData?.length || 0, 'records');
      
      // Notify components of data change
      notifyDataChange('submissions', submissionsData || []);
      
    } catch (error) {
      console.error('❌ Failed to fetch submissions:', error);
      setError(prev => ({ ...prev, submissions: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, submissions: false }));
      pendingOperations.current.delete('fetch-submissions');
    }
  }, [supabase, notifyDataChange]);

  // Fetch clients with caching and error handling
  const fetchClients = useCallback(async (force = false) => {
    if (!supabase) return;
    
    // Prevent duplicate operations
    if (!force && pendingOperations.current.has('fetch-clients')) {
      console.log('🏢 Clients fetch already in progress, skipping...');
      return;
    }
    
    pendingOperations.current.add('fetch-clients');
    
    try {
      setLoading(prev => ({ ...prev, clients: true }));
      setError(prev => ({ ...prev, clients: null }));
      
      console.log('🏢 Fetching clients data...');
      
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (clientsError) throw clientsError;
      
      setData(prev => ({
        ...prev,
        clients: clientsData || [],
        lastRefresh: {
          ...prev.lastRefresh,
          clients: Date.now()
        }
      }));
      
      console.log('✅ Clients data synced:', clientsData?.length || 0, 'records');
      
      // Notify components of data change
      notifyDataChange('clients', clientsData || []);
      
    } catch (error) {
      console.error('❌ Failed to fetch clients:', error);
      setError(prev => ({ ...prev, clients: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, clients: false }));
      pendingOperations.current.delete('fetch-clients');
    }
  }, [supabase, notifyDataChange]);

  // Update submission in cache and trigger refresh
  const updateSubmission = useCallback(async (submissionData) => {
    console.log('📝 Updating submission in sync cache...');
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      submissions: prev.submissions.map(sub => 
        sub.id === submissionData.id ? { ...sub, ...submissionData } : sub
      )
    }));
    
    // Trigger full refresh to ensure consistency
    setTimeout(() => {
      fetchSubmissions(true);
    }, 100);
  }, [fetchSubmissions]);

  // Add new submission to cache and trigger refresh
  const addSubmission = useCallback(async (submissionData) => {
    console.log('➕ Adding submission to sync cache...');
    
    if (!supabase) {
      // Running in local mode - save to localStorage
      try {
        const localData = localStorage.getItem('codex_submissions') || '[]';
        const submissions = JSON.parse(localData);
        const newSubmissions = [submissionData, ...submissions];
        localStorage.setItem('codex_submissions', JSON.stringify(newSubmissions));
        
        // Update local state
        setData(prev => ({
          ...prev,
          submissions: newSubmissions
        }));
        
        console.log('✅ Submission saved to local storage');
      } catch (error) {
        console.error('Error saving submission to local storage:', error);
      }
      return;
    }
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      submissions: [submissionData, ...prev.submissions]
    }));
    
    // Trigger full refresh to ensure consistency
    setTimeout(() => {
      fetchSubmissions(true);
    }, 100);
  }, [fetchSubmissions, supabase]);

  // Update client in cache and trigger refresh
  const updateClient = useCallback(async (clientData) => {
    console.log('🏢 Updating client in sync cache...');
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(client => 
        client.id === clientData.id ? { ...client, ...clientData } : client
      )
    }));
    
    // Trigger full refresh to ensure consistency
    setTimeout(() => {
      fetchClients(true);
    }, 100);
  }, [fetchClients]);

  // Add new client to cache and trigger refresh
  const addClient = useCallback(async (clientData) => {
    console.log('➕ Adding client to sync cache...');
    
    // Optimistic update
    setData(prev => ({
      ...prev,
      clients: [clientData, ...prev.clients]
    }));
    
    // Trigger full refresh to ensure consistency
    setTimeout(() => {
      fetchClients(true);
    }, 100);
  }, [fetchClients]);

  // Force refresh all data
  const refreshAllData = useCallback(async () => {
    console.log('🔄 Force refreshing all data...');
    await Promise.all([
      fetchSubmissions(true),
      fetchClients(true)
    ]);
  }, [fetchSubmissions, fetchClients]);

  // Auto-refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if no pending operations
      if (pendingOperations.current.size === 0) {
        refreshAllData();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Initial data load
  useEffect(() => {
    if (supabase) {
      refreshAllData();
    }
  }, [supabase, refreshAllData]);

  // Clear pending operations on unmount
  useEffect(() => {
    return () => {
      pendingOperations.current.clear();
    };
  }, []);

  const value = {
    // Data
    submissions: data.submissions,
    clients: data.clients,
    lastRefresh: data.lastRefresh,
    
    // Loading states
    loading,
    error,
    
    // Actions
    fetchSubmissions,
    fetchClients,
    updateSubmission,
    addSubmission,
    updateClient,
    addClient,
    refreshAllData,
    onDataChange,
    
    // Utilities
    isLoading: loading.submissions || loading.clients,
    hasError: error.submissions || error.clients,
    getSubmissionsByEmployee: (name, phone) => data.submissions.filter(sub => 
      sub.employee?.name === name && sub.employee?.phone === phone
    ),
    getClientsByTeam: (team) => data.clients.filter(client => 
      team === 'All' || client.team === team
    )
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
};