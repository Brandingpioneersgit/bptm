import { supabase } from '@/shared/lib/supabase';

/**
 * Dashboard Analytics Service
 * Connects to the dashboard_usage table for real analytics data
 */
class DashboardAnalyticsService {
  /**
   * Get comprehensive dashboard analytics
   * @param {string} timeRange - '7d', '30d', or '90d'
   * @param {string} department - Optional department filter
   * @returns {Object} Analytics data
   */
  static async getAnalytics(timeRange = '30d', department = null) {
    try {
      const days = this.getTimeRangeDays(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get usage analytics using the database function
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_usage_analytics', {
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString(),
          target_department: department
        });

      if (usageError) throw usageError;

      // Get user statistics from unified_users
      const { data: users, error: usersError } = await supabase
        .from('unified_users')
        .select('id, name, department, role, is_active')
        .eq('is_active', true);

      if (usersError) throw usersError;

      // Get recent activity from dashboard_usage
      const { data: recentActivity, error: activityError } = await supabase
        .from('dashboard_usage')
        .select(`
          id,
          user_name,
          page_path,
          action_type,
          action_target,
          timestamp,
          department
        `)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      // Get active projects from monthly_form_submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('monthly_form_submissions')
        .select('id, status, created_at')
        .gte('created_at', startDate.toISOString());

      if (submissionsError) throw submissionsError;

      // Calculate department and role distributions
      const departmentStats = this.calculateDistribution(users, 'department');
      const roleDistribution = this.calculateDistribution(users, 'role');

      // Calculate performance metrics
      const completedTasks = submissions.filter(sub => sub.status === 'completed').length;
      const pendingTasks = submissions.filter(sub => sub.status === 'pending' || sub.status === 'draft').length;
      const totalTasks = completedTasks + pendingTasks;
      
      const performanceMetrics = {
        completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0',
        averageTasksPerUser: users.length > 0 ? (totalTasks / users.length).toFixed(1) : '0',
        activeUserPercentage: users.length > 0 ? ((users.filter(u => u.is_active).length / users.length) * 100).toFixed(1) : '0'
      };

      // Format recent activity
      const formattedActivity = recentActivity.map(activity => ({
        id: activity.id,
        type: activity.action_type,
        title: this.formatActivityTitle(activity),
        user: activity.user_name,
        timestamp: activity.timestamp,
        status: this.getActivityStatus(activity.action_type)
      }));

      return {
        totalUsers: users.length,
        activeProjects: submissions.filter(sub => sub.status === 'active' || sub.status === 'pending').length,
        completedTasks,
        pendingTasks,
        departmentStats,
        roleDistribution,
        recentActivity: formattedActivity,
        performanceMetrics,
        usageStats: usageData?.[0] || {
          total_sessions: 0,
          unique_users: 0,
          total_page_views: 0,
          avg_session_duration: 0,
          avg_page_load_time: 0,
          most_visited_page: null,
          most_active_department: null,
          bounce_rate: 0
        }
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  /**
   * Get user activity summary for a specific user
   * @param {string} userId - User ID
   * @param {number} daysBack - Number of days to look back
   * @returns {Object} User activity summary
   */
  static async getUserActivitySummary(userId, daysBack = 30) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_activity_summary', {
          target_user_id: userId,
          days_back: daysBack
        });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching user activity summary:', error);
      throw error;
    }
  }

  /**
   * Track a page view event
   * @param {Object} params - Page view parameters
   */
  static async trackPageView({
    userId,
    userName,
    userType,
    pagePath,
    department = null,
    sessionId = null,
    referrerPage = null,
    pageLoadTime = null
  }) {
    try {
      const { data, error } = await supabase
        .rpc('track_page_view', {
          p_user_id: userId,
          p_user_name: userName,
          p_user_type: userType,
          p_page_path: pagePath,
          p_department: department,
          p_session_id: sessionId,
          p_referrer_page: referrerPage,
          p_page_load_time: pageLoadTime
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tracking page view:', error);
      throw error;
    }
  }

  /**
   * Track a user interaction event
   * @param {Object} params - Interaction parameters
   */
  static async trackUserInteraction({
    userId,
    userName,
    userType,
    pagePath,
    actionType,
    actionTarget = null,
    actionValue = null,
    componentName = null,
    sessionId = null,
    interactionDuration = null
  }) {
    try {
      const { data, error } = await supabase
        .rpc('track_user_interaction', {
          p_user_id: userId,
          p_user_name: userName,
          p_user_type: userType,
          p_page_path: pagePath,
          p_action_type: actionType,
          p_action_target: actionTarget,
          p_action_value: actionValue,
          p_component_name: componentName,
          p_session_id: sessionId,
          p_interaction_duration: interactionDuration
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tracking user interaction:', error);
      throw error;
    }
  }

  /**
   * Get department-specific analytics
   * @param {string} department - Department name
   * @param {string} timeRange - Time range
   * @returns {Object} Department analytics
   */
  static async getDepartmentAnalytics(department, timeRange = '30d') {
    return this.getAnalytics(timeRange, department);
  }

  /**
   * Get real-time dashboard metrics
   * @returns {Object} Real-time metrics
   */
  static async getRealTimeMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get active sessions in the last hour
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('dashboard_usage')
        .select('session_id, user_id')
        .gte('timestamp', oneHourAgo.toISOString())
        .not('session_id', 'is', null);

      if (sessionsError) throw sessionsError;

      // Get recent page views
      const { data: recentViews, error: viewsError } = await supabase
        .from('dashboard_usage')
        .select('page_path')
        .eq('action_type', 'page_view')
        .gte('timestamp', oneHourAgo.toISOString());

      if (viewsError) throw viewsError;

      const uniqueSessions = new Set(activeSessions.map(s => s.session_id)).size;
      const uniqueUsers = new Set(activeSessions.map(s => s.user_id)).size;

      return {
        activeUsers: uniqueUsers,
        activeSessions: uniqueSessions,
        recentPageViews: recentViews.length,
        lastUpdated: now.toISOString()
      };
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  }

  // Helper methods
  static getTimeRangeDays(timeRange) {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  }

  static calculateDistribution(items, field) {
    return items.reduce((acc, item) => {
      const value = item[field] || 'Unassigned';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  static formatActivityTitle(activity) {
    const actionMap = {
      'page_view': `Viewed ${activity.page_path}`,
      'button_click': `Clicked ${activity.action_target || 'button'}`,
      'form_submit': `Submitted form on ${activity.page_path}`,
      'data_export': `Exported data from ${activity.page_path}`,
      'filter_apply': `Applied filter: ${activity.action_target}`,
      'search': `Searched for: ${activity.action_target}`,
      'modal_open': `Opened ${activity.action_target} modal`,
      'tab_switch': `Switched to ${activity.action_target} tab`
    };
    
    return actionMap[activity.action_type] || `${activity.action_type} on ${activity.page_path}`;
  }

  static getActivityStatus(actionType) {
    const statusMap = {
      'page_view': 'completed',
      'button_click': 'completed',
      'form_submit': 'completed',
      'data_export': 'completed',
      'error': 'failed'
    };
    
    return statusMap[actionType] || 'completed';
  }
}

export default DashboardAnalyticsService;