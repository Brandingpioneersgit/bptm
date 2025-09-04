import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useDataSync } from './DataSyncContext';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { useToast } from '@/shared/components/Toast';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useModal } from '@/shared/components/ModalContext';
import { useEnhancedErrorHandling } from '../shared/hooks/useEnhancedErrorHandling';
import AddEmployeeModal from './AddEmployeeModal';

const EmployeeDirectory = ({ onBack }) => {
  const { supabase } = useSupabase();
  const { notify } = useToast();
  const { authState } = useUnifiedAuth();
  const { openModal, closeModal } = useModal();
  const {
    handleDataFetch,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useEnhancedErrorHandling();
  
  // Use context data with real-time sync
  const { employees, loading: employeesLoading, error: employeesError } = useDataSync();
  const loading = employeesLoading;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showHierarchy, setShowHierarchy] = useState(false);

  const openAddEmployeeModal = () => {
    openModal({
      title: '➕ Add New Employee',
      content: (
        <AddEmployeeModal
          onClose={closeModal}
          onSuccess={(newEmployee) => {
            // Employee list will automatically refresh via real-time sync
            notify(`Employee ${newEmployee.name} added successfully!`, 'success');
          }}
        />
      ),
      size: 'large',
      showCloseButton: true
    });
  };

  // Show error notification if data sync fails
  useEffect(() => {
    if (employeesError) {
      notify('Failed to sync employee data', 'error');
    }
  }, [employeesError, notify]);

  // Data is now automatically synced via context with real-time updates



  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Format as international number if it doesn't start with +
    if (cleaned.startsWith('971')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+971${cleaned.substring(1)}`;
    } else if (cleaned.length === 9) {
      return `+971${cleaned}`;
    }
    return `+${cleaned}`;
  };

  const openWhatsApp = (phone, name) => {
    const formattedPhone = formatPhoneNumber(phone);
    if (!formattedPhone) {
      notify('Phone number not available', 'error');
      return;
    }
    
    const message = encodeURIComponent(`Hello ${name}, I'm reaching out from Branding Pioneers Agency.`);
    const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const isCompanyNumber = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    // Define company number patterns (you can customize these)
    const companyPatterns = [
      '971501234567', // Example company numbers
      '971521234567',
      '971551234567'
    ];
    return companyPatterns.some(pattern => cleaned.includes(pattern.substring(0, 8)));
  };

  // Check if current user can view contact details
  const canViewContactDetails = (employee) => {
    const userRole = authState.currentUser?.role || authState.role;
    const userCategory = authState.currentUser?.category || authState.category;
    
    // Super Admin and HR can see all contacts
    if (userRole === 'Super Admin' || userRole === 'HR' || userCategory === 'super_admin') {
      return true;
    }
    
    // Managers can see their team members
    if (userRole === 'Manager' || userRole === 'Operations Head') {
      return employee.department === authState.currentUser?.department;
    }
    
    // Employees can only see basic info of others
    return false;
  };

  // Generate avatar from profile image or initials
  const getEmployeeAvatar = (employee) => {
    if (employee.profile_image_url) {
      return (
        <img 
          src={employee.profile_image_url} 
          alt={employee.name}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
        {employee.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  };

  // Hierarchy view component
  const HierarchyView = () => {
    const departmentGroups = departments.reduce((acc, dept) => {
      acc[dept] = employees.filter(emp => emp.department === dept);
      return acc;
    }, {});

    return (
      <div className="space-y-8">
        {Object.entries(departmentGroups).map(([department, deptEmployees]) => {
          const managers = deptEmployees.filter(emp => 
            emp.role?.includes('Manager') || emp.role?.includes('Head') || emp.role?.includes('Lead')
          );
          const teamMembers = deptEmployees.filter(emp => 
            !emp.role?.includes('Manager') && !emp.role?.includes('Head') && !emp.role?.includes('Lead')
          );

          return (
            <div key={department} className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                {department}
                <span className="text-sm font-normal text-gray-500">({deptEmployees.length} members)</span>
              </h3>
              
              {managers.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">👑</span>
                    Leadership
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {managers.map(manager => (
                      <div key={manager.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        {getEmployeeAvatarSmall(manager)}
                        <div>
                          <p className="font-semibold text-gray-900">{manager.name}</p>
                          <p className="text-sm text-blue-600">
                            {Array.isArray(manager.role) ? manager.role.join(', ') : manager.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {teamMembers.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    Team Members
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        {getEmployeeAvatarSmall(member)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{member.name}</p>
                          <p className="text-xs text-gray-600 truncate">
                            {Array.isArray(member.role) ? member.role.join(', ') : member.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const getEmployeeAvatarSmall = (employee) => {
    if (employee.profile_image_url) {
      return (
        <img 
          src={employee.profile_image_url} 
          alt={employee.name}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
        {employee.name?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  };

  const filteredEmployees = employees.filter(employee => {
    const roleString = Array.isArray(employee.role) 
      ? employee.role.join(' ').toLowerCase() 
      : (employee.role || '').toLowerCase();
    
    const matchesSearch = employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roleString.includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Get dynamic departments from actual employee data
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))].sort();
  
  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment]);

  const EmployeeCard = ({ employee }) => {
    const hasPhone = employee.phone && employee.phone.trim() !== '';
    const isCompany = isCompanyNumber(employee.phone);
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getEmployeeAvatar(employee)}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg" style={{display: 'none'}}>
              {employee.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{employee.name || 'Unknown'}</h3>
              <p className="text-sm text-gray-600">
                {Array.isArray(employee.role) 
                  ? employee.role.join(', ') 
                  : employee.role || 'No role specified'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {employee.status === 'active' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Active
              </span>
            )}
            {isCompany && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Company
              </span>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">📧</span>
            <span className="text-gray-700">{employee.email || 'No email'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">🏢</span>
            <span className="text-gray-700">{employee.department || 'No department'}</span>
          </div>
          
          {employee.hire_date && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">📅</span>
              <span className="text-gray-700">Joined {new Date(employee.hire_date).toLocaleDateString()}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">📱</span>
            {hasPhone && canViewContactDetails(employee) ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-gray-700">{formatPhoneNumber(employee.phone)}</span>
                {isCompany && (
                  <span className="text-xs text-blue-600 font-medium">(Official)</span>
                )}
              </div>
            ) : hasPhone && !canViewContactDetails(employee) ? (
              <span className="text-gray-400">Contact via HR</span>
            ) : (
              <span className="text-gray-400">No phone number</span>
            )}
          </div>
        </div>
        
        {hasPhone && canViewContactDetails(employee) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => openWhatsApp(employee.phone, employee.name)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
            >
              <span>💬</span>
              Chat on WhatsApp
            </button>
          </div>
        )}
      </div>
    );
  };

  const EmployeeListItem = ({ employee }) => {
    const hasPhone = employee.phone && employee.phone.trim() !== '';
    const isCompany = isCompanyNumber(employee.phone);
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {getEmployeeAvatarSmall(employee)}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold" style={{display: 'none'}}>
              {employee.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
              <div>
                <p className="font-semibold text-gray-900">{employee.name || 'Unknown'}</p>
                <p className="text-sm text-gray-600">
                  {Array.isArray(employee.role) 
                    ? employee.role.join(', ') 
                    : employee.role || 'No role'
                  }
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-700">{employee.department || 'No department'}</p>
                <p className="text-xs text-gray-500">{employee.email || 'No email'}</p>
              </div>
              
              <div>
                {hasPhone && canViewContactDetails(employee) ? (
                  <div>
                    <p className="text-sm text-gray-700">{formatPhoneNumber(employee.phone)}</p>
                    {isCompany && (
                      <p className="text-xs text-blue-600 font-medium">Official Number</p>
                    )}
                  </div>
                ) : hasPhone && !canViewContactDetails(employee) ? (
                  <p className="text-sm text-gray-400">Contact via HR</p>
                ) : (
                  <p className="text-sm text-gray-400">No phone</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {employee.status === 'active' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Active
                  </span>
                )}
                {isCompany && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Company
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {hasPhone && canViewContactDetails(employee) && (
            <button
              onClick={() => openWhatsApp(employee.phone, employee.name)}
              className="ml-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 font-medium"
            >
              <span>💬</span>
              WhatsApp
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="xl" showText text="Loading employee directory..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Directory</h1>
          <p className="text-gray-600">Contact information and WhatsApp integration for all team members</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openAddEmployeeModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 font-medium"
          >
            ➕ Add Employee
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
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              <p className="text-sm text-gray-600">Total Employees</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-600 text-lg">📱</span>
          </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{employees.filter(emp => emp.phone).length}</p>
              <p className="text-sm text-gray-600">With Phone Numbers</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-600 text-lg">💬</span>
          </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{employees.filter(emp => emp.phone && emp.phone.length > 8).length}</p>
              <p className="text-sm text-gray-600">WhatsApp Ready</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-600 text-lg">🏢</span>
          </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
              <p className="text-sm text-gray-600">Departments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search employees by name, email, department, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHierarchy(!showHierarchy)}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                showHierarchy 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏢 Hierarchy
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} employees
          {selectedDepartment !== 'all' && ` in ${selectedDepartment}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
          </div>
        )}
      </div>

      {/* Employee List */}
      {showHierarchy ? (
        <HierarchyView />
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedDepartment !== 'all' 
              ? 'Try adjusting your search criteria or filters.'
              : 'No employees have been added to the directory yet.'}
          </p>
          {(searchTerm || selectedDepartment !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('all');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {paginatedEmployees.map((employee) => (
              <div key={employee.id}>
                {viewMode === 'grid' ? (
                  <EmployeeCard employee={employee} />
                ) : (
                  <EmployeeListItem employee={employee} />
                )}
              </div>
            ))}
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (totalPages <= 7 || page === 1 || page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeDirectory;