import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  Eye, 
  Play, 
  Clock, 
  MousePointer, 
  PlusCircle,
  Edit,
  Check,
  X,
  Star,
  BarChart3,
  Filter,
  Download,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { exportReport, reportUtils } from '../../utils/reportGenerator';
import DashboardLayout from '../layouts/DashboardLayout';

const SocialMediaDashboard = ({ userRole = 'employee' }) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    ytdAvgScore: 0,
    lastMonthScore: 0,
    activeClients: 0,
    avgNps90d: 0
  });
  const [platformData, setPlatformData] = useState([]);
  const [clientPerformance, setClientPerformance] = useState([]);
  const [contentMetrics, setContentMetrics] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // Load social media data using Social Media Reporting Service
  useEffect(() => {
    const loadSocialMediaData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const socialMediaData = await socialMediaReportingService.getSocialMediaMetrics();
        
        setDashboardMetrics(socialMediaData.metrics);
        setPlatformData(socialMediaData.platformData);
        setClientPerformance(socialMediaData.clientPerformance);
        setContentMetrics(socialMediaData.contentMetrics);
        setRecentActivity(socialMediaData.recentActivity);
        
        // Convert platform and client data to entries format for compatibility
        const entries = [];
        socialMediaData.clientPerformance.forEach(client => {
          client.platforms.forEach(platform => {
            entries.push({
              id: `${client.id}-${platform}`,
              client: client.name,
              platform: platform,
              monthScore: client.avgScore,
              status: client.status === 'active' ? 'approved' : 'draft',
              followersGrowth: client.monthlyGrowth,
              engagementGrowth: client.engagement,
              lastActivity: client.lastActivity
            });
          });
        });
        setEntries(entries);
        
        toast({
          title: "Social Media Data Loaded",
          description: "Successfully loaded social media metrics and performance data.",
        });
      } catch (error) {
        console.error('Error loading social media data:', error);
        setError('Failed to load social media data. Please try again.');
        
        // Use fallback data
        setEntries([]);
        setDashboardMetrics({ ytdAvgScore: 0, lastMonthScore: 0, activeClients: 0, avgNps90d: 0 });
        setPlatformData([]);
        setClientPerformance([]);
        setContentMetrics({});
        setRecentActivity([]);
        
        toast({
          title: "Error Loading Data",
          description: "Using fallback data. Some features may be limited.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSocialMediaData();
  }, []);

  const [exportFormat, setExportFormat] = useState('excel');

  // Handle export report
  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      
      // Prepare social media report data
      const reportData = {
        summary: {
          totalPosts: platformData.reduce((sum, p) => sum + (p.posts || 0), 0),
          totalEngagement: platformData.reduce((sum, p) => sum + (p.engagement || 0), 0),
          totalReach: platformData.reduce((sum, p) => sum + (p.reach || 0), 0),
          avgEngagementRate: platformData.reduce((sum, p) => sum + (p.engagementRate || 0), 0) / platformData.length
        },
        platforms: platformData || [],
        clientPerformance: clientPerformance || [],
        contentPerformance: contentPerformance || [],
        generatedAt: new Date().toISOString(),
        reportPeriod: 'Last 3 Months'
      };
      
      const filename = reportUtils.generateFilename('social_media_report', exportFormat);
      
      const result = await exportReport(reportData, exportFormat, 'socialMediaReport', filename);
      
      if (result.success) {
        toast({
          title: "Report Exported",
          description: `Social media report has been exported as ${exportFormat.toUpperCase()}.`,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export social media report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      submitted: { color: 'bg-blue-100 text-blue-800', text: 'Submitted' },
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Draft' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const getScoreBadge = (score) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">A</Badge>;
    if (score >= 75) return <Badge className="bg-blue-100 text-blue-800">B</Badge>;
    if (score >= 65) return <Badge className="bg-yellow-100 text-yellow-800">C</Badge>;
    return <Badge className="bg-red-100 text-red-800">D</Badge>;
  };

  const filteredEntries = entries.filter(entry => {
    if (selectedClient !== 'all' && entry.client !== selectedClient) return false;
    if (selectedPlatform !== 'all' && entry.platform !== selectedPlatform) return false;
    return true;
  });

  if (loading) {
    return (
      <DashboardLayout title="Social Media Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading social media dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Social Media Dashboard">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Media Dashboard</h1>
          <p className="text-gray-600 mt-1">Track performance across platforms and clients</p>
        </div>
        {userRole === 'employee' && (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Previous Month Data
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading social media data...</span>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">YTD Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.ytdAvgScore.toFixed(1)}</p>
                <div className="mt-1">{getScoreBadge(dashboardMetrics.ytdAvgScore)}</div>
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
                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.lastMonthScore.toFixed(1)}</p>
                <div className="mt-1">{getScoreBadge(dashboardMetrics.lastMonthScore)}</div>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600"># Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.activeClients}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg NPS (90d)</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.avgNps90d.toFixed(1)}</p>
              </div>
              <Heart className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance" disabled={loading || isExporting}>Performance</TabsTrigger>
          {(userRole === 'admin' || userRole === 'tl') && (
            <>
              <TabsTrigger value="team" disabled={loading || isExporting}>Team Overview</TabsTrigger>
              <TabsTrigger value="analytics" disabled={loading || isExporting}>Analytics</TabsTrigger>
            </>
          )}
          <TabsTrigger value="content" disabled={loading || isExporting}>Content Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <select 
                  value={selectedClient} 
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Clients</option>
                  {[...new Set(entries.map(e => e.client))].map(client => (
                    <option key={client} value={client}>{client}</option>
                  ))}
                </select>
                <select 
                  value={selectedPlatform} 
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Platforms</option>
                  {[...new Set(entries.map(e => e.platform))].map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
                {(userRole === 'admin' || userRole === 'tl') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportReport}
                    disabled={loading || isExporting}
                  >
                    <Download className="w-4 h-4 mr-1" /> 
                    {isExporting ? 'Exporting...' : 'Export Report'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-left p-2">Client</th>
                      <th className="text-left p-2">Platform</th>
                      <th className="text-left p-2">Followers Δ%</th>
                      <th className="text-left p-2">Reach Δ%</th>
                      <th className="text-left p-2">Engagement Δ%</th>
                      <th className="text-left p-2">Video Views Δ%</th>
                      <th className="text-left p-2">Watch Time Δ%</th>
                      <th className="text-left p-2">Video CTR Δ%</th>
                      <th className="text-left p-2">Content Output</th>
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
                        <td className="p-2">{entry.client}</td>
                        <td className="p-2">
                          <Badge variant="outline">{entry.platform}</Badge>
                        </td>
                        <td className="p-2">
                          <span className={`font-medium ${
                            entry.followersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.followersGrowth >= 0 ? '+' : ''}{entry.followersGrowth}%
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`font-medium ${
                            entry.reachGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.reachGrowth >= 0 ? '+' : ''}{entry.reachGrowth}%
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`font-medium ${
                            entry.engagementGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.engagementGrowth >= 0 ? '+' : ''}{entry.engagementGrowth}%
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`font-medium ${
                            entry.videoViewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.videoViewsGrowth >= 0 ? '+' : ''}{entry.videoViewsGrowth}%
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`font-medium ${
                            entry.watchTimeGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.watchTimeGrowth >= 0 ? '+' : ''}{entry.watchTimeGrowth}%
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`font-medium ${
                            entry.videoCtrGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.videoCtrGrowth >= 0 ? '+' : ''}{entry.videoCtrGrowth}%
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="text-xs">
                            <div>V: {entry.contentOutput.videos} | R: {entry.contentOutput.reels}</div>
                            <div>S: {entry.contentOutput.stories} | C: {entry.contentOutput.collabs}</div>
                          </div>
                        </td>
                        <td className="p-2 font-medium">{entry.nps}</td>
                        <td className="p-2 font-medium">{entry.mentorScore}</td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold">{entry.monthScore}</span>
                            {getScoreBadge(entry.monthScore)}
                          </div>
                        </td>
                        <td className="p-2">{getStatusBadge(entry.status)}</td>
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3" />
                            </Button>
                            {entry.status === 'draft' && (
                              <Button variant="outline" size="sm">
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {(userRole === 'tl' || userRole === 'admin') && entry.status === 'submitted' && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-600">
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600">
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
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
        </TabsContent>

        {(userRole === 'admin' || userRole === 'tl') && (
          <TabsContent value="team" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                      <div>
                        <span className="font-medium">Mike Chen</span>
                        <div className="text-sm text-gray-600">3 Active Clients</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">87.2</div>
                        <Badge className="bg-green-100 text-green-800">A</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                      <div>
                        <span className="font-medium">Lisa Wang</span>
                        <div className="text-sm text-gray-600">2 Active Clients</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">79.5</div>
                        <Badge className="bg-blue-100 text-blue-800">B</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Red/Amber Flags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-800">Low Engagement Growth</p>
                        <p className="text-sm text-yellow-700">StartupXYZ - LinkedIn showing declining engagement</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Growth trend charts will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                    <span className="font-medium">Instagram</span>
                    <span className="text-purple-600 font-semibold">Avg Score: 84.8</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="font-medium">LinkedIn</span>
                    <span className="text-blue-600 font-semibold">Avg Score: 75.8</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Planning & Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Edit className="w-12 h-12 mx-auto mb-2" />
                <p>Content planning tools and calendar will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SocialMediaDashboard;