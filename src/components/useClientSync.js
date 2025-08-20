import { useEffect, useMemo, useState } from 'react';
import { useSupabase } from './SupabaseProvider';
import { getClientRepository } from './ClientRepository';

// Hook to sync client repository data for dropdowns and lookups
export function useClientSync() {
  const supabase = useSupabase();
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    const fetchClients = async () => {
      try {
        setLoading(true);
        const repo = getClientRepository(supabase);
        const clients = await repo.getAllClients();
        setAllClients(clients || []);
        setError(null);
      } catch (err) {
        console.error('Error syncing clients:', err);
        setError(err);
        setAllClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [supabase]);

  const getClientOptions = useMemo(() => {
    return (allClients || []).map(client => ({
      value: client.name,
      label: client.name,
      team: client.team,
      services: client.services,
      status: client.status
    }));
  }, [allClients]);

  const clientExists = (clientName) => {
    if (!clientName || !clientName.trim()) return false;
    const normalized = clientName.trim().toLowerCase();
    return allClients.some(c => c.name.toLowerCase() === normalized);
  };

  return {
    allClients,
    getClientOptions,
    clientExists,
    loading,
    error
  };
}