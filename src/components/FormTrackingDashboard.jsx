import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useToast } from '@/shared/components/Toast';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';

const FormTrackingDashboard = () => {
  const { user, hasPermission } = useUnifiedAuth();
  const { showToast } = useToast();
  
  const [clientOnboardingForms, setClientOnboardingForms] = useState([]);
  const [employeeOnboardingForms, setEmployeeOnboardingForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('client');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Check if user has admin permissions
  useEffect(() => {
    if (!user || !hasPermission('manage:onboarding')) {
      showToast('Access denied. Admin permissions required.', 'error');
      return;
    }
    loadFormData();
  }, [user]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      
      // Load client onboarding forms
      const { data: clientForms, error: clientError } = await supabase
        .from('client_onboarding')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (clientError) throw clientError;
      
      // Load employee onboarding data from employees table
      const { data: employeeForms, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (employeeError) throw employeeError;
      
      setClientOnboardingForms(clientForms || []);
      setEmployeeOnboardingForms(employeeForms || []);
      
    } catch (error) {
      console.error('Error loading form data:', error);
      showToast('Failed to load form tracking data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateFormStatus = async (formId, newStatus, formType) => {
    try {
      const table = formType === 'client' ? 'client_onboarding' : 'employees';
      const statusField = formType === 'client' ? 'submission_status' : 'status';
      
      const { error } = await supabase
        .from(table)
        .update({ [statusField]: newStatus })
        .eq('id', formId);
      
      if (error) throw error;
      
      showToast(`${formType === 'client' ? 'Client' : 'Employee'} form status updated successfully`, 'success');
      loadFormData(); // Refresh data
      
    } catch (error) {
      console.error('Error updating form status:', error);
      showToast('Failed to update form status', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (createdAt, status) => {
    const created = new Date(createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    
    // Consider forms overdue if pending/submitted for more than 7 days
    return daysDiff > 7 && ['pending', 'submitted', 'draft'].includes(status?.toLowerCase());
  };

  const filterForms = (forms, formType) => {
    let filtered = forms;
    
    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        filtered = filtered.filter(form => {
          const status = formType === 'client' ? form.submission_status : form.status;
          return isOverdue(form.created_at, status);
        });
      } else {
        filtered = filtered.filter(form => {
          const status = formType === 'client' ? form.submission_status : form.status;
          return status?.toLowerCase() === statusFilter;
        });
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(form => {
        const name = formType === 'client' ? form.client_name : form.name;
        const email = formType === 'client' ? form.email : form.email;
        return name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               email?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  const getFormStats = (forms, formType) => {
    const total = forms.length;
    const pending = forms.filter(form => {
      const status = formType === 'client' ? form.submission_status : form.status;
      return ['pending', 'submitted', 'draft'].includes(status?.toLowerCase());
    }).length;
    const completed = forms.filter(form => {
      const status = formType === 'client' ? form.submission_status : form.status;
      return ['approved', 'active'].includes(status?.toLowerCase());
    }).length;
    const overdue = forms.filter(form => {
      const status = formType === 'client' ? form.submission_status : form.status;
      return isOverdue(form.created_at, status);
    }).length;
    
    return { total, pending, completed, overdue };
  };

  const renderClientForm = (form) => (
    <tr key={form.id} className={`hover:bg-gray-50 ${isOverdue(form.created_at, form.submission_status) ? 'bg-red-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{form.client_name}</div>
        <div className="text-sm text-gray-500">{form.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{form.industry}</div>
        <div className="text-sm text-gray-500">{form.company_size}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(form.submission_status)}`}>
          {form.submission_status || 'Draft'}
        </span>
        {isOverdue(form.created_at, form.submission_status) && (
          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Overdue
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(form.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {form.assigned_team || 'Unassigned'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <select
          value={form.submission_status || 'draft'}
          onChange={(e) => updateFormStatus(form.id, e.target.value, 'client')}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </td>
    </tr>
  );

  const renderEmployeeForm = (form) => (
    <tr key={form.id} className={`hover:bg-gray-50 ${isOverdue(form.created_at, form.status) ? 'bg-red-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{form.name}</div>
        <div className="text-sm text-gray-500">{form.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{form.department}</div>
        <div className="text-sm text-gray-500">{form.employee_type}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(form.status)}`}>
          {form.status || 'Pending'}
        </span>
        {isOverdue(form.created_at, form.status) && (
          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Overdue
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(form.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {form.hire_date ? new Date(form.hire_date).toLocaleDateString() : 'Not set'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <select
          value={form.status || 'pending'}
          onChange={(e) => updateFormStatus(form.id, e.target.value, 'employee')}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </td>
    </tr>
  );

  if (!user || !hasPermission('manage:onboarding')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the form tracking dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form tracking data...</p>
        </div>
      </div>
    );
  }

  const currentForms = activeTab === 'client' ? clientOnboardingForms : employeeOnboardingForms;
  const filteredForms = filterForms(currentForms, activeTab);
  const stats = getFormStats(currentForms, activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Form Tracking Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor and manage onboarding form submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Forms</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('client')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'client'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Client Onboarding ({clientOnboardingForms.length})
              </button>
              <button
                onClick={() => setActiveTab('employee')}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'employee'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Employee Onboarding ({employeeOnboardingForms.length})
              </button>
            </nav>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created_at">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>
              <div>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'client' ? 'Client' : 'Employee'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'client' ? 'Industry' : 'Department'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'client' ? 'Assigned Team' : 'Hire Date'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredForms.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No forms found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredForms.map(form => 
                    activeTab === 'client' ? renderClientForm(form) : renderEmployeeForm(form)
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormTrackingDashboard;