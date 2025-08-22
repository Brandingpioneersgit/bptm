import React, { useState, useEffect, useCallback } from 'react';
import { useClientSync } from '@/features/clients/context/ClientSyncContext';
import { MultiSelect } from './ui';

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
    getClientOptions, 
    findClientByName, 
    addClient 
  } = useClientSync();
  
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
  const handleCreateClient = useCallback(async (clientData) => {
    if (!allowCreate) return null;
    
    setIsCreatingNew(true);
    try {
      const newClient = await addClient(clientData);
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
  }, [allowCreate, addClient, onClientSelect, onChange]);

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
        <MultiSelect
          options={filteredOptions}
          value={selectedClient ? selectedClient.name : ''}
          onChange={handleClientSelect}
          onInputChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || loading}
          searchable
          creatable={allowCreate}
          isLoading={loading || isCreatingNew}
          className="w-full"
        />
        
        {/* Client info display */}
        {selectedClient && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
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