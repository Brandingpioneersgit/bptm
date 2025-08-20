import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from './SupabaseProvider';
import { fetchEmployeeClients } from './clientServices';

export function useClientSync() {
  const supabase = useSupabase();
  const [clientLinks, setClientLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      try {
        setLoading(true);
        const data = await fetchEmployeeClients(supabase);
        setClientLinks(data);
        setError(null);
      } catch (e) {
        console.error('Error fetching employee clients:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [supabase]);

  const allClients = useMemo(() => {
    const map = new Map();
    clientLinks.forEach(link => {
      const client = link.clients;
      if (!client || !client.name) return;
      const key = client.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { ...client, services: [{ service: link.scope, frequency: link.frequency }] });
      } else {
        const existing = map.get(key);
        existing.services = existing.services || [];
        existing.services.push({ service: link.scope, frequency: link.frequency });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [clientLinks]);

  const getClientsForEmployee = (employeeId) => {
    return clientLinks
      .filter(link => link.employee_id === employeeId && link.clients)
      .map(link => ({
        ...link.clients,
        scope: link.scope,
        frequency: link.frequency
      }));
  };

  const getClientOptions = () => {
    return allClients.map(client => ({
      value: client.id || client.name,
      label: client.name,
      services: client.services
    }));
  };

  const clientExists = (clientName) => {
    if (!clientName || !clientName.trim()) return false;
    const normalizedName = clientName.trim().toLowerCase();
    return allClients.some(client => client.name.toLowerCase() === normalizedName);
    };

  return {
    allClients,
    getClientsForEmployee,
    getClientOptions,
    clientExists,
    loading,
    error
  };
}
