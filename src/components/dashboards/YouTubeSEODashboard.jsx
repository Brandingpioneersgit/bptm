import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import DashboardLayout from '../layouts/DashboardLayout';
import { supabase } from '../../shared/lib/supabase';
import { 
  Play, 
  Eye, 
  ThumbsUp, 
  MessageSquare, 
  Share2, 
  TrendingUp, 
  Search, 
  Target, 
  Clock, 
  Users, 
  BarChart3, 
  PlusCircle,
  Edit,
  CheckCircle,
  X,
  Star,
  Filter,
  Download,
  AlertTriangle,
  Youtube,
  Hash,
  Zap,
  Calendar,
  Award,
  Briefcase,
  ExternalLink,
  Settings,
  FileText,
  Activity,
  Layers,
  MousePointer
} from 'lucide-react';

const YouTubeSEODashboard = ({ userRole = 'employee' }) => {
  const [channels, setChannels] = useState([]);
  const [monthlyEntries, setMonthlyEntries] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    ytdAvgScore: 0,
    lastMonthScore: 0,
    activeChannels: 0,
    avgWatchTime90d: 0
  });
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [loading, setLoading] = useState(true);

  // Load YouTube SEO data from clients
  useEffect(() => {
    const loadYouTubeData = async () => {
      try {
        // Fetch active clients from Marketing team
        const { data: clients, error } = await supabase
          .from('clients')
          .select('*')
          .eq('team', 'Marketing')
          .eq('status', 'Active')
          .limit(5);

        if (error) {
          console.error('Error fetching clients:', error);
          return;
        }

        if (!clients || clients.length === 0) {
          console.log('No active Marketing clients found');
          setLoading(false);
          return;
        }

        // Generate mock YouTube channels based on real clients
        const mockChannels = clients.map((client, index) => ({
          id: index + 1,
          clientName: client.name,
          clientType: client.client_type,
          handle: `@${client.name.toLowerCase().replace(/\s+/g, '-')}`,
          url: `https://youtube.com/@${client.name.toLowerCase().replace(/\s+/g, '-')}`,
          niche: ['Technology', 'Business', 'Finance', 'Marketing', 'Education'][index % 5],
          scopeOfWork: client.client_type === 'Premium' 
            ? 'Full channel management, SEO optimization, content strategy'
            : 'SEO optimization, metadata management',
          status: 'active',
          startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }));

        // Generate mock monthly entries for each channel
        const mockEntries = [];
        const months = ['2023-11', '2023-12', '2024-01'];
        
        mockChannels.forEach((channel, channelIndex) => {
          months.forEach((month, monthIndex) => {
            const baseScore = 70 + Math.random() * 25;
            const entry = {
              id: mockEntries.length + 1,
              month,
              channelId: channel.id,
              clientName: channel.clientName,
              niche: channel.niche,
              
              // Growth metrics
              subsGrowthPct: 5 + Math.random() * 20,
              viewsGrowthPct: 8 + Math.random() * 25,
              watchGrowthPct: 6 + Math.random() * 20,
              ctrGrowthPct: 3 + Math.random() * 10,
              
              // Content output
              longVideosCount: Math.floor(2 + Math.random() * 4),
              shortsCount: Math.floor(6 + Math.random() * 10),
              communityPosts: Math.floor(1 + Math.random() * 4),
              collabsCount: Math.floor(Math.random() * 2),
              
              // SEO metrics
              metadataCompletenessRate: 75 + Math.random() * 20,
              chaptersUsageRate: 60 + Math.random() * 30,
              endScreensCardsRate: 55 + Math.random() * 30,
              playlistAssignmentRate: 70 + Math.random() * 25,
              thumbsABTests: Math.floor(1 + Math.random() * 4),
              
              // Search performance
              searchImpressionsShare: 25 + Math.random() * 25,
              searchClickShare: 20 + Math.random() * 25,
              topKeywordsCovered: Math.floor(8 + Math.random() * 12),
              keywordsGainingRank: Math.floor(3 + Math.random() * 8),
              
              // Retention
              avgViewDurationSec: 180 + Math.random() * 150,
              avgPercentViewed: 60 + Math.random() * 20,
              
              // Client management
              meetingsWithClient: Math.floor(1 + Math.random() * 3),
              npsClient: 6.5 + Math.random() * 2.5,
              mentorScore: 6.5 + Math.random() * 2.5,
              
              status: 'approved',
              scopeCompleted: `Optimized ${Math.floor(2 + Math.random() * 4)} videos, created ${Math.floor(6 + Math.random() * 10)} shorts with SEO metadata`,
              activitiesNextMonth: 'Focus on playlist optimization and content strategy'
            };
            
            // Calculate component scores
            entry.discoverabilityScore = (entry.subsGrowthPct + entry.viewsGrowthPct) * 0.6;
            entry.retentionQualityScore = (entry.avgPercentViewed / 100) * 25;
            entry.contentConsistencyScore = (entry.longVideosCount + entry.shortsCount * 0.5) * 0.8;
            entry.seoHygieneScore = (entry.metadataCompletenessRate / 100) * 15;
            entry.searchPerformanceScore = (entry.searchImpressionsShare / 100) * 12;
            entry.relationshipScore = (entry.npsClient / 10) * 5;
            
            entry.monthScore = entry.discoverabilityScore + entry.retentionQualityScore + 
                              entry.contentConsistencyScore + entry.seoHygieneScore + 
                              entry.searchPerformanceScore + entry.relationshipScore;
            
            mockEntries.push(entry);
          });
        });

        setChannels(mockChannels);
        setMonthlyEntries(mockEntries);
        
        // Calculate dashboard metrics
        const approvedEntries = mockEntries.filter(e => e.status === 'approved');
        const ytdEntries = approvedEntries.filter(e => e.month >= '2024-01');
        const lastMonthEntries = approvedEntries.filter(e => e.month === '2024-01');
        
        const ytdAvgScore = ytdEntries.length > 0 
          ? ytdEntries.reduce((sum, e) => sum + e.monthScore, 0) / ytdEntries.length 
          : 0;
        
        const lastMonthScore = lastMonthEntries.length > 0 
          ? lastMonthEntries.reduce((sum, e) => sum + e.monthScore, 0) / lastMonthEntries.length 
          : 0;
        
        const activeChannels = mockChannels.filter(c => c.status === 'active').length;
        
        const avgWatchTime90d = approvedEntries.length > 0 
          ? approvedEntries.reduce((sum, e) => sum + e.avgViewDurationSec, 0) / approvedEntries.length 
          : 0;

        setDashboardMetrics({
          ytdAvgScore,
          lastMonthScore,
          activeChannels,
          avgWatchTime90d
        });
        
      } catch (error) {
        console.error('Error loading YouTube data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadYouTubeData();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      paused: { color: 'bg-yellow-100 text-yellow-800', text: 'Paused' },
      completed: { color: 'bg-blue-100 text-blue-800', text: 'Completed' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Inactive' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const getClientTypeBadge = (clientType) => {
    const typeConfig = {
      'Standard': { color: 'bg-blue-100 text-blue-800' },
      'Premium': { color: 'bg-purple-100 text-purple-800' },
      'Enterprise': { color: 'bg-orange-100 text-orange-800' }
    };
    
    const config = typeConfig[clientType] || typeConfig.Standard;
    return (
      <Badge className={config.color}>
        {clientType}
      </Badge>
    );
  };

  const getScoreBadge = (score) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 75) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 65) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const getGrowthBadge = (growthPct) => {
    if (growthPct >= 15) return <Badge className="bg-green-100 text-green-800">+{growthPct.toFixed(1)}%</Badge>;
    if (growthPct >= 5) return <Badge className="bg-blue-100 text-blue-800">+{growthPct.toFixed(1)}%</Badge>;
    if (growthPct >= 0) return <Badge className="bg-yellow-100 text-yellow-800">+{growthPct.toFixed(1)}%</Badge>;
    return <Badge className="bg-red-100 text-red-800">{growthPct.toFixed(1)}%</Badge>;
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num) => {
    return num.toFixed(1);
  };

  const filteredChannels = channels.filter(channel => {
    if (selectedClient !== 'all' && channel.clientName !== selectedClient) return false;
    if (selectedNiche !== 'all' && channel.niche !== selectedNiche) return false;
    return true;
  });

  const filteredEntries = monthlyEntries.filter(entry => {
    const channel = channels.find(c => c.id === entry.channelId);
    if (!channel) return false;
    if (selectedClient !== 'all' && channel.clientName !== selectedClient) return false;
    if (selectedNiche !== 'all' && channel.niche !== selectedNiche) return false;
    if (selectedFormat !== 'all') {
      if (selectedFormat === 'long' && entry.longVideosCount === 0) return false;
      if (selectedFormat === 'short' && entry.shortsCount === 0) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading YouTube SEO dashboard...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">YouTube SEO Dashboard</h1>
          <p className="text-gray-600 mt-1">Channel optimization and performance tracking</p>
        </div>
        {userRole === 'employee' && (
          <Button className="bg-red-600 hover:bg-red-700">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Previous Month Data
          </Button>
        )}
      </div>

      {/* Mock Data Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> This dashboard is currently displaying mock YouTube SEO performance data based on active Marketing clients. 
            Dedicated YouTube SEO tables will be created for real metrics tracking.
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">YTD Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardMetrics.ytdAvgScore)}</p>
                <div className="mt-1">{getScoreBadge(dashboardMetrics.ytdAvgScore)}</div>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Month Score</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardMetrics.lastMonthScore)}</p>
                <div className="mt-1">{getScoreBadge(dashboardMetrics.lastMonthScore)}</div>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Channels</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.activeChannels}</p>
              </div>
              <Youtube className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Watch Time (90d)</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(Math.round(dashboardMetrics.avgWatchTime90d))}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Table</TabsTrigger>
          {(userRole === 'admin' || userRole === 'tl') && (
            <>
              <TabsTrigger value="channels">Channel Portfolio</TabsTrigger>
              <TabsTrigger value="team">Team Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </>
          )}
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
                  {[...new Set(channels.map(c => c.clientName))].map(clientName => (
                    <option key={clientName} value={clientName}>{clientName}</option>
                  ))}
                </select>
                <select 
                  value={selectedNiche} 
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Niches</option>
                  {[...new Set(channels.map(c => c.niche))].map(niche => (
                    <option key={niche} value={niche}>{niche}</option>
                  ))}
                </select>
                <select 
                  value={selectedFormat} 
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="all">All Formats</option>
                  <option value="long">Long-form</option>
                  <option value="short">Shorts</option>
                </select>
                {(userRole === 'admin' || userRole === 'tl') && (
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" /> Export
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

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
                      <th className="text-left p-2">Client/Channel</th>
                      <th className="text-left p-2">Subs Δ%</th>
                      <th className="text-left p-2">Views Δ%</th>
                      <th className="text-left p-2">Watch Time Δ%</th>
                      <th className="text-left p-2">CTR Δ%</th>
                      <th className="text-left p-2">AVD (sec)</th>
                      <th className="text-left p-2">Long/Shorts</th>
                      <th className="text-left p-2">SEO Score</th>
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
                          <div className="font-medium text-red-600">{entry.clientName}</div>
                          <div className="text-xs text-gray-500">{entry.niche}</div>
                        </td>
                        <td className="p-2">{getGrowthBadge(entry.subsGrowthPct)}</td>
                        <td className="p-2">{getGrowthBadge(entry.viewsGrowthPct)}</td>
                        <td className="p-2">{getGrowthBadge(entry.watchGrowthPct)}</td>
                        <td className="p-2">{getGrowthBadge(entry.ctrGrowthPct)}</td>
                        <td className="p-2">
                          <span className="font-medium">{formatDuration(entry.avgViewDurationSec)}</span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className="text-xs">
                              L: {entry.longVideosCount}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              S: {entry.shortsCount}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="font-medium text-blue-600">
                            {entry.seoHygieneScore.toFixed(1)}/15
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="font-medium text-purple-600">{entry.npsClient.toFixed(1)}</span>
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
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3" />
                            </Button>
                            {entry.status === 'draft' && (
                              <Button variant="outline" size="sm">
                                <Edit className="w-3 h-3" />
                              </Button>
                            )}
                            {(userRole === 'admin' || userRole === 'tl') && entry.status === 'submitted' && (
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
                      { label: 'Discoverability & Growth', score: latestEntry.discoverabilityScore, max: 30, color: 'red' },
                      { label: 'Retention & Watch Quality', score: latestEntry.retentionQualityScore, max: 25, color: 'blue' },
                      { label: 'Content Output', score: latestEntry.contentConsistencyScore, max: 15, color: 'green' },
                      { label: 'SEO Hygiene', score: latestEntry.seoHygieneScore, max: 15, color: 'purple' },
                      { label: 'Search Performance', score: latestEntry.searchPerformanceScore, max: 10, color: 'orange' },
                      { label: 'Relationship & QA', score: latestEntry.relationshipScore, max: 5, color: 'gray' }
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

          {/* SEO Metrics Detail */}
          {filteredEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>SEO Hygiene Details (Latest Entry)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {(() => {
                    const latestEntry = filteredEntries[0];
                    return [
                      { label: 'Metadata Completeness', value: latestEntry.metadataCompletenessRate, unit: '%', icon: FileText },
                      { label: 'Chapters Usage', value: latestEntry.chaptersUsageRate, unit: '%', icon: Layers },
                      { label: 'End Screens/Cards', value: latestEntry.endScreensCardsRate, unit: '%', icon: MousePointer },
                      { label: 'Playlist Assignment', value: latestEntry.playlistAssignmentRate, unit: '%', icon: Activity },
                      { label: 'Thumbnail A/B Tests', value: latestEntry.thumbsABTests, unit: ' tests', icon: Target }
                    ].map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={index} className="text-center p-3 bg-gray-50 rounded">
                          <IconComponent className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                          <div className="text-lg font-bold text-gray-900">
                            {item.value}{item.unit}
                          </div>
                          <div className="text-xs font-medium text-gray-600">{item.label}</div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {(userRole === 'admin' || userRole === 'tl') && (
          <>
            <TabsContent value="channels" className="space-y-4">
              {/* Channel Portfolio */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChannels.map((channel) => (
                  <Card key={channel.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{channel.clientName}</CardTitle>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex items-center space-x-2">
                        {getClientTypeBadge(channel.clientType)}
                        <Badge variant="outline">{channel.niche}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Handle:</span>
                          <span className="text-sm font-medium">{channel.handle}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status:</span>
                          {getStatusBadge(channel.status)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Start Date:</span>
                          <span className="text-sm">{channel.startDate}</span>
                        </div>
                        <div className="mt-3">
                          <span className="text-sm text-gray-600">Scope:</span>
                          <p className="text-xs text-gray-500 mt-1">{channel.scopeOfWork}</p>
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
                          <span className="font-medium">Alex Johnson</span>
                          <div className="text-sm text-gray-600">3 Active Channels</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">88.8</div>
                          <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <div>
                          <span className="font-medium">Sarah Chen</span>
                          <div className="text-sm text-gray-600">2 Active Channels</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">75.2</div>
                          <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Channel Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Active Channels</span>
                        <span className="text-red-600 font-semibold">{channels.filter(c => c.status === 'active').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Premium Clients</span>
                        <span className="text-purple-600 font-semibold">{channels.filter(c => c.clientType === 'Premium').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Enterprise Clients</span>
                        <span className="text-orange-600 font-semibold">{channels.filter(c => c.clientType === 'Enterprise').length}</span>
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
                    <CardTitle>Niche Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <span className="font-medium text-sm">Technology</span>
                        <span className="text-blue-600 font-semibold">40%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                        <span className="font-medium text-sm">Business</span>
                        <span className="text-green-600 font-semibold">35%</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                        <span className="font-medium text-sm">Finance</span>
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

export default YouTubeSEODashboard;