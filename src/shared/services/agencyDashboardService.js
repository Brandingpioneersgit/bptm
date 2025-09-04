/**
 * Agency Dashboard Service
 * Provides dynamic data for agency dashboard stats and metrics
 */

import { supabase } from '../lib/supabase';

class AgencyDashboardService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get dynamic agency dashboard stats
   * @returns {Promise<Object>} Dynamic stats object
   */
  async getAgencyStats() {
    const cacheKey = 'agency_dashboard_stats';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const stats = {
        q4Targets: await this.getQ4TargetsProgress(),
        newClients: await this.getNewClientsCount(),
        totalEmployees: await this.getTotalEmployeesCount(),
        activeDepartments: await this.getActiveDepartmentsCount(),
        monthlyRevenue: await this.getMonthlyRevenue(),
        completionRate: await this.getProjectCompletionRate()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;
    } catch (error) {
      console.error('Error fetching agency dashboard stats:', error);
      // Return fallback data
      return this.getFallbackStats();
    }
  }

  /**
   * Get Q4 targets progress
   * @returns {Promise<Object>} Q4 targets data
   */
  async getQ4TargetsProgress() {
    try {
      // Calculate Q4 progress based on submissions and targets
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .gte('created_at', '2024-10-01')
        .lte('created_at', '2024-12-31');

      if (error) throw error;

      // Calculate progress percentage
      const targetSubmissions = 500; // Example target
      const currentSubmissions = submissions?.length || 0;
      const progressPercentage = Math.min(Math.round((currentSubmissions / targetSubmissions) * 100), 100);
      
      return {
        value: `+${progressPercentage}%`,
        label: 'Q4 Targets',
        progress: progressPercentage,
        current: currentSubmissions,
        target: targetSubmissions
      };
    } catch (error) {
      console.error('Error fetching Q4 targets:', error);
      return {
        value: '+15%',
        label: 'Q4 Targets',
        progress: 15
      };
    }
  }

  /**
   * Get new clients count for current month
   * @returns {Promise<Object>} New clients data
   */
  async getNewClientsCount() {
    try {
      const currentMonth = new Date();
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .gte('created_at', firstDayOfMonth.toISOString());

      if (error) throw error;

      const newClientsCount = clients?.length || 0;
      
      return {
        value: newClientsCount.toString(),
        label: 'New Clients',
        thisMonth: newClientsCount
      };
    } catch (error) {
      console.error('Error fetching new clients count:', error);
      return {
        value: '5',
        label: 'New Clients',
        thisMonth: 5
      };
    }
  }

  /**
   * Get total employees count
   * @returns {Promise<number>} Total employees
   */
  async getTotalEmployeesCount() {
    try {
      const { data: employees, error } = await supabase
        .from('unified_users')
        .select('id')
        .eq('status', 'active')
        .eq('is_active', true);

      if (error) throw error;
      return employees?.length || 0;
    } catch (error) {
      console.error('Error fetching employees count:', error);
      return 125; // Fallback
    }
  }

  /**
   * Get active departments count
   * @returns {Promise<number>} Active departments
   */
  async getActiveDepartmentsCount() {
    try {
      const { data: departments, error } = await supabase
        .from('unified_users')
        .select('department')
        .eq('status', 'active')
        .eq('is_active', true);

      if (error) throw error;
      
      // Get unique departments
      const uniqueDepartments = new Set(departments?.map(emp => emp.department).filter(Boolean));
      return uniqueDepartments.size;
    } catch (error) {
      console.error('Error fetching departments count:', error);
      return 8; // Fallback
    }
  }

  /**
   * Get monthly revenue
   * @returns {Promise<number>} Monthly revenue
   */
  async getMonthlyRevenue() {
    try {
      // This would typically come from a financial/billing table
      // For now, we'll calculate based on client projects or use mock data
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*');

      if (error) throw error;
      
      // Mock calculation: assume average client value
      const averageClientValue = 50000; // ₹50,000 per client per month
      const activeClients = clients?.length || 0;
      
      return activeClients * averageClientValue;
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      return 2500000; // Fallback: ₹25L
    }
  }

  /**
   * Get project completion rate
   * @returns {Promise<number>} Completion rate percentage
   */
  async getProjectCompletionRate() {
    try {
      // Calculate based on submissions or project data
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (error) throw error;
      
      // Mock calculation: assume completion based on submission scores
      const completedSubmissions = submissions?.filter(sub => 
        sub.overall_score && sub.overall_score >= 7
      ).length || 0;
      
      const totalSubmissions = submissions?.length || 1;
      const completionRate = Math.round((completedSubmissions / totalSubmissions) * 100);
      
      return Math.min(completionRate, 100);
    } catch (error) {
      console.error('Error fetching completion rate:', error);
      return 85; // Fallback
    }
  }

  /**
   * Get performance leaderboard data
   * @returns {Promise<Array>} Leaderboard data
   */
  async getPerformanceLeaderboard() {
    try {
      // First try to get submissions with scores
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .not('overall_score', 'is', null)
        .order('overall_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        // Return fallback data if no submissions found
        return this.getFallbackLeaderboardData();
      }

      return submissions.map((submission, index) => ({
        rank: index + 1,
        name: submission.employee_name,
        department: submission.department,
        score: submission.overall_score,
        profilePicture: null, // Not available in submissions table
        attendanceDays: (submission.attendance_wfo || 0) + (submission.attendance_wfh || 0),
        tasksCompleted: submission.tasks_completed || 0,
        learningHours: this.calculateLearningHours(submission.learning_activities),
        clientWorkHours: this.calculateClientWorkHours(submission.clients)
      }));
    } catch (error) {
      console.error('Error fetching performance leaderboard:', error);
      return this.getFallbackLeaderboardData();
    }
  }

  /**
   * Calculate learning hours from learning activities
   * @param {Array} learningActivities 
   * @returns {number} Total learning hours
   */
  calculateLearningHours(learningActivities) {
    if (!learningActivities || !Array.isArray(learningActivities)) return 0;
    return learningActivities.reduce((total, activity) => {
      return total + (activity.hours || 0);
    }, 0);
  }

  /**
   * Calculate client work hours from clients data
   * @param {Array} clients 
   * @returns {number} Total client work hours
   */
  calculateClientWorkHours(clients) {
    if (!clients || !Array.isArray(clients)) return 0;
    return clients.reduce((total, client) => {
      return total + (client.hours || 0);
    }, 0);
  }

  /**
   * Get fallback leaderboard data
   * @returns {Array} Fallback leaderboard
   */
  getFallbackLeaderboardData() {
    return [
      {
        rank: 1,
        name: 'Sarah Johnson',
        department: 'Marketing',
        score: 9.2,
        profilePicture: null,
        attendanceDays: 22,
        tasksCompleted: 15,
        learningHours: 8,
        clientWorkHours: 120
      },
      {
        rank: 2,
        name: 'Mike Chen',
        department: 'Web',
        score: 8.9,
        profilePicture: null,
        attendanceDays: 21,
        tasksCompleted: 12,
        learningHours: 6,
        clientWorkHours: 110
      },
      {
        rank: 3,
        name: 'Emily Davis',
        department: 'Sales',
        score: 8.7,
        profilePicture: null,
        attendanceDays: 20,
        tasksCompleted: 14,
        learningHours: 7,
        clientWorkHours: 105
      }
    ];
  }

  /**
   * Get fallback stats when database is unavailable
   * @returns {Object} Fallback stats
   */
  getFallbackStats() {
    return {
      q4Targets: {
        value: '+15%',
        label: 'Q4 Targets',
        progress: 15
      },
      newClients: {
        value: '5',
        label: 'New Clients',
        thisMonth: 5
      },
      totalEmployees: 125,
      activeDepartments: 8,
      monthlyRevenue: 2500000,
      completionRate: 85
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create and export singleton instance
const agencyDashboardService = new AgencyDashboardService();
export default agencyDashboardService;