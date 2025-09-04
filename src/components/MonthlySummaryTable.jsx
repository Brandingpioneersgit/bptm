import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/database/supabaseClient';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';
import { InputSanitizer } from '@/shared/utils/securityUtils';

const MonthlySummaryTable = () => {
  const { user } = useUnifiedAuth();
  const { showToast } = useToast();
  
  const [monthlyRows, setMonthlyRows] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [userEntities, setUserEntities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  
  // Initialize with current month
  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    setSelectedMonth(currentMonth);
  }, []);
  
  // Load data when month or user changes
  useEffect(() => {
    if (user && selectedMonth) {
      loadMonthlyData();
    }
  }, [user, selectedMonth]);
  
  const loadMonthlyData = async () => {
    try {
      setIsLoading(true);
      
      // Load user's entity mappings
      const { data: mappings, error: mappingsError } = await supabase
        .from('user_entity_mappings')
        .select(`
          *,
          entities (*)
        `)
        .eq('user_id', user.id)
        .eq('active', true);
      
      if (mappingsError) throw mappingsError;
      
      setUserEntities(mappings || []);
      
      // Load monthly rows for selected month
      const monthDate = `${selectedMonth}-01`; // Convert YYYY-MM to YYYY-MM-01
      
      const { data: rows, error: rowsError } = await supabase
        .from('monthly_rows')
        .select(`
          *,
          entities (*),
          reviewer:reviewer_id (name)
        `)
        .eq('user_id', authState.user.id)
        .eq('month', monthDate)
        .order('entity_id', { nullsFirst: true });
      
      if (rowsError) throw rowsError;
      
      setMonthlyRows(rows || []);
      
    } catch (error) {
      console.error('Failed to load monthly data:', error);
      showToast('Failed to load monthly data', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const createMonthlyRow = async (entityId = null) => {
    try {
      const monthDate = `${selectedMonth}-01`;
      
      // Check if row already exists
      const existingRow = monthlyRows.find(row => 
        (row.entity_id === entityId) || (row.entity_id === null && entityId === null)
      );
      
      if (existingRow) {
        showToast('Monthly row already exists for this entity', 'warning');
        return;
      }
      
      const newRow = {
        user_id: authState.user.id,
        month: monthDate,
        entity_id: entityId,
        work_summary: '',
        kpi_json: {},
        meetings_count: 0,
        meeting_links: [],
        client_satisfaction: null,
        learning_entries: [],
        learning_minutes: 0,
        team_feedback: '',
        evidence_links: [],
        status: 'draft'
      };
      
      const { data, error } = await supabase
        .from('monthly_rows')
        .insert(newRow)
        .select(`
          *,
          entities (*),
          reviewer:reviewer_id (name)
        `)
        .single();
      
      if (error) throw error;
      
      setMonthlyRows(prev => [...prev, data]);
      showToast('Monthly row created successfully', 'success');
      
    } catch (error) {
      console.error('Failed to create monthly row:', error);
      showToast('Failed to create monthly row', 'error');
    }
  };
  
  const updateMonthlyRow = async (rowId, updates) => {
    try {
      setIsSaving(true);
      
      // Sanitize text inputs
      const sanitizedUpdates = {
        ...updates,
        work_summary: updates.work_summary ? InputSanitizer.sanitizeInput(updates.work_summary) : updates.work_summary,
        team_feedback: updates.team_feedback ? InputSanitizer.sanitizeInput(updates.team_feedback) : updates.team_feedback
      };
      
      const { data, error } = await supabase
        .from('monthly_rows')
        .update(sanitizedUpdates)
        .eq('id', rowId)
        .select(`
          *,
          entities (*),
          reviewer:reviewer_id (name)
        `)
        .single();
      
      if (error) throw error;
      
      setMonthlyRows(prev => prev.map(row => row.id === rowId ? data : row));
      showToast('Monthly row updated successfully', 'success');
      
    } catch (error) {
      console.error('Failed to update monthly row:', error);
      showToast('Failed to update monthly row', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  const submitMonthlyRow = async (rowId) => {
    try {
      const row = monthlyRows.find(r => r.id === rowId);
      if (!row) return;
      
      // Validate required fields
      if (!row.work_summary?.trim()) {
        showToast('Work summary is required before submission', 'error');
        return;
      }
      
      await updateMonthlyRow(rowId, { status: 'submitted' });
      showToast('Monthly row submitted for review', 'success');
      
    } catch (error) {
      console.error('Failed to submit monthly row:', error);
      showToast('Failed to submit monthly row', 'error');
    }
  };
  
  const isRowEditable = (row) => {
    if (!row) return false;
    
    // Can't edit approved rows
    if (row.status === 'approved') return false;
    
    // Can only edit current month or future months
    const rowMonth = new Date(row.month);
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month
    
    return rowMonth >= currentMonth;
  };
  
  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };
  
  const formatMonth = (monthString) => {
    const date = new Date(`${monthString}-01`);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };
  
  const getCurrentMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Add current month and next 2 months
    for (let i = 0; i < 3; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthString = date.toISOString().slice(0, 7);
      options.push({
        value: monthString,
        label: formatMonth(monthString)
      });
    }
    
    // Add previous 6 months for viewing history
    for (let i = 1; i <= 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthString = date.toISOString().slice(0, 7);
      options.unshift({
        value: monthString,
        label: formatMonth(monthString)
      });
    }
    
    return options;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading monthly data...</span>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Summary</h1>
            <p className="text-gray-600 mt-1">
              Manage your monthly submissions and track progress
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getCurrentMonthOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Create New Rows */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Monthly Submissions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* General Activities (No Entity) */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">General Activities</h3>
            <p className="text-sm text-gray-600 mb-3">
              General activities not tied to specific clients or projects
            </p>
            <button
              onClick={() => createMonthlyRow(null)}
              disabled={monthlyRows.some(row => row.entity_id === null)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {monthlyRows.some(row => row.entity_id === null) ? 'Already Created' : 'Create General Row'}
            </button>
          </div>
          
          {/* Entity-specific rows */}
          {userEntities.map(mapping => (
            <div key={mapping.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                {mapping.entities.name}
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                Type: {mapping.entities.entity_type}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Expected: {mapping.expected_projects} projects, {mapping.expected_units} units
              </p>
              <button
                onClick={() => createMonthlyRow(mapping.entity_id)}
                disabled={monthlyRows.some(row => row.entity_id === mapping.entity_id)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {monthlyRows.some(row => row.entity_id === mapping.entity_id) ? 'Already Created' : 'Create Row'}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Monthly Rows Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {formatMonth(selectedMonth)} Submissions
          </h2>
        </div>
        
        {monthlyRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No monthly submissions found for {formatMonth(selectedMonth)}.</p>
            <p className="text-sm mt-2">Create your first submission using the options above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Work Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meetings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Learning (min)
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
                {monthlyRows.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {row.entities ? row.entities.name : 'General'}
                      </div>
                      {row.entities && (
                        <div className="text-sm text-gray-500">
                          {row.entities.entity_type}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingRow === row.id ? (
                        <textarea
                          value={row.work_summary || ''}
                          onChange={(e) => {
                            const updatedRows = monthlyRows.map(r => 
                              r.id === row.id ? { ...r, work_summary: e.target.value } : r
                            );
                            setMonthlyRows(updatedRows);
                          }}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe your work for this month..."
                        />
                      ) : (
                        <div className="text-sm text-gray-900 max-w-xs">
                          {row.work_summary || (
                            <span className="text-gray-400 italic">No summary provided</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRow === row.id ? (
                        <input
                          type="number"
                          min="0"
                          value={row.meetings_count || 0}
                          onChange={(e) => {
                            const updatedRows = monthlyRows.map(r => 
                              r.id === row.id ? { ...r, meetings_count: parseInt(e.target.value) || 0 } : r
                            );
                            setMonthlyRows(updatedRows);
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {row.meetings_count || 0}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRow === row.id ? (
                        <input
                          type="number"
                          min="0"
                          value={row.learning_minutes || 0}
                          onChange={(e) => {
                            const updatedRows = monthlyRows.map(r => 
                              r.id === row.id ? { ...r, learning_minutes: parseInt(e.target.value) || 0 } : r
                            );
                            setMonthlyRows(updatedRows);
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {row.learning_minutes || 0}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {isRowEditable(row) ? (
                        <div className="flex space-x-2">
                          {editingRow === row.id ? (
                            <>
                              <button
                                onClick={() => {
                                  updateMonthlyRow(row.id, {
                                    work_summary: row.work_summary,
                                    meetings_count: row.meetings_count,
                                    learning_minutes: row.learning_minutes
                                  });
                                  setEditingRow(null);
                                }}
                                disabled={isSaving}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRow(null);
                                  loadMonthlyData(); // Reload to reset changes
                                }}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingRow(row.id)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              {row.status === 'draft' && (
                                <button
                                  onClick={() => submitMonthlyRow(row.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Submit
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Locked</span>
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
};

export default MonthlySummaryTable;