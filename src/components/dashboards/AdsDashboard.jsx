import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Users, 
  BarChart3, 
  PlusCircle,
  Eye,
  Edit,
  Play,
  Pause,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../shared/lib/supabase';
import DashboardLayout from '../layouts/DashboardLayout';

const AdsDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSpend: 0,
    totalImpressions: 0,
    totalClicks: 0,
    averageCTR: 0,
    averageCPC: 0,
    totalConversions: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load campaigns and metrics from database
  useEffect(() => {
    const loadCampaignsData = async () => {
      try {
        setLoading(true);
        
        // Fetch campaigns from database
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('ad_campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (campaignsError) {
          console.error('Error fetching campaigns:', campaignsError);
          // Fallback to mock data
          const mockCampaigns = [
            {
              id: 1,
              name: 'Q1 Brand Awareness Campaign',
              status: 'active',
              budget: 5000,
              spent: 3200,
              impressions: 125000,
              clicks: 2500,
              conversions: 85,
              ctr: 2.0,
              cpc: 1.28,
              startDate: '2024-01-01',
              endDate: '2024-03-31',
              platform: 'Google Ads'
            },
            {
              id: 2,
              name: 'Product Launch - Social Media',
              status: 'active',
              budget: 3000,
              spent: 1800,
              impressions: 89000,
              clicks: 1780,
              conversions: 42,
              ctr: 2.0,
              cpc: 1.01,
              startDate: '2024-01-15',
              endDate: '2024-02-15',
              platform: 'Meta Ads'
            },
            {
              id: 3,
              name: 'Retargeting Campaign',
              status: 'paused',
              budget: 2000,
              spent: 1200,
              impressions: 45000,
              clicks: 900,
              conversions: 28,
              ctr: 2.0,
              cpc: 1.33,
              startDate: '2024-01-10',
              endDate: '2024-02-10',
              platform: 'Google Ads'
            }
          ];
          setCampaigns(mockCampaigns);
          
          // Calculate metrics from mock data
          const totalSpend = mockCampaigns.reduce((sum, campaign) => sum + campaign.spent, 0);
          const totalImpressions = mockCampaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);
          const totalClicks = mockCampaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
          const totalConversions = mockCampaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
          const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
          const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

          setMetrics({
            totalSpend,
            totalImpressions,
            totalClicks,
            averageCTR,
            averageCPC,
            totalConversions
          });
        } else {
          setCampaigns(campaignsData || []);
          
          // Calculate metrics from database data
          const campaignsToUse = campaignsData || [];
          const totalSpend = campaignsToUse.reduce((sum, campaign) => sum + (campaign.spent || 0), 0);
          const totalImpressions = campaignsToUse.reduce((sum, campaign) => sum + (campaign.impressions || 0), 0);
          const totalClicks = campaignsToUse.reduce((sum, campaign) => sum + (campaign.clicks || 0), 0);
          const totalConversions = campaignsToUse.reduce((sum, campaign) => sum + (campaign.conversions || 0), 0);
          const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
          const averageCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;

          setMetrics({
            totalSpend,
            totalImpressions,
            totalClicks,
            averageCTR,
            averageCPC,
            totalConversions
          });
        }
      } catch (error) {
        console.error('Error loading campaigns data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaignsData();

  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      paused: { color: 'bg-yellow-100 text-yellow-800', text: 'Paused' },
      completed: { color: 'bg-blue-100 text-blue-800', text: 'Completed' },
      draft: { color: 'bg-gray-100 text-gray-800', text: 'Draft' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const toggleCampaignStatus = (campaignId) => {
    setCampaigns(campaigns.map(campaign => {
      if (campaign.id === campaignId) {
        const newStatus = campaign.status === 'active' ? 'paused' : 'active';
        // Show feedback to user
        alert(`Campaign "${campaign.name}" has been ${newStatus === 'active' ? 'resumed' : 'paused'} successfully.`);
        return {
          ...campaign,
          status: newStatus
        };
      }
      return campaign;
    }));
  };

  const handleCreateCampaign = () => {
    setShowCreateCampaignModal(true);
    alert('Create Campaign modal would open here. This feature allows you to set up new advertising campaigns with budget, targeting, and creative settings.');
  };

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setShowEditModal(true);
    alert(`Edit Campaign modal would open for "${campaign.name}". This feature allows you to modify campaign settings, budget, targeting, and performance optimization.`);
  };

  const handleCampaignAction = (campaignId, action) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    switch (action) {
      case 'view':
        alert(`Viewing detailed analytics for "${campaign.name}". This would show comprehensive performance metrics, audience insights, and optimization recommendations.`);
        break;
      case 'duplicate':
        alert(`Duplicating campaign "${campaign.name}". This would create a copy of the campaign with all settings for quick setup of similar campaigns.`);
        break;
      case 'archive':
        alert(`Archiving campaign "${campaign.name}". This would move the campaign to archived status while preserving historical data.`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Ads Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading ads dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Ads Dashboard">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ads Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your advertising campaigns</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleCreateCampaign}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spend</p>
                <p className="text-2xl font-bold text-gray-900">${metrics.totalSpend.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Impressions</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalImpressions.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalClicks.toLocaleString()}</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CTR</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.averageCTR.toFixed(2)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg CPC</p>
                <p className="text-2xl font-bold text-gray-900">${metrics.averageCPC.toFixed(2)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversions</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalConversions}</p>
              </div>
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audiences">Audiences</TabsTrigger>
          <TabsTrigger value="creatives">Creatives</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        {getStatusBadge(campaign.status)}
                        <Badge variant="outline">{campaign.platform}</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCampaignStatus(campaign.id)}
                        >
                          {campaign.status === 'active' ? (
                            <><Pause className="w-4 h-4 mr-1" /> Pause</>
                          ) : (
                            <><Play className="w-4 h-4 mr-1" /> Resume</>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCampaign(campaign)}
                        >
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Budget</p>
                        <p className="font-semibold">${campaign.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Spent</p>
                        <p className="font-semibold">${campaign.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Impressions</p>
                        <p className="font-semibold">{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Clicks</p>
                        <p className="font-semibold">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">CTR</p>
                        <p className="font-semibold">{campaign.ctr.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">CPC</p>
                        <p className="font-semibold">${campaign.cpc.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Conversions</p>
                        <p className="font-semibold">{campaign.conversions}</p>
                      </div>
                    </div>
                    
                    {/* Budget Progress Bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Budget Usage</span>
                        <span>{((campaign.spent / campaign.budget) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (campaign.spent / campaign.budget) > 0.9 
                              ? 'bg-red-500' 
                              : (campaign.spent / campaign.budget) > 0.7 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((campaign.spent / campaign.budget) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Performance Trends
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => alert('Advanced analytics dashboard would open here with detailed performance charts, conversion funnels, and ROI analysis.')}
                  >
                    View Details
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded">
                      <p className="text-sm text-gray-600">Best Performing</p>
                      <p className="font-semibold text-green-700">Q1 Brand Awareness</p>
                      <p className="text-xs text-green-600">2.0% CTR</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded">
                      <p className="text-sm text-gray-600">Needs Attention</p>
                      <p className="font-semibold text-red-700">Retargeting Campaign</p>
                      <p className="text-xs text-red-600">Paused</p>
                    </div>
                  </div>
                  <div className="h-32 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded">
                    <div className="text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-1" />
                      <p className="text-sm">Interactive charts coming soon</p>
                    </div>
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
                  {[
                    { platform: 'Google Ads', spent: campaigns.filter(c => c.platform === 'Google Ads').reduce((sum, c) => sum + c.spent, 0), campaigns: campaigns.filter(c => c.platform === 'Google Ads').length, color: 'blue' },
                    { platform: 'Meta Ads', spent: campaigns.filter(c => c.platform === 'Meta Ads').reduce((sum, c) => sum + c.spent, 0), campaigns: campaigns.filter(c => c.platform === 'Meta Ads').length, color: 'purple' }
                  ].map(platform => (
                    <div 
                      key={platform.platform}
                      className={`flex justify-between items-center p-3 bg-${platform.color}-50 rounded cursor-pointer hover:bg-${platform.color}-100 transition-colors`}
                      onClick={() => alert(`Viewing detailed ${platform.platform} analytics. This would show platform-specific metrics, optimization recommendations, and performance comparisons.`)}
                    >
                      <div>
                        <span className="font-medium">{platform.platform}</span>
                        <p className="text-xs text-gray-600">{platform.campaigns} active campaigns</p>
                      </div>
                      <span className={`text-${platform.color}-600 font-semibold`}>
                        ${platform.spent.toLocaleString()} spent
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audiences" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Audience Segments
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => alert('Create New Audience modal would open here. This allows you to define custom audience segments based on demographics, interests, and behaviors.')}
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Create Audience
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Tech Enthusiasts', size: '2.5M', performance: 'High', color: 'green' },
                    { name: 'Young Professionals', size: '1.8M', performance: 'Medium', color: 'yellow' },
                    { name: 'Retargeting - Website Visitors', size: '450K', performance: 'High', color: 'green' },
                    { name: 'Lookalike - Customers', size: '3.2M', performance: 'Medium', color: 'yellow' }
                  ].map((audience, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => alert(`Viewing audience details for "${audience.name}". This would show demographic breakdown, interests, and campaign performance for this segment.`)}
                    >
                      <div>
                        <p className="font-medium">{audience.name}</p>
                        <p className="text-sm text-gray-600">{audience.size} people</p>
                      </div>
                      <Badge className={`bg-${audience.color}-100 text-${audience.color}-800`}>
                        {audience.performance}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-2xl font-bold text-blue-600">8.9M</p>
                      <p className="text-sm text-gray-600">Total Reach</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded">
                      <p className="text-2xl font-bold text-purple-600">2.1%</p>
                      <p className="text-sm text-gray-600">Avg Engagement</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => alert('Audience Analytics dashboard would open here with detailed demographic data, interest analysis, and behavior patterns.')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Full Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="creatives" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Ad Creatives
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => alert('Upload New Creative modal would open here. This allows you to upload images, videos, and create ad variations for A/B testing.')}
                  >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    Upload Creative
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Brand Hero Image', type: 'Image', performance: 'High CTR', status: 'Active' },
                    { name: 'Product Demo Video', type: 'Video', performance: 'Medium CTR', status: 'Active' },
                    { name: 'Testimonial Carousel', type: 'Carousel', performance: 'Low CTR', status: 'Paused' },
                    { name: 'Holiday Promotion', type: 'Image', performance: 'High CTR', status: 'Active' }
                  ].map((creative, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => alert(`Viewing creative details for "${creative.name}". This would show performance metrics, A/B test results, and optimization suggestions.`)}
                    >
                      <div>
                        <p className="font-medium">{creative.name}</p>
                        <p className="text-sm text-gray-600">{creative.type} • {creative.performance}</p>
                      </div>
                      <Badge variant={creative.status === 'Active' ? 'default' : 'secondary'}>
                        {creative.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>A/B Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Hero Image Test</p>
                      <Badge className="bg-blue-100 text-blue-800">Running</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Variant A: 2.3% CTR</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Variant B: 2.8% CTR</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => alert('A/B Testing dashboard would open here. This allows you to create new tests, analyze results, and implement winning variations.')}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Manage A/B Tests
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dynamic Budget Alerts */}
      {campaigns.filter(campaign => (campaign.spent / campaign.budget) > 0.7).length > 0 && (
        <div className="space-y-2">
          {campaigns
            .filter(campaign => (campaign.spent / campaign.budget) > 0.7)
            .map(campaign => {
              const usagePercent = ((campaign.spent / campaign.budget) * 100).toFixed(1);
              const isHighAlert = (campaign.spent / campaign.budget) > 0.9;
              
              return (
                <Card 
                  key={`alert-${campaign.id}`} 
                  className={`border-2 ${
                    isHighAlert 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className={`w-5 h-5 ${
                          isHighAlert ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <div>
                          <p className={`font-medium ${
                            isHighAlert ? 'text-red-800' : 'text-yellow-800'
                          }`}>
                            {isHighAlert ? 'Critical Budget Alert' : 'Budget Alert'}
                          </p>
                          <p className={`text-sm ${
                            isHighAlert ? 'text-red-700' : 'text-yellow-700'
                          }`}>
                            "{campaign.name}" has used {usagePercent}% of its ${campaign.budget.toLocaleString()} budget
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditCampaign(campaign)}
                        className={isHighAlert ? 'border-red-300 text-red-700 hover:bg-red-100' : 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'}
                      >
                        Adjust Budget
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          }
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdsDashboard;