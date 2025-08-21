import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useSupabase } from "./SupabaseProvider";
import { CLIENT_SERVICES, DELIVERY_FREQUENCIES, createServiceObject, EMPTY_CLIENT } from "./clientServices";
import { getClientRepository } from "./ClientRepository";
import { 
  useEnhancedClientCreation, 
  ClientCreationStatus, 
  DuplicateNameChecker 
} from "./ClientCreationEnhancements";
import { useDataSync } from "./DataSyncContext";

export function ClientManagementView() {
  const supabase = useSupabase();
  const { 
    clients, 
    loading: dataLoading, 
    addClient, 
    updateClient, 
    fetchClients,
    getClientsByTeam
  } = useDataSync();
  
  const loading = dataLoading.clients;
  
  const getClientsByStatus = useCallback((status) => {
    if (status === 'All') return clients;
    return clients.filter(client => client.status === status);
  }, [clients]);
  
  const refreshClients = useCallback(() => {
    return fetchClients(true);
  }, [fetchClients]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newClient, setNewClient] = useState({
    ...EMPTY_CLIENT
  });

  const [editingClient, setEditingClient] = useState(null);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [selectedClientForServices, setSelectedClientForServices] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [serviceFrequencies, setServiceFrequencies] = useState({});
  
  // Enhanced client creation
  const {
    createClient,
    isCreating,
    validationErrors,
    validationWarnings,
    creationStatus,
    resetValidation
  } = useEnhancedClientCreation(
    supabase,
    (createdClient) => {
      console.log('✅ Client created successfully:', createdClient.name);
      
      // Add to synchronized client state
      addClient(createdClient);
      
      // Reset form
      setNewClient({ ...EMPTY_CLIENT });
      setSelectedServices([]);
      setServiceFrequencies({});
      
      // Close form after short delay to show success message
      setTimeout(() => {
        setShowCreateForm(false);
      }, 2000);
    },
    (error) => {
      console.error('❌ Client creation failed:', error);
    }
  );

  const [departureForm, setDepartureForm] = useState({
    isOpen: false,
    clientId: null,
    reason: '',
    employees: []
  });

  // No longer needed - using ClientSyncContext

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!supabase || isCreating) return;

    // Use enhanced client creation
    const result = await createClient(newClient, selectedServices, serviceFrequencies);
    
    if (result.success) {
      // Success is handled by the success callback and ClientSyncContext
      console.log('🎉 Client creation completed via enhanced workflow');
    }
    // Error handling is done by the error callback
  };

  const handleEditServices = (client) => {
    setSelectedClientForServices(client);
    setSelectedServices(client.services?.map(s => s.service) || []);
    
    const frequencies = {};
    client.services?.forEach(s => {
      frequencies[s.service] = s.frequency;
    });
    setServiceFrequencies(frequencies);
    setShowServicesModal(true);
  };

  const handleSaveServices = async () => {
    if (!selectedClientForServices || !supabase) return;
    
    try {
      const clientRepository = getClientRepository(supabase, { updateClient, addClient });
      
      const services = selectedServices.map(service => createServiceObject(
        service,
        serviceFrequencies[service] || "Monthly",
        ""
      ));
      
      const updatedClient = await clientRepository.updateClientServices(selectedClientForServices.id, services);
      
      // Update the client in sync context
      if (updatedClient) {
        updateClient(updatedClient);
      }
      
      setShowServicesModal(false);
      setSelectedClientForServices(null);
      setSelectedServices([]);
      setServiceFrequencies({});
      
      console.log('✅ Successfully updated client services');
    } catch (error) {
      console.error('Error updating client services:', error);
      alert('Failed to update services. Please try again.');
    }
  };

  const handleServiceToggle = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(prev => prev.filter(s => s !== service));
      const newFreqs = { ...serviceFrequencies };
      delete newFreqs[service];
      setServiceFrequencies(newFreqs);
    } else {
      setSelectedServices(prev => [...prev, service]);
      setServiceFrequencies(prev => ({
        ...prev,
        [service]: "Monthly" // Default frequency
      }));
    }
  };

  const handleFrequencyChange = (service, frequency) => {
    setServiceFrequencies(prev => ({
      ...prev,
      [service]: frequency
    }));
  };

  // Handle form reset and validation reset
  const handleFormCancel = () => {
    setNewClient({ ...EMPTY_CLIENT });
    setSelectedServices([]);
    setServiceFrequencies({});
    resetValidation();
    setShowCreateForm(false);
  };

  const handleFormShow = () => {
    resetValidation();
    setShowCreateForm(true);
  };

  // Handle duplicate name suggestions
  const handleSuggestionClick = (suggestedName) => {
    setNewClient(prev => ({ ...prev, name: suggestedName }));
  };

  // Add event listener for suggestion clicks
  useEffect(() => {
    const handleSuggestion = (e) => {
      handleSuggestionClick(e.detail);
    };
    
    document.addEventListener('suggestionClick', handleSuggestion);
    return () => document.removeEventListener('suggestionClick', handleSuggestion);
  }, []);

  const handleClientDeparture = async () => {
    if (!supabase || !departureForm.clientId) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          status: 'Departed',
          departed_reason: departureForm.reason,
          departed_employees: departureForm.employees,
          updated_at: new Date().toISOString()
        })
        .eq('id', departureForm.clientId);
      
      if (error) throw error;
      
      setDepartureForm({
        isOpen: false,
        clientId: null,
        reason: '',
        employees: []
      });
      fetchClients();
    } catch (error) {
      console.error('Error updating client departure:', error);
      alert('Failed to update client status. Please try again.');
    }
  };

  const filteredClients = useMemo(() => {
    let filtered = getClientsByStatus(selectedStatus);
    filtered = getClientsByTeam(selectedTeam).filter(c => filtered.includes(c));
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [clients, selectedTeam, selectedStatus, searchQuery, getClientsByTeam, getClientsByStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading clients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Client Management</h2>
            <p className="text-gray-600">Manage web and marketing team clients</p>
          </div>
          
          <button
            onClick={handleFormShow}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Client
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
            </div>
          </div>
          
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All Teams</option>
            <option value="Web">Web Team</option>
            <option value="Marketing">Marketing Team</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Active">Active Clients</option>
            <option value="Departed">Departed Clients</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h4" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Active</h3>
              <p className="text-2xl font-semibold text-gray-900">{clients.filter(c => c.status === 'Active').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Premium Clients</h3>
              <p className="text-2xl font-semibold text-gray-900">{clients.filter(c => c.client_type === 'Premium' && c.status === 'Active').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Enterprise</h3>
              <p className="text-2xl font-semibold text-gray-900">{clients.filter(c => c.client_type === 'Enterprise' && c.status === 'Active').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Departed</h3>
              <p className="text-2xl font-semibold text-gray-900">{clients.filter(c => c.status === 'Departed').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">Created {new Date(client.created_at).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.client_type === 'Enterprise' 
                        ? 'bg-purple-100 text-purple-800'
                        : client.client_type === 'Premium'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.client_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.team === 'Web' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {client.team}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {client.services && client.services.length > 0 ? (
                        client.services.slice(0, 2).map((service, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {service.service} ({service.frequency})
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">No services</span>
                      )}
                      {client.services && client.services.length > 2 && (
                        <span className="text-xs text-gray-500">+{client.services.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditServices(client)}
                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                      >
                        Edit Services
                      </button>
                      {client.status === 'Active' && (
                        <button
                          onClick={() => setDepartureForm({
                            isOpen: true,
                            clientId: client.id,
                            reason: '',
                            employees: []
                          })}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                        >
                          Mark Departed
                        </button>
                      )}
                      {client.status === 'Departed' && client.departed_reason && (
                        <div className="text-xs text-gray-500">
                          Reason: {client.departed_reason}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
                <button
                  onClick={handleFormCancel}
                  className="text-gray-400 hover:text-gray-500"
                  disabled={isCreating}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Enhanced Status Display */}
            <ClientCreationStatus
              status={creationStatus}
              errors={validationErrors}
              warnings={validationWarnings}
              className="mx-6 mt-4"
            />

            <form onSubmit={handleCreateClient} className="px-6 py-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
                <input
                  type="text"
                  required
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors ${
                    validationErrors.name 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter client name"
                  disabled={isCreating}
                />
                
                {/* Real-time duplicate detection */}
                <DuplicateNameChecker
                  clientName={newClient.name}
                  existingClients={clients}
                  onDuplicateFound={(isDuplicate, suggestions) => {
                    // This could be used to show visual feedback
                  }}
                />
                
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Type *</label>
                  <select
                    value={newClient.client_type}
                    onChange={(e) => setNewClient(prev => ({ ...prev, client_type: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors ${
                      validationErrors.client_type 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={isCreating}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team *</label>
                  <select
                    value={newClient.team}
                    onChange={(e) => setNewClient(prev => ({ ...prev, team: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors ${
                      validationErrors.team 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    disabled={isCreating}
                  >
                    <option value="Web">Web Team</option>
                    <option value="Marketing">Marketing Team</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scope of Work</label>
                <textarea
                  rows={4}
                  value={newClient.scope_notes}
                  onChange={(e) => setNewClient(prev => ({ ...prev, scope_notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the client's scope of work, requirements, etc."
                />
              </div>

              {/* Services Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Services Provided</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {CLIENT_SERVICES.map(service => (
                    <label key={service} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
                {selectedServices.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Select the services you provide to this client</p>
                )}
              </div>

              {/* Service Frequencies */}
              {selectedServices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Frequency per Service</label>
                  <div className="space-y-3 max-h-32 overflow-y-auto">
                    {selectedServices.map(service => (
                      <div key={service} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm font-medium text-gray-700">{service}</span>
                        <select
                          value={serviceFrequencies[service] || "Monthly"}
                          onChange={(e) => handleFrequencyChange(service, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        >
                          {DELIVERY_FREQUENCIES.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleFormCancel}
                  disabled={isCreating}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || Object.keys(validationErrors).length > 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isCreating && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  )}
                  {isCreating ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {departureForm.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Mark Client as Departed</h3>
                <button
                  onClick={() => setDepartureForm(prev => ({ ...prev, isOpen: false }))}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Departure *</label>
                <textarea
                  rows={3}
                  required
                  value={departureForm.reason}
                  onChange={(e) => setDepartureForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Explain why the client left..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employees Responsible (Optional)</label>
                <input
                  type="text"
                  value={departureForm.employees.join(', ')}
                  onChange={(e) => setDepartureForm(prev => ({ 
                    ...prev, 
                    employees: e.target.value.split(',').map(name => name.trim()).filter(Boolean)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter employee names separated by commas"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple names with commas</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setDepartureForm(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClientDeparture}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Mark as Departed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Management Modal */}
      {showServicesModal && selectedClientForServices && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Manage Services for {selectedClientForServices.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Define the scope of services and delivery frequency for this client
              </p>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Services Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Services</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {CLIENT_SERVICES.map(service => (
                    <label key={service} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Service Frequencies */}
              {selectedServices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Delivery Frequency per Service
                  </label>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedServices.map(service => (
                      <div key={service} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{service}</span>
                          <p className="text-xs text-gray-600">How often do you deliver this service?</p>
                        </div>
                        <select
                          value={serviceFrequencies[service] || "Monthly"}
                          onChange={(e) => handleFrequencyChange(service, e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {DELIVERY_FREQUENCIES.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Selected Services Summary</h4>
                    <div className="space-y-1">
                      {selectedServices.map(service => (
                        <div key={service} className="text-xs text-green-700 flex justify-between">
                          <span>{service}</span>
                          <span className="font-medium">{serviceFrequencies[service] || "Monthly"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedServices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">Select services to define scope and frequency</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowServicesModal(false);
                  setSelectedClientForServices(null);
                  setSelectedServices([]);
                  setServiceFrequencies({});
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveServices}
                disabled={selectedServices.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Save Services ({selectedServices.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}