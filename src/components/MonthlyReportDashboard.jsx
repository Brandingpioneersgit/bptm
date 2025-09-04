import React, { useState, useEffect, useMemo } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { useMobileResponsive } from '@/hooks/useMobileResponsive';
import { MonthlyReportService } from '@/services/monthlyReportService';
import { exportReport, reportUtils } from '@/utils/reportGenerator';

export function MonthlyReportDashboard({ onBack }) {
  const { user, role, hasDashboardAccess } = useUnifiedAuth();
  const { notify } = useToast();
  const { isMobile, gridConfig, spacing, text } = useMobileResponsive();
  
  // Local state for data
  const [reportData, setReportData] = useState({
    users: [],
    submissions: [],
    loading: true,
    error: null
  });
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [reportType, setReportType] = useState('summary');
  const [filterDepartment, setFilterDepartment] = useState('all');
  
  // Fetch data when month changes
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setReportData(prev => ({ ...prev, loading: true, error: null }));
        const data = await MonthlyReportService.getMonthlyReportData(selectedMonth);
        setReportData({
          users: data.users,
          submissions: data.submissions,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching report data:', error);
        setReportData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
        notify('Failed to load report data', 'error');
      }
    };
    
    fetchReportData();
  }, [selectedMonth, notify]);

  // Generate month options for last 12 months
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      options.push({ value, label });
    }
    return options;
  }, []);

  // Get submissions (already filtered by month from service)
  const monthlySubmissions = reportData.submissions;

  // Filter users by department if needed
  const filteredEmployees = useMemo(() => {
    if (filterDepartment === 'all') return reportData.users;
    return reportData.users.filter(user => user.department === filterDepartment);
  }, [reportData.users, filterDepartment]);

  // Calculate monthly metrics using service
  const monthlyMetrics = useMemo(() => {
    return MonthlyReportService.calculateMonthlyMetrics(filteredEmployees, monthlySubmissions);
  }, [filteredEmployees, monthlySubmissions]);

  // Department breakdown using service
  const departmentBreakdown = useMemo(() => {
    return MonthlyReportService.calculateDepartmentBreakdown(filteredEmployees, monthlySubmissions);
  }, [filteredEmployees, monthlySubmissions]);

  // Role-based access control
  const canViewAllDepartments = ['Super Admin', 'HR', 'Operations Head'].includes(role);
  const canExportData = ['Super Admin', 'HR', 'Operations Head', 'Manager'].includes(role);

  const [exportFormat, setExportFormat] = useState('excel');

  const handleExportReport = async () => {
    try {
      const reportData = {
        title: 'Monthly Performance Report',
        month: monthOptions.find(opt => opt.value === selectedMonth)?.label,
        metrics: monthlyMetrics,
        departmentBreakdown,
        generatedBy: user?.name,
        generatedAt: new Date().toISOString(),
        reportType,
        period: selectedMonth,
        filterDepartment: filterDepartment !== 'all' ? filterDepartment : null
      };

      const filename = reportUtils.generateFilename(`monthly-report-${selectedMonth}`);
      const result = await exportReport(reportData, exportFormat, 'monthlyReport', filename);
      
      if (result.success) {
        notify(result.message, 'success');
      } else {
        notify(result.message, 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      notify('Failed to export report', 'error');
    }
  };

  if (reportData.loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="xl" showText text="Loading monthly report data..." />
        </div>
      </div>
    );
  }

  if (reportData.error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error Loading Report</div>
            <div className="text-gray-600 mb-4">{reportData.error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto ${spacing.container} px-4 sm:px-6`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className={`${text.title} font-bold text-gray-900 mb-2`}>
            📊 Monthly Report Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive monthly performance and activity reports
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-4'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="performance">Performance Focus</option>
              <option value="department">Department Analysis</option>
            </select>
          </div>

          {canViewAllDepartments && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Filter
              </label>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                <option value="Marketing">Marketing</option>
                <option value="Technology">Technology</option>
                <option value="Creative">Creative</option>
                <option value="Operations">Operations</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          )}

          {canExportData && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="excel">Excel (.xlsx)</option>
                <option value="pdf">PDF Report</option>
                <option value="csv">CSV Data</option>
              </select>
              <button
                onClick={handleExportReport}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                📥 Export Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className={`${gridConfig.metrics} gap-4 mb-8`}>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">👥</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{monthlyMetrics.activeEmployees}</p>
              <p className="text-sm text-gray-600">Active Employees</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">📝</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{monthlyMetrics.totalSubmissions}</p>
              <p className="text-sm text-gray-600">Total Submissions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-lg">⭐</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{monthlyMetrics.avgPerformance}</p>
              <p className="text-sm text-gray-600">Avg Performance</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-lg">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{monthlyMetrics.submissionRate}%</p>
              <p className="text-sm text-gray-600">Submission Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Department Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Employees</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Submissions</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Rate</th>
              </tr>
            </thead>
            <tbody>
              {departmentBreakdown.map((dept, index) => (
                <tr key={dept.department} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4 font-medium text-gray-900">{dept.department}</td>
                  <td className="py-3 px-4 text-gray-700">{dept.employees}</td>
                  <td className="py-3 px-4 text-gray-700">{dept.submissions}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dept.avgScore >= 80 ? 'bg-green-100 text-green-800' :
                      dept.avgScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {dept.avgScore}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {dept.submissionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Summary */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h3>
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4">
            This report covers the month of <strong>{monthOptions.find(opt => opt.value === selectedMonth)?.label}</strong>.
            {filterDepartment !== 'all' && (
              <span> Filtered to show only <strong>{filterDepartment}</strong> department.</span>
            )}
          </p>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <h4 className="font-medium text-blue-900">Key Insights</h4>
            <ul className="mt-2 text-blue-800 text-sm space-y-1">
              <li>• {monthlyMetrics.uniqueSubmitters} out of {monthlyMetrics.activeEmployees} employees submitted reports ({monthlyMetrics.submissionRate}% participation)</li>
              <li>• Average of {monthlyMetrics.avgSubmissionsPerEmployee} submissions per employee</li>
              <li>• Overall performance average: {monthlyMetrics.avgPerformance}/100</li>
              <li>• Report generated by {user?.name} on {new Date().toLocaleDateString()}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthlyReportDashboard;