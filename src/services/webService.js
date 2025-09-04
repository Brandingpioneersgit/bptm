import { supabase } from '../shared/lib/supabase';

class WebService {
  // Fetch web development data from Supabase
  async getWebDevelopmentMetrics() {
    try {
      // Fetch projects data
      const { data: projects, error: projectsError } = await supabase
        .from('web_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        throw projectsError;
      }

      // Fetch monthly entries data
      const { data: monthlyEntries, error: entriesError } = await supabase
        .from('monthly_form_submissions')
        .select('*')
        .eq('department', 'Web Development')
        .order('submission_date', { ascending: false });

      if (entriesError) {
        console.error('Error fetching monthly entries:', entriesError);
        throw entriesError;
      }

      // Process and calculate metrics
      const processedData = this.processWebData(projects || [], monthlyEntries || []);
      
      return {
        success: true,
        data: processedData
      };
    } catch (error) {
      console.error('Error in getWebDevelopmentMetrics:', error);
      return {
        success: false,
        error: error.message,
        data: this.getMockData()
      };
    }
  }

  // Process raw data into web development metrics
  processWebData(projects, monthlyEntries) {
    // Calculate key metrics
    const metrics = this.calculateWebMetrics(projects, monthlyEntries);
    
    // Process projects data
    const processedProjects = projects.map(project => ({
      ...project,
      status: this.getProjectStatus(project),
      progress: this.calculateProjectProgress(project),
      techStack: this.parseTechStack(project.tech_stack),
      clientSatisfaction: this.calculateClientSatisfaction(project),
      timeline: this.calculateTimeline(project)
    }));

    // Process monthly entries
    const processedEntries = monthlyEntries.map(entry => ({
      ...entry,
      month_score: this.calculateMonthScore(entry),
      project_count: this.getProjectCount(entry),
      client_feedback: this.getClientFeedback(entry),
      technical_skills: this.getTechnicalSkills(entry),
      delivery_performance: this.getDeliveryPerformance(entry)
    }));

    return {
      metrics,
      projects: processedProjects,
      monthlyEntries: processedEntries,
      projectPerformance: this.generateProjectPerformance(processedProjects),
      technicalMetrics: this.generateTechnicalMetrics(processedEntries),
      clientMetrics: this.generateClientMetrics(processedProjects)
    };
  }

  // Calculate key web development metrics
  calculateWebMetrics(projects, monthlyEntries) {
    const activeProjects = projects.filter(p => 
      ['active', 'in_progress', 'development'].includes(p.status?.toLowerCase())
    ).length;

    const completedProjects = projects.filter(p => 
      p.status?.toLowerCase() === 'completed'
    ).length;

    // Calculate YTD average score from monthly entries
    const currentYear = new Date().getFullYear();
    const ytdEntries = monthlyEntries.filter(entry => {
      const entryYear = new Date(entry.submission_date).getFullYear();
      return entryYear === currentYear;
    });

    const ytdAvgScore = ytdEntries.length > 0
      ? ytdEntries.reduce((sum, entry) => sum + this.calculateMonthScore(entry), 0) / ytdEntries.length
      : 82.5;

    // Get last month's score
    const lastMonthEntry = monthlyEntries[0];
    const lastMonthScore = lastMonthEntry ? this.calculateMonthScore(lastMonthEntry) : 85.2;

    // Calculate average NPS from project feedback
    const projectsWithNPS = projects.filter(p => p.client_nps && p.client_nps > 0);
    const avgNPS = projectsWithNPS.length > 0
      ? projectsWithNPS.reduce((sum, p) => sum + p.client_nps, 0) / projectsWithNPS.length
      : 8.7;

    return {
      ytdAvgScore: Math.round(ytdAvgScore * 10) / 10,
      lastMonthScore: Math.round(lastMonthScore * 10) / 10,
      activeProjects,
      avgNPS: Math.round(avgNPS * 10) / 10,
      completedProjects,
      totalProjects: projects.length
    };
  }

  // Helper methods for data processing
  calculateMonthScore(entry) {
    if (!entry) return 0;
    
    // Calculate score based on various factors
    const factors = {
      projectDelivery: entry.project_delivery_score || 0,
      codeQuality: entry.code_quality_score || 0,
      clientSatisfaction: entry.client_satisfaction_score || 0,
      technicalSkills: entry.technical_skills_score || 0,
      teamwork: entry.teamwork_score || 0
    };

    const totalScore = Object.values(factors).reduce((sum, score) => sum + score, 0);
    return totalScore / Object.keys(factors).length;
  }

  getProjectStatus(project) {
    if (!project.status) return 'unknown';
    return project.status.toLowerCase();
  }

  calculateProjectProgress(project) {
    if (project.progress_percentage) return project.progress_percentage;
    
    // Calculate based on milestones or timeline
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    const currentDate = new Date();
    
    if (currentDate < startDate) return 0;
    if (currentDate > endDate) return 100;
    
    const totalDuration = endDate - startDate;
    const elapsed = currentDate - startDate;
    return Math.round((elapsed / totalDuration) * 100);
  }

  parseTechStack(techStackString) {
    if (!techStackString) return [];
    return techStackString.split(',').map(tech => tech.trim());
  }

  calculateClientSatisfaction(project) {
    return project.client_satisfaction_score || project.client_nps || 8.0;
  }

  calculateTimeline(project) {
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    const currentDate = new Date();
    
    return {
      startDate: project.start_date,
      endDate: project.end_date,
      isOverdue: currentDate > endDate && project.status !== 'completed',
      daysRemaining: Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24))
    };
  }

  getProjectCount(entry) {
    return entry.active_projects_count || 0;
  }

  getClientFeedback(entry) {
    return entry.client_feedback || 'No feedback available';
  }

  getTechnicalSkills(entry) {
    return {
      frontend: entry.frontend_skills_score || 0,
      backend: entry.backend_skills_score || 0,
      database: entry.database_skills_score || 0,
      devops: entry.devops_skills_score || 0
    };
  }

  getDeliveryPerformance(entry) {
    return {
      onTimeDelivery: entry.on_time_delivery_rate || 0,
      qualityScore: entry.code_quality_score || 0,
      bugCount: entry.bug_count || 0,
      clientSatisfaction: entry.client_satisfaction_score || 0
    };
  }

  generateProjectPerformance(projects) {
    return projects.map(project => ({
      id: project.id,
      name: project.project_name || project.name,
      client: project.client_name,
      status: project.status,
      progress: project.progress,
      techStack: project.techStack,
      timeline: project.timeline,
      satisfaction: project.clientSatisfaction,
      budget: project.budget,
      team: project.team_members || []
    }));
  }

  generateTechnicalMetrics(entries) {
    if (entries.length === 0) return {};
    
    const avgSkills = entries.reduce((acc, entry) => {
      const skills = this.getTechnicalSkills(entry);
      Object.keys(skills).forEach(skill => {
        acc[skill] = (acc[skill] || 0) + skills[skill];
      });
      return acc;
    }, {});

    Object.keys(avgSkills).forEach(skill => {
      avgSkills[skill] = avgSkills[skill] / entries.length;
    });

    return avgSkills;
  }

  generateClientMetrics(projects) {
    const clientData = {};
    
    projects.forEach(project => {
      const client = project.client_name;
      if (!client) return;
      
      if (!clientData[client]) {
        clientData[client] = {
          projectCount: 0,
          avgSatisfaction: 0,
          totalBudget: 0,
          completedProjects: 0
        };
      }
      
      clientData[client].projectCount++;
      clientData[client].avgSatisfaction += project.clientSatisfaction;
      clientData[client].totalBudget += project.budget || 0;
      
      if (project.status === 'completed') {
        clientData[client].completedProjects++;
      }
    });

    // Calculate averages
    Object.keys(clientData).forEach(client => {
      clientData[client].avgSatisfaction = 
        clientData[client].avgSatisfaction / clientData[client].projectCount;
    });

    return clientData;
  }

  // Generate and export web development reports
  async generateWebReport(filters = {}) {
    try {
      const data = await this.getWebDevelopmentMetrics();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      const report = {
        generatedAt: new Date().toISOString(),
        filters,
        summary: {
          totalProjects: data.data.projects.length,
          activeProjects: data.data.metrics.activeProjects,
          completedProjects: data.data.metrics.completedProjects,
          avgScore: data.data.metrics.ytdAvgScore,
          avgNPS: data.data.metrics.avgNPS
        },
        projects: data.data.projectPerformance,
        technicalMetrics: data.data.technicalMetrics,
        clientMetrics: data.data.clientMetrics,
        monthlyPerformance: data.data.monthlyEntries
      };

      return {
        success: true,
        report
      };
    } catch (error) {
      console.error('Error generating web report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Export report as JSON
  exportWebReport(report, filename = 'web-development-report') {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Get mock data for fallback
  getMockData() {
    return {
      metrics: {
        ytdAvgScore: 82.5,
        lastMonthScore: 85.2,
        activeProjects: 8,
        avgNPS: 8.7,
        completedProjects: 12,
        totalProjects: 20
      },
      projects: [
        {
          id: 1,
          name: 'E-commerce Platform',
          client: 'TechCorp Inc.',
          status: 'active',
          progress: 75,
          techStack: ['React', 'Node.js', 'MongoDB'],
          timeline: {
            startDate: '2024-01-15',
            endDate: '2024-03-15',
            isOverdue: false,
            daysRemaining: 30
          },
          satisfaction: 9.2,
          budget: 50000
        },
        {
          id: 2,
          name: 'Corporate Website',
          client: 'Business Solutions Ltd.',
          status: 'completed',
          progress: 100,
          techStack: ['Vue.js', 'Express', 'PostgreSQL'],
          timeline: {
            startDate: '2023-11-01',
            endDate: '2024-01-01',
            isOverdue: false,
            daysRemaining: 0
          },
          satisfaction: 8.8,
          budget: 25000
        }
      ],
      monthlyEntries: [
        {
          id: 1,
          submission_date: '2024-01-31',
          month_score: 85.2,
          project_count: 3,
          client_feedback: 'Excellent work on the e-commerce platform',
          technical_skills: {
            frontend: 9.0,
            backend: 8.5,
            database: 8.0,
            devops: 7.5
          },
          delivery_performance: {
            onTimeDelivery: 95,
            qualityScore: 9.0,
            bugCount: 2,
            clientSatisfaction: 9.2
          }
        }
      ],
      projectPerformance: [],
      technicalMetrics: {
        frontend: 9.0,
        backend: 8.5,
        database: 8.0,
        devops: 7.5
      },
      clientMetrics: {
        'TechCorp Inc.': {
          projectCount: 2,
          avgSatisfaction: 9.0,
          totalBudget: 75000,
          completedProjects: 1
        }
      }
    };
  }
}

const webService = new WebService();
export default webService;