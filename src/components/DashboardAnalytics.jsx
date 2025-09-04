import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import DashboardAnalyticsService from '@/services/dashboardAnalyticsService';

// Dashboard Analytics Component
export const DashboardAnalytics = () => {
  const { user, role } = useUnifiedAuth();
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
    departmentStats: {},
    roleDistribution: {},
    recentActivity: [],
    performanceMetrics: {},
    usageStats: {}
  });
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, user]);

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get department filter for role-based access
      const department = role === 'manager' ? null : user.department;
      
      const analyticsData = await DashboardAnalyticsService.getAnalytics(timeRange, department);
      setAnalytics(analyticsData);
      
      // Track this page view
      await DashboardAnalyticsService.trackPageView({
        userId: user.id || user.email,
        userName: user.name || user.email,
        userType: user.user_type || 'employee',
        pagePath: '/dashboard-analytics',
        department: user.department,
        pageLoadTime: performance.now()
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = async (newTimeRange) => {
    setTimeRange(newTimeRange);
    
    // Track the filter change
    if (user) {
      await DashboardAnalyticsService.trackUserInteraction({
        userId: user.id || user.email,
        userName: user.name || user.email,
        userType: user.user_type || 'employee',
        pagePath: '/dashboard-analytics',
        actionType: 'filter_apply',
        actionTarget: 'time_range',
        actionValue: newTimeRange
      });
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-brand p-6">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card-brand p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold">Error Loading Analytics</h3>
            <p className="text-sm text-brand-text-secondary mt-2">{error}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-brand-text">Dashboard Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-brand p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {analytics.totalUsers}
          </div>
          <div className="text-sm text-brand-text-secondary">Total Users</div>
        </div>
        
        <div className="card-brand p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {analytics.activeProjects}
          </div>
          <div className="text-sm text-brand-text-secondary">Active Projects</div>
        </div>
        
        <div className="card-brand p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {analytics.completedTasks}
          </div>
          <div className="text-sm text-brand-text-secondary">Completed Tasks</div>
        </div>
        
        <div className="card-brand p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {analytics.pendingTasks}
          </div>
          <div className="text-sm text-brand-text-secondary">Pending Tasks</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Statistics */}
        <div className="card-brand p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Department Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analytics.departmentStats).map(([dept, count]) => (
              <div key={dept} className="flex justify-between items-center">
                <span className="text-brand-text">{dept}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / analytics.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-brand-text">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Distribution */}
        <div className="card-brand p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Role Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analytics.roleDistribution).slice(0, 6).map(([role, count]) => (
              <div key={role} className="flex justify-between items-center">
                <span className="text-brand-text text-sm">{role}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(count / analytics.totalUsers) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-brand-text">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="card-brand p-6">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {analytics.performanceMetrics.completionRate}%
            </div>
            <div className="text-sm text-brand-text-secondary">Task Completion Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {analytics.performanceMetrics.averageTasksPerUser}
            </div>
            <div className="text-sm text-brand-text-secondary">Avg Tasks per User</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {analytics.performanceMetrics.activeUserPercentage}%
            </div>
            <div className="text-sm text-brand-text-secondary">Active Users</div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="card-brand p-6">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Usage Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 mb-1">
              {analytics.usageStats.total_sessions || 0}
            </div>
            <div className="text-sm text-brand-text-secondary">Total Sessions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-600 mb-1">
              {analytics.usageStats.total_page_views || 0}
            </div>
            <div className="text-sm text-brand-text-secondary">Page Views</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {analytics.usageStats.avg_session_duration ? Math.round(analytics.usageStats.avg_session_duration / 60) : 0}m
            </div>
            <div className="text-sm text-brand-text-secondary">Avg Session Duration</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-rose-600 mb-1">
              {analytics.usageStats.avg_page_load_time ? Math.round(analytics.usageStats.avg_page_load_time) : 0}ms
            </div>
            <div className="text-sm text-brand-text-secondary">Avg Load Time</div>
          </div>
        </div>
        
        {analytics.usageStats.most_active_department && (
          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="text-sm text-brand-text-secondary">Most Active Department</div>
            <div className="font-medium text-brand-text">{analytics.usageStats.most_active_department}</div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card-brand p-6">
        <h3 className="text-lg font-semibold text-brand-text mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {analytics.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-brand-text-secondary">
              No recent activity found
            </div>
          ) : (
            analytics.recentActivity.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-brand-text">{activity.title}</div>
                  <div className="text-sm text-brand-text-secondary">
                    by {activity.user} • {activity.type}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </div>
                  <div className="text-xs text-brand-text-secondary mt-1">
                    {formatTimestamp(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;