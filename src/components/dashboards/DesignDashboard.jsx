import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import DashboardLayout from '../layouts/DashboardLayout';
import { supabase } from '../../lib/supabase';
import { 
  Palette, 
  Image, 
  Video, 
  Layout, 
  Layers, 
  Eye, 
  Download, 
  Upload, 
  Star, 
  Clock, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Share2, 
  Heart, 
  MessageSquare, 
  Zap, 
  Award, 
  Target, 
  BarChart3, 
  PieChart, 
  Calendar, 
  Briefcase, 
  FileText, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Printer, 
  Camera, 
  Brush, 
  Scissors, 
  Crop, 
  Filter, 
  Type, 
  Grid, 
  MousePointer, 
  Move, 
  RotateCcw, 
  ZoomIn, 
  Maximize, 
  Minimize, 
  Copy, 
  Save, 
  FolderOpen, 
  Search, 
  Settings, 
  RefreshCw
} from 'lucide-react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';

const DesignDashboard = () => {
  const { user } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showCreateDesignModal, setShowCreateDesignModal] = useState(false);
  const [showUploadAssetModal, setShowUploadAssetModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showCollaborateModal, setShowCollaborateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Dynamic data states
  const [designData, setDesignData] = useState({
    projects: [],
    metrics: null,
    tools: [],
    feedback: []
  });
  
  // Load design data from Supabase
  useEffect(() => {
    const loadDesignData = async () => {
      try {
        setIsLoading(true);
        
        // Try to load design projects and metrics from database
        const { data: projects, error: projectsError } = await supabase
          .from('design_projects')
          .select('*')
          .order('created_at', { ascending: false });
          
        const { data: metrics, error: metricsError } = await supabase
          .from('design_metrics')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!projectsError && projects) {
          setDesignData(prev => ({ ...prev, projects }));
        }
        
        if (!metricsError && metrics) {
          setDesignData(prev => ({ ...prev, metrics }));
        }
        
      } catch (error) {
        console.log('Using mock data for design dashboard:', error.message);
        // Continue with mock data
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      loadDesignData();
    }
  }, [user?.id]);

  // Mock design metrics
  const designMetrics = {
    totalProjects: 45,
    completedProjects: 38,
    activeProjects: 7,
    clientSatisfaction: 4.8,
    averageDeliveryTime: 2.3,
    revisionRequests: 12,
    approvalRate: 89.5,
    monthlyGrowth: 15.2,
    totalAssets: 1250,
    downloadsThisMonth: 890,
    collaborations: 23,
    portfolioViews: 3420
  };

  const recentProjects = [
    { 
      id: 'PRJ001', 
      name: 'Brand Identity - TechCorp', 
      client: 'TechCorp Solutions', 
      type: 'Branding', 
      status: 'completed', 
      deadline: '2024-01-20', 
      progress: 100,
      rating: 5,
      deliverables: ['Logo', 'Business Cards', 'Letterhead']
    },
    { 
      id: 'PRJ002', 
      name: 'Website UI Design', 
      client: 'StartupXYZ', 
      type: 'Web Design', 
      status: 'in_progress', 
      deadline: '2024-01-25', 
      progress: 75,
      rating: null,
      deliverables: ['Homepage', 'Product Pages', 'Mobile Design']
    },
    { 
      id: 'PRJ003', 
      name: 'Social Media Campaign', 
      client: 'Fashion Brand', 
      type: 'Social Media', 
      status: 'in_progress', 
      deadline: '2024-01-22', 
      progress: 60,
      rating: null,
      deliverables: ['Instagram Posts', 'Stories', 'Reels Templates']
    },
    { 
      id: 'PRJ004', 
      name: 'Print Advertisement', 
      client: 'Local Restaurant', 
      type: 'Print Design', 
      status: 'review', 
      deadline: '2024-01-18', 
      progress: 90,
      rating: null,
      deliverables: ['Flyer', 'Menu Design', 'Banner']
    },
    { 
      id: 'PRJ005', 
      name: 'Mobile App Icons', 
      client: 'App Development Co', 
      type: 'Icon Design', 
      status: 'pending', 
      deadline: '2024-01-30', 
      progress: 25,
      rating: null,
      deliverables: ['App Icon', 'Feature Icons', 'Loading Animations']
    }
  ];

  const designTools = [
    { name: 'Adobe Photoshop', usage: 85, proficiency: 'Expert', lastUsed: '2024-01-15' },
    { name: 'Adobe Illustrator', usage: 78, proficiency: 'Expert', lastUsed: '2024-01-15' },
    { name: 'Figma', usage: 92, proficiency: 'Advanced', lastUsed: '2024-01-15' },
    { name: 'Adobe InDesign', usage: 65, proficiency: 'Intermediate', lastUsed: '2024-01-14' },
    { name: 'Sketch', usage: 45, proficiency: 'Intermediate', lastUsed: '2024-01-12' },
    { name: 'Adobe After Effects', usage: 35, proficiency: 'Beginner', lastUsed: '2024-01-10' }
  ];

  const clientFeedback = [
    { 
      client: 'TechCorp Solutions', 
      project: 'Brand Identity', 
      rating: 5, 
      comment: 'Exceptional work! The logo perfectly captures our brand essence.',
      date: '2024-01-15'
    },
    { 
      client: 'StartupXYZ', 
      project: 'Website Design', 
      rating: 4, 
      comment: 'Great design concepts, looking forward to the final version.',
      date: '2024-01-12'
    },
    { 
      client: 'Fashion Brand', 
      project: 'Social Media Graphics', 
      rating: 5, 
      comment: 'Amazing creativity! Our engagement has increased significantly.',
      date: '2024-01-10'
    }
  ];

  const designCategories = [
    { category: 'Web Design', projects: 12, revenue: 180000, growth: 25.3 },
    { category: 'Branding', projects: 8, revenue: 120000, growth: 18.7 },
    { category: 'Social Media', projects: 15, revenue: 95000, growth: 32.1 },
    { category: 'Print Design', projects: 6, revenue: 75000, growth: -5.2 },
    { category: 'Icon Design', projects: 4, revenue: 45000, growth: 15.8 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProficiencyColor = (proficiency) => {
    switch (proficiency) {
      case 'Expert': return 'text-green-600';
      case 'Advanced': return 'text-blue-600';
      case 'Intermediate': return 'text-yellow-600';
      case 'Beginner': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Handler functions
  const handleCreateNewDesign = () => {
    setShowCreateDesignModal(true);
    alert('Create New Design modal would open here. This allows you to start a new design project with templates, canvas size selection, and project details.');
  };
  
  const handleUploadAsset = () => {
    setShowUploadAssetModal(true);
    alert('Upload Asset modal would open here. This allows you to upload images, fonts, icons, and other design assets to your library.');
  };
  
  const handleBrowseTemplates = () => {
    setShowTemplatesModal(true);
    alert('Browse Templates modal would open here. This shows a gallery of design templates categorized by type (web, print, social media, etc.).');
  };
  
  const handleCollaborate = () => {
    setShowCollaborateModal(true);
    alert('Collaboration modal would open here. This allows you to invite team members, share projects, and manage permissions.');
  };
  
  const handleExportPortfolio = () => {
    alert('Export Portfolio functionality would start here. This generates a PDF or web portfolio of your selected projects with customizable layouts.');
  };
  
  const handleNewProject = () => {
    alert('New Project modal would open here. This allows you to create a new design project with client details, timeline, and deliverables.');
  };
  
  const handleViewProject = (project) => {
    setSelectedProject(project);
    alert(`Viewing project details for "${project.name}". This would show project timeline, deliverables, client feedback, and file versions.`);
  };
  
  const handleEditProject = (project) => {
    setSelectedProject(project);
    alert(`Editing project "${project.name}". This would open the project editor with design tools, asset library, and collaboration features.`);
  };
  
  // Calculate dynamic metrics
  const calculateDesignMetrics = () => {
    if (designData.metrics) {
      return designData.metrics;
    }
    
    // Use mock data as fallback
    return designMetrics;
  };
  
  const getProjectsData = () => {
    return designData.projects.length > 0 ? designData.projects : recentProjects;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Design Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Designer'}</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleUploadAsset}
            >
              <Upload className="h-4 w-4" />
              Upload Asset
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={handleNewProject}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{calculateDesignMetrics().totalProjects}</div>
              <div className="flex items-center text-xs text-purple-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{calculateDesignMetrics().monthlyGrowth}% this month
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{calculateDesignMetrics().completedProjects}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <Target className="h-3 w-3 mr-1" />
                {calculateDesignMetrics().approvalRate}% approval rate
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{calculateDesignMetrics().clientSatisfaction}/5</div>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <Heart className="h-3 w-3 mr-1" />
                Excellent rating
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{calculateDesignMetrics().averageDeliveryTime} days</div>
              <div className="flex items-center text-xs text-orange-600 mt-1">
                <Zap className="h-3 w-3 mr-1" />
                Fast delivery
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="tools">Tools & Skills</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Active Projects</span>
                    <span className="font-bold text-blue-600">{calculateDesignMetrics().activeProjects}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Total Assets</span>
                    <span className="font-bold text-purple-600">{calculateDesignMetrics().totalAssets}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Downloads This Month</span>
                    <span className="font-bold text-green-600">{calculateDesignMetrics().downloadsThisMonth}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Portfolio Views</span>
                    <span className="font-bold text-orange-600">{calculateDesignMetrics().portfolioViews}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleCreateNewDesign}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Create New Design
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleUploadAsset}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Asset
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleBrowseTemplates}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleCollaborate}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Collaborate
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleExportPortfolio}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Portfolio
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Recent Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getProjectsData().map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.client}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{project.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{project.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{project.deadline}</TableCell>
                        <TableCell>
                          {project.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{project.rating}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewProject(project)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditProject(project)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools & Skills Tab */}
          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Design Tools & Proficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(designData.tools.length > 0 ? designData.tools : designTools).map((tool, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{tool.name}</span>
                          <span className={`text-sm font-medium ${getProficiencyColor(tool.proficiency)}`}>
                            {tool.proficiency}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${tool.usage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-bold">{tool.usage}%</div>
                        <div className="text-xs text-gray-500">Last used: {tool.lastUsed}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Client Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(designData.feedback.length > 0 ? designData.feedback : clientFeedback).map((feedback, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium">{feedback.client}</span>
                          <span className="text-sm text-gray-500 ml-2">• {feedback.project}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3 w-3 ${
                                i < feedback.rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                          <span className="text-xs ml-1">{feedback.rating}/5</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feedback.comment}</p>
                      <p className="text-xs text-gray-400">{feedback.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Design Categories Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(designData.categories || designCategories).map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{category.category}</span>
                          <span className="text-sm text-gray-500">{category.projects} projects</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" 
                            style={{ width: `${(category.projects / 15) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-bold">{formatCurrency(category.revenue)}</div>
                        <div className={`text-sm flex items-center justify-end ${
                          category.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {category.growth > 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(category.growth)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DesignDashboard;