import React, { useState, useEffect } from 'react';
import { useDataSync } from './DataSyncContext';
import { useUnifiedAuth } from '@/shared/hooks/useUnifiedAuth';
import { useSupabase } from './SupabaseProvider';
import { useEnhancedErrorHandling } from '@/shared/hooks/useEnhancedErrorHandling';

// Organization Chart Component
const OrganizationChart = ({ onNavigateToDashboard }) => {
  const { employees, loading, refreshEmployees } = useDataSync();
  const { role, currentUser } = useUnifiedAuth();
  const supabase = useSupabase();
  const { handleError } = useEnhancedErrorHandling();
  
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'tree', 'list'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [sortBy, setSortBy] = useState('hierarchy'); // 'hierarchy', 'name', 'department', 'joinDate'
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefreshData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Initialize expanded departments
  useEffect(() => {
    if (employees.length > 0 && expandedDepartments.size === 0) {
      const allDepartments = new Set(employees.map(emp => emp.department || 'Other').filter(Boolean));
      setExpandedDepartments(allDepartments);
    }
  }, [employees]);

  // Group employees by department/role
  const groupedEmployees = employees.reduce((acc, employee) => {
    const dept = employee.department || employee.role || 'Other';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(employee);
    return acc;
  }, {});

  // Filter employees based on search and department
  const filteredEmployees = employees.filter(employee => {
    const roleString = Array.isArray(employee.role) 
      ? employee.role.join(' ').toLowerCase() 
      : (employee.role || '').toLowerCase();
    
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roleString.includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || 
                             employee.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Get unique departments
  const departments = ['all', ...new Set(employees.map(emp => emp.department || emp.role).filter(Boolean))];

  // Role hierarchy for display
  const roleHierarchy = {
    // Management Level
    'Manager': 1,
    'Head': 1,
    
    // Team Leads
    'Web Team Lead': 2,
    'SEO Team Lead': 2,
    'Ads Team Lead': 2,
    'AI Team Lead': 2,
    
    // Senior Roles
    'Web Developer': 3,
    'Graphic Designer': 3,
    'SEO Executive': 3,
    'Meta Ads Specialist': 3,
    'Google Ads Specialist': 3,
    'Social Media Manager': 3,
    'Youtube SEO': 3,
    'Video Editor': 3,
    'AI Executive': 3,
    'Accountant': 3,
    'Sales Executive': 3,
    'HR Specialist': 3,
    
    // Junior Roles
    'Content Writer': 4,
    'SEO Content Writer': 4,
    'Graphics Designer': 4,
    
    // Contract/Temporary
    'Freelancer': 5,
    'Intern': 6
  };

  // Helper function to get primary role for sorting
  const getPrimaryRole = (employee) => {
    if (Array.isArray(employee.role)) {
      // Find the highest priority role
      return employee.role.reduce((highest, role) => {
        const currentLevel = roleHierarchy[role] || 7;
        const highestLevel = roleHierarchy[highest] || 7;
        return currentLevel < highestLevel ? role : highest;
      }, employee.role[0] || 'No role');
    }
    return employee.role || 'No role';
  };

  // Interactive functions
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeeModal(true);
  };

  const handleContactEmployee = async (employee, method) => {
    try {
      if (method === 'email' && employee.email) {
        window.open(`mailto:${employee.email}`, '_blank');
      } else if (method === 'phone' && employee.phone) {
        window.open(`tel:${employee.phone}`, '_blank');
      }
    } catch (error) {
      handleError(error, 'Failed to initiate contact');
    }
  };

  const handleExportData = () => {
    try {
      const csvData = employees.map(emp => ({
        Name: emp.name || '',
        Email: emp.email || '',
        Department: emp.department || '',
        Role: Array.isArray(emp.role) ? emp.role.join(', ') : emp.role || '',
        Phone: emp.phone || '',
        HireDate: emp.hire_date || '',
        Status: emp.status || ''
      }));
      
      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `organization-chart-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      handleError(error, 'Failed to export data');
    }
  };

  const toggleDepartmentExpansion = (department) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(department)) {
      newExpanded.delete(department);
    } else {
      newExpanded.add(department);
    }
    setExpandedDepartments(newExpanded);
  };

  const handleRefreshData = async () => {
    try {
      await refreshEmployees();
      setLastUpdated(new Date());
    } catch (error) {
      handleError(error, 'Failed to refresh data');
    }
  };

  // Enhanced sorting logic
  const getSortedEmployees = (employees) => {
    return [...employees].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'department':
          return (a.department || '').localeCompare(b.department || '');
        case 'joinDate':
          return new Date(b.hire_date || 0) - new Date(a.hire_date || 0);
        case 'hierarchy':
        default:
          const levelA = roleHierarchy[getPrimaryRole(a)] || 7;
          const levelB = roleHierarchy[getPrimaryRole(b)] || 7;
          return levelA - levelB;
      }
    });
  };

  const sortedEmployees = getSortedEmployees(filteredEmployees);

  if (loading) {
    return (
      <div className="card-brand p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-brand p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-brand-text mb-2">Organization Chart</h2>
            <p className="text-brand-text-secondary">
              View company structure and employee hierarchy
            </p>
            <p className="text-xs text-brand-text-secondary mt-1">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefreshData}
              className="btn-secondary text-sm"
              disabled={loading}
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleExportData}
              className="btn-secondary text-sm"
              disabled={employees.length === 0}
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => onNavigateToDashboard?.('manager')}
              className="btn-brand-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
        
        {/* Filters and Controls */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* View Mode and Sort Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-text-secondary">View:</span>
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                {['grid', 'list', 'tree'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      viewMode === mode
                        ? 'bg-white dark:bg-slate-600 text-brand-text shadow-sm'
                        : 'text-brand-text-secondary hover:text-brand-text'
                    }`}
                  >
                    {mode === 'grid' ? '⊞' : mode === 'list' ? '☰' : '🌳'} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-text-secondary">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hierarchy">Hierarchy</option>
                <option value="name">Name</option>
                <option value="department">Department</option>
                <option value="joinDate">Join Date</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Chart */}
      <div className="card-brand p-6">
        <div className="mb-4">
          <p className="text-brand-text-secondary">
            Total Employees: {filteredEmployees.length}
          </p>
        </div>

        {/* Hierarchy View */}
        <div className="space-y-6">
          {Object.entries(groupedEmployees)
            .filter(([dept, empList]) => 
              selectedDepartment === 'all' || 
              dept === selectedDepartment ||
              empList.some(emp => 
                emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
            )
            .map(([department, deptEmployees]) => {
              const filteredDeptEmployees = deptEmployees.filter(emp => {
                const roleString = Array.isArray(emp.role) 
                  ? emp.role.join(' ').toLowerCase() 
                  : (emp.role || '').toLowerCase();
                
                return emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       roleString.includes(searchTerm.toLowerCase());
              });
              
              if (filteredDeptEmployees.length === 0) return null;
              
              return (
                <div key={department} className="border border-slate-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-brand-text mb-4 border-b border-slate-200 pb-2">
                    {department} ({filteredDeptEmployees.length})
                  </h3>
                  
                  <div className={`gap-4 ${
                    viewMode === 'list' 
                      ? 'space-y-2' 
                      : viewMode === 'tree'
                      ? 'grid grid-cols-1 gap-2'
                      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {filteredDeptEmployees
                      .sort((a, b) => {
                        const levelA = roleHierarchy[getPrimaryRole(a)] || 7;
                        const levelB = roleHierarchy[getPrimaryRole(b)] || 7;
                        return levelA - levelB;
                      })
                      .map((employee) => (
                        <div 
                          key={employee.id} 
                          className={`bg-slate-50 dark:bg-slate-700 p-4 rounded-lg transition-all duration-200 hover:shadow-md hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer border-2 border-transparent hover:border-blue-200 ${
                            viewMode === 'list' ? 'flex items-center space-x-4' : ''
                          }`}
                          onClick={() => handleEmployeeClick(employee)}
                        >
                          <div className={`flex items-center space-x-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {employee.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-brand-text truncate">
                                {employee.name || 'Unknown'}
                              </p>
                              <p className="text-sm text-brand-text-secondary truncate">
                                {Array.isArray(employee.role) 
                                  ? employee.role.join(', ') 
                                  : employee.role || 'No role assigned'
                                }
                              </p>
                              {viewMode !== 'list' && (
                                <p className="text-xs text-brand-text-secondary truncate">
                                  {employee.email}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {viewMode === 'list' && (
                            <div className="flex items-center space-x-2">
                              {employee.email && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleContactEmployee(employee, 'email');
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                  title="Send Email"
                                >
                                  ✉️
                                </button>
                              )}
                              {employee.phone && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleContactEmployee(employee, 'phone');
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                  title="Call"
                                >
                                  📞
                                </button>
                              )}
                            </div>
                          )}
                          
                          {viewMode !== 'list' && (
                            <>
                              {employee.phone && (
                                <div className="mt-2 text-xs text-brand-text-secondary">
                                  📞 {employee.phone}
                                </div>
                              )}
                              
                              {employee.hire_date && (
                                <div className="mt-1 text-xs text-brand-text-secondary">
                                  📅 Joined: {new Date(employee.hire_date).toLocaleDateString()}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              );
            })
          }
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <p className="text-brand-text-secondary text-lg">
              No employees found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-brand p-6 text-center">
          <div className="text-3xl font-bold text-brand-primary mb-2">
            {employees.length}
          </div>
          <div className="text-brand-text-secondary">Total Employees</div>
        </div>
        
        <div className="card-brand p-6 text-center">
          <div className="text-3xl font-bold text-brand-primary mb-2">
            {Object.keys(groupedEmployees).length}
          </div>
          <div className="text-brand-text-secondary">Departments</div>
        </div>
        
        <div className="card-brand p-6 text-center">
          <div className="text-3xl font-bold text-brand-primary mb-2">
            {employees.filter(emp => emp.status === 'active').length}
          </div>
          <div className="text-brand-text-secondary">Active Employees</div>
        </div>
      </div>

      {/* Employee Detail Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-brand-text">Employee Details</h3>
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="text-brand-text-secondary hover:text-brand-text text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                    {selectedEmployee.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-brand-text">
                      {selectedEmployee.name || 'Unknown'}
                    </h4>
                    <p className="text-brand-text-secondary">
                      {Array.isArray(selectedEmployee.role) 
                        ? selectedEmployee.role.join(', ') 
                        : selectedEmployee.role || 'No role assigned'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {selectedEmployee.email && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-sm text-brand-text-secondary">Email</p>
                        <p className="text-brand-text">{selectedEmployee.email}</p>
                      </div>
                      <button
                        onClick={() => handleContactEmployee(selectedEmployee, 'email')}
                        className="btn-secondary text-sm"
                      >
                        ✉️ Email
                      </button>
                    </div>
                  )}
                  
                  {selectedEmployee.phone && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <p className="text-sm text-brand-text-secondary">Phone</p>
                        <p className="text-brand-text">{selectedEmployee.phone}</p>
                      </div>
                      <button
                        onClick={() => handleContactEmployee(selectedEmployee, 'phone')}
                        className="btn-secondary text-sm"
                      >
                        📞 Call
                      </button>
                    </div>
                  )}
                  
                  {selectedEmployee.department && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-brand-text-secondary">Department</p>
                      <p className="text-brand-text">{selectedEmployee.department}</p>
                    </div>
                  )}
                  
                  {selectedEmployee.hire_date && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-brand-text-secondary">Hire Date</p>
                      <p className="text-brand-text">
                        {new Date(selectedEmployee.hire_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {selectedEmployee.status && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <p className="text-sm text-brand-text-secondary">Status</p>
                      <p className={`text-brand-text capitalize ${
                        selectedEmployee.status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedEmployee.status}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-600">
                  <button
                    onClick={() => setShowEmployeeModal(false)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationChart;