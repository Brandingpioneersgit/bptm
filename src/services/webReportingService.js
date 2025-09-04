import { supabase } from '../shared/lib/supabase';

class WebReportingService {
  // Fetch web development data from Supabase
  async getWebDevelopmentData() {
    try {
      // Fetch web projects
      const { data: projects, error: projectsError } = await supabase
        .from('web_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching web projects:', projectsError);
      }

      // Fetch monthly form submissions for web team
      const { data: submissions, error: submissionsError } = await supabase
        .from('monthly_form_submissions')
        .select('*')
        .eq('department', 'Web Development')
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching web submissions:', submissionsError);
      }

      // Fetch recurring clients for web projects
      const { data: clients, error: clientsError } = await supabase
        .from('recurring_clients')
        .select('*')
        .eq('service_type', 'Web Development')
        .eq('status', 'active');

      if (clientsError) {
        console.error('Error fetching web clients:', clientsError);
      }

      return {
        projects: projects || [],
        submissions: submissions || [],
        clients: clients || []
      };
    } catch (error) {
      console.error('Error in getWebDevelopmentData:', error);
      throw error;
    }
  }

  // Calculate web development metrics
  async getWebDevelopmentMetrics() {
    try {
      const data = await this.getWebDevelopmentData();
      const { projects, submissions, clients } = data;

      // Calculate basic metrics
      const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const totalProjects = projects.length;

      // Calculate YTD average score from submissions
      const currentYear = new Date().getFullYear();
      const ytdSubmissions = submissions.filter(s => {
        const submissionYear = new Date(s.created_at).getFullYear();
        return submissionYear === currentYear;
      });

      const ytdAvgScore = ytdSubmissions.length > 0
        ? ytdSubmissions.reduce((sum, s) => sum + (this.calculateMonthScore(s) || 0), 0) / ytdSubmissions.length
        : 0;

      // Calculate last month score
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthSubmissions = submissions.filter(s => {
        const submissionDate = new Date(s.created_at);
        return submissionDate.getMonth() === lastMonth.getMonth() && 
               submissionDate.getFullYear() === lastMonth.getFullYear();
      });

      const lastMonthScore = lastMonthSubmissions.length > 0
        ? lastMonthSubmissions.reduce((sum, s) => sum + (this.calculateMonthScore(s) || 0), 0) / lastMonthSubmissions.length
        : 0;

      // Calculate average NPS from submissions
      const npsSubmissions = submissions.filter(s => s.nps_client && s.nps_client > 0);
      const avgNPS = npsSubmissions.length > 0
        ? npsSubmissions.reduce((sum, s) => sum + s.nps_client, 0) / npsSubmissions.length
        : 0;

      // Calculate additional metrics
      const projectCompletionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
      const averageProjectDuration = this.calculateAverageProjectDuration(projects);
      const clientSatisfactionRate = this.calculateClientSatisfactionRate(submissions);
      const onTimeDeliveryRate = this.calculateOnTimeDeliveryRate(projects);

      return {
        metrics: {
          ytdAvgScore: Math.round(ytdAvgScore * 10) / 10,
          lastMonthScore: Math.round(lastMonthScore * 10) / 10,
          activeProjects,
          avgNPS: Math.round(avgNPS * 10) / 10,
          completedProjects,
          totalProjects,
          projectCompletionRate: Math.round(projectCompletionRate * 10) / 10,
          averageProjectDuration,
          clientSatisfactionRate: Math.round(clientSatisfactionRate * 10) / 10,
          onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10
        },
        projects: this.processProjectData(projects),
        monthlyEntries: this.processMonthlyEntries(submissions),
        clientPerformance: this.generateClientPerformance(clients, projects),
        technologyMetrics: this.generateTechnologyMetrics(projects),
        teamPerformance: this.generateTeamPerformance(submissions)
      };
    } catch (error) {
      console.error('Error calculating web development metrics:', error);
      throw error;
    }
  }

  // Process project data for dashboard display
  processProjectData(projects) {
    return projects.map(project => ({
      id: project.id,
      title: project.project_name || project.title || 'Untitled Project',
      client: project.client_name || 'Unknown Client',
      clientType: this.determineClientType(project),
      platform: project.platform || project.technology_stack || 'Custom',
      totalPages: project.total_pages || project.scope_pages || 10,
      pagesApproved: project.pages_approved || project.completed_pages || 0,
      status: project.status || 'active',
      stage: project.current_stage || project.phase || 'Development',
      startDate: project.start_date || project.created_at,
      estimatedCompletion: project.estimated_completion || project.deadline,
      delayFlag: this.isProjectDelayed(project),
      progressPercentage: this.calculateProjectProgress(project),
      budget: project.budget || 0,
      hoursSpent: project.hours_spent || 0,
      estimatedHours: project.estimated_hours || 0
    }));
  }

  // Process monthly entries from submissions
  processMonthlyEntries(submissions) {
    return submissions.map(submission => ({
      id: submission.id,
      employee_id: submission.employee_id,
      month: this.formatMonth(submission.created_at),
      projectsWorked: submission.projects_worked || 1,
      pagesCompleted: submission.pages_completed || 0,
      clientMeetings: submission.client_meetings || 0,
      monthScore: this.calculateMonthScore(submission),
      nps: submission.nps_client || 0,
      status: submission.status || 'submitted',
      technologiesUsed: submission.technologies_used || [],
      achievements: submission.achievements || [],
      challenges: submission.challenges || []
    }));
  }

  // Generate client performance data
  generateClientPerformance(clients, projects) {
    return clients.map(client => {
      const clientProjects = projects.filter(p => 
        p.client_name === client.client_name || p.client_id === client.id
      );
      
      const completedProjects = clientProjects.filter(p => p.status === 'completed').length;
      const activeProjects = clientProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
      const totalValue = clientProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
      
      return {
        clientName: client.client_name,
        clientType: client.client_type || 'Standard',
        totalProjects: clientProjects.length,
        completedProjects,
        activeProjects,
        totalValue,
        averageProjectDuration: this.calculateAverageProjectDuration(clientProjects),
        satisfactionScore: client.satisfaction_score || 0,
        retentionStatus: client.status === 'active' ? 'Retained' : 'Churned'
      };
    });
  }

  // Generate technology metrics
  generateTechnologyMetrics(projects) {
    const techUsage = {};
    
    projects.forEach(project => {
      const tech = project.platform || project.technology_stack || 'Custom';
      if (!techUsage[tech]) {
        techUsage[tech] = {
          name: tech,
          projectCount: 0,
          completedProjects: 0,
          averageScore: 0,
          totalBudget: 0
        };
      }
      
      techUsage[tech].projectCount++;
      if (project.status === 'completed') {
        techUsage[tech].completedProjects++;
      }
      techUsage[tech].totalBudget += project.budget || 0;
    });
    
    return Object.values(techUsage).map(tech => ({
      ...tech,
      completionRate: tech.projectCount > 0 ? (tech.completedProjects / tech.projectCount) * 100 : 0,
      averageBudget: tech.projectCount > 0 ? tech.totalBudget / tech.projectCount : 0
    }));
  }

  // Generate team performance data
  generateTeamPerformance(submissions) {
    const teamData = {};
    
    submissions.forEach(submission => {
      const employeeId = submission.employee_id;
      if (!teamData[employeeId]) {
        teamData[employeeId] = {
          employeeId,
          employeeName: submission.employee_name || `Employee ${employeeId}`,
          totalSubmissions: 0,
          averageScore: 0,
          totalProjects: 0,
          averageNPS: 0,
          scores: []
        };
      }
      
      teamData[employeeId].totalSubmissions++;
      const monthScore = this.calculateMonthScore(submission);
      teamData[employeeId].scores.push(monthScore);
      teamData[employeeId].totalProjects += submission.projects_worked || 1;
      
      if (submission.nps_client) {
        teamData[employeeId].averageNPS = 
          (teamData[employeeId].averageNPS + submission.nps_client) / 2;
      }
    });
    
    return Object.values(teamData).map(member => ({
      ...member,
      averageScore: member.scores.length > 0 
        ? member.scores.reduce((sum, score) => sum + score, 0) / member.scores.length 
        : 0
    }));
  }

  // Helper methods
  calculateMonthScore(submission) {
    // Calculate month score based on various factors
    let score = 0;
    
    // Base score from performance metrics
    if (submission.performance_score) {
      score += submission.performance_score * 0.4;
    }
    
    // Quality score
    if (submission.quality_score) {
      score += submission.quality_score * 0.3;
    }
    
    // Client satisfaction
    if (submission.nps_client) {
      score += (submission.nps_client / 10) * 20; // Convert 1-10 to 0-20
    }
    
    // Project completion rate
    if (submission.projects_completed && submission.projects_assigned) {
      const completionRate = submission.projects_completed / submission.projects_assigned;
      score += completionRate * 30;
    }
    
    return Math.min(score, 100); // Cap at 100
  }

  determineClientType(project) {
    const budget = project.budget || 0;
    if (budget > 50000) return 'Enterprise';
    if (budget > 20000) return 'Large';
    if (budget > 5000) return 'SMB';
    return 'Small';
  }

  isProjectDelayed(project) {
    if (!project.estimated_completion) return false;
    const deadline = new Date(project.estimated_completion);
    const now = new Date();
    return now > deadline && project.status !== 'completed';
  }

  calculateProjectProgress(project) {
    const totalPages = project.total_pages || project.scope_pages || 10;
    const completedPages = project.pages_approved || project.completed_pages || 0;
    return totalPages > 0 ? (completedPages / totalPages) * 100 : 0;
  }

  calculateAverageProjectDuration(projects) {
    const completedProjects = projects.filter(p => 
      p.status === 'completed' && p.start_date && p.completion_date
    );
    
    if (completedProjects.length === 0) return 0;
    
    const totalDuration = completedProjects.reduce((sum, project) => {
      const start = new Date(project.start_date);
      const end = new Date(project.completion_date);
      const duration = (end - start) / (1000 * 60 * 60 * 24); // days
      return sum + duration;
    }, 0);
    
    return Math.round(totalDuration / completedProjects.length);
  }

  calculateClientSatisfactionRate(submissions) {
    const satisfactionSubmissions = submissions.filter(s => s.nps_client && s.nps_client > 0);
    if (satisfactionSubmissions.length === 0) return 0;
    
    const satisfiedClients = satisfactionSubmissions.filter(s => s.nps_client >= 7).length;
    return (satisfiedClients / satisfactionSubmissions.length) * 100;
  }

  calculateOnTimeDeliveryRate(projects) {
    const completedProjects = projects.filter(p => 
      p.status === 'completed' && p.estimated_completion && p.completion_date
    );
    
    if (completedProjects.length === 0) return 0;
    
    const onTimeProjects = completedProjects.filter(p => {
      const deadline = new Date(p.estimated_completion);
      const completion = new Date(p.completion_date);
      return completion <= deadline;
    }).length;
    
    return (onTimeProjects / completedProjects.length) * 100;
  }

  formatMonth(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Generate web development report
  async generateWebDevelopmentReport(options = {}) {
    try {
      const data = await this.getWebDevelopmentMetrics();
      
      return {
        reportType: 'web_development',
        generatedAt: new Date().toISOString(),
        dateRange: options.dateRange || 'last_6_months',
        summary: {
          totalProjects: data.metrics.totalProjects,
          activeProjects: data.metrics.activeProjects,
          completedProjects: data.metrics.completedProjects,
          averageScore: data.metrics.ytdAvgScore,
          clientSatisfaction: data.metrics.avgNPS
        },
        metrics: data.metrics,
        projects: options.includeDetails ? data.projects : [],
        clientPerformance: options.includeDetails ? data.clientPerformance : [],
        technologyMetrics: options.includeDetails ? data.technologyMetrics : [],
        teamPerformance: options.includeDetails ? data.teamPerformance : []
      };
    } catch (error) {
      console.error('Error generating web development report:', error);
      throw error;
    }
  }

  // Export web development report
  async exportWebDevelopmentReport(reportData, options = {}) {
    try {
      const { format = 'json', filename } = options;
      const timestamp = new Date().toISOString().split('T')[0];
      const defaultFilename = `web_development_report_${timestamp}.${format}`;
      
      let content, mimeType;
      
      if (format === 'json') {
        content = JSON.stringify(reportData, null, 2);
        mimeType = 'application/json';
      } else if (format === 'csv') {
        content = this.convertToCSV(reportData);
        mimeType = 'text/csv';
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || defaultFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      return { success: true, filename: filename || defaultFilename };
    } catch (error) {
      console.error('Error exporting web development report:', error);
      throw error;
    }
  }

  // Convert report data to CSV format
  convertToCSV(reportData) {
    const { projects, metrics } = reportData;
    
    let csv = 'Web Development Report\n\n';
    
    // Add metrics summary
    csv += 'Metrics Summary\n';
    csv += 'Metric,Value\n';
    csv += `Total Projects,${metrics.totalProjects}\n`;
    csv += `Active Projects,${metrics.activeProjects}\n`;
    csv += `Completed Projects,${metrics.completedProjects}\n`;
    csv += `YTD Average Score,${metrics.ytdAvgScore}\n`;
    csv += `Average NPS,${metrics.avgNPS}\n`;
    csv += `Project Completion Rate,${metrics.projectCompletionRate}%\n`;
    csv += `Client Satisfaction Rate,${metrics.clientSatisfactionRate}%\n`;
    csv += `On-Time Delivery Rate,${metrics.onTimeDeliveryRate}%\n\n`;
    
    // Add projects data
    if (projects && projects.length > 0) {
      csv += 'Projects\n';
      csv += 'Title,Client,Platform,Status,Stage,Progress,Budget\n';
      projects.forEach(project => {
        csv += `"${project.title}","${project.client}","${project.platform}","${project.status}","${project.stage}",${project.progressPercentage}%,${project.budget}\n`;
      });
    }
    
    return csv;
  }
}

export default new WebReportingService();