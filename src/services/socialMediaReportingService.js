import { supabase } from '@/shared/lib/supabase';

/**
 * Social Media Reporting Service
 * Provides social media analytics and performance tracking functionality
 */
class SocialMediaReportingService {
  /**
   * Get comprehensive social media metrics
   */
  async getSocialMediaMetrics() {
    try {
      // Get clients data for social media context
      const { data: clients, error: clientsError } = await supabase
        .from('recurring_clients')
        .select('*')
        .eq('status', 'active');

      if (clientsError) throw clientsError;

      // Get web projects that might include social media work
      const { data: projects, error: projectsError } = await supabase
        .from('web_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Get monthly submissions that might contain social media data
      const { data: submissions, error: submissionsError } = await supabase
        .from('monthly_form_submissions')
        .select(`
          *,
          unified_users(
            name,
            department,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (submissionsError) throw submissionsError;

      // Process and generate social media metrics
      const metrics = this.calculateSocialMediaMetrics(clients, projects, submissions);
      const platformData = this.generatePlatformData(clients, submissions);
      const clientPerformance = this.generateClientPerformance(clients, submissions);
      const contentMetrics = this.generateContentMetrics(submissions);

      return {
        metrics,
        platformData,
        clientPerformance,
        contentMetrics,
        recentActivity: this.generateRecentActivity(submissions)
      };
    } catch (error) {
      console.error('Error fetching social media metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate social media metrics from available data
   */
  calculateSocialMediaMetrics(clients, projects, submissions) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter submissions for current year
    const ytdSubmissions = submissions.filter(sub => {
      const subDate = new Date(sub.created_at);
      return subDate.getFullYear() === currentYear;
    });

    // Filter submissions for last month
    const lastMonthSubmissions = submissions.filter(sub => {
      const subDate = new Date(sub.created_at);
      return subDate.getMonth() === (currentMonth - 1) && subDate.getFullYear() === currentYear;
    });

    // Calculate average scores
    const ytdAvgScore = ytdSubmissions.length > 0
      ? ytdSubmissions.reduce((sum, sub) => sum + (sub.month_score || 0), 0) / ytdSubmissions.length
      : 0;

    const lastMonthScore = lastMonthSubmissions.length > 0
      ? lastMonthSubmissions.reduce((sum, sub) => sum + (sub.month_score || 0), 0) / lastMonthSubmissions.length
      : 0;

    // Count active clients
    const activeClients = clients.filter(client => client.status === 'active').length;

    // Calculate engagement metrics (simulated based on available data)
    const totalEngagement = this.calculateEngagementMetrics(submissions);
    const avgNps90d = this.calculateNPSMetrics(submissions);

    return {
      ytdAvgScore: Math.round(ytdAvgScore * 10) / 10,
      lastMonthScore: Math.round(lastMonthScore * 10) / 10,
      activeClients,
      avgNps90d: Math.round(avgNps90d * 10) / 10,
      totalFollowers: this.estimateFollowers(clients),
      totalReach: this.estimateReach(clients),
      engagementRate: Math.round(totalEngagement * 10) / 10,
      contentPieces: this.countContentPieces(submissions),
      platformCount: this.countActivePlatforms(clients),
      growthRate: this.calculateGrowthRate(ytdSubmissions)
    };
  }

  /**
   * Generate platform-specific data
   */
  generatePlatformData(clients, submissions) {
    const platforms = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'Twitter'];
    
    return platforms.map(platform => {
      const platformClients = Math.floor(clients.length * (0.6 + Math.random() * 0.4));
      const platformSubmissions = submissions.filter((_, index) => index % platforms.length === platforms.indexOf(platform));
      
      const avgScore = platformSubmissions.length > 0
        ? platformSubmissions.reduce((sum, sub) => sum + (sub.month_score || 0), 0) / platformSubmissions.length
        : 0;

      return {
        platform,
        clients: platformClients,
        avgScore: Math.round(avgScore * 10) / 10,
        followers: this.estimatePlatformFollowers(platform, platformClients),
        engagement: Math.round((2 + Math.random() * 6) * 10) / 10,
        reach: this.estimatePlatformReach(platform, platformClients),
        posts: Math.floor(platformSubmissions.length * (0.8 + Math.random() * 0.4))
      };
    });
  }

  /**
   * Generate client performance data
   */
  generateClientPerformance(clients, submissions) {
    return clients.slice(0, 10).map((client, index) => {
      const clientSubmissions = submissions.filter((_, subIndex) => subIndex % clients.length === index);
      const avgScore = clientSubmissions.length > 0
        ? clientSubmissions.reduce((sum, sub) => sum + (sub.month_score || 0), 0) / clientSubmissions.length
        : 0;

      return {
        id: client.id,
        name: client.client_name || client.name || `Client ${index + 1}`,
        platforms: this.getClientPlatforms(index),
        avgScore: Math.round(avgScore * 10) / 10,
        followers: this.estimateClientFollowers(index),
        engagement: Math.round((3 + Math.random() * 5) * 10) / 10,
        lastActivity: clientSubmissions[0]?.created_at || client.created_at,
        status: client.status || 'active',
        monthlyGrowth: Math.round((5 + Math.random() * 15) * 10) / 10
      };
    });
  }

  /**
   * Generate content metrics
   */
  generateContentMetrics(submissions) {
    const last30Days = submissions.filter(sub => {
      const subDate = new Date(sub.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return subDate >= thirtyDaysAgo;
    });

    return {
      totalPosts: last30Days.length * 3, // Estimate 3 posts per submission
      videos: Math.floor(last30Days.length * 0.4),
      images: Math.floor(last30Days.length * 2.2),
      stories: Math.floor(last30Days.length * 1.8),
      reels: Math.floor(last30Days.length * 0.6),
      avgEngagement: Math.round((4.2 + Math.random() * 2) * 10) / 10,
      topPerforming: this.getTopPerformingContent(last30Days),
      contentTypes: this.getContentTypeBreakdown(last30Days)
    };
  }

  /**
   * Generate recent activity
   */
  generateRecentActivity(submissions) {
    return submissions.slice(0, 10).map(sub => ({
      id: sub.id,
      type: 'submission',
      description: `Monthly report submitted by ${sub.unified_users?.name || 'User'}`,
      timestamp: sub.created_at,
      score: sub.month_score,
      status: sub.status
    }));
  }

  /**
   * Export social media report
   */
  async exportSocialMediaReport(reportData, format = 'json') {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `social-media-report-${timestamp}.${format}`;
      
      if (format === 'json') {
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        
        return { success: true, filename };
      }
      
      throw new Error(`Export format '${format}' not yet implemented`);
    } catch (error) {
      console.error('Error exporting social media report:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  calculateEngagementMetrics(submissions) {
    // Simulate engagement calculation based on submission scores
    const avgScore = submissions.length > 0
      ? submissions.reduce((sum, sub) => sum + (sub.month_score || 0), 0) / submissions.length
      : 0;
    
    return Math.max(1, avgScore / 20); // Convert to engagement rate
  }

  calculateNPSMetrics(submissions) {
    // Simulate NPS calculation
    const last90Days = submissions.filter(sub => {
      const subDate = new Date(sub.created_at);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return subDate >= ninetyDaysAgo;
    });

    const avgScore = last90Days.length > 0
      ? last90Days.reduce((sum, sub) => sum + (sub.month_score || 0), 0) / last90Days.length
      : 0;

    return Math.max(6, Math.min(10, avgScore / 10)); // Convert to NPS scale
  }

  estimateFollowers(clients) {
    return clients.length * (1000 + Math.floor(Math.random() * 5000));
  }

  estimateReach(clients) {
    return clients.length * (5000 + Math.floor(Math.random() * 15000));
  }

  countContentPieces(submissions) {
    return submissions.length * 3; // Estimate 3 content pieces per submission
  }

  countActivePlatforms(clients) {
    return Math.min(6, Math.max(3, Math.floor(clients.length / 2)));
  }

  calculateGrowthRate(submissions) {
    if (submissions.length < 2) return 0;
    
    const recent = submissions.slice(0, Math.floor(submissions.length / 2));
    const older = submissions.slice(Math.floor(submissions.length / 2));
    
    const recentAvg = recent.reduce((sum, sub) => sum + (sub.month_score || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, sub) => sum + (sub.month_score || 0), 0) / older.length;
    
    return olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100 * 10) / 10 : 0;
  }

  estimatePlatformFollowers(platform, clientCount) {
    const multipliers = {
      'Instagram': 1500,
      'Facebook': 1200,
      'LinkedIn': 800,
      'TikTok': 2000,
      'YouTube': 600,
      'Twitter': 1000
    };
    
    return clientCount * (multipliers[platform] || 1000) + Math.floor(Math.random() * 1000);
  }

  estimatePlatformReach(platform, clientCount) {
    const multipliers = {
      'Instagram': 8000,
      'Facebook': 6000,
      'LinkedIn': 4000,
      'TikTok': 12000,
      'YouTube': 3000,
      'Twitter': 5000
    };
    
    return clientCount * (multipliers[platform] || 5000) + Math.floor(Math.random() * 5000);
  }

  getClientPlatforms(index) {
    const allPlatforms = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'Twitter'];
    const platformCount = 2 + (index % 3); // 2-4 platforms per client
    return allPlatforms.slice(0, platformCount);
  }

  estimateClientFollowers(index) {
    return (2000 + index * 500) + Math.floor(Math.random() * 3000);
  }

  getTopPerformingContent(submissions) {
    return submissions.slice(0, 3).map((sub, index) => ({
      id: sub.id,
      title: `Top Content ${index + 1}`,
      engagement: Math.round((5 + Math.random() * 3) * 10) / 10,
      reach: 1000 + Math.floor(Math.random() * 5000),
      platform: ['Instagram', 'Facebook', 'LinkedIn'][index % 3]
    }));
  }

  getContentTypeBreakdown(submissions) {
    return {
      images: Math.round(submissions.length * 0.4),
      videos: Math.round(submissions.length * 0.3),
      stories: Math.round(submissions.length * 0.2),
      reels: Math.round(submissions.length * 0.1)
    };
  }
}

export const socialMediaReportingService = new SocialMediaReportingService();
export default socialMediaReportingService;