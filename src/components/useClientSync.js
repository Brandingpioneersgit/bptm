import { useMemo } from 'react';
import { useFetchSubmissions } from './useFetchSubmissions';

export function useClientSync() {
  const { allSubmissions, loading, error } = useFetchSubmissions();

  // Extract all unique clients from all submissions
  const allClients = useMemo(() => {
    if (!allSubmissions || allSubmissions.length === 0) return [];

    const clientMap = new Map();

    allSubmissions.forEach(submission => {
      if (submission.clients && Array.isArray(submission.clients)) {
        submission.clients.forEach(client => {
          if (client && client.name && client.name.trim()) {
            const clientKey = client.name.trim().toLowerCase();
            
            // Store the most complete client info we have
            if (!clientMap.has(clientKey) || 
                (clientMap.get(clientKey).services || []).length < (client.services || []).length) {
              clientMap.set(clientKey, {
                name: client.name.trim(),
                services: client.services || [],
                // Add other common client properties here
                industry: client.industry || '',
                lastUpdated: submission.monthKey,
                employeeName: submission.employee?.name,
                employeePhone: submission.employee?.phone
              });
            }
          }
        });
      }
    });

    // Convert Map to array and sort by name
    return Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSubmissions]);

  // Get clients for a specific employee
  const getClientsForEmployee = (employeeName, employeePhone) => {
    if (!allSubmissions || allSubmissions.length === 0) return [];

    const employeeClients = new Set();
    
    allSubmissions.forEach(submission => {
      if (submission.employee?.name === employeeName && 
          submission.employee?.phone === employeePhone &&
          submission.clients) {
        submission.clients.forEach(client => {
          if (client && client.name && client.name.trim()) {
            employeeClients.add(client.name.trim());
          }
        });
      }
    });

    return Array.from(employeeClients).sort();
  };

  // Get client names for dropdown options
  const getClientOptions = () => {
    return allClients.map(client => ({
      value: client.name,
      label: client.name,
      services: client.services,
      lastUpdated: client.lastUpdated
    }));
  };

  // Check if a client exists in the system
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