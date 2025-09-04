import React, { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { TextField } from '@/shared/components/ui';
import { LoadingButton } from '@/shared/components/LoadingButton';
import { useToast } from '@/shared/components/Toast';
import { exportReport, reportUtils } from '@/utils/reportGenerator';

const ManagerIncentiveReporting = () => {
  const supabase = useSupabase();
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedIncentiveType, setSelectedIncentiveType] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      if (supabase) {
        // Load incentive applications
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('incentive_applications')
          .select(`
            *,
            employees!inner(name, phone, department)
          `)
          .order('created_at', { ascending: false });

        if (applicationsError) {
          console.error('Error loading applications:', applicationsError);
        } else {
          setApplications(applicationsData || []);
        }

        // Load employees
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('*')
          .eq('status', 'active');

        if (employeesError) {
          console.error('Error loading employees:', employeesError);
        } else {
          setEmployees(employeesData || []);
        }
      } else {
        // Fallback for local development
        const localApplications = JSON.parse(localStorage.getItem('incentive_applications') || '[]');
        const localEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
        setApplications(localApplications);
        setEmployees(localEmployees);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter applications based on selected criteria
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }

    // Filter by incentive type
    if (selectedIncentiveType !== 'all') {
      filtered = filtered.filter(app => app.incentive_type === selectedIncentiveType);
    }

    // Filter by date range
    const now = new Date();
    const filterDate = new Date();
    
    switch (dateRange) {
      case 'last7days':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        filterDate.setDate(now.getDate() - 30);
        break;
      case 'last90days':
        filterDate.setDate(now.getDate() - 90);
        break;
      case 'thisyear':
        filterDate.setFullYear(now.getFullYear(), 0, 1);
        break;
      default:
        return filtered;
    }

    filtered = filtered.filter(app => new Date(app.created_at) >= filterDate);
    return filtered;
  }, [applications, selectedStatus, selectedIncentiveType, dateRange]);

  // Calculate analytics
  const analytics = useMemo(() => {
    const total = filteredApplications.length;
    const pending = filteredApplications.filter(app => app.status === 'pending').length;
    const approved = filteredApplications.filter(app => app.status === 'approved').length;
    const rejected = filteredApplications.filter(app => app.status === 'rejected').length;
    const disbursed = filteredApplications.filter(app => app.status === 'disbursed').length;

    const totalDisbursed = filteredApplications
      .filter(app => app.status === 'disbursed')
      .reduce((sum, app) => {
        const amounts = {
          'hiring_recommendation': 3000,
          'client_testimonial': 1000,
          'promotional_video': 500
        };
        return sum + (amounts[app.incentive_type] || 0);
      }, 0);

    const byType = {
      hiring_recommendation: filteredApplications.filter(app => app.incentive_type === 'hiring_recommendation').length,
      client_testimonial: filteredApplications.filter(app => app.incentive_type === 'client_testimonial').length,
      promotional_video: filteredApplications.filter(app => app.incentive_type === 'promotional_video').length
    };

    const byDepartment = {};
    filteredApplications.forEach(app => {
      const dept = app.employees?.department || 'Unknown';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    return {
      total,
      pending,
      approved,
      rejected,
      disbursed,
      totalDisbursed,
      byType,
      byDepartment,
      approvalRate: total > 0 ? ((approved + disbursed) / total * 100).toFixed(1) : 0,
      avgProcessingTime: '2.5 days' // Mock data
    };
  }, [filteredApplications]);

  const handleExport = async () => {
    try {
      const amounts = {
        'hiring_recommendation': 3000,
        'client_testimonial': 1000,
        'promotional_video': 500
      };

      const reportData = {
        title: 'Employee Incentive Report',
        period: dateRange.replace(/([A-Z])/g, ' $1').toLowerCase(),
        totalApplications: filteredApplications.length,
        totalAmount: filteredApplications.reduce((sum, app) => sum + (amounts[app.incentive_type] || 0), 0),
        applications: filteredApplications.map(app => ({
          'Employee Name': app.employees?.name || app.employee_name || 'N/A',
          'Phone': app.employees?.phone || app.employee_phone || 'N/A',
          'Department': app.employees?.department || 'N/A',
          'Incentive Type': app.incentive_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A',
          'Amount (INR)': amounts[app.incentive_type] || 0,
          'Status': app.status?.toUpperCase() || 'N/A',
          'Applied Date': new Date(app.created_at).toLocaleDateString(),
          'Approved Date': app.approved_at ? new Date(app.approved_at).toLocaleDateString() : 'N/A',
          'Disbursed Date': app.disbursement_date ? new Date(app.disbursement_date).toLocaleDateString() : 'N/A',
          'Disbursement Reference': app.disbursement_reference || 'N/A'
        }))
      };

      const filename = reportUtils.generateFilename('incentive-report');
      const result = await exportReport(reportData, exportFormat, 'incentiveReport', filename);
      
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export report', 'error');
    }
  };





  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading incentive data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">💰 Incentive Reporting Dashboard</h1>
            <p className="text-gray-600 mt-1">Track and analyze employee incentive disbursements</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="csv">Export CSV</option>
              <option value="pdf">Export PDF</option>
            </select>
            <LoadingButton onClick={handleExport} variant="primary">
              📊 Export Report
            </LoadingButton>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
              <option value="thisyear">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="disbursed">Disbursed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Incentive Type</label>
            <select
              value={selectedIncentiveType}
              onChange={(e) => setSelectedIncentiveType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="hiring_recommendation">Hiring Recommendation (₹3,000)</option>
              <option value="client_testimonial">Client Testimonial (₹1,000)</option>
              <option value="promotional_video">Promotional Video (₹500)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disbursed</p>
              <p className="text-2xl font-bold text-green-600">{analytics.disbursed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Disbursed</p>
              <p className="text-2xl font-bold text-purple-600">₹{analytics.totalDisbursed.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approval Rate</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.approvalRate}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incentive Type Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Incentive Type Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hiring Recommendation (₹3,000)</span>
              <span className="font-semibold">{analytics.byType.hiring_recommendation}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Client Testimonial (₹1,000)</span>
              <span className="font-semibold">{analytics.byType.client_testimonial}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Promotional Video (₹500)</span>
              <span className="font-semibold">{analytics.byType.promotional_video}</span>
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Department Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(analytics.byDepartment).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{dept}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📋 Incentive Applications</h3>
          <p className="text-sm text-gray-600 mt-1">Showing {filteredApplications.length} applications</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incentive Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disbursed Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => {
                const amounts = {
                  'hiring_recommendation': 3000,
                  'client_testimonial': 1000,
                  'promotional_video': 500
                };
                
                const statusColors = {
                  pending: 'bg-yellow-100 text-yellow-800',
                  approved: 'bg-green-100 text-green-800',
                  rejected: 'bg-red-100 text-red-800',
                  disbursed: 'bg-purple-100 text-purple-800'
                };

                return (
                  <tr key={application.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {application.employees?.name || application.employee_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.employees?.phone || application.employee_phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.employees?.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.incentive_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{(amounts[application.incentive_type] || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        statusColors[application.status] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {application.status?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(application.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {application.disbursement_date 
                        ? new Date(application.disbursement_date).toLocaleDateString()
                        : '-'
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">Try adjusting your filters to see more data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerIncentiveReporting;