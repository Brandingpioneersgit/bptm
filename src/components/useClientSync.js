import { useEffect, useState } from 'react';
import { useSupabase } from './SupabaseProvider';
import { getClientRepository } from './ClientRepository';

export function useClientSync() {
  const supabase = useSupabase();
  const [allClients, setAllClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    const repo = getClientRepository(supabase);
    setLoading(true);
    repo.getAllClients()
      .then(clients => setAllClients(clients))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [supabase]);

  const getClientsForEmployee = async (employeeId) => {
    if (!supabase || !employeeId) return [];
    const repo = getClientRepository(supabase);
    return await repo.getClientsForEmployee(employeeId);
  };

  const getClientOptions = () => {
    return allClients.map(client => ({
      value: client.name,
      label: client.name,
      services: client.services,
      lastUpdated: client.updated_at
    }));
  };

  const clientExists = (clientName) => {
    if (!clientName || !clientName.trim()) return false;
    const normalizedName = clientName.trim().toLowerCase();
    return allClients.some(c => c.name.toLowerCase() === normalizedName);
  };

  return {
    allClients,
    getClientsForEmployee,
    getClientOptions,
    clientExists,
    loading,
    error,
  };
}
