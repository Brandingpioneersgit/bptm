/**
 * Client Synchronization Context
 * 
 * Provides a centralized state management system for client data
 * that ensures all components stay synchronized when clients are created,
 * updated, or modified across the application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from './SupabaseProvider';

const ClientSyncContext = createContext(null);

export const useClientSync = () => {
  const context = useContext(ClientSyncContext);
  if (!context) {
    throw new Error('useClientSync must be used within a ClientSyncProvider');
  }
  return context;
};

export const ClientSyncProvider = ({ children }) => {
  const supabase = useSupabase();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Fetch all clients from the database
  const fetchClients = useCallback(async (force = false) => {
    if (!supabase) return;

    try {
      if (force) setLoading(true);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setClients(data || []);
      setLastRefresh(Date.now());
      
      console.log('🔄 Client sync updated:', data?.length || 0, 'clients');
    } catch (error) {
      console.error('Error fetching clients in sync context:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initial load
  useEffect(() => {
    fetchClients(true);
  }, [fetchClients]);

  // Add a new client to the synchronized state
  const addClient = useCallback((newClient) => {
    setClients(prev => {
      // Check if client already exists (prevent duplicates)
      const exists = prev.some(c => c.id === newClient.id);
      if (exists) {
        // Update existing client
        return prev.map(c => c.id === newClient.id ? newClient : c);
      }
      // Add new client to the beginning
      return [newClient, ...prev];
    });
    
    console.log('➕ Client added to sync context:', newClient.name);
  }, []);

  // Update an existing client in the synchronized state
  const updateClient = useCallback((updatedClient) => {
    setClients(prev => 
      prev.map(c => c.id === updatedClient.id ? updatedClient : c)
    );
    
    console.log('📝 Client updated in sync context:', updatedClient.name);
  }, []);

  // Remove a client from the synchronized state
  const removeClient = useCallback((clientId) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
    console.log('🗑️ Client removed from sync context:', clientId);
  }, []);

  // Force refresh from database
  const refreshClients = useCallback(() => {
    console.log('🔄 Force refreshing clients...');
    return fetchClients(true);
  }, [fetchClients]);

  // Get clients filtered by team
  const getClientsByTeam = useCallback((team) => {
    if (team === 'All') return clients;
    return clients.filter(client => client.team === team);
  }, [clients]);

  // Get clients filtered by status
  const getClientsByStatus = useCallback((status) => {
    if (status === 'All') return clients;
    return clients.filter(client => client.status === status);
  }, [clients]);

  // Get active clients for a specific team (common use case)
  const getActiveClientsByTeam = useCallback((team) => {
    return clients.filter(client => 
      client.status === 'Active' && 
      (team === 'All' || client.team === team)
    );
  }, [clients]);

  // Get client names for dropdown options
  const getClientOptions = useCallback((team = 'All') => {
    const filteredClients = getActiveClientsByTeam(team);
    return filteredClients.map(client => ({
      value: client.name,
      label: client.name,
      id: client.id,
      services: client.services || [],
      team: client.team,
      client_type: client.client_type
    }));
  }, [getActiveClientsByTeam]);

  // Check if a client exists
  const clientExists = useCallback((clientName) => {
    if (!clientName || !clientName.trim()) return false;
    const normalizedName = clientName.trim().toLowerCase();
    return clients.some(client => 
      client.name.toLowerCase().trim() === normalizedName
    );
  }, [clients]);

  // Find client by name
  const findClientByName = useCallback((clientName) => {
    if (!clientName || !clientName.trim()) return null;
    const normalizedName = clientName.trim().toLowerCase();
    return clients.find(client => 
      client.name.toLowerCase().trim() === normalizedName
    );
  }, [clients]);

  const value = {
    // State
    clients,
    loading,
    lastRefresh,
    
    // Actions
    addClient,
    updateClient,
    removeClient,
    refreshClients,
    
    // Getters
    getClientsByTeam,
    getClientsByStatus,
    getActiveClientsByTeam,
    getClientOptions,
    clientExists,
    findClientByName
  };

  return (
    <ClientSyncContext.Provider value={value}>
      {children}
    </ClientSyncContext.Provider>
  );
};