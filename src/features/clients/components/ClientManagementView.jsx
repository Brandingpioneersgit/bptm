import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { CLIENT_SERVICES, DELIVERY_FREQUENCIES, createServiceObject, EMPTY_CLIENT } from "@/features/clients/services/clientServices";
import { getClientRepository } from "@/features/clients/services/ClientRepository";
import { 
  useEnhancedClientCreation, 
  ClientCreationStatus, 
  DuplicateNameChecker 
} from "@/components/ClientCreationEnhancements";
import { useDataSync } from "@/components/DataSyncContext";
// import { ImageUpload } from "@/components/ImageUpload"; // Component not found
import { ClientLogo } from "@/shared/components/ImageDisplay";
import { useToast } from "@/shared/components/Toast";
import { useAutoSave, useAutoSaveKey } from "@/shared/hooks/useAutoSave";

export function ClientManagementView() {
  const supabase = useSupabase();
  const { notify } = useToast();
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

  // Auto-save functionality for client creation form
  const autoSaveKey = useAutoSaveKey('client_form', {
    name: newClient.name,
    team: newClient.team || 'new'
  });
  
  const {
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    saveNow,
    loadSavedData,
    clearSavedData
  } = useAutoSave(
    newClient,
    autoSaveKey,
    showCreateForm && (newClient.name || newClient.scope_notes), // Only auto-save when form is open and has data
    2000, // 2 second debounce
    (savedData) => console.log('💾 Client form auto-saved'),
    (error) => notify({ type: 'error', title: 'Auto-save failed', message: error.message })
  );

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
      setShowCreateForm(false);
      setNewClient({ ...EMPTY_CLIENT });
      console.log('✅ Client created successfully:', createdClient.name);
      
      // Add to sync context
      addClient(createdClient);
    },
    (error) => {
      console.error('❌ Error creating client:', error);
    }
  );

  useEffect(() => {
    if (!loading && clients.length > 0) {
      // Preload services data for frequency defaults
      const freqDefaults = {};
      CLIENT_SERVICES.forEach(service => {
        freqDefaults[service] = 'Monthly';
      });
      setServiceFrequencies(freqDefaults);
    }
  }, [loading, clients]);

  const filteredClients = useMemo(() => {
    let filtered = clients;
    if (selectedTeam !== 'All') {
      filtered = filtered.filter(client => client.team === selectedTeam);
    }
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(client => client.status === selectedStatus);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(query) ||
        (client.scope_notes || '').toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [clients, selectedTeam, selectedStatus, searchQuery]);

  const teams = useMemo(() => {
    const uniqueTeams = new Set(['All']);
    clients.forEach(client => uniqueTeams.add(client.team || 'Web'));
    return Array.from(uniqueTeams);
  }, [clients]);

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleCreateClient = async () => {
    try {
      // Basic validation
      if (!newClient.name || !newClient.name.trim()) {
        notify({ type: 'error', title: 'Validation Error', message: 'Please enter a client name' });
        return;
      }

      // Create client object with selected services
      const services = selectedServices.map(service => 
        createServiceObject(service, serviceFrequencies[service] || 'Monthly')
      );

      const repository = getClientRepository(supabase, (updatedClient) => {
        updateClient(updatedClient);
      });

      const clientToCreate = {
        ...newClient,
        services
      };

      const created = await repository.createClient(clientToCreate);
      if (created) {
        addClient(created);
        setShowCreateForm(false);
        setNewClient({ ...EMPTY_CLIENT });
        setSelectedServices([]);
        
        // Clear auto-saved data after successful creation
        clearSavedData();
        
        notify({ type: 'success', title: 'Client created', message: created.name });
      }
    } catch (error) {
      notify({ type: 'error', title: 'Client create failed', message: error.message });
    }
  };

  // Load saved draft when form opens
  useEffect(() => {
    if (showCreateForm && autoSaveKey) {
      const savedData = loadSavedData();
      if (savedData && (savedData.name || savedData.scope_notes)) {
        // Only load if there's meaningful data
        setNewClient(savedData);
        notify({ 
          type: 'info', 
          title: 'Draft restored', 
          message: 'Your previous work has been restored' 
        });
      }
    }
  }, [showCreateForm, autoSaveKey, loadSavedData, notify]);

  // Clear draft when form is closed without saving
  const handleCancelCreate = useCallback(() => {
    if (hasUnsavedChanges) {
      const shouldDiscard = window.confirm('You have unsaved changes. Discard them?');
      if (!shouldDiscard) return;
    }
    
    setShowCreateForm(false);
    setNewClient({ ...EMPTY_CLIENT });
    setSelectedServices([]);
    clearSavedData();
  }, [hasUnsavedChanges, clearSavedData]);

  const handleUpdateClient = async (client) => {
    try {
      const repository = getClientRepository(supabase, (updatedClient) => {
        updateClient(updatedClient);
      });
      const updated = await repository.updateClient(client);
      if (updated) {
        updateClient(updated);
        setEditingClient(null);
        notify({ type: 'success', title: 'Client updated', message: updated.name });
      }
    } catch (error) {
      notify({ type: 'error', title: 'Update failed', message: error.message });
    }
  };

  const handleUpdateClientLogo = async (client, imageData) => {
    try {
      if (!imageData?.url) return;
      const { error } = await supabase
        .from('clients')
        .update({ logo_url: imageData.url })
        .eq('id', client.id);
      if (error) throw error;
      notify({ type: 'success', title: 'Logo updated', message: client.name });
      updateClient({ ...client, logo_url: imageData.url });
    } catch (err) {
      notify({ type: 'error', title: 'Logo update failed', message: err.message });
    }
  };

  const handleAddServices = async () => {
    if (!selectedClientForServices) return;
    try {
      const repository = getClientRepository(supabase, (updatedClient) => {
        updateClient(updatedClient);
      });
      
      const newServices = selectedServices.map(service => 
        createServiceObject(service, serviceFrequencies[service] || 'Monthly')
      );
      
      const updated = await repository.addServicesToClient(
        selectedClientForServices.id,
        newServices
      );
      
      if (updated) {
        updateClient(updated);
        setShowServicesModal(false);
        setSelectedClientForServices(null);
        setSelectedServices([]);
        notify({ type: 'success', title: 'Services added', message: updated.name });
      }
    } catch (error) {
      notify({ type: 'error', title: 'Add services failed', message: error.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Client Management</h2>
        <button
          className="rounded-xl bg-blue-600 text-white px-4 py-2"
          onClick={() => setShowCreateForm(s => !s)}
        >
          {showCreateForm ? 'Close' : 'Create New Client'}
        </button>
      </div>

      {showCreateForm && (
        <div className="border rounded-xl p-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Client Name</label>
              <input
                className="w-full border rounded-xl p-2"
                value={newClient.name}
                onChange={e => setNewClient(c => ({ ...c, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm">Team</label>
              <select
                className="w-full border rounded-xl p-2"
                value={newClient.team}
                onChange={e => setNewClient(c => ({ ...c, team: e.target.value }))}
              >
                <option>Web</option>
                <option>Marketing</option>
                <option>Website</option>
              </select>
            </div>
            <div>
              <label className="text-sm">Status</label>
              <select
                className="w-full border rounded-xl p-2"
                value={newClient.status}
                onChange={e => setNewClient(c => ({ ...c, status: e.target.value }))}
              >
                <option>Active</option>
                <option>Paused</option>
                <option>Left</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm">Scope Notes</label>
            <textarea
              className="w-full border rounded-xl p-2"
              rows={3}
              value={newClient.scope_notes}
              onChange={e => setNewClient(c => ({ ...c, scope_notes: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm">Services</label>
            <div className="grid md:grid-cols-4 gap-2 mt-2">
              {CLIENT_SERVICES.map(s => (
                <label key={s} className="flex items-center gap-2 border rounded-xl p-2">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(s)}
                    onChange={() => handleServiceToggle(s)}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Auto-save status */}
          {autoSaveKey && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <div className="animate-spin w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                    <span>Saving...</span>
                  </div>
                ) : lastSaved ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span>Saved {new Date().getTime() - lastSaved.getTime() < 10000 ? 'just now' : 'automatically'}</span>
                  </div>
                ) : hasUnsavedChanges ? (
                  <div className="flex items-center gap-2 text-orange-600">
                    <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                    <span>Unsaved changes</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>Ready</span>
                  </div>
                )}
              </div>
              {hasUnsavedChanges && (
                <button
                  onClick={saveNow}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Save Now
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              className="rounded-xl px-4 py-2 border"
              onClick={handleCancelCreate}
            >
              Cancel
            </button>
            <button
              className="rounded-xl px-4 py-2 bg-blue-600 text-white"
              onClick={handleCreateClient}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select className="border rounded-xl p-2" value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
          {teams.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="border rounded-xl p-2" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
          {['Active', 'Paused', 'Left', 'All'].map(s => <option key={s}>{s}</option>)}
        </select>
        <input className="border rounded-xl p-2" placeholder="Search clients" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <button className="rounded-xl px-3 py-2 border" onClick={() => refreshClients()}>Refresh</button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filteredClients.map(client => (
          <div key={client.id} className="border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClientLogo url={client.logo_url} name={client.name} />
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-xs text-gray-500">{client.team} • {client.status}</div>
                </div>
              </div>
              <button className="rounded-xl px-3 py-2 border" onClick={() => setEditingClient(client)}>Edit</button>
            </div>

            {/* Client logo uploader */}
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-1">Logo</div>
              <ImageUpload
                currentImageUrl={client.logo_url}
                onImageChange={(img) => handleUpdateClientLogo(client, img)}
                userId={`client-${client.id || client.name}`}
                type="client-logo"
                maxWidth={300}
                maxHeight={300}
                placeholder="Upload client logo"
                className="max-w-xs"
              />
            </div>

          {client.services?.length > 0 && (
              <div className="mt-3">
                <div className="text-sm text-gray-600">Services</div>
                <ul className="text-sm mt-1 list-disc pl-5">
                  {client.services.map((s, i) => (
                    <li key={i}>{s.service} <span className="text-gray-500">({s.frequency})</span></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button className="rounded-xl px-3 py-2 border" onClick={() => { setSelectedClientForServices(client); setShowServicesModal(true); }}>Add Services</button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl p-3 sm:p-4 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">Edit Client</div>
              <button className="text-gray-500" onClick={() => setEditingClient(null)}>✕</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-sm">Client Name</label>
                <input className="w-full border rounded-xl p-2" value={editingClient.name} onChange={e => setEditingClient(c => ({ ...c, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm">Team</label>
                <select className="w-full border rounded-xl p-2" value={editingClient.team} onChange={e => setEditingClient(c => ({ ...c, team: e.target.value }))}>
                  <option>Web</option>
                  <option>Marketing</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Status</label>
                <select className="w-full border rounded-xl p-2" value={editingClient.status} onChange={e => setEditingClient(c => ({ ...c, status: e.target.value }))}>
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Left</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm">Scope Notes</label>
                <textarea className="w-full border rounded-xl p-2" rows={3} value={editingClient.scope_notes} onChange={e => setEditingClient(c => ({ ...c, scope_notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="rounded-xl px-4 py-2 border" onClick={() => setEditingClient(null)}>Cancel</button>
              <button className="rounded-xl px-4 py-2 bg-blue-600 text-white" onClick={() => handleUpdateClient(editingClient)}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Services Modal */}
      {showServicesModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl p-3 sm:p-4 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">Add Services</div>
              <button className="text-gray-500" onClick={() => setShowServicesModal(false)}>✕</button>
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              {CLIENT_SERVICES.map(s => (
                <label key={s} className="flex items-center gap-2 border rounded-xl p-2">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(s)}
                    onChange={() => handleServiceToggle(s)}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="rounded-xl px-4 py-2 border" onClick={() => setShowServicesModal(false)}>Cancel</button>
              <button className="rounded-xl px-4 py-2 bg-blue-600 text-white" onClick={handleAddServices}>Add Selected</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
