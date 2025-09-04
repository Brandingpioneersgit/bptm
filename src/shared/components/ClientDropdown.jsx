import React, { useState, useEffect, useCallback } from 'react';
import { useDataSync } from '@/components/DataSyncContext';
import SearchableDropdown from './SearchableDropdown';
import ClientDataPriorityIndicator from '@/components/ClientDataPriorityIndicator';

const ClientDropdown = ({ 
  value = '', 
  onChange, 
  onClientSelect,
  placeholder = 'Select or type client name...',
  allowCreate = true,
  disabled = false,
  className = '',
  label = 'Client',
  required = false,
  team = null // Filter clients by team
}) => {
  const { 
    clients, 
    loading, 
    addClient 
  } = useDataSync();
  
  // Helper functions to match ClientSyncContext API
  const getClientOptions = () => {
    const activeClients = clients.filter(client => client.status === 'Active');
    return activeClients.map(client => ({
      value: client.name,
      label: client.name,
      name: client.name,
      id: client.id,
      services: client.services || [],
      team: client.team,
      client_type: client.client_type
    }));
  };
  
  const findClientByName = (clientName) => {
    if (!clientName || !clientName.trim()) return null;
    const normalizedName = clientName.trim().toLowerCase();
    return clients.find(client => client.name.toLowerCase().trim() === normalizedName);
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Get client options for dropdown, filtered by team if specified
  const clientOptions = getClientOptions().filter(option => {
    if (!team) return true;
    const client = findClientByName(option.name);
    return client && client.team === team;
  });

  // Filter options based on search term
  const filteredOptions = clientOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle client selection from dropdown
  const handleClientSelect = useCallback((selectedValue) => {
    if (!selectedValue) {
      setSelectedClient(null);
      if (onClientSelect) {
        onClientSelect(null);
      }
      if (onChange) {
        onChange('');
      }
      return;
    }

    // Find the client by name
    const client = findClientByName(selectedValue);
    
    if (client) {
      setSelectedClient(client);
      setSearchTerm(client.name);
      
      // Notify parent components
      if (onClientSelect) {
        onClientSelect(client);
      }
      if (onChange) {
        onChange(client.name);
      }
    }
  }, [findClientByName, onClientSelect, onChange]);

  // Handle manual input (for new clients)
  const handleInputChange = useCallback((inputValue) => {
    setSearchTerm(inputValue);
    if (onChange) {
      onChange(inputValue);
    }

    // Check if this matches an existing client
    const existingClient = clients.find(client => 
      client.name.toLowerCase() === inputValue.toLowerCase()
    );
    
    if (existingClient) {
      setSelectedClient(existingClient);
      if (onClientSelect) {
        onClientSelect(existingClient);
      }
    } else {
      setSelectedClient(null);
      if (onClientSelect) {
        onClientSelect(null);
      }
    }
  }, [clients, onChange, onClientSelect]);

  // Create new client when needed
  const handleCreateClient = useCallback(async (clientName) => {
    if (!allowCreate || !clientName.trim()) return null;
    
    setIsCreatingNew(true);
    try {
      const newClient = await addClient({
        name: clientName.trim(),
        status: 'Active',
        team: team || 'General',
        client_type: 'Standard'
      });
      if (newClient) {
        setSelectedClient(newClient);
        setSearchTerm(newClient.name);
        
        if (onClientSelect) {
          onClientSelect(newClient);
        }
        if (onChange) {
          onChange(newClient.name);
        }
      }
      return newClient;
    } catch (error) {
      console.error('Error creating client:', error);
      return null;
    } finally {
      setIsCreatingNew(false);
    }
  }, [allowCreate, addClient, onClientSelect, onChange, team]);

  // Update search term when value prop changes
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value || '');
    }
  }, [value]);

  // Auto-populate client data when name is typed
  useEffect(() => {
    if (searchTerm && !selectedClient) {
      const matchingClient = clients.find(client => 
        client.name.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (matchingClient) {
        setSelectedClient(matchingClient);
        if (onClientSelect) {
          onClientSelect(matchingClient);
        }
      }
    }
  }, [searchTerm, selectedClient, clients, onClientSelect]);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <SearchableDropdown
          options={filteredOptions}
          value={selectedClient ? selectedClient.name : searchTerm}
          onChange={(selectedValue) => {
            // If it's a new client name (string), create it
            if (typeof selectedValue === 'string' && !clientOptions.find(opt => opt.value === selectedValue)) {
              if (allowCreate) {
                handleCreateClient(selectedValue);
              }
            } else {
              // Handle existing client selection
              handleClientSelect(selectedValue);
            }
          }}
          onInputChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || loading}
          searchable={true}
          creatable={allowCreate}
          isLoading={loading || isCreatingNew}
          className="w-full"
          onCreateNew={allowCreate ? handleCreateClient : undefined}
        />
        
        {/* Client info display */}
        {selectedClient && (
          <div className="mt-2 space-y-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">
                    {selectedClient.name}
                  </p>
                  <p className="text-xs text-green-700">
                    {selectedClient.team} • {selectedClient.status}
                  </p>
                  {selectedClient.services && selectedClient.services.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Services: {Array.isArray(selectedClient.services) 
                        ? selectedClient.services.join(', ') 
                        : selectedClient.services}
                    </p>
                  )}
                  {selectedClient.scope_of_work && (
                    <p className="text-xs text-green-600 mt-1">
                      Scope: {selectedClient.scope_of_work}
                    </p>
                  )}
                </div>
                <div className="text-xs text-green-500">
                  Auto-populated
                </div>
              </div>
            </div>
            
            {/* Client Data Priority Information */}
            <ClientDataPriorityIndicator clientName={selectedClient.name} />
          </div>
        )}
        
        {/* New client indicator */}
        {searchTerm && !selectedClient && allowCreate && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-700">
              💡 New client "{searchTerm}" will be created when form is submitted
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDropdown;