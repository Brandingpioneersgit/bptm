import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';

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
    } catch (error) {
      console.error('Error fetching clients in sync context:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchClients(true);
  }, [fetchClients]);

  const addClient = useCallback((newClient) => {
    setClients(prev => prev.some(c => c.id === newClient.id)
      ? prev.map(c => c.id === newClient.id ? newClient : c)
      : [newClient, ...prev]
    );
  }, []);

  const updateClient = useCallback((updatedClient) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  }, []);

  const removeClient = useCallback((clientId) => {
    setClients(prev => prev.filter(c => c.id !== clientId));
  }, []);

  const refreshClients = useCallback(() => fetchClients(true), [fetchClients]);

  const getClientsByTeam = useCallback((team) => {
    if (team === 'All') return clients;
    return clients.filter(client => client.team === team);
  }, [clients]);

  const getClientsByStatus = useCallback((status) => {
    if (status === 'All') return clients;
    return clients.filter(client => client.status === status);
  }, [clients]);

  const getActiveClientsByTeam = useCallback((team) => {
    return clients.filter(client => client.status === 'Active' && (team === 'All' || client.team === team));
  }, [clients]);

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

  const clientExists = useCallback((clientName) => {
    if (!clientName || !clientName.trim()) return false;
    const normalizedName = clientName.trim().toLowerCase();
    return clients.some(client => client.name.toLowerCase().trim() === normalizedName);
  }, [clients]);

  const findClientByName = useCallback((clientName) => {
    if (!clientName || !clientName.trim()) return null;
    const normalizedName = clientName.trim().toLowerCase();
    return clients.find(client => client.name.toLowerCase().trim() === normalizedName);
  }, [clients]);

  const value = {
    clients,
    loading,
    lastRefresh,
    addClient,
    updateClient,
    removeClient,
    refreshClients,
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
