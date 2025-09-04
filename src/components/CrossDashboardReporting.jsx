import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/shared/hooks/useUnifiedAuth';
import { useToast } from '@/shared/hooks/useToast';
import { DEPARTMENTS } from "@/shared/lib/constants";
import crossDashboardReportingService from '@/services/crossDashboardReportingService';
import { exportReport, reportUtils } from '@/utils/reportGenerator';

export const CrossDashboardReporting = () => {
  const { user } = useUnifiedAuth();
  const { toast } = useToast();
  const [reportData, setReportData] = useState({
    departmentMetrics: [],
    rolePerformance: [],
    crossFunctionalProjects: [],
    resourceUtilization: [],
    summary: {}
  });
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [activeView, setActiveView] = useState('overview');
  const [error, setError] = useState(null);

  const departments = DEPARTMENTS;

  const timeframes = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' }
  ];

  useEffect(() => {
    generateReportData();
  }, [selectedTimeframe, selectedDepartments]);

  const generateReportData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await crossDashboardReportingService.getCrossDashboardMetrics(
        selectedTimeframe,
        selectedDepartments.length > 0 ? selectedDepartments : departments
      );
      
      setReportData(data);
      
      toast({
        title: 'Report Generated',
        description: 'Cross-dashboard analytics loaded successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error generating report data:', error);
      setError('Failed to load analytics data. Please try again.');
      toast({
        title: 'Error Loading Data',
        description: 'Failed to generate report data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      
      const exportData = {
        title: 'Cross-Dashboard Analytics Report',
        timeframe: selectedTimeframe,
        departments: selectedDepartments.length > 0 ? selectedDepartments : departments,
        generatedBy: user?.name || 'Unknown User',
        generatedAt: new Date().toISOString(),
        summary: reportData.summary,
        departmentMetrics: reportData.departmentMetrics,
        rolePerformance: reportData.rolePerformance,
        crossFunctionalProjects: reportData.crossFunctionalProjects,
        resourceUtilization: reportData.resourceUtilization
      };
      
      const filename = reportUtils.generateFilename('cross-dashboard-report');
      const result = await exportReport(exportData, exportFormat, 'genericData', filename);
      
      if (result.success) {
        toast({
          title: 'Export Successful',
          description: result.message,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Departments</h3>
        <p className="text-3xl font-bold text-blue-600">{reportData.summary?.totalDepartments || 0}</p>
        <p className="text-sm text-blue-600 mt-1">Active departments</p>
      </div>
      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Cross-Functional Projects</h3>
        <p className="text-3xl font-bold text-green-600">{reportData.summary?.totalProjects || 0}</p>
        <p className="text-sm text-green-600 mt-1">Active projects</p>
      </div>
      <div className="bg-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-800 mb-2">Average Efficiency</h3>
        <p className="text-3xl font-bold text-purple-600">
          {reportData.summary?.averageEfficiency || 0}%
        </p>
        <p className="text-sm text-purple-600 mt-1">Across all departments</p>
      </div>
      <div className="bg-orange-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-orange-800 mb-2">Resource Utilization</h3>
        <p className="text-3xl font-bold text-orange-600">
          {reportData.summary?.averageUtilization || 0}%
        </p>
        <p className="text-sm text-orange-600 mt-1">Average utilization</p>
      </div>
    </div>
  );

  const renderDepartmentMetrics = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Department Performance Metrics</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.departmentMetrics.map((dept, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.totalEmployees}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.activeProjects}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    dept.completionRate >= 90 ? 'bg-green-100 text-green-800' :
                    dept.completionRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {dept.completionRate}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.efficiency}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dept.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCrossFunctionalProjects = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-800">Cross-Functional Projects</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData.crossFunctionalProjects.map((project) => (
            <div key={project.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{project.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  project.status === 'Active' ? 'bg-green-100 text-green-800' :
                  project.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Departments:</strong> {project.departments.join(', ')}</p>
                <p><strong>Team Size:</strong> {project.teamSize}</p>
                <p><strong>Progress:</strong> {project.progress}%</p>
                <p><strong>Deadline:</strong> {project.deadline}</p>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const views = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'departments', label: 'Departments', icon: '🏢' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'resources', label: 'Resources', icon: '⚡' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Cross-Dashboard Reporting</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeframes.map((timeframe) => (
                <option key={timeframe.value} value={timeframe.value}>
                  {timeframe.label}
                </option>
              ))}
            </select>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="pdf">PDF Report</option>
              <option value="csv">CSV Data</option>
            </select>
            <button
              onClick={handleExportReport}
              disabled={isExporting || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exporting...' : 'Export Report'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-6">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              disabled={isLoading}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors disabled:opacity-50 ${
                activeView === view.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>

        {activeView === 'overview' && renderOverview()}
        {activeView === 'departments' && renderDepartmentMetrics()}
        {activeView === 'projects' && renderCrossFunctionalProjects()}
        {activeView === 'resources' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resource Utilization</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.resourceUtilization.map((resource, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{resource.department}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilization:</span>
                      <span className="font-medium">{resource.utilization}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Capacity:</span>
                      <span className="font-medium">{resource.capacity}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Bottlenecks:</span>
                      <span className="font-medium">{resource.bottlenecks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Efficiency:</span>
                      <span className="font-medium">{resource.efficiency}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrossDashboardReporting;