import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useDataSync } from './DataSyncContext';
import { useEmployeeSync } from '@/features/employees/context/EmployeeSyncContext';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { useToast } from '@/shared/components/Toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const ClientDirectory = ({ onBack }) => {
  const supabase = useSupabase();
  const { notify } = useToast();
  
  // Use context data with real-time sync
  const { clients, loading: clientsLoading, error: clientsError } = useDataSync();
  const { employees, loading: employeesLoading } = useEmployeeSync();
  
  const loading = clientsLoading || employeesLoading;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards', 'table', 'charts'

  // Show error notification if data sync fails
  useEffect(() => {
    if (clientsError) {
      notify('Failed to sync client data', 'error');
    }
  }, [clientsError, notify]);

  // Data is now automatically synced via context with real-time updates

  // Generate mock satisfaction scores if not available
  const generateSatisfactionScore = (client) => {
    if (client.satisfaction_score) return client.satisfaction_score;
    // Generate consistent score based on client name
    const hash = client.name?.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) || 0;
    return Math.abs(hash % 41) + 60; // Score between 60-100
  };

  // Categorize clients based on services and type
  const categorizeClient = (client) => {
    const servicesCount = client.services?.length || 0;
    const isCorporateHospital = client.type?.toLowerCase().includes('corporate') || 
                               client.type?.toLowerCase().includes('hospital') ||
                               client.name?.toLowerCase().includes('hospital') ||
                               client.name?.toLowerCase().includes('corporate');
    
    if (servicesCount > 3 && isCorporateHospital) {
      return 'Enterprise';
    } else if (servicesCount >= 2 && servicesCount <= 3) {
      return 'Premium';
    } else if (servicesCount === 1) {
      return 'Standard';
    } else {
      // Fallback to old logic for clients without services data
      const name = client.name?.toLowerCase() || '';
      const description = client.description?.toLowerCase() || '';
      const budget = client.budget || 0;
      
      if (budget > 50000 || name.includes('enterprise') || description.includes('enterprise')) {
        return 'Enterprise';
      } else if (budget > 20000 || name.includes('premium') || description.includes('premium')) {
        return 'Premium';
      } else {
        return 'Standard';
      }
    }
  };

  // Get project handler
  const getProjectHandler = (client) => {
    if (client.assigned_employee) {
      const employee = employees.find(emp => emp.id === client.assigned_employee || emp.name === client.assigned_employee);
      return employee?.name || client.assigned_employee;
    }
    
    // Auto-assign based on client category
    const category = categorizeClient(client);
    const marketingEmployees = employees.filter(emp => 
      emp.department?.toLowerCase().includes('marketing') || 
      (Array.isArray(emp.role) 
        ? emp.role.some(r => r?.toLowerCase().includes('marketing'))
        : emp.role?.toLowerCase().includes('marketing'))
    );
    
    if (category === 'Marketing' && marketingEmployees.length > 0) {
      return marketingEmployees[0].name;
    }
    
    return 'Unassigned';
  };

  // Handle handler assignment
  const handleHandlerChange = async (clientId, newHandler) => {
    try {
      const { error } = await supabase
        .from('client_onboarding')
        .update({ assigned_team: newHandler })
        .eq('id', clientId);
      
      if (error) throw error;
      
      // Update local state
      updateClient(clientId, { assigned_employee: newHandler });
      
      notify('Handler updated successfully', 'success');
    } catch (error) {
      console.error('Error updating handler:', error);
      notify('Failed to update handler', 'error');
    }
  };

  // Handle adding new client
  const handleAddClient = () => {
    // This would typically open a modal or navigate to a form
    notify('Add client functionality - would open client creation form', 'info');
  };

  // Handle bulk operations
  const handleBulkAssign = () => {
    notify('Bulk assign functionality - would open bulk assignment modal', 'info');
  };

  const handleBulkEmail = () => {
    notify('Bulk email functionality - would open email composer', 'info');
  };

  // Enhanced client data with calculations
  const enhancedClients = clients.map(client => ({
    ...client,
    category: categorizeClient(client),
    handler: getProjectHandler(client),
    satisfactionScore: generateSatisfactionScore(client),
    status: client.status || 'active',
    servicesCount: client.services?.length || 0
  }));

  // Filter clients
  const filteredClients = enhancedClients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.handler?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || client.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Chart data
  const categoryData = [
    { name: 'Enterprise', value: enhancedClients.filter(c => c.category === 'Enterprise').length, color: '#8B5CF6' },
    { name: 'Premium', value: enhancedClients.filter(c => c.category === 'Premium').length, color: '#06B6D4' },
    { name: 'Marketing', value: enhancedClients.filter(c => c.category === 'Marketing').length, color: '#10B981' },
    { name: 'Standard', value: enhancedClients.filter(c => c.category === 'Standard').length, color: '#F59E0B' }
  ];

  const satisfactionData = enhancedClients.map(client => ({
    name: client.name?.substring(0, 15) + (client.name?.length > 15 ? '...' : ''),
    satisfaction: client.satisfactionScore,
    category: client.category
  })).sort((a, b) => b.satisfaction - a.satisfaction).slice(0, 10);

  const handlerData = Object.entries(
    enhancedClients.reduce((acc, client) => {
      const handler = client.handler || 'Unassigned';
      acc[handler] = (acc[handler] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }));

  const ClientCard = ({ client }) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const categoryColors = {
      Enterprise: 'bg-purple-100 text-purple-800',
      Premium: 'bg-cyan-100 text-cyan-800',
      Marketing: 'bg-green-100 text-green-800',
      Standard: 'bg-orange-100 text-orange-800'
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">{client.name || 'Unnamed Client'}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{client.description || 'No description available'}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[client.status] || 'bg-gray-100 text-gray-800'
            }`}>
              {client.status || 'active'}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              categoryColors[client.category] || 'bg-gray-100 text-gray-800'
            }`}>
              {client.category}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Handler:</span>
            <span className="font-medium text-gray-900">{client.handler}</span>
          </div>
          
          {client.budget && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Budget:</span>
              <span className="font-medium text-gray-900">${client.budget.toLocaleString()}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Satisfaction:</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    client.satisfactionScore >= 80 ? 'bg-green-500' :
                    client.satisfactionScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${client.satisfactionScore}%` }}
                ></div>
              </div>
              <span className="font-medium text-gray-900">{client.satisfactionScore}%</span>
            </div>
          </div>
          
          {client.created_at && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Started:</span>
              <span className="text-gray-700">{new Date(client.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="xl" showText text="Loading client management..." />
        </div>
      </div>
    );
  }

  // Empty state when no clients exist
  if (!loading && enhancedClients.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Directory</h1>
              <p className="text-gray-600">Project categorization, handler assignments, and satisfaction tracking</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddClient}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                + Add Client
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
          
          {/* Empty State */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first client to the directory.</p>
            <button
              onClick={handleAddClient}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Add Your First Client
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Directory</h1>
          <p className="text-gray-600">Project categorization, handler assignments, and satisfaction tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddClient}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            + Add Client
          </button>
          <button
            onClick={handleBulkAssign}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            Bulk Assign
          </button>
          <button
            onClick={handleBulkEmail}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            Bulk Email
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">👥</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              <p className="text-sm text-gray-600">Total Clients</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{enhancedClients.filter(c => c.status === 'active').length}</p>
              <p className="text-sm text-gray-600">Active Projects</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-lg">⭐</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(enhancedClients.reduce((sum, c) => sum + c.satisfactionScore, 0) / enhancedClients.length || 0)}%
              </p>
              <p className="text-sm text-gray-600">Avg Satisfaction</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-lg">💼</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{enhancedClients.filter(c => c.category === 'Enterprise').length}</p>
              <p className="text-sm text-gray-600">Enterprise Projects</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search clients by name, description, or handler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Premium">Premium</option>
              <option value="Marketing">Marketing</option>
              <option value="Standard">Standard</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'cards' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'table' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'charts' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Charts
            </button>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'charts' ? (
        <div className="space-y-8">
          {/* Project Categories Chart */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Categories</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Satisfaction Scores Chart */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Satisfaction Scores (Top 10)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={satisfactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="satisfaction" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Handler Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects by Handler</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={handlerData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handler</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satisfaction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{client.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.category === 'Enterprise' ? 'bg-purple-100 text-purple-800' :
                        client.category === 'Premium' ? 'bg-cyan-100 text-cyan-800' :
                        client.category === 'Marketing' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {client.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <select
                        value={client.handler}
                        onChange={(e) => handleHandlerChange(client.id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Unassigned">Unassigned</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'active' ? 'bg-green-100 text-green-800' :
                        client.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        client.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              client.satisfactionScore >= 80 ? 'bg-green-500' :
                              client.satisfactionScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${client.satisfactionScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{client.satisfactionScore}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {client.budget ? `$${client.budget.toLocaleString()}` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-gray-600">
              Showing {filteredClients.length} of {clients.length} clients
              {selectedCategory !== 'all' && ` in ${selectedCategory} category`}
              {selectedStatus !== 'all' && ` with ${selectedStatus} status`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>

          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'No clients have been added yet.'}
              </p>
              {(searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientDirectory;