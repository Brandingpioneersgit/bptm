import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useUnifiedAuth } from '../features/auth/UnifiedAuthContext';
import { useEnhancedErrorHandling } from '@/shared/hooks/useEnhancedErrorHandling';

const PerformanceScoring = () => {
  const {
    handleAsyncOperation,
    handleDataFetching,
    handleFormSubmission,
    handleDatabaseOperation,
    showSuccessNotification,
    showErrorModal,
    showWarningModal,
    showInfoModal
  } = useEnhancedErrorHandling();
  
  const [error, setError] = useState(null);
  
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-red-600 text-2xl">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800">Performance Scoring Error</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  const supabase = useSupabase();
  const { user } = useUnifiedAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [performanceData, setPerformanceData] = useState({
    performance_period: '',
    overall_score: '',
    productivity_score: '',
    quality_score: '',
    communication_score: '',
    teamwork_score: '',
    attendance_score: '',
    performance_status: 'satisfactory',
    is_low_performer: false,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [existingPerformance, setExistingPerformance] = useState([]);

  useEffect(() => {
    try {
      fetchEmployees();
    } catch (error) {
      setError(`Initialization error: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      try {
        fetchEmployeePerformance();
      } catch (error) {
        setError(`Error loading performance data: ${error.message}`);
      }
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    await handleDataFetching(
      async () => {
        if (!supabase) {
          throw new Error('Database connection not available');
        }
        
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, email, department')
          .order('name');

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        return data || [];
      },
      {
        onSuccess: (data) => {
          setEmployees(data);
          if (data.length === 0) {
            showInfoModal('No employees found in database. Using sample data for demonstration.');
            setEmployees([
              { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering' },
              { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing' },
              { id: 3, name: 'Mike Johnson', email: 'mike@example.com', department: 'Sales' }
            ]);
          }
        },
        onError: (error) => {
          showWarningModal('Unable to load employees from database. Using sample data for demonstration.');
          setEmployees([
            { id: 1, name: 'John Doe', email: 'john@example.com', department: 'Engineering' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', department: 'Marketing' },
            { id: 3, name: 'Mike Johnson', email: 'mike@example.com', department: 'Sales' }
          ]);
        },
        retryAttempts: 2
      }
    );
  };

  const fetchEmployeePerformance = async () => {
    if (!selectedEmployee) return;
    
    await handleDataFetching(
      async () => {
        if (!supabase) {
          throw new Error('Database connection not available');
        }
        
        const { data, error } = await supabase
          .from('employee_performance')
          .select('*')
          .eq('employee_id', selectedEmployee)
          .order('evaluation_date', { ascending: false });

        if (error) {
          // If table doesn't exist, just return empty array
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            return [];
          }
          throw new Error(`Database error: ${error.message}`);
        }
        
        return data || [];
      },
      {
        onSuccess: (data) => {
          setExistingPerformance(data);
        },
        onError: (error) => {
          showErrorModal('Failed to load performance history', error.message);
          setExistingPerformance([]);
        }
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPerformanceData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const calculateOverallScore = () => {
    const scores = [
      parseFloat(performanceData.productivity_score) || 0,
      parseFloat(performanceData.quality_score) || 0,
      parseFloat(performanceData.communication_score) || 0,
      parseFloat(performanceData.teamwork_score) || 0,
      parseFloat(performanceData.attendance_score) || 0
    ];
    
    const validScores = scores.filter(score => score > 0);
    if (validScores.length === 0) return 0;
    
    return (validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(2);
  };

  const determinePerformanceStatus = (overallScore) => {
    if (overallScore >= 9) return 'excellent';
    if (overallScore >= 7) return 'good';
    if (overallScore >= 5) return 'satisfactory';
    if (overallScore >= 3) return 'needs_improvement';
    return 'unsatisfactory';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    await handleFormSubmission(
      async () => {
        const overallScore = calculateOverallScore();
        const status = determinePerformanceStatus(overallScore);
        const isLowPerformer = overallScore < 5; // Score below 5 is considered low performance

        const performanceRecord = {
          employee_id: selectedEmployee,
          performance_period: performanceData.performance_period,
          overall_score: overallScore,
          productivity_score: parseFloat(performanceData.productivity_score) || null,
          quality_score: parseFloat(performanceData.quality_score) || null,
          communication_score: parseFloat(performanceData.communication_score) || null,
          teamwork_score: parseFloat(performanceData.teamwork_score) || null,
          attendance_score: parseFloat(performanceData.attendance_score) || null,
          performance_status: status,
          is_low_performer: isLowPerformer,
          evaluated_by: user?.id,
          notes: performanceData.notes
        };

        const { error } = await supabase
          .from('employee_performance')
          .insert([performanceRecord]);

        if (error) throw error;
        return { overallScore };
      },
      {
        onSuccess: (data) => {
          showSuccessNotification(`Performance evaluation submitted successfully! Overall Score: ${data.overallScore}/10`);
          setMessage(`Performance evaluation submitted successfully! Overall Score: ${data.overallScore}/10`);
          
          // Reset form
          setPerformanceData({
            performance_period: '',
            overall_score: '',
            productivity_score: '',
            quality_score: '',
            communication_score: '',
            teamwork_score: '',
            attendance_score: '',
            performance_status: 'satisfactory',
            is_low_performer: false,
            notes: ''
          });
          
          // Refresh performance history
          fetchEmployeePerformance();
        },
        onError: (error) => {
          showErrorModal('Failed to submit performance evaluation', error.message);
          setMessage(`Error: ${error.message}`);
        },
        validationRules: [
          {
            condition: !selectedEmployee,
            message: 'Please select an employee'
          },
          {
            condition: !performanceData.performance_period.trim(),
            message: 'Please enter a performance period'
          }
        ],
        onFinally: () => {
          setLoading(false);
        }
      }
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      excellent: 'text-green-600 bg-green-100',
      good: 'text-blue-600 bg-blue-100',
      satisfactory: 'text-yellow-600 bg-yellow-100',
      needs_improvement: 'text-orange-600 bg-orange-100',
      unsatisfactory: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            📊 Employee Performance Scoring
          </h2>
          <p className="text-blue-100 mt-2">
            Evaluate employee performance and identify development needs
          </p>
        </div>

        <div className="p-6">
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Evaluation Form */}
            <div>
              <h3 className="text-lg font-semibold mb-4">📝 New Performance Evaluation</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Employee Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Employee *
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose an employee...</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.department}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Performance Period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Performance Period *
                  </label>
                  <input
                    type="text"
                    name="performance_period"
                    value={performanceData.performance_period}
                    onChange={handleInputChange}
                    placeholder="e.g., Q1-2024, H1-2024, Jan-2024"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Performance Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Productivity Score (0-10)
                    </label>
                    <input
                      type="number"
                      name="productivity_score"
                      value={performanceData.productivity_score}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality Score (0-10)
                    </label>
                    <input
                      type="number"
                      name="quality_score"
                      value={performanceData.quality_score}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Communication Score (0-10)
                    </label>
                    <input
                      type="number"
                      name="communication_score"
                      value={performanceData.communication_score}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teamwork Score (0-10)
                    </label>
                    <input
                      type="number"
                      name="teamwork_score"
                      value={performanceData.teamwork_score}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attendance Score (0-10)
                    </label>
                    <input
                      type="number"
                      name="attendance_score"
                      value={performanceData.attendance_score}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Calculated Overall Score */}
                {(performanceData.productivity_score || performanceData.quality_score || 
                  performanceData.communication_score || performanceData.teamwork_score || 
                  performanceData.attendance_score) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-900">
                      Calculated Overall Score: <span className="text-lg">{calculateOverallScore()}/10</span>
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Status: {determinePerformanceStatus(calculateOverallScore())}
                      {calculateOverallScore() < 5 && (
                        <span className="ml-2 text-red-600 font-medium">
                          ⚠️ Low Performer - Will have access to Performance Concerns Form
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evaluation Notes
                  </label>
                  <textarea
                    name="notes"
                    value={performanceData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Additional comments, feedback, or recommendations..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedEmployee}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Submitting...' : 'Submit Performance Evaluation'}
                </button>
              </form>
            </div>

            {/* Performance History */}
            <div>
              <h3 className="text-lg font-semibold mb-4">📈 Performance History</h3>
              
              {selectedEmployee ? (
                <div className="space-y-4">
                  {existingPerformance.length > 0 ? (
                    existingPerformance.map((record, index) => (
                      <div key={record.id} className="bg-gray-50 border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-gray-900">
                              {record.performance_period}
                            </div>
                            <div className="text-sm text-gray-600">
                              Evaluated on {formatDate(record.evaluation_date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              {record.overall_score}/10
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.performance_status)}`}>
                              {record.performance_status.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        
                        {record.is_low_performer && (
                          <div className="bg-red-100 border border-red-200 rounded p-2 mb-2">
                            <div className="text-red-700 text-sm font-medium">
                              ⚠️ Low Performer - Has access to Performance Concerns Form
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div>Productivity: {record.productivity_score || 'N/A'}</div>
                          <div>Quality: {record.quality_score || 'N/A'}</div>
                          <div>Communication: {record.communication_score || 'N/A'}</div>
                          <div>Teamwork: {record.teamwork_score || 'N/A'}</div>
                          <div>Attendance: {record.attendance_score || 'N/A'}</div>
                        </div>
                        
                        {record.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Notes:</strong> {record.notes}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No performance records found for this employee.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select an employee to view their performance history.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceScoring;