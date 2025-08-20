import React, { useMemo, useEffect, useState } from "react";
import { useSupabase } from "./SupabaseProvider";
import { useFetchSubmissions } from "./useFetchSubmissions.js";
import { MultiSelect } from "./ui";

export function ClientDashboardView() {
  const supabase = useSupabase();
  const { allSubmissions } = useFetchSubmissions();
  const [clients, setClients] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('All');
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const serviceOptions = ['SEO', 'GBP SEO', 'Website Maintenance', 'Social Media', 'Google Ads', 'Meta Ads', 'AI'];

  useEffect(() => {
    const fetchClients = async () => {
      if (!supabase) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('status', 'Active')
          .order('name');
        
        if (error) throw error;
        setClients(data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchClients();
  }, [supabase]);

  const processedClients = useMemo(() => {
    return clients.map(client => {
      const clientSubmissions = allSubmissions.filter(submission => 
        submission.payload?.clients?.some(c => c.name === client.name)
      );

      const employees = clientSubmissions.reduce((acc, submission) => {
        const employeeKey = `${submission.employee_name}-${submission.employee_email}`;
        if (!acc[employeeKey]) {
          acc[employeeKey] = {
            name: submission.employee_name,
            email: submission.employee_email,
            department: submission.department,
            role: submission.role,
            submissions: []
          };
        }
        acc[employeeKey].submissions.push(submission);
        return acc;
      }, {});

      const totalSubmissions = clientSubmissions.length;
      const activeEmployees = Object.keys(employees).length;
      const avgScore = totalSubmissions > 0 
        ? clientSubmissions.reduce((sum, sub) => sum + (sub.scores?.overall || 0), 0) / totalSubmissions
        : 0;

      return {
        ...client,
        employees: Object.values(employees),
        totalSubmissions,
        activeEmployees,
        avgScore: Math.round(avgScore * 10) / 10
      };
    });
  }, [clients, allSubmissions]);

  const filteredClients = processedClients.filter(client => 
    selectedTeam === 'All' || client.team === selectedTeam
  );
  
  const handleEditClient = (client) => {
    setEditingClient({
      ...client,
      services: client.services || [],
      service_scopes: client.service_scopes || {}
    });
  };
  
  const handleServiceChange = (selectedServices) => {
    setEditingClient(prev => ({ ...prev, services: selectedServices }));
    const newServiceScopes = { ...prev.service_scopes };
    Object.keys(newServiceScopes).forEach(service => {
      if (!selectedServices.includes(service)) {
        delete newServiceScopes[service];
      }
    });
    setEditingClient(prev => ({ ...prev, service_scopes: newServiceScopes }));
  };

  const handleServiceScopeChange = (service, field, value) => {
    setEditingClient(prev => ({
      ...prev,
      service_scopes: {
        ...prev.service_scopes,
        [service]: {
          ...prev.service_scopes[service],
          [field]: value
        }
      }
    }));
  };
  
  const handleSaveClient = async () => {
    if (!supabase || !editingClient) return;
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          client_type: editingClient.client_type,
          services: editingClient.services,
          service_scopes: editingClient.service_scopes,
          scope_of_work: editingClient.scope_of_work
        })
        .eq('id', editingClient.id);
        
      if (error) throw error;
      
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'Active')
        .order('name');
        
      if (fetchError) throw fetchError;
      setClients(data || []);
      setEditingClient(null);
      
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Failed to update client. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading client data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Client Progress Dashboard</h2>
            <p className="text-gray-600">Track employee progress and performance for each client</p>
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 flex items-start gap-3">
                {client.logo_url && (
                  <img src={client.logo_url} alt={`${client.name} logo`} className="w-10 h-10 rounded object-cover" />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{client.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.client_type === 'Enterprise'
                        ? 'bg-purple-100 text-purple-800'
                        : client.client_type === 'Premium'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.client_type}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.team === 'Web' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {client.team}
                    </span>
                  </div>

                {client.services && client.services.length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {client.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="inline-flex px-1.5 py-0.5 text-xs font-medium rounded bg-indigo-50 text-indigo-700"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClient(client);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Edit Client Services"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{client.activeEmployees}</div>
                <div className="text-xs text-gray-500">Employees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{client.totalSubmissions}</div>
                <div className="text-xs text-gray-500">Submissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{client.avgScore}/10</div>
                <div className="text-xs text-gray-500">Avg Score</div>
              </div>
            </div>

            {client.scope_of_work && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-2" title={client.scope_of_work}>
                  {client.scope_of_work}
                </p>
              </div>
            )}

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Working Employees:</div>
              <div className="space-y-1">
                {client.employees.slice(0, 3).map((employee, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{employee.name}</span>
                    <span className="text-xs text-gray-500">{employee.submissions.length} submissions</span>
                  </div>
                ))}
                {client.employees.length > 3 && (
                  <div className="text-xs text-gray-500">+{client.employees.length - 3} more...</div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedClient(client)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              View Progress Details
            </button>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your team filter.</p>
        </div>
      )}

      {editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Client Services</h3>
                <button
                  onClick={() => setEditingClient(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{editingClient.name}</h4>
                <div className="flex gap-2 mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    editingClient.client_type === 'Enterprise' 
                      ? 'bg-purple-100 text-purple-800'
                      : editingClient.client_type === 'Premium'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {editingClient.client_type}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    editingClient.team === 'Web' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {editingClient.team}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                <select
                  value={editingClient.client_type}
                  onChange={(e) => setEditingClient(prev => ({ ...prev, client_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Services *</label>
                <MultiSelect 
                  options={serviceOptions}
                  selected={editingClient.services}
                  onChange={handleServiceChange}
                  placeholder="Select services..."
                />
              </div>

              {editingClient.services.map(service => (
                <div key={service} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-800 mb-3">{service} - Scope Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Deliverables</label>
                      <input
                        type="number"
                        min="1"
                        value={editingClient.service_scopes[service]?.deliverables || ''}
                        onChange={(e) => handleServiceScopeChange(service, 'deliverables', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={`Number of ${service.toLowerCase()} deliverables per month`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scope Description</label>
                      <textarea
                        rows={2}
                        value={editingClient.service_scopes[service]?.description || ''}
                        onChange={(e) => handleServiceScopeChange(service, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={`Describe the ${service} scope and requirements...`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <select
                        value={editingClient.service_scopes[service]?.frequency || 'monthly'}
                        onChange={(e) => handleServiceScopeChange(service, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  rows={2}
                  value={editingClient.scope_of_work}
                  onChange={(e) => setEditingClient(prev => ({ ...prev, scope_of_work: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Additional notes or overall scope description..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedClient.name}</h3>
                  <p className="text-sm text-gray-600">{selectedClient.client_type} • {selectedClient.team} Team</p>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Client Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Type:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedClient.client_type}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Team:</span>
                      <span className="ml-2 text-sm text-gray-900">{selectedClient.team}</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-gray-700">Scope of Work:</span>
                      <p className="mt-1 text-sm text-gray-900">{selectedClient.scope_of_work || 'No scope defined'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Employee Progress</h4>
                <div className="space-y-4">
                  {selectedClient.employees.map((employee, idx) => {
                    const latestSubmission = employee.submissions[0];
                    const avgScore = employee.submissions.length > 0
                      ? employee.submissions.reduce((sum, sub) => sum + (sub.scores?.overall || 0), 0) / employee.submissions.length
                      : 0;

                    return (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">{employee.name}</h5>
                            <p className="text-sm text-gray-600">{employee.department} • {employee.role}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-blue-600">{Math.round(avgScore * 10) / 10}/10</div>
                            <div className="text-xs text-gray-500">Avg Score</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total Submissions:</span>
                            <div className="font-medium">{employee.submissions.length}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Latest:</span>
                            <div className="font-medium">
                              {latestSubmission 
                                ? new Date(latestSubmission.created_at).toLocaleDateString()
                                : 'N/A'
                              }
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">KPI Score:</span>
                            <div className="font-medium">{latestSubmission?.scores?.kpiScore || 'N/A'}/10</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Learning:</span>
                            <div className="font-medium">{latestSubmission?.scores?.learningScore || 'N/A'}/10</div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <span className="text-sm text-gray-500">Recent Activity:</span>
                          <div className="mt-2 space-y-1">
                            {employee.submissions.slice(0, 3).map((submission, subIdx) => (
                              <div key={subIdx} className="flex items-center gap-2 text-xs text-gray-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>{submission.month_key}</span>
                                <span>•</span>
                                <span>Score: {submission.scores?.overall || 'N/A'}/10</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}