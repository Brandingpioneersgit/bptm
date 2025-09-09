import React, { useState, useEffect } from 'react';
import { supabase } from '../shared/lib/supabase';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';

const TestDataManager = ({ onBack }) => {
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Client form state
  const [clientForm, setClientForm] = useState({
    name: '',
    team: 'Web',
    client_type: 'Standard',
    contact_person: '',
    email: '',
    phone: '',
    industry: ''
  });
  
  // KPI form state
  const [kpiForm, setKpiForm] = useState({
    employee_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    meetings_with_clients: 0,
    whatsapp_messages_sent: 50,
    client_satisfaction_score: 8.0,
    client_retention_rate: 95.0,
    new_clients_acquired: 2,
    tasks_completed: 15,
    tasks_on_time: 14,
    quality_score: 8.5,
    productivity_score: 8.3,
    learning_hours: 25.0,
    courses_completed: 1,
    certifications_earned: 0,
    attendance_rate: 95.0,
    punctuality_score: 9.2,
    team_collaboration_score: 8.8,
    initiative_score: 8.0,
    overall_score: 8.2
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([fetchEmployees(), fetchClients()]);
      } finally {
        setInitialLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, department, role')
        .eq('status', 'Active');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, team, client_type, status')
        .eq('status', 'Active');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          ...clientForm,
          status: 'Active',
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) throw error;
      
      toast.success('Client added successfully!');
      setClientForm({
        name: '',
        team: 'Web',
        client_type: 'Standard',
        contact_person: '',
        email: '',
        phone: '',
        industry: ''
      });
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKPI = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('monthly_kpi_reports')
        .upsert([{
          ...kpiForm,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'employee_id,month,year'
        })
        .select();
      
      if (error) throw error;
      
      toast.success('KPI data added/updated successfully!');
      setKpiForm({
        employee_id: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        meetings_with_clients: 0,
        whatsapp_messages_sent: 50,
        client_satisfaction_score: 8.0,
        client_retention_rate: 95.0,
        new_clients_acquired: 2,
        tasks_completed: 15,
        tasks_on_time: 14,
        quality_score: 8.5,
        productivity_score: 8.3,
        learning_hours: 25.0,
        courses_completed: 1,
        certifications_earned: 0,
        attendance_rate: 95.0,
        punctuality_score: 9.2,
        team_collaboration_score: 8.8,
        initiative_score: 8.0,
        overall_score: 8.2
      });
    } catch (error) {
      console.error('Error adding KPI:', error);
      toast.error('Failed to add KPI data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomKPIs = async () => {
    setLoading(true);
    
    try {
      const kpiPromises = employees.map(employee => {
        const randomKPI = {
          employee_id: employee.id,
          month: kpiForm.month,
          year: kpiForm.year,
          meetings_with_clients: Math.floor(Math.random() * 10) + 5,
          whatsapp_messages_sent: Math.floor(Math.random() * 50) + 30,
          client_satisfaction_score: Math.round((Math.random() * 2 + 8) * 10) / 10,
          client_retention_rate: Math.round((Math.random() * 10 + 90) * 10) / 10,
          new_clients_acquired: Math.floor(Math.random() * 5) + 1,
          tasks_completed: Math.floor(Math.random() * 20) + 15,
          tasks_on_time: Math.floor(Math.random() * 18) + 12,
          quality_score: Math.round((Math.random() * 2 + 8) * 10) / 10,
          productivity_score: Math.round((Math.random() * 2 + 8) * 10) / 10,
          learning_hours: Math.round((Math.random() * 15 + 20) * 10) / 10,
          courses_completed: Math.floor(Math.random() * 3),
          certifications_earned: Math.floor(Math.random() * 2),
          attendance_rate: Math.round((Math.random() * 10 + 90) * 10) / 10,
          punctuality_score: Math.round((Math.random() * 2 + 8) * 10) / 10,
          team_collaboration_score: Math.round((Math.random() * 2 + 8) * 10) / 10,
          initiative_score: Math.round((Math.random() * 2 + 7.5) * 10) / 10,
          overall_score: Math.round((Math.random() * 2 + 8) * 10) / 10
        };
        
        return supabase
          .from('monthly_kpi_reports')
          .upsert([randomKPI], {
            onConflict: 'employee_id,month,year'
          });
      });
      
      await Promise.all(kpiPromises);
      toast.success(`Generated random KPIs for ${employees.length} employees!`);
    } catch (error) {
      console.error('Error generating random KPIs:', error);
      toast.error('Failed to generate random KPIs');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <LoadingSpinner message="Loading test data manager..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Test Data Manager</h1>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Client Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add Test Client</h2>
          <form onSubmit={handleAddClient} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input
                type="text"
                value={clientForm.name}
                onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select
                  value={clientForm.team}
                  onChange={(e) => setClientForm({...clientForm, team: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Web">Web</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Performance Ads">Performance Ads</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Type</label>
                <select
                  value={clientForm.client_type}
                  onChange={(e) => setClientForm({...clientForm, client_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={clientForm.contact_person}
                onChange={(e) => setClientForm({...clientForm, contact_person: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                value={clientForm.industry}
                onChange={(e) => setClientForm({...clientForm, industry: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Technology, Healthcare, Finance"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Client'}
            </button>
          </form>
        </div>
        
        {/* Add KPI Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Add KPI Data</h2>
          <form onSubmit={handleAddKPI} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                value={kpiForm.employee_id}
                onChange={(e) => setKpiForm({...kpiForm, employee_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.department}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={kpiForm.month}
                  onChange={(e) => setKpiForm({...kpiForm, month: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>
                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={kpiForm.year}
                  onChange={(e) => setKpiForm({...kpiForm, year: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="2020"
                  max="2030"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Meetings</label>
                <input
                  type="number"
                  value={kpiForm.meetings_with_clients}
                  onChange={(e) => setKpiForm({...kpiForm, meetings_with_clients: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Messages</label>
                <input
                  type="number"
                  value={kpiForm.whatsapp_messages_sent}
                  onChange={(e) => setKpiForm({...kpiForm, whatsapp_messages_sent: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Satisfaction (1-10)</label>
                <input
                  type="number"
                  step="0.1"
                  value={kpiForm.client_satisfaction_score}
                  onChange={(e) => setKpiForm({...kpiForm, client_satisfaction_score: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Retention Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={kpiForm.client_retention_rate}
                  onChange={(e) => setKpiForm({...kpiForm, client_retention_rate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Clients Acquired</label>
                <input
                  type="number"
                  value={kpiForm.new_clients_acquired}
                  onChange={(e) => setKpiForm({...kpiForm, new_clients_acquired: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasks On Time</label>
                <input
                  type="number"
                  value={kpiForm.tasks_on_time}
                  onChange={(e) => setKpiForm({...kpiForm, tasks_on_time: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Completed</label>
                <input
                  type="number"
                  value={kpiForm.tasks_completed}
                  onChange={(e) => setKpiForm({...kpiForm, tasks_completed: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quality Score (1-10)</label>
                <input
                  type="number"
                  step="0.1"
                  value={kpiForm.quality_score}
                  onChange={(e) => setKpiForm({...kpiForm, quality_score: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Productivity Score (1-10)</label>
                <input
                  type="number"
                  step="0.1"
                  value={kpiForm.productivity_score}
                  onChange={(e) => setKpiForm({...kpiForm, productivity_score: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Courses Completed</label>
                <input
                  type="number"
                  value={kpiForm.courses_completed}
                  onChange={(e) => setKpiForm({...kpiForm, courses_completed: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learning Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={kpiForm.learning_hours}
                  onChange={(e) => setKpiForm({...kpiForm, learning_hours: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certifications Earned</label>
                <input
                  type="number"
                  value={kpiForm.certifications_earned}
                  onChange={(e) => setKpiForm({...kpiForm, certifications_earned: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={kpiForm.attendance_rate}
                  onChange={(e) => setKpiForm({...kpiForm, attendance_rate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Punctuality Score (1-10)</label>
                <input
                  type="number"
                  step="0.1"
                  value={kpiForm.punctuality_score}
                  onChange={(e) => setKpiForm({...kpiForm, punctuality_score: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Collaboration (1-10)</label>
                <input
                  type="number"
                  step="0.1"
                  value={kpiForm.team_collaboration_score}
                  onChange={(e) => setKpiForm({...kpiForm, team_collaboration_score: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initiative Score (1-10)</label>
                <input
                  type="number"
                  step="0.1"
                  value={kpiForm.initiative_score}
                  onChange={(e) => setKpiForm({...kpiForm, initiative_score: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overall Score (1-10)</label>
              <input
                type="number"
                step="0.1"
                value={kpiForm.overall_score}
                onChange={(e) => setKpiForm({...kpiForm, overall_score: parseFloat(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
              />
            </div>
            
            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add/Update KPI Data'}
              </button>
              
              <button
                type="button"
                onClick={generateRandomKPIs}
                disabled={loading || employees.length === 0}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading ? 'Generating...' : `Generate Random KPIs for All ${employees.length} Employees`}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Current Data Display */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Clients List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Current Clients ({clients.length})</h3>
          <div className="max-h-64 overflow-y-auto">
            {clients.map(client => (
              <div key={client.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-gray-500">{client.team} - {client.client_type}</div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {client.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Employees List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Current Employees ({employees.length})</h3>
          <div className="max-h-64 overflow-y-auto">
            {employees.map(employee => (
              <div key={employee.id} className="flex justify-between items-center py-2 border-b border-gray-200">
                <div>
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-gray-500">{employee.department} - {employee.role?.join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDataManager;