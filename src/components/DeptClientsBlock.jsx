import React, { useState, useEffect } from 'react';
import { useDataSync } from '@/components/DataSyncContext';
import ClientDropdown from '@/shared/components/ClientDropdown';
import { Plus, X, Users, TrendingUp, Calendar, Target } from 'lucide-react';

const DeptClientsBlock = ({ 
  currentSubmission, 
  previousSubmission, 
  comparisonSubmission, 
  setModel, 
  monthPrev, 
  monthThis, 
  monthComparison, 
  openModal, 
  closeModal 
}) => {
  const { clients: allClients, loading } = useDataSync();
  const [selectedClients, setSelectedClients] = useState(currentSubmission?.clients || []);
  const [newClientEntry, setNewClientEntry] = useState({
    name: '',
    services: [],
    deliverables: '',
    progress: 0,
    challenges: '',
    achievements: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // Update parent form data when clients change
  useEffect(() => {
    if (setModel) {
      setModel(prev => ({
        ...prev,
        clients: selectedClients
      }));
    }
  }, [selectedClients, setModel]);

  // Handle adding a new client entry
  const handleAddClient = () => {
    if (!newClientEntry.name.trim()) return;
    
    const clientEntry = {
      id: Date.now().toString(),
      name: newClientEntry.name,
      services: newClientEntry.services,
      deliverables: newClientEntry.deliverables,
      progress: newClientEntry.progress,
      challenges: newClientEntry.challenges,
      achievements: newClientEntry.achievements,
      monthKey: monthThis
    };
    
    setSelectedClients(prev => [...prev, clientEntry]);
    setNewClientEntry({
      name: '',
      services: [],
      deliverables: '',
      progress: 0,
      challenges: '',
      achievements: ''
    });
    setShowAddForm(false);
  };

  // Handle removing a client entry
  const handleRemoveClient = (clientId) => {
    setSelectedClients(prev => prev.filter(client => client.id !== clientId));
  };

  // Handle updating a client entry
  const handleUpdateClient = (clientId, field, value) => {
    setSelectedClients(prev => 
      prev.map(client => 
        client.id === clientId 
          ? { ...client, [field]: value }
          : client
      )
    );
  };

  // Handle client selection from dropdown
  const handleClientSelect = (selectedClient) => {
    if (!selectedClient) return;
    
    // Check if client is already added
    const isAlreadyAdded = selectedClients.some(client => 
      client.name.toLowerCase() === selectedClient.name.toLowerCase()
    );
    
    if (isAlreadyAdded) {
      alert('This client is already added to your list.');
      return;
    }
    
    setNewClientEntry(prev => ({
      ...prev,
      name: selectedClient.name,
      services: selectedClient.services || []
    }));
  };

  // Calculate progress statistics
  const progressStats = {
    totalClients: selectedClients.length,
    avgProgress: selectedClients.length > 0 
      ? selectedClients.reduce((sum, client) => sum + (client.progress || 0), 0) / selectedClients.length
      : 0,
    completedProjects: selectedClients.filter(client => (client.progress || 0) >= 100).length
  };

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Client Management & KPIs
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Track your client work, deliverables, and progress for {monthThis}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
        
        {/* Progress Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Total Clients</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{progressStats.totalClients}</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Avg Progress</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{progressStats.avgProgress.toFixed(1)}%</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Completed</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{progressStats.completedProjects}</div>
          </div>
        </div>
      </div>

      {/* Add Client Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">Add New Client</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Client
              </label>
              <ClientDropdown
                value={newClientEntry.name}
                onChange={(value) => setNewClientEntry(prev => ({ ...prev, name: value }))}
                onClientSelect={handleClientSelect}
                placeholder="Select or create a new client..."
                allowCreate={true}
                className="w-full"
              />
            </div>
            
            {/* Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services Provided
              </label>
              <input
                type="text"
                value={Array.isArray(newClientEntry.services) ? newClientEntry.services.join(', ') : newClientEntry.services}
                onChange={(e) => setNewClientEntry(prev => ({ 
                  ...prev, 
                  services: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                }))}
                placeholder="e.g., SEO, Social Media, Web Development"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Deliverables */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Deliverables
              </label>
              <textarea
                value={newClientEntry.deliverables}
                onChange={(e) => setNewClientEntry(prev => ({ ...prev, deliverables: e.target.value }))}
                placeholder="Describe the main deliverables and outcomes for this client..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Progress */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress ({newClientEntry.progress}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={newClientEntry.progress}
                onChange={(e) => setNewClientEntry(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleAddClient}
                disabled={!newClientEntry.name.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Client
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client List */}
      <div className="space-y-4">
        {selectedClients.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Clients Added</h4>
            <p className="text-gray-600 mb-4">
              Add clients to track your work progress and deliverables for this month.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Client
            </button>
          </div>
        ) : (
          selectedClients.map((client, index) => (
            <div key={client.id || index} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{client.name}</h4>
                  {client.services && client.services.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Services: {Array.isArray(client.services) ? client.services.join(', ') : client.services}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveClient(client.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm text-gray-600">{client.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${client.progress || 0}%` }}
                  ></div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={client.progress || 0}
                  onChange={(e) => handleUpdateClient(client.id, 'progress', parseInt(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
              
              {/* Deliverables */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Deliverables
                </label>
                <textarea
                  value={client.deliverables || ''}
                  onChange={(e) => handleUpdateClient(client.id, 'deliverables', e.target.value)}
                  placeholder="Describe the main deliverables and outcomes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Achievements and Challenges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Achievements
                  </label>
                  <textarea
                    value={client.achievements || ''}
                    onChange={(e) => handleUpdateClient(client.id, 'achievements', e.target.value)}
                    placeholder="Key wins and successes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Challenges
                  </label>
                  <textarea
                    value={client.challenges || ''}
                    onChange={(e) => handleUpdateClient(client.id, 'challenges', e.target.value)}
                    placeholder="Obstacles and difficulties faced..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Summary */}
      {selectedClients.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-medium text-blue-900 mb-2">Monthly Summary</h4>
          <div className="text-sm text-blue-800">
            <p>• Working with {progressStats.totalClients} client{progressStats.totalClients !== 1 ? 's' : ''} this month</p>
            <p>• Average project progress: {progressStats.avgProgress.toFixed(1)}%</p>
            <p>• {progressStats.completedProjects} project{progressStats.completedProjects !== 1 ? 's' : ''} completed</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeptClientsBlock;