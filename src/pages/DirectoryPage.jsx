import React, { useState, useEffect } from 'react';
import { useDataSync } from '../components/DataSyncContext';
import { useUnifiedAuth } from '@/shared/hooks/useUnifiedAuth';
import { useNavigationUtils } from '../utils/navigation';
import { useSupabase } from '../components/SupabaseProvider';
import { useEnhancedErrorHandling } from '../shared/hooks/useEnhancedErrorHandling';

const DirectoryPage = () => {
  const { employees, loading, addEmployee, updateEmployee, removeEmployee } = useDataSync();
  const { user, role } = useUnifiedAuth();
  const { supabase } = useSupabase();
  const { notify, handleDataFetch } = useEnhancedErrorHandling();
  const navigation = useNavigationUtils();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter and sort employees
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || 
                             employee.department === selectedDepartment;
    
    const matchesRole = selectedRole === 'all' || 
                       (Array.isArray(employee.role) ? 
                        employee.role.includes(selectedRole) : 
                        employee.role === selectedRole);
    
    return matchesSearch && matchesDepartment && matchesRole;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'department':
        return (a.department || '').localeCompare(b.department || '');
      case 'role':
        const roleA = Array.isArray(a.role) ? a.role[0] : a.role || '';
        const roleB = Array.isArray(b.role) ? b.role[0] : b.role || '';
        return roleA.localeCompare(roleB);
      case 'email':
        return (a.email || '').localeCompare(b.email || '');
      default:
        return 0;
    }
  });

  // Get unique departments and roles
  const departments = ['all', ...new Set(employees.map(emp => emp.department).filter(Boolean))];
  const roles = ['all', ...new Set(employees.flatMap(emp => 
    Array.isArray(emp.role) ? emp.role : [emp.role]
  ).filter(Boolean))];

  // Get employee's primary role for display
  const getPrimaryRole = (employee) => {
    if (Array.isArray(employee.role)) {
      return employee.role[0] || 'Employee';
    }
    return employee.role || 'Employee';
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colorMap = {
      'Manager': 'bg-purple-100 text-purple-800',
      'Head': 'bg-red-100 text-red-800',
      'Lead': 'bg-blue-100 text-blue-800',
      'Senior': 'bg-green-100 text-green-800',
      'Executive': 'bg-yellow-100 text-yellow-800',
      'Specialist': 'bg-indigo-100 text-indigo-800',
      'Developer': 'bg-cyan-100 text-cyan-800',
      'Designer': 'bg-pink-100 text-pink-800',
      'Writer': 'bg-orange-100 text-orange-800',
      'Intern': 'bg-gray-100 text-gray-800',
      'Freelancer': 'bg-teal-100 text-teal-800'
    };
    
    for (const [key, color] of Object.entries(colorMap)) {
      if (role.includes(key)) {
        return color;
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  // Contact Actions
  const handleSendEmail = (employee) => {
    if (employee.email) {
      window.open(`mailto:${employee.email}`, '_blank');
      notify(`Opening email to ${employee.name}`, 'info');
    } else {
      notify('No email address available', 'warning');
    }
  };

  const handleCall = (employee) => {
    if (employee.phone) {
      window.open(`tel:${employee.phone}`, '_blank');
      notify(`Calling ${employee.name}`, 'info');
    } else {
      notify('No phone number available', 'warning');
    }
  };

  const handleSendMessage = (employee) => {
    notify(`Message functionality for ${employee.name} - would open messaging interface`, 'info');
  };

  // CRUD Operations
  const handleAddEmployee = () => {
    setShowAddModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', employeeId);
        
        if (error) throw error;
        
        removeEmployee(employeeId);
        notify('Employee deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting employee:', error);
        notify('Failed to delete employee', 'error');
      }
    }
  };

  // Bulk Operations
  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.id));
    }
  };

  const handleBulkEmail = () => {
    const selectedEmails = filteredEmployees
      .filter(emp => selectedEmployees.includes(emp.id) && emp.email)
      .map(emp => emp.email)
      .join(',');
    
    if (selectedEmails) {
      window.open(`mailto:${selectedEmails}`, '_blank');
      notify(`Opening email to ${selectedEmployees.length} employees`, 'info');
    } else {
      notify('No email addresses available for selected employees', 'warning');
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedEmployees.length} employees?`)) {
      try {
        const { error } = await supabase
          .from('employees')
          .delete()
          .in('id', selectedEmployees);
        
        if (error) throw error;
        
        selectedEmployees.forEach(id => removeEmployee(id));
        setSelectedEmployees([]);
        notify(`${selectedEmployees.length} employees deleted successfully`, 'success');
      } catch (error) {
        console.error('Error deleting employees:', error);
        notify('Failed to delete employees', 'error');
      }
    }
  };

  // Check permissions
  const canEdit = () => {
    return ['super_admin', 'hr', 'manager'].includes(role) || user?.user_category === 'admin';
  };

  const canDelete = () => {
    return ['super_admin', 'hr'].includes(role) || user?.user_category === 'admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Directory</h1>
            <p className="text-gray-600 mt-1">
              {filteredEmployees.length} of {employees.length} employees
              {selectedEmployees.length > 0 && (
                <span className="ml-2 text-blue-600">({selectedEmployees.length} selected)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedEmployees.length > 0 && (
              <>
                <button
                  onClick={handleBulkEmail}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  📧 Email Selected
                </button>
                {canDelete() && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    🗑️ Delete Selected
                  </button>
                )}
                <button
                  onClick={() => setSelectedEmployees([])}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Clear Selection
                </button>
              </>
            )}
            {canEdit() && (
              <button
                onClick={handleAddEmployee}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                + Add Employee
              </button>
            )}
            <button
              onClick={() => navigation.navigateToHome()}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Select All ({filteredEmployees.length})
              </label>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('all');
                setSelectedRole('all');
                setSortBy('name');
              }}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
            >
              Clear Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'All Roles' : role}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="department">Department</option>
                <option value="role">Role</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
        </div>

        {/* Employee Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee, index) => {
            const primaryRole = getPrimaryRole(employee);
            const badgeColor = getRoleBadgeColor(primaryRole);
            
            return (
              <div key={employee.id || index} className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow ${
                selectedEmployees.includes(employee.id) ? 'ring-2 ring-blue-500 border-blue-500' : ''
              }`}>
                <div className="p-6">
                  {/* Employee Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleSelectEmployee(employee.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                      />
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                        {(employee.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {employee.name || 'Unknown'}
                        </h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                          {primaryRole}
                        </span>
                      </div>
                    </div>
                    {/* Action Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSendEmail(employee)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Send Email"
                      >
                        📧
                      </button>
                      <button
                        onClick={() => handleCall(employee)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Call"
                      >
                        📞
                      </button>
                      <button
                        onClick={() => handleSendMessage(employee)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Send Message"
                      >
                        💬
                      </button>
                      {canEdit() && (
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit Employee"
                        >
                          ✏️
                        </button>
                      )}
                      {canDelete() && (
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Employee"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Employee Details */}
                  <div className="space-y-3">
                    {employee.department && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-5 h-5 mr-2">🏢</span>
                        <span>{employee.department}</span>
                      </div>
                    )}
                    
                    {employee.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-5 h-5 mr-2">📧</span>
                        <a 
                          href={`mailto:${employee.email}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {employee.email}
                        </a>
                      </div>
                    )}
                    
                    {employee.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-5 h-5 mr-2">📞</span>
                        <a 
                          href={`tel:${employee.phone}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {employee.phone}
                        </a>
                      </div>
                    )}

                    {/* Additional Roles */}
                    {Array.isArray(employee.role) && employee.role.length > 1 && (
                      <div className="flex items-start text-sm text-gray-600">
                        <span className="w-5 h-5 mr-2 mt-0.5">👥</span>
                        <div className="flex flex-wrap gap-1">
                          {employee.role.slice(1).map((role, idx) => (
                            <span 
                              key={idx}
                              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Employee Status */}
                    {employee.status && (
                      <div className="flex items-center text-sm">
                        <span className="w-5 h-5 mr-2">📊</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.status === 'active' ? 'bg-green-100 text-green-800' :
                          employee.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            {employees.length === 0 ? (
              <>
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No employees found
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by adding your first employee to the directory.
                </p>
                {canEdit() && (
                  <button
                    onClick={handleAddEmployee}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Your First Employee
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No employees match your filters
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or filters.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryPage;