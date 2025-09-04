import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import DashboardLayout from '../layouts/DashboardLayout';
import { useToast } from '../../shared/hooks/use-toast';
import personalizedDashboardService from '../../shared/services/personalizedDashboardService';
import webService from '../../services/webService';
import AdvancedFilters from '../shared/AdvancedFilters';
import { applyFilters, createFilterOptions, exportToCSV } from '../../utils/filterUtils';
import { exportReport, reportUtils } from '../../utils/reportGenerator';
import { 
  Globe, 
  Code, 
  Palette, 
  Zap, 
  Users, 
  Star, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  PlusCircle,
  Edit,
  Eye,
  Filter,
  Download,
  BarChart3,
  Target,
  Calendar,
  FileText,
  Settings,
  Award,
  Briefcase,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  AlertCircle,
  Loader2
} from 'lucide-react';

const WebDashboard = ({ userRole = 'employee' }) => {
  const [projects, setProjects] = useState([]);
  const [monthlyEntries, setMonthlyEntries] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    ytdAvgScore: 0,
    lastMonthScore: 0,
    activeProjects: 0,
    avgNPS: 0
  });
  const [personalizedMetrics, setPersonalizedMetrics] = useState({});
  const [user] = useState({ id: '1', name: 'Web Developer', role: userRole, department: 'Web Development' });
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const [webData, setWebData] = useState({
    projects: [],
    monthlyEntries: [],
    metrics: {}
  });
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    department: '',
    role: '',
    status: '',
    search: '',
    client: '',
    platform: '',
    stage: ''
  });
  const { toast } = useToast();

  // Create filter options from data
  const filterOptions = useMemo(() => {
    return createFilterOptions(monthlyEntries, {
      departments: ['Web Development', 'Technology'],
      roles: ['Web Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer'],
      statuses: ['draft', 'submitted', 'approved', 'rejected']
    });
  }, [monthlyEntries]);

  // Apply filters to monthly entries
  const filteredEntries = useMemo(() => {
    return applyFilters(monthlyEntries, filters, {
      client: (entry, value) => entry.client?.toLowerCase().includes(value.toLowerCase()),
      platform: (entry, value) => entry.platform?.toLowerCase().includes(value.toLowerCase()),
      stage: (entry, value) => entry.stage?.toLowerCase().includes(value.toLowerCase())
    });
  }, [monthlyEntries, filters]);

  // Load web development data using webReportingService
  const loadWebData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await webReportingService.getWebDevelopmentMetrics();
      
      setProjects(data.projects);
      setMonthlyEntries(data.monthlyEntries);
      setDashboardMetrics(data.metrics);
      setClientPerformance(data.clientPerformance);
      setTechnologyMetrics(data.technologyMetrics);
      setTeamPerformance(data.teamPerformance);
      
      setWebData({
        projects: data.projects,
        monthlyEntries: data.monthlyEntries,
        metrics: data.metrics
      });
      
    } catch (error) {
      console.error('Error loading web data:', error);
      setError('Failed to load web development data. Please try again.');
      
      // Fallback to mock data
      setProjects(mockProjects);
      setMonthlyEntries(mockEntries);
      setDashboardMetrics({
        ytdAvgScore: 82.5,
        lastMonthScore: 85.2,
        activeProjects: 8,
        avgNPS: 8.7
      });
    } finally {
      setLoading(false);
    }
  };

  const [exportFormat, setExportFormat] = useState('excel');

  // Handle export report
  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      
      // Prepare web development report data
      const reportData = {
        summary: {
          totalProjects: webData.projects?.length || 0,
          activeProjects: webData.projects?.filter(p => p.status === 'active').length || 0,
          completedProjects: webData.projects?.filter(p => p.status === 'completed').length || 0,
          avgProjectScore: dashboardMetrics.ytdAvgScore,
          avgNPS: dashboardMetrics.avgNPS
        },
        projects: webData.projects || [],
        technologies: webData.technologies || [],
        clientFeedback: webData.clientFeedback || [],
        performance: webData.performance || [],
        generatedAt: new Date().toISOString(),
        reportPeriod: 'Last 6 Months'
      };
      
      const filename = reportUtils.generateFilename('web_development_report', exportFormat);
      
      const result = await exportReport(reportData, exportFormat, 'webDevelopmentReport', filename);
      
      if (result.success) {
        toast({
          title: "Report Exported",
          description: `Web development report has been exported as ${exportFormat.toUpperCase()}.`,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
      
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export web development report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };



  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load personalized metrics first
        const metrics = await personalizedDashboardService.getPersonalizedDashboardMetrics(user, 'webDevelopment');
        setPersonalizedMetrics(metrics);
        
        // Load web development data
        await loadWebData();
        
        // Update dashboard metrics with personalized data if available
        setDashboardMetrics(prev => ({
          ...prev,
          ytdAvgScore: metrics.performanceScore || prev.ytdAvgScore,
          lastMonthScore: metrics.monthlyScore || prev.lastMonthScore,
          activeProjects: metrics.activeProjects || prev.activeProjects,
          avgNPS: metrics.customerSatisfaction || prev.avgNPS
        }));
      } catch (error) {
        console.error('Error loading data:', error);
        // Load web data even if personalized metrics fail
        await loadWebData();
      }
    };
    
    loadData();
   }, [user]);

  // Mock data - fallback when Supabase data is not available
  const mockProjects = [
    {
      id: 1,
      title: 'E-commerce Website Redesign',
      client: 'TechCorp',
      clientType: 'Large',
      platform: 'Shopify',
      totalPages: 15,
      pagesApproved: 12,
      status: 'active',
      stage: 'Development',
      startDate: '2024-01-01',
      estimatedCompletion: '2024-02-15',
      delayFlag: false
    },
    {
      id: 2,
      title: 'Corporate Portfolio Site',
      client: 'StartupXYZ',
      clientType: 'SMB',
      platform: 'WordPress',
      totalPages: 8,
      pagesApproved: 8,
      status: 'completed',
      stage: 'UAT',
      startDate: '2023-12-01',
      estimatedCompletion: '2024-01-20',
      delayFlag: false
    },
    {
      id: 3,
      title: 'Custom Web Application',
      client: 'FinanceInc',
      clientType: 'Large',
      platform: 'Custom',
      totalPages: 25,
      pagesApproved: 18,
      status: 'active',
      stage: 'QA',
      startDate: '2023-11-15',
      estimatedCompletion: '2024-01-30',
      delayFlag: true
    }
  ];

  const mockEntries = [
    {
      id: 1,
      month: '2024-01',
      projectId: 1,
      projectTitle: 'E-commerce Website Redesign',
      client: 'TechCorp',
      platform: 'Shopify',
      pagesApproved: 12,
      pagesPlanned: 15,
      homepageDesignScore: 8.5,
      serviceDesignScore: 8.0,
      pagespeedScore: 85,
      meetings: 3,
      nps: 8.5,
      mentorScore: 8.0,
      monthScore: 82.5,
      status: 'approved',
      deliveryScore: 28,
      designScore: 16.5,
      technicalScore: 12,
      relationshipScore: 13.5,
      businessScore: 8,
      hygieneScore: 4.5
    },
    {
      id: 2,
      month: '2024-01',
      projectId: 2,
      projectTitle: 'Corporate Portfolio Site',
      client: 'StartupXYZ',
      platform: 'WordPress',
      pagesApproved: 8,
      pagesPlanned: 8,
      homepageDesignScore: 9.0,
      serviceDesignScore: 8.5,
      pagespeedScore: 92,
      meetings: 2,
      nps: 9.0,
      mentorScore: 8.5,
      monthScore: 88.0,
      status: 'approved',
      deliveryScore: 35,
      designScore: 17.5,
      technicalScore: 15,
      relationshipScore: 14.5,
      businessScore: 6,
      hygieneScore: 5
    },
    {
      id: 3,
      month: '2023-12',
      projectId: 1,
      projectTitle: 'E-commerce Website Redesign',
      client: 'TechCorp',
      platform: 'Shopify',
      pagesApproved: 8,
      pagesPlanned: 15,
      homepageDesignScore: 8.0,
      serviceDesignScore: 7.5,
      pagespeedScore: 78,
      meetings: 4,
      nps: 8.0,
      mentorScore: 7.5,
      monthScore: 75.5,
      status: 'approved',
      deliveryScore: 20,
      designScore: 15.5,
      technicalScore: 9,
      relationshipScore: 13,
      businessScore: 10,
      hygieneScore: 4
    }
  ];

  // Set loading to false when data is loaded
  useEffect(() => {
    setLoading(false);
  }, [projects, monthlyEntries]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-blue-100 text-blue-800', text: 'Active' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      'on-hold': { color: 'bg-yellow-100 text-yellow-800', text: 'On Hold' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const getStageBadge = (stage) => {
    const stageConfig = {
      'Design': { color: 'bg-purple-100 text-purple-800', icon: Palette },
      'Development': { color: 'bg-blue-100 text-blue-800', icon: Code },
      'QA': { color: 'bg-orange-100 text-orange-800', icon: CheckCircle },
      'UAT': { color: 'bg-green-100 text-green-800', icon: Users }
    };
    
    const config = stageConfig[stage] || stageConfig.Design;
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {stage}
      </Badge>
    );
  };

  const getScoreBadge = (score) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 75) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 65) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const formatNumber = (num) => {
    return num.toFixed(1);
  };

  const getCompletionPercentage = (approved, planned) => {
    return planned > 0 ? Math.round((approved / planned) * 100) : 0;
  };

  // Handler functions for actions
  const handleExportPortfolio = async () => {
    try {
      const dataToExport = {
        projects: filteredProjects,
        monthlyEntries: filteredEntries,
        metrics: dashboardMetrics,
        exportDate: new Date().toISOString(),
        filters: {
          client: selectedClient,
          platform: selectedPlatform,
          stage: selectedStage
        }
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `web-portfolio-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Portfolio exported successfully');
    } catch (error) {
      console.error('Error exporting portfolio:', error);
    }
  };

  const handleAddMonthlyData = async () => {
    try {
      // This would open a modal or form to add new monthly data
      console.log('Opening add monthly data form...');
      // For now, just log the action
    } catch (error) {
      console.error('Error adding monthly data:', error);
    }
  };

  const handleViewProject = (projectId) => {
    console.log('Viewing project:', projectId);
    // Navigate to project detail view
  };

  const handleEditProject = (projectId) => {
    console.log('Editing project:', projectId);
    // Navigate to project edit form
  };

  // Get unique values for filter options
  const uniqueClients = [...new Set(projects.map(p => p.client))];
  const uniquePlatforms = [...new Set(projects.map(p => p.platform))];
  const uniqueStages = [...new Set(projects.map(p => p.stage))];

  const filteredProjects = projects.filter(project => {
    if (selectedClient !== 'all' && project.client !== selectedClient) return false;
    if (selectedPlatform !== 'all' && project.platform !== selectedPlatform) return false;
    if (selectedStage !== 'all' && project.stage !== selectedStage) return false;
    return true;
  });



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading Web dashboard...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Web Development Dashboard</h1>
            <p className="text-gray-600 mt-1">Project delivery and performance tracking</p>
          </div>
        {userRole === 'employee' && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddMonthlyData}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Monthly Data
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error loading data</span>
            </div>
            <p className="text-red-600 mt-1 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading web development data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">YTD Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(webData.metrics.ytdAvgScore || dashboardMetrics.ytdAvgScore)}</p>
                <div className="mt-1">{getScoreBadge(webData.metrics.ytdAvgScore || dashboardMetrics.ytdAvgScore)}</div>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Month Score</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(webData.metrics.lastMonthScore || dashboardMetrics.lastMonthScore)}</p>
                <div className="mt-1">{getScoreBadge(webData.metrics.lastMonthScore || dashboardMetrics.lastMonthScore)}</div>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{webData.metrics.activeProjects || dashboardMetrics.activeProjects}</p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg NPS (90d)</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(webData.metrics.avgNPS || dashboardMetrics.avgNPS)}</p>
              </div>
              <Star className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance" disabled={loading || isExporting}>Performance Table</TabsTrigger>
          {(userRole === 'admin' || userRole === 'tl' || userRole === 'pm') && (
            <TabsTrigger value="portfolio" disabled={loading || isExporting}>Portfolio View</TabsTrigger>
          )}
          <TabsTrigger value="team" disabled={loading || isExporting}>Team Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled={loading || isExporting}>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* Advanced Filters */}
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            filterOptions={filterOptions}
            onExport={() => exportToCSV(filteredEntries, 'web-development-performance')}
            customFilters={[
              {
                key: 'client',
                label: 'Client',
                type: 'select',
                options: [...new Set(monthlyEntries.map(entry => entry.client).filter(Boolean))]
              },
              {
                key: 'platform',
                label: 'Platform',
                type: 'select',
                options: [...new Set(monthlyEntries.map(entry => entry.platform).filter(Boolean))]
              },
              {
                key: 'stage',
                label: 'Project Stage',
                type: 'select',
                options: ['Planning', 'Design', 'Development', 'Testing', 'Launch', 'Maintenance']
              }
            ]}
          />

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-left p-2">Client/Project</th>
                      <th className="text-left p-2">Platform</th>
                      <th className="text-left p-2">Pages Approved/Planned</th>
                      <th className="text-left p-2">Design Quality</th>
                      <th className="text-left p-2">PSI (Home)</th>
                      <th className="text-left p-2">Meetings</th>
                      <th className="text-left p-2">NPS</th>
                      <th className="text-left p-2">Mentor</th>
                      <th className="text-left p-2">Month Score</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{entry.month}</td>
                        <td className="p-2">
                          <div className="font-medium text-blue-600">{entry.client}</div>
                          <div className="text-xs text-gray-500">{entry.projectTitle}</div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{entry.platform}</Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{entry.pagesApproved}/{entry.pagesPlanned}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${getCompletionPercentage(entry.pagesApproved, entry.pagesPlanned)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {getCompletionPercentage(entry.pagesApproved, entry.pagesPlanned)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="text-center">
                            <div className="text-sm font-medium">
                              {entry.homepageDesignScore ? entry.homepageDesignScore.toFixed(1) : 'N/A'} / 
                              {entry.serviceDesignScore ? entry.serviceDesignScore.toFixed(1) : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">Home / Service</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className={`font-medium ${
                            entry.pagespeedScore >= 90 ? 'text-green-600' : 
                            entry.pagespeedScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {entry.pagespeedScore}
                          </span>
                        </td>
                        <td className="p-2 text-center">{entry.meetings}</td>
                        <td className="p-2">
                          <span className="font-medium text-purple-600">{entry.nps.toFixed(1)}</span>
                        </td>
                        <td className="p-2">
                          <span className="font-medium text-orange-600">{entry.mentorScore.toFixed(1)}</span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-lg">{entry.monthScore.toFixed(1)}</span>
                            {getScoreBadge(entry.monthScore)}
                          </div>
                        </td>
                        <td className="p-2">{getStatusBadge(entry.status)}</td>
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            <Button variant="outline" size="sm" onClick={() => handleViewProject(entry.projectId)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            {entry.status === 'draft' && (
                              <Button variant="outline" size="sm" onClick={() => handleEditProject(entry.projectId)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {(userRole === 'admin' || userRole === 'tl' || userRole === 'pm') && entry.status === 'submitted' && (
                              <Button variant="outline" size="sm">
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          {filteredEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown (Latest Entry)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {(() => {
                    const latestEntry = filteredEntries[0];
                    return [
                      { label: 'Delivery & Milestones', score: latestEntry.deliveryScore, max: 35, color: 'blue' },
                      { label: 'Design & UX Quality', score: latestEntry.designScore, max: 20, color: 'purple' },
                      { label: 'Technical Health', score: latestEntry.technicalScore, max: 15, color: 'green' },
                      { label: 'Client Relationship', score: latestEntry.relationshipScore, max: 15, color: 'orange' },
                      { label: 'Business Impact', score: latestEntry.businessScore, max: 10, color: 'red' },
                      { label: 'Process Hygiene', score: latestEntry.hygieneScore, max: 5, color: 'gray' }
                    ].map((item, index) => (
                      <div key={index} className="text-center">
                        <div className={`text-2xl font-bold text-${item.color}-600`}>
                          {item.score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">/ {item.max}</div>
                        <div className="text-xs font-medium mt-1">{item.label}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className={`bg-${item.color}-600 h-2 rounded-full`} 
                            style={{ width: `${(item.score / item.max) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {(userRole === 'admin' || userRole === 'tl' || userRole === 'pm') && (
          <>
            <TabsContent value="portfolio" className="space-y-4">
              {/* Portfolio Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4" />
                      <span className="text-sm font-medium">Portfolio Filters:</span>
                    </div>
                    <select 
                      value={selectedStage} 
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="border rounded px-3 py-1 text-sm"
                    >
                      <option value="all">All Stages</option>
                      {uniqueStages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedPlatform} 
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="border rounded px-3 py-1 text-sm"
                    >
                      <option value="all">All Platforms</option>
                      {uniquePlatforms.map(platform => (
                        <option key={platform} value={platform}>{platform}</option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={handleExportPortfolio}>
                      <Download className="w-4 h-4 mr-1" /> Export Portfolio
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project) => (
                  <Card key={project.id} className={`${project.delayFlag ? 'border-red-200' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        {project.delayFlag && (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{project.client}</Badge>
                        <Badge variant="outline">{project.clientType}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Platform:</span>
                          <Badge variant="outline">{project.platform}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Stage:</span>
                          {getStageBadge(project.stage)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Progress:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {project.pagesApproved}/{project.totalPages}
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${getCompletionPercentage(project.pagesApproved, project.totalPages)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status:</span>
                          {getStatusBadge(project.status)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Est. Completion:</span>
                          <span className="text-sm">{project.estimatedCompletion}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <div>
                          <span className="font-medium">Mike Chen</span>
                          <div className="text-sm text-gray-600">3 Active Projects</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">85.2</div>
                          <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <div>
                          <span className="font-medium">Lisa Wong</span>
                          <div className="text-sm text-gray-600">2 Active Projects</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">78.5</div>
                          <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Active Projects</span>
                        <span className="text-blue-600 font-semibold">{projects.filter(p => p.status === 'active').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Completed This Month</span>
                        <span className="text-green-600 font-semibold">{projects.filter(p => p.status === 'completed').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Delayed Projects</span>
                        <span className="text-red-600 font-semibold">{projects.filter(p => p.delayFlag).length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                        <p>Performance trend charts will be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <span className="font-medium text-sm">WordPress</span>
                        <span className="text-blue-600 font-semibold">45%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <span className="font-medium text-sm">Shopify</span>
                        <span className="text-green-600 font-semibold">30%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                        <span className="font-medium text-sm">Custom</span>
                        <span className="text-purple-600 font-semibold">25%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </>
        )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default WebDashboard;