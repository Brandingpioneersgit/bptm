import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { useEmployeeSync } from '@/features/employees/context/EmployeeSyncContext';
import { Section } from '@/shared/components/ui';
import { 
  getAllEmployeeExits, 
  updateEmployeeExitStatus, 
  getEmployeeExitStats 
} from '@/utils/createEmployeeExitsTable';

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  approved: 'bg-gray-100 text-gray-800 border-gray-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const STATUS_ICONS = {
  pending: '⏳',
  approved: '✅',
  completed: '🎯'
};

export function ExitWorkflowManagement() {
  const supabase = useSupabase();
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  const { refreshEmployees } = useEmployeeSync();
  
  const [exitRecords, setExitRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    thisMonth: 0
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExit, setSelectedExit] = useState(null);
  
  const loadExitRecords = useCallback(async () => {
    try {
      setLoading(true);
      const [records, statistics] = await Promise.all([
        getAllEmployeeExits(supabase),
        getEmployeeExitStats(supabase)
      ]);
      
      setExitRecords(records);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading exit records:', error);
      notify('Failed to load exit records', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, notify]);
  
  useEffect(() => {
    loadExitRecords();
  }, [loadExitRecords]);
  
  useEffect(() => {
    let filtered = exitRecords;
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(record => record.status === activeFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record => 
        record.employee_name.toLowerCase().includes(term) ||
        record.department.toLowerCase().includes(term) ||
        record.exit_reason.toLowerCase().includes(term)
      );
    }
    
    setFilteredRecords(filtered);
  }, [exitRecords, activeFilter, searchTerm]);
  
  const handleStatusUpdate = useCallback(async (exitId, newStatus, notes = '') => {
    try {
      await updateEmployeeExitStatus(supabase, exitId, newStatus, notes);
      
      // If approved or completed, update employee status
      if (newStatus === 'approved' || newStatus === 'completed') {
        const exitRecord = exitRecords.find(record => record.id === exitId);
        if (exitRecord && supabase) {
          const employeeStatus = newStatus === 'completed' ? 'Inactive' : 'Exiting';
          const updateData = {
            status: employeeStatus,
            updated_at: new Date().toISOString()
          };
          
          // Set departure date if completed or if last working day has passed
          if (newStatus === 'completed' || new Date(exitRecord.last_working_day) <= new Date()) {
            updateData.departure_date = exitRecord.last_working_day;
          }
          
          await supabase
            .from('employees')
            .update(updateData)
            .eq('name', exitRecord.employee_name)
            .eq('phone', exitRecord.employee_phone);
        }
      }
      
      await loadExitRecords();
      if (refreshEmployees) {
        await refreshEmployees();
      }
      
      notify(`Exit request ${newStatus} successfully`, 'success');
    } catch (error) {
      console.error('Error updating exit status:', error);
      notify('Failed to update exit status', 'error');
    }
  }, [supabase, exitRecords, loadExitRecords, refreshEmployees, notify]);
  
  const handleViewDetails = useCallback((exitRecord) => {
    setSelectedExit(exitRecord);
    
    openModal({
      title: `Exit Details - ${exitRecord.employee_name}`,
      content: (
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {/* Basic Information */}
          <Section title="Employee Information" icon="👤">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <p className="text-gray-900">{exitRecord.employee_name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Department:</span>
                <p className="text-gray-900">{exitRecord.department}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <p className="text-gray-900">{exitRecord.employee_phone}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Role:</span>
                <p className="text-gray-900">{Array.isArray(exitRecord.role) ? exitRecord.role.join(', ') : exitRecord.role}</p>
              </div>
            </div>
          </Section>
          
          {/* Exit Details */}
          <Section title="Exit Information" icon="📋">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Reason:</span>
                <p className="text-gray-900">{exitRecord.exit_reason}</p>
                {exitRecord.custom_reason && (
                  <p className="text-gray-600 text-xs mt-1">{exitRecord.custom_reason}</p>
                )}
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Working Day:</span>
                <p className="text-gray-900">{new Date(exitRecord.last_working_day).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Notice Period:</span>
                <p className="text-gray-900">{exitRecord.notice_period} days</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Immediate Exit:</span>
                <p className="text-gray-900">{exitRecord.immediate_exit ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </Section>
          
          {/* Exit Interview */}
          {exitRecord.overall_experience && (
            <Section title="Exit Interview" icon="💬">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Overall Experience:</span>
                  <p className="text-gray-900 mt-1">{exitRecord.overall_experience}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Reason for Leaving:</span>
                  <p className="text-gray-900 mt-1">{exitRecord.reason_for_leaving}</p>
                </div>
                {exitRecord.improvement_suggestions && (
                  <div>
                    <span className="font-medium text-gray-700">Improvement Suggestions:</span>
                    <p className="text-gray-900 mt-1">{exitRecord.improvement_suggestions}</p>
                  </div>
                )}
                {exitRecord.would_recommend_company && (
                  <div>
                    <span className="font-medium text-gray-700">Would Recommend Company:</span>
                    <p className="text-gray-900 mt-1">{exitRecord.would_recommend_company}</p>
                  </div>
                )}
              </div>
            </Section>
          )}
          
          {/* Asset Return Status */}
          <Section title="Asset Return" icon="💼">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  exitRecord.laptop_returned ? 'bg-gray-500' : 'bg-gray-500'
                }`}></span>
                <span>Laptop: {exitRecord.laptop_returned ? 'Returned' : 'Pending'}</span>
              </div>
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  exitRecord.access_cards_returned ? 'bg-gray-500' : 'bg-gray-500'
                }`}></span>
                <span>Access Cards: {exitRecord.access_cards_returned ? 'Returned' : 'Pending'}</span>
              </div>
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${
                  exitRecord.documents_returned ? 'bg-gray-500' : 'bg-gray-500'
                }`}></span>
                <span>Documents: {exitRecord.documents_returned ? 'Returned' : 'Pending'}</span>
              </div>
            </div>
            {exitRecord.other_assets && (
              <div className="mt-3">
                <span className="font-medium text-gray-700">Other Assets:</span>
                <p className="text-gray-900 text-sm mt-1">{exitRecord.other_assets}</p>
              </div>
            )}
          </Section>
          
          {/* Handover Information */}
          {exitRecord.handover_notes && (
            <Section title="Handover" icon="🔄">
              <div className="space-y-3 text-sm">
                {exitRecord.handover_to && (
                  <div>
                    <span className="font-medium text-gray-700">Handover To:</span>
                    <p className="text-gray-900 mt-1">{exitRecord.handover_to}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Handover Notes:</span>
                  <p className="text-gray-900 mt-1">{exitRecord.handover_notes}</p>
                </div>
                {exitRecord.pending_tasks && (
                  <div>
                    <span className="font-medium text-gray-700">Pending Tasks:</span>
                    <p className="text-gray-900 mt-1">{exitRecord.pending_tasks}</p>
                  </div>
                )}
              </div>
            </Section>
          )}
          
          {/* HR Notes */}
          {exitRecord.hr_notes && (
            <Section title="HR Notes" icon="📝">
              <p className="text-gray-900 text-sm">{exitRecord.hr_notes}</p>
            </Section>
          )}
        </div>
      ),
      actions: [
        {
          label: 'Close',
          onClick: closeModal,
          variant: 'secondary'
        }
      ]
    });
  }, [openModal, closeModal]);
  
  const handleApprove = useCallback((exitRecord) => {
    openModal({
      title: 'Approve Exit Request',
      content: (
        <div>
          <p className="text-gray-700 mb-4">
            Are you sure you want to approve the exit request for <strong>{exitRecord.employee_name}</strong>?
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">This will:</h4>
            <ul className="text-sm text-gray-800 space-y-1">
              <li>• Change employee status to "Exiting"</li>
              <li>• Initiate the handover process</li>
              <li>• Begin asset return coordination</li>
              <li>• Set departure date: {new Date(exitRecord.last_working_day).toLocaleDateString()}</li>
            </ul>
          </div>
        </div>
      ),
      actions: [
        {
          label: 'Cancel',
          onClick: closeModal,
          variant: 'secondary'
        },
        {
          label: 'Approve',
          onClick: () => {
            handleStatusUpdate(exitRecord.id, 'approved');
            closeModal();
          },
          variant: 'primary'
        }
      ]
    });
  }, [openModal, closeModal, handleStatusUpdate]);
  
  const handleComplete = useCallback((exitRecord) => {
    openModal({
      title: 'Complete Exit Process',
      content: (
        <div>
          <p className="text-gray-700 mb-4">
            Mark the exit process as completed for <strong>{exitRecord.employee_name}</strong>?
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">This will:</h4>
            <ul className="text-sm text-gray-800 space-y-1">
              <li>• Change employee status to "Inactive"</li>
              <li>• Set final departure date</li>
              <li>• Complete the exit workflow</li>
              <li>• Archive the employee record</li>
            </ul>
          </div>
        </div>
      ),
      actions: [
        {
          label: 'Cancel',
          onClick: closeModal,
          variant: 'secondary'
        },
        {
          label: 'Complete',
          onClick: () => {
            handleStatusUpdate(exitRecord.id, 'completed');
            closeModal();
          },
          variant: 'primary'
        }
      ]
    });
  }, [openModal, closeModal, handleStatusUpdate]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading exit records...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-lg">📊</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Exits</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-lg">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-lg">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-600">{stats.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-lg">🎯</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-lg">📅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-600">{stats.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'completed'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                {filter !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({filter === 'pending' ? stats.pending : filter === 'approved' ? stats.approved : stats.completed})
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by name, department, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Exit Records Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Exit Records ({filteredRecords.length})
          </h3>
        </div>
        
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No exit records found
            </h3>
            <p className="text-gray-600">
              {searchTerm || activeFilter !== 'all' 
                ? 'Try adjusting your filters or search terms'
                : 'No employee exit requests have been submitted yet'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exit Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Working Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.employee_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.employee_phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.exit_reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.last_working_day).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        STATUS_COLORS[record.status]
                      }`}>
                        <span className="mr-1">{STATUS_ICONS[record.status]}</span>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewDetails(record)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                      
                      {record.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(record)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                      )}
                      
                      {record.status === 'approved' && (
                        <button
                          onClick={() => handleComplete(record)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}