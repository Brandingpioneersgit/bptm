import React, { useState, useEffect } from 'react';
import { useDataSync } from '../components/DataSyncContext';
import { useUnifiedAuth } from '@/shared/hooks/useUnifiedAuth';
import { useNavigationUtils } from '../utils/navigation';

const PerformanceScoringPage = () => {
  const { employees, loading } = useDataSync();
  const { user, role } = useUnifiedAuth();
  const navigation = useNavigationUtils();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // Mock performance data - in real app, this would come from database
  const generatePerformanceData = (employee) => {
    const baseScore = 65 + Math.random() * 30; // 65-95 range
    const metrics = {
      productivity: Math.round(baseScore + (Math.random() - 0.5) * 20),
      quality: Math.round(baseScore + (Math.random() - 0.5) * 15),
      collaboration: Math.round(baseScore + (Math.random() - 0.5) * 25),
      innovation: Math.round(baseScore + (Math.random() - 0.5) * 30),
      leadership: Math.round(baseScore + (Math.random() - 0.5) * 20)
    };
    
    // Ensure scores are within 0-100 range
    Object.keys(metrics).forEach(key => {
      metrics[key] = Math.max(0, Math.min(100, metrics[key]));
    });
    
    const overallScore = Math.round(
      (metrics.productivity * 0.3 + 
       metrics.quality * 0.25 + 
       metrics.collaboration * 0.2 + 
       metrics.innovation * 0.15 + 
       metrics.leadership * 0.1)
    );
    
    return {
      ...metrics,
      overall: overallScore,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable',
      lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    };
  };

  // Generate performance data for all employees
  const employeesWithPerformance = employees.map(employee => ({
    ...employee,
    performance: generatePerformanceData(employee)
  }));

  // Filter and sort employees
  const filteredEmployees = employeesWithPerformance.filter(employee => {
    const matchesDepartment = selectedDepartment === 'all' || 
                             employee.department === selectedDepartment;
    return matchesDepartment;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'score':
        aValue = a.performance.overall;
        bValue = b.performance.overall;
        break;
      case 'name':
        aValue = a.name || '';
        bValue = b.name || '';
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      case 'department':
        aValue = a.department || '';
        bValue = b.department || '';
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      case 'productivity':
        aValue = a.performance.productivity;
        bValue = b.performance.productivity;
        break;
      case 'quality':
        aValue = a.performance.quality;
        bValue = b.performance.quality;
        break;
      default:
        return 0;
    }
    
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Get unique departments
  const departments = ['all', ...new Set(employees.map(emp => emp.department).filter(Boolean))];

  // Get score color based on performance
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  // Calculate department averages
  const departmentAverages = departments.slice(1).map(dept => {
    const deptEmployees = filteredEmployees.filter(emp => emp.department === dept);
    const avgScore = deptEmployees.length > 0 
      ? Math.round(deptEmployees.reduce((sum, emp) => sum + emp.performance.overall, 0) / deptEmployees.length)
      : 0;
    return { department: dept, average: avgScore, count: deptEmployees.length };
  }).sort((a, b) => b.average - a.average);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6 w-64"></div>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Performance Scoring</h1>
            <p className="text-gray-600 mt-1">
              Track and analyze employee performance metrics
            </p>
          </div>
          <button
            onClick={() => navigation.navigateToHome()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Department Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {departmentAverages.map((dept, index) => (
              <div key={dept.department} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{dept.department}</h3>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(dept.average)}`}>
                    {dept.average}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{dept.count} employees</p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dept.average}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Period Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="current">Current Quarter</option>
                <option value="last">Last Quarter</option>
                <option value="ytd">Year to Date</option>
                <option value="annual">Annual</option>
              </select>
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
                <option value="score">Overall Score</option>
                <option value="name">Name</option>
                <option value="department">Department</option>
                <option value="productivity">Productivity</option>
                <option value="quality">Quality</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View
              </label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'cards' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Data */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee, index) => {
              const perf = employee.performance;
              const scoreColor = getScoreColor(perf.overall);
              
              return (
                <div key={employee.id || index} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Employee Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {(employee.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {employee.name || 'Unknown'}
                          </h3>
                          <p className="text-sm text-gray-600">{employee.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${scoreColor} px-3 py-1 rounded-lg`}>
                          {perf.overall}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {getTrendIcon(perf.trend)} {perf.trend}
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-3">
                      {[
                        { key: 'productivity', label: 'Productivity', icon: '⚡' },
                        { key: 'quality', label: 'Quality', icon: '⭐' },
                        { key: 'collaboration', label: 'Collaboration', icon: '🤝' },
                        { key: 'innovation', label: 'Innovation', icon: '💡' },
                        { key: 'leadership', label: 'Leadership', icon: '👑' }
                      ].map(metric => (
                        <div key={metric.key} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{metric.icon}</span>
                            <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${perf[metric.key]}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-8 text-right">
                              {perf[metric.key]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Last Updated */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Last updated: {perf.lastUpdated.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                      Overall Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productivity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collaboration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Innovation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leadership
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee, index) => {
                    const perf = employee.performance;
                    const scoreColor = getScoreColor(perf.overall);
                    
                    return (
                      <tr key={employee.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {(employee.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {employee.name || 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${scoreColor}`}>
                            {perf.overall}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {perf.productivity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {perf.quality}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {perf.collaboration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {perf.innovation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {perf.leadership}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getTrendIcon(perf.trend)} {perf.trend}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No performance data found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceScoringPage;