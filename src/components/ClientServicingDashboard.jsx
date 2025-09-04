import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, Target, DollarSign, AlertCircle } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import personalizedDashboardService from '../shared/services/personalizedDashboardService';
import clientServicingService from '@/services/clientServicingService';
import AdvancedFilters from './shared/AdvancedFilters';
import { applyFilters, createFilterOptions, exportToCSV } from '@/utils/filterUtils';

const ClientServicingDashboard = () => {
  const { toast } = useToast();
  const [user] = useState({
    id: '1',
    name: 'John Doe',
    role: 'employee', // employee, lead, admin, reviewer
    department: 'Client Servicing'
  });

  const [entries, setEntries] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({
    ytdAvgScore: 0,
    lastMonthScore: 0,
    activeClients: 0,
    avgNPS: 0,
    slaOnTime: 0
  });
  const [personalizedMetrics, setPersonalizedMetrics] = useState({});
  const [clientPerformance, setClientPerformance] = useState([]);
  const [serviceMetrics, setServiceMetrics] = useState({});
  const [riskAnalysis, setRiskAnalysis] = useState({});
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    month: '',
    client: '',
    status: '',
    riskLevel: ''
  });

  // Load client servicing data using Client Servicing Service
  useEffect(() => {
    const loadClientServicingData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const clientServicingData = await clientServicingService.getClientServicingMetrics();
        
        setDashboardMetrics(clientServicingData.metrics);
        setEntries(clientServicingData.entries);
        setClientPerformance(clientServicingData.clientPerformance);
        setServiceMetrics(clientServicingData.serviceMetrics);
        setRiskAnalysis(clientServicingData.riskAnalysis);
        
        // Load personalized metrics as enhancement
        try {
          const personalizedData = await personalizedDashboardService.getPersonalizedDashboardMetrics(user, 'clientServicing');
          setPersonalizedMetrics(personalizedData);
          
          // Enhance dashboard metrics with personalized data if available
          if (personalizedData && Object.keys(personalizedData).length > 0) {
            setDashboardMetrics(prev => ({
              ...prev,
              ytdAvgScore: personalizedData.performanceScore || prev.ytdAvgScore,
              lastMonthScore: personalizedData.monthlyScore || prev.lastMonthScore,
              activeClients: personalizedData.activeClients || prev.activeClients,
              avgNPS: personalizedData.customerSatisfaction || prev.avgNPS,
              slaOnTime: personalizedData.slaCompliance || prev.slaOnTime
            }));
          }
        } catch (personalizedError) {
          console.error('Error loading personalized metrics:', personalizedError);
        }
        
        toast({
          title: "Client Servicing Data Loaded",
          description: "Successfully loaded client servicing metrics and performance data.",
        });
      } catch (error) {
        console.error('Error loading client servicing data:', error);
        setError('Failed to load client servicing data. Please try again.');
        
        // Use fallback data
        setEntries([]);
        setDashboardMetrics({ ytdAvgScore: 0, lastMonthScore: 0, activeClients: 0, avgNPS: 0, slaOnTime: 0 });
        setClientPerformance([]);
        setServiceMetrics({});
        setRiskAnalysis({});
        
        toast({
          title: "Error Loading Data",
          description: "Using fallback data. Some features may be limited.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadClientServicingData();
  }, [user]);

  // Mock data for demonstration
  useEffect(() => {
    const mockEntries = [
      {
        id: '1',
        employee_id: '1',
        client_id: '1',
        client_name: 'Acme Corp',
        client_type: 'Premium',
        month: '2024-01',
        meetings_count: 4,
        sla_closure_rate: 95.5,
        breach_rate: 2.1,
        escalations_count: 1,
        nps_client: 8,
        upsell_discussions: 2,
        upsells_closed: 1,
        renewal_stage: 'negotiation',
        account_health_score: 8.5,
        servicing_hygiene_score: 22.0,
        relationship_score: 18.5,
        commercials_score: 13.0,
        month_score: 87.5,
        status: 'approved',
        churn_risk_flag: false
      },
      {
        id: '2',
        employee_id: '1',
        client_id: '2',
        client_name: 'Beta Ltd',
        client_type: 'Standard',
        month: '2024-01',
        meetings_count: 2,
        sla_closure_rate: 88.2,
        breach_rate: 8.5,
        escalations_count: 0,
        nps_client: 7,
        upsell_discussions: 1,
        upsells_closed: 0,
        renewal_stage: 'discovery',
        account_health_score: 6.0,
        servicing_hygiene_score: 18.5,
        relationship_score: 14.4,
        commercials_score: 5.0,
        month_score: 72.1,
        status: 'submitted',
        churn_risk_flag: true
      },
      {
        id: '3',
        employee_id: '1',
        client_id: '3',
        client_name: 'Gamma Inc',
        client_type: 'Premium',
        month: '2023-12',
        meetings_count: 3,
        sla_closure_rate: 92.0,
        breach_rate: 5.2,
        escalations_count: 2,
        nps_client: 9,
        upsell_discussions: 3,
        upsells_closed: 2,
        renewal_stage: 'closed',
        account_health_score: 9.2,
        servicing_hygiene_score: 20.5,
        relationship_score: 19.8,
        commercials_score: 15.0,
        month_score: 91.3,
        status: 'approved',
        churn_risk_flag: false
      }
    ];

    setEntries(mockEntries);

    // Calculate dashboard metrics from mock data (fallback if no personalized data)
    if (!personalizedMetrics || Object.keys(personalizedMetrics).length === 0) {
      const approvedEntries = mockEntries.filter(e => e.status === 'approved');
      const ytdAvg = approvedEntries.reduce((sum, e) => sum + e.month_score, 0) / approvedEntries.length;
      const lastMonth = mockEntries.filter(e => e.month === '2024-01');
      const lastMonthAvg = lastMonth.reduce((sum, e) => sum + e.month_score, 0) / lastMonth.length;
      const activeClients = new Set(mockEntries.map(e => e.client_id)).size;
      const avgNPS = mockEntries.reduce((sum, e) => sum + (e.nps_client || 0), 0) / mockEntries.length;
      const slaOnTime = mockEntries.reduce((sum, e) => sum + e.sla_closure_rate, 0) / mockEntries.length;

      setDashboardMetrics(prev => ({
        ...prev,
        ytdAvgScore: ytdAvg || prev.ytdAvgScore,
        lastMonthScore: lastMonthAvg || prev.lastMonthScore,
        activeClients: activeClients || prev.activeClients,
        avgNPS: avgNPS || prev.avgNPS,
        slaOnTime: slaOnTime || prev.slaOnTime
      }));
    }
  }, [entries, personalizedMetrics]);

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      submitted: 'default',
      approved: 'default',
      rejected: 'destructive'
    };
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getScoreBadge = (score) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">A ({score.toFixed(1)})</Badge>;
    if (score >= 75) return <Badge className="bg-blue-100 text-blue-800">B ({score.toFixed(1)})</Badge>;
    if (score >= 65) return <Badge className="bg-yellow-100 text-yellow-800">C ({score.toFixed(1)})</Badge>;
    return <Badge className="bg-red-100 text-red-800">D ({score.toFixed(1)})</Badge>;
  };

  const getRiskBadge = (isRisk) => {
    return isRisk ? (
      <Badge className="bg-red-100 text-red-800">
        <AlertTriangle className="w-3 h-3 mr-1" />
        High Risk
      </Badge>
    ) : (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Healthy
      </Badge>
    );
  };

  // Filter options for AdvancedFilters component
  const filterOptions = useMemo(() => {
    if (!entries.length) return {};
    
    return createFilterOptions(entries, {
      clients: 'client_name',
      status: 'status',
      types: 'type',
      months: 'month'
    });
  }, [entries]);

  // Apply filters to entries data
  const filteredEntries = useMemo(() => {
    return applyFilters(entries, filters, {
      searchFields: ['client_name', 'month', 'type', 'status'],
      dateFields: ['created_at', 'updated_at'],
      customFilters: {
        riskLevel: (entry, value) => {
          if (!value) return true;
          if (value === 'high') return entry.churn_risk_flag;
          if (value === 'low') return !entry.churn_risk_flag;
          return true;
        }
      }
    });
  }, [entries, filters]);

  const isEmployee = user.role === 'employee';
  const isLeadOrAdmin = ['lead', 'admin'].includes(user.role);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Servicing Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {isEmployee ? `Welcome back, ${user.name}` : 'Team Performance Overview'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Calendar className="w-4 h-4 mr-2" />
            Add Previous Month Data
          </Button>
          {isLeadOrAdmin && (
            <Button 
              variant="outline"
              onClick={handleExportReport}
              disabled={loading || isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <p className="text-gray-600">Loading client servicing data...</p>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">YTD Avg Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.ytdAvgScore.toFixed(1)}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Month Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.lastMonthScore.toFixed(1)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.activeClients}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg NPS (90d)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.avgNPS.toFixed(1)}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SLA On-time %</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardMetrics.slaOnTime.toFixed(1)}%
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="performance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="performance" disabled={loading || isExporting}>Performance Table</TabsTrigger>
              {isLeadOrAdmin && <TabsTrigger value="portfolio" disabled={loading || isExporting}>Portfolio View</TabsTrigger>}
              <TabsTrigger value="analytics" disabled={loading || isExporting}>Analytics</TabsTrigger>
              <TabsTrigger value="planning" disabled={loading || isExporting}>Planning</TabsTrigger>
            </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* Advanced Filters */}
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            filterOptions={filterOptions}
            onExport={() => exportToCSV(filteredEntries, 'client-servicing-performance')}
            customFilters={[
              {
                key: 'riskLevel',
                label: 'Risk Level',
                type: 'select',
                options: ['Low', 'Medium', 'High', 'Critical']
              }
            ]}
          />

          {/* Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">Month</th>
                      <th className="text-left p-3 font-medium text-gray-700">Client</th>
                      <th className="text-left p-3 font-medium text-gray-700">Type</th>
                      <th className="text-left p-3 font-medium text-gray-700">Meetings</th>
                      <th className="text-left p-3 font-medium text-gray-700">SLA Closure %</th>
                      <th className="text-left p-3 font-medium text-gray-700">Breaches</th>
                      <th className="text-left p-3 font-medium text-gray-700">Escalations</th>
                      <th className="text-left p-3 font-medium text-gray-700">NPS</th>
                      <th className="text-left p-3 font-medium text-gray-700">Upsells (D/C)</th>
                      <th className="text-left p-3 font-medium text-gray-700">Renewal Stage</th>
                      <th className="text-left p-3 font-medium text-gray-700">Account Health</th>
                      <th className="text-left p-3 font-medium text-gray-700">Month Score</th>
                      <th className="text-left p-3 font-medium text-gray-700">Risk</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status</th>
                      <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{entry.month}</td>
                        <td className="p-3 font-medium">{entry.client_name}</td>
                        <td className="p-3">
                          <Badge variant={entry.client_type === 'Premium' ? 'default' : 'secondary'}>
                            {entry.client_type}
                          </Badge>
                        </td>
                        <td className="p-3">{entry.meetings_count}</td>
                        <td className="p-3">{entry.sla_closure_rate.toFixed(1)}%</td>
                        <td className="p-3">{entry.breach_rate.toFixed(1)}%</td>
                        <td className="p-3">{entry.escalations_count}</td>
                        <td className="p-3">{entry.nps_client}/10</td>
                        <td className="p-3">{entry.upsell_discussions}/{entry.upsells_closed}</td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {entry.renewal_stage.charAt(0).toUpperCase() + entry.renewal_stage.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-3">{entry.account_health_score.toFixed(1)}/10</td>
                        <td className="p-3">{getScoreBadge(entry.month_score)}</td>
                        <td className="p-3">{getRiskBadge(entry.churn_risk_flag)}</td>
                        <td className="p-3">{getStatusBadge(entry.status)}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">View</Button>
                            {(entry.status === 'draft' || isLeadOrAdmin) && (
                              <Button size="sm" variant="outline">Edit</Button>
                            )}
                            {entry.status === 'draft' && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Submit</Button>
                            )}
                            {isLeadOrAdmin && entry.status === 'submitted' && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">Approve</Button>
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

        {isLeadOrAdmin && (
          <TabsContent value="portfolio" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Portfolio Overview */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Portfolio Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h3 className="font-medium text-red-800">Red Accounts</h3>
                        <p className="text-2xl font-bold text-red-900">2</p>
                        <p className="text-sm text-red-600">High churn risk</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h3 className="font-medium text-yellow-800">Amber Accounts</h3>
                        <p className="text-2xl font-bold text-yellow-900">3</p>
                        <p className="text-sm text-yellow-600">Needs attention</p>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-medium text-green-800">Green Accounts</h3>
                      <p className="text-2xl font-bold text-green-900">8</p>
                      <p className="text-sm text-green-600">Performing well</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">John Doe</span>
                      <Badge className="bg-green-100 text-green-800">A (87.5)</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Jane Smith</span>
                      <Badge className="bg-blue-100 text-blue-800">B (78.2)</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Mike Johnson</span>
                      <Badge className="bg-yellow-100 text-yellow-800">C (69.8)</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown (100-Point System)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Servicing Hygiene & Cadence</span>
                    <span className="font-medium">22.0/25</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">SLA & Issue Management</span>
                    <span className="font-medium">23.5/25</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Relationship & Risk</span>
                    <span className="font-medium">18.5/20</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Commercials</span>
                    <span className="font-medium">13.0/15</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Account Health</span>
                    <span className="font-medium">8.5/10</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Mentor Quality</span>
                    <span className="font-medium">4.0/5</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center font-bold">
                    <span>Total Score</span>
                    <span>89.5/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-800">SLA Performance</h3>
                    <p className="text-sm text-blue-600">Consistent 90%+ closure rate</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium text-green-800">Client Satisfaction</h3>
                    <p className="text-sm text-green-600">NPS trending upward</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h3 className="font-medium text-yellow-800">Upsell Opportunities</h3>
                    <p className="text-sm text-yellow-600">3 active discussions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Next Month Planning */}
            <Card>
              <CardHeader>
                <CardTitle>Next Month Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Acme Corp - Premium</h3>
                    <p className="text-sm text-gray-600 mb-2">Planned Activities:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Q1 strategy review meeting</li>
                      <li>• Campaign performance analysis</li>
                      <li>• Upsell proposal presentation</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Beta Ltd - Standard</h3>
                    <p className="text-sm text-gray-600 mb-2">Risk Mitigation:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Address performance concerns</li>
                      <li>• Improve communication cadence</li>
                      <li>• Renewal discussion initiation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle>Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm">Follow up on Beta Ltd escalation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Prepare Acme Corp upsell proposal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Schedule Gamma Inc renewal meeting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Update campaign calendars</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientServicingDashboard;