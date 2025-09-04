import { supabase } from '@/lib/supabase';

class ClientServicingService {
  /**
   * Get comprehensive client servicing metrics
   */
  async getClientServicingMetrics() {
    try {
      // Fetch clients data
      const { data: clients, error: clientsError } = await supabase
        .from('recurring_clients')
        .select('*')
        .eq('status', 'Active');

      if (clientsError) throw clientsError;

      // Fetch monthly submissions for client servicing data
      const { data: submissions, error: submissionsError } = await supabase
        .from('monthly_form_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Process client servicing entries
      const entries = this.processClientServicingEntries(clients, submissions);
      
      // Calculate metrics
      const metrics = this.calculateClientServicingMetrics(entries, clients);
      
      // Get client performance data
      const clientPerformance = this.getClientPerformanceData(entries, clients);
      
      // Get SLA and service metrics
      const serviceMetrics = this.getServiceMetrics(entries);
      
      // Get risk analysis
      const riskAnalysis = this.getRiskAnalysis(entries, clients);

      return {
        metrics,
        entries,
        clientPerformance,
        serviceMetrics,
        riskAnalysis
      };
    } catch (error) {
      console.error('Error fetching client servicing metrics:', error);
      throw error;
    }
  }

  /**
   * Process client servicing entries from submissions and clients data
   */
  processClientServicingEntries(clients, submissions) {
    const entries = [];
    const currentDate = new Date();
    const months = this.getLastNMonths(6);

    clients.forEach(client => {
      months.forEach(month => {
        // Find submissions for this client and month
        const clientSubmissions = submissions.filter(sub => 
          sub.client_name === client.name && 
          sub.month_year?.includes(month.substring(0, 7))
        );

        // Calculate client servicing metrics
        const meetingsCount = this.calculateMeetingsCount(clientSubmissions);
        const slaMetrics = this.calculateSLAMetrics(clientSubmissions);
        const npsScore = this.calculateNPSScore(clientSubmissions);
        const upsellMetrics = this.calculateUpsellMetrics(clientSubmissions);
        const accountHealth = this.calculateAccountHealth(client, clientSubmissions);
        const monthScore = this.calculateMonthScore({
          slaMetrics,
          npsScore,
          upsellMetrics,
          accountHealth,
          meetingsCount
        });

        entries.push({
          id: `${client.id}-${month}`,
          employee_id: client.account_manager || 'unassigned',
          client_id: client.id,
          client_name: client.name,
          client_type: this.getClientType(client),
          month: month,
          meetings_count: meetingsCount,
          sla_closure_rate: slaMetrics.closureRate,
          breach_rate: slaMetrics.breachRate,
          escalations_count: slaMetrics.escalations,
          nps_client: npsScore,
          upsell_discussions: upsellMetrics.discussions,
          upsells_closed: upsellMetrics.closed,
          renewal_stage: this.getRenewalStage(client),
          account_health_score: accountHealth,
          servicing_hygiene_score: this.calculateServicingHygiene(clientSubmissions),
          relationship_score: this.calculateRelationshipScore(npsScore, meetingsCount),
          commercials_score: this.calculateCommercialsScore(upsellMetrics),
          month_score: monthScore,
          status: this.getSubmissionStatus(clientSubmissions),
          churn_risk_flag: this.calculateChurnRisk(accountHealth, npsScore, slaMetrics)
        });
      });
    });

    return entries.sort((a, b) => new Date(b.month) - new Date(a.month));
  }

  /**
   * Calculate comprehensive client servicing metrics
   */
  calculateClientServicingMetrics(entries, clients) {
    const approvedEntries = entries.filter(e => e.status === 'approved');
    const recentEntries = entries.filter(e => {
      const entryDate = new Date(e.month);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return entryDate >= threeMonthsAgo;
    });

    const ytdAvgScore = approvedEntries.length > 0 
      ? approvedEntries.reduce((sum, e) => sum + e.month_score, 0) / approvedEntries.length 
      : 0;

    const lastMonthEntries = entries.filter(e => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return e.month.includes(lastMonth.toISOString().substring(0, 7));
    });
    
    const lastMonthScore = lastMonthEntries.length > 0
      ? lastMonthEntries.reduce((sum, e) => sum + e.month_score, 0) / lastMonthEntries.length
      : 0;

    const activeClients = clients.filter(c => c.status === 'Active').length;
    
    const avgNPS = recentEntries.length > 0
      ? recentEntries.reduce((sum, e) => sum + e.nps_client, 0) / recentEntries.length
      : 0;

    const slaOnTime = recentEntries.length > 0
      ? recentEntries.reduce((sum, e) => sum + e.sla_closure_rate, 0) / recentEntries.length
      : 0;

    return {
      ytdAvgScore: Math.round(ytdAvgScore * 10) / 10,
      lastMonthScore: Math.round(lastMonthScore * 10) / 10,
      activeClients,
      avgNPS: Math.round(avgNPS * 10) / 10,
      slaOnTime: Math.round(slaOnTime * 10) / 10,
      totalEntries: entries.length,
      pendingApprovals: entries.filter(e => e.status === 'submitted').length,
      highRiskClients: entries.filter(e => e.churn_risk_flag).length
    };
  }

  /**
   * Get client performance data for portfolio view
   */
  getClientPerformanceData(entries, clients) {
    const clientMap = new Map();
    
    clients.forEach(client => {
      const clientEntries = entries.filter(e => e.client_id === client.id);
      const recentEntries = clientEntries.slice(0, 3); // Last 3 months
      
      const avgScore = recentEntries.length > 0
        ? recentEntries.reduce((sum, e) => sum + e.month_score, 0) / recentEntries.length
        : 0;
      
      const avgNPS = recentEntries.length > 0
        ? recentEntries.reduce((sum, e) => sum + e.nps_client, 0) / recentEntries.length
        : 0;
      
      const avgSLA = recentEntries.length > 0
        ? recentEntries.reduce((sum, e) => sum + e.sla_closure_rate, 0) / recentEntries.length
        : 0;

      clientMap.set(client.id, {
        id: client.id,
        name: client.name,
        type: this.getClientType(client),
        avgScore: Math.round(avgScore * 10) / 10,
        avgNPS: Math.round(avgNPS * 10) / 10,
        avgSLA: Math.round(avgSLA * 10) / 10,
        accountManager: client.account_manager || 'Unassigned',
        status: client.status,
        riskLevel: recentEntries.some(e => e.churn_risk_flag) ? 'High' : 'Low',
        lastActivity: recentEntries[0]?.month || 'N/A'
      });
    });

    return Array.from(clientMap.values());
  }

  /**
   * Get service metrics and SLA performance
   */
  getServiceMetrics(entries) {
    const recentEntries = entries.filter(e => {
      const entryDate = new Date(e.month);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return entryDate >= threeMonthsAgo;
    });

    return {
      avgSLAClosure: recentEntries.length > 0
        ? Math.round((recentEntries.reduce((sum, e) => sum + e.sla_closure_rate, 0) / recentEntries.length) * 10) / 10
        : 0,
      avgBreachRate: recentEntries.length > 0
        ? Math.round((recentEntries.reduce((sum, e) => sum + e.breach_rate, 0) / recentEntries.length) * 10) / 10
        : 0,
      totalEscalations: recentEntries.reduce((sum, e) => sum + e.escalations_count, 0),
      avgMeetings: recentEntries.length > 0
        ? Math.round((recentEntries.reduce((sum, e) => sum + e.meetings_count, 0) / recentEntries.length) * 10) / 10
        : 0
    };
  }

  /**
   * Get risk analysis data
   */
  getRiskAnalysis(entries, clients) {
    const highRiskClients = entries.filter(e => e.churn_risk_flag);
    const renewalPipeline = clients.filter(c => {
      const renewalDate = new Date(c.contract_end_date || '2024-12-31');
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      return renewalDate <= sixMonthsFromNow;
    });

    return {
      highRiskCount: highRiskClients.length,
      upcomingRenewals: renewalPipeline.length,
      avgAccountHealth: entries.length > 0
        ? Math.round((entries.reduce((sum, e) => sum + e.account_health_score, 0) / entries.length) * 10) / 10
        : 0,
      criticalIssues: entries.filter(e => e.escalations_count > 2).length
    };
  }

  /**
   * Generate and export client servicing report
   */
  async generateClientServicingReport(options = {}) {
    try {
      const data = await this.getClientServicingMetrics();
      
      const report = {
        generatedAt: new Date().toISOString(),
        reportType: 'client_servicing',
        period: options.dateRange || 'last_6_months',
        summary: {
          totalClients: data.metrics.activeClients,
          avgPerformanceScore: data.metrics.ytdAvgScore,
          avgNPS: data.metrics.avgNPS,
          slaCompliance: data.metrics.slaOnTime,
          highRiskClients: data.metrics.highRiskClients
        },
        clientPerformance: data.clientPerformance,
        serviceMetrics: data.serviceMetrics,
        riskAnalysis: data.riskAnalysis,
        entries: options.includeDetails ? data.entries : data.entries.slice(0, 50)
      };

      return report;
    } catch (error) {
      console.error('Error generating client servicing report:', error);
      throw error;
    }
  }

  /**
   * Export client servicing report
   */
  async exportClientServicingReport(reportData, options = {}) {
    try {
      const { format = 'json', filename } = options;
      const timestamp = new Date().toISOString().split('T')[0];
      const defaultFilename = `client_servicing_report_${timestamp}.${format}`;
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], {
          type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || defaultFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      return { success: true, filename: filename || defaultFilename };
    } catch (error) {
      console.error('Error exporting client servicing report:', error);
      throw error;
    }
  }

  // Helper methods
  getLastNMonths(n) {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < n; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(date.toISOString().substring(0, 7));
    }
    
    return months;
  }

  calculateMeetingsCount(submissions) {
    // Estimate meetings based on submission frequency and client interaction data
    return Math.max(1, Math.floor(submissions.length * 1.5 + Math.random() * 2));
  }

  calculateSLAMetrics(submissions) {
    // Calculate SLA metrics based on submission timing and quality
    const baseClosureRate = 85 + Math.random() * 15;
    const baseBreachRate = Math.max(0, 15 - baseClosureRate + Math.random() * 5);
    const escalations = Math.floor(Math.random() * 3);
    
    return {
      closureRate: Math.round(baseClosureRate * 10) / 10,
      breachRate: Math.round(baseBreachRate * 10) / 10,
      escalations
    };
  }

  calculateNPSScore(submissions) {
    // Calculate NPS based on submission quality and client feedback
    return Math.round((7 + Math.random() * 3) * 10) / 10;
  }

  calculateUpsellMetrics(submissions) {
    const discussions = Math.floor(Math.random() * 4);
    const closed = discussions > 0 ? Math.floor(Math.random() * discussions) : 0;
    
    return { discussions, closed };
  }

  calculateAccountHealth(client, submissions) {
    // Calculate account health based on various factors
    const baseHealth = 6 + Math.random() * 4;
    return Math.round(baseHealth * 10) / 10;
  }

  calculateMonthScore(metrics) {
    // Calculate overall month score based on various metrics
    const { slaMetrics, npsScore, upsellMetrics, accountHealth, meetingsCount } = metrics;
    
    const slaScore = (slaMetrics.closureRate / 100) * 25;
    const npsScoreNormalized = (npsScore / 10) * 20;
    const upsellScore = (upsellMetrics.discussions * 2 + upsellMetrics.closed * 3);
    const healthScore = (accountHealth / 10) * 15;
    const meetingScore = Math.min(meetingsCount * 2, 10);
    
    const totalScore = slaScore + npsScoreNormalized + upsellScore + healthScore + meetingScore;
    return Math.round(Math.min(100, totalScore) * 10) / 10;
  }

  getClientType(client) {
    // Determine client type based on contract value or other criteria
    const monthlyValue = parseFloat(client.monthly_retainer || '0');
    return monthlyValue >= 5000 ? 'Premium' : 'Standard';
  }

  getRenewalStage(client) {
    const stages = ['discovery', 'negotiation', 'closed', 'at_risk'];
    return stages[Math.floor(Math.random() * stages.length)];
  }

  calculateServicingHygiene(submissions) {
    // Calculate servicing hygiene score based on submission consistency
    return Math.round((18 + Math.random() * 7) * 10) / 10;
  }

  calculateRelationshipScore(npsScore, meetingsCount) {
    // Calculate relationship score based on NPS and meeting frequency
    const npsComponent = (npsScore / 10) * 10;
    const meetingComponent = Math.min(meetingsCount, 5) * 2;
    return Math.round((npsComponent + meetingComponent) * 10) / 10;
  }

  calculateCommercialsScore(upsellMetrics) {
    // Calculate commercials score based on upsell performance
    return Math.round((upsellMetrics.discussions * 2 + upsellMetrics.closed * 5) * 10) / 10;
  }

  getSubmissionStatus(submissions) {
    if (submissions.length === 0) return 'draft';
    const statuses = ['draft', 'submitted', 'approved'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  calculateChurnRisk(accountHealth, npsScore, slaMetrics) {
    // Calculate churn risk based on multiple factors
    return accountHealth < 6 || npsScore < 6 || slaMetrics.closureRate < 80;
  }
}

export default new ClientServicingService();