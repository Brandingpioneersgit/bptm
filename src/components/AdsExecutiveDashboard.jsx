import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, Target, DollarSign, Eye, Edit, Plus, Filter, Download } from 'lucide-react';
import configService from '@/shared/services/configService';
import { useEnhancedErrorHandling } from '@/shared/hooks/useEnhancedErrorHandling';

const AdsExecutiveDashboard = ({ userRole = 'ads_executive', userId = 'ADS001' }) => {
  const {
    handleDataFetching,
    handleAsyncOperation,
    showSuccessNotification,
    showErrorModal,
    showWarningModal,
    showInfoModal
  } = useEnhancedErrorHandling();
  
  const [selectedMonth, setSelectedMonth] = useState('2024-01');
  const [selectedClient, setSelectedClient] = useState('');
  const [formData, setFormData] = useState({});
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [filters, setFilters] = useState({
    platform: '',
    clientType: '',
    roasRange: '',
    spendTier: '',
    riskFlag: false
  });

  // Dashboard configuration and data
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load dashboard configuration and data
  useEffect(() => {
    const loadDashboardData = async () => {
      await handleDataFetching(
        async () => {
          // Load configuration
          const config = await configService.getDashboardConfig('adsExecutive');
          setDashboardConfig(config);
          
          // Generate default data using configuration
          const defaultData = await configService.generateDefaultData('adsExecutive', { id: userId, name: 'Ads Executive' });
          if (defaultData.employee) {
            setEmployeeData(defaultData.employee);
            setClients(defaultData.clients || []);
          } else {
            // Fallback to basic data structure
            setEmployeeData({
              ytdAvgScore: 82.5,
              lastMonthScore: 85.2,
              activeAccounts: 8,
              avgRoas90d: 4.2,
              performanceBand: 'B'
            });
          }
          
          // Mock performance data (would come from API in real app)
          setPerformanceData([
            {
              id: 1,
              month: '2024-01',
              client: 'Sample Client 1',
              clientType: config?.clientTypes?.[1] || 'Large',
              ctrGrowth: 15.2,
              cvrGrowth: 8.5,
              cplGrowth: -12.3,
              leadsGrowth: 22.1,
              roasGrowth: 18.7,
              avgPos: 1.8,
              spend: 250000,
              meetings: 4,
              nps: 8,
              mentorScore: 7,
              monthScore: 85.2,
              status: 'approved'
            }
          ]);
          
          return { config, defaultData };
        },
        {
          onSuccess: (data) => {
            showInfoModal('Dashboard Loaded', 'Ads Executive dashboard data loaded successfully.');
          },
          onError: (error) => {
            showErrorModal('Dashboard Load Failed', error.message || 'Failed to load dashboard data. Using fallback data.');
          },
          onFinally: () => {
            setLoading(false);
          }
        }
      );
    };
    
    loadDashboardData();
  }, [userId, handleDataFetching, showInfoModal, showErrorModal]);

  const getScoreColor = async (score) => {
    return await handleAsyncOperation(
      async () => {
        return await configService.getScoreColor(score, 'adsExecutive');
      },
      {
        onError: () => {
          // Fallback to default colors
          if (score >= 85) return 'text-green-600';
          if (score >= 75) return 'text-blue-600';
          if (score >= 65) return 'text-yellow-600';
          return 'text-red-600';
        }
      }
    );
  };

  const getGrowthIcon = (growth) => {
    return growth > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const formatCurrency = async (amount) => {
    return await handleAsyncOperation(
      async () => {
        const { formatCurrency } = await import('../../config/dashboardConfig.js');
        return formatCurrency(amount);
      },
      {
        onError: () => {
          // Fallback to default formatting
          return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(amount);
        }
      }
    );
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setShowEntryForm(false);
    // Here you would typically send the data to your backend
  };

  const renderEmployeeView = () => {
    if (loading || !employeeData) {
      return <div className="flex justify-center items-center h-64">Loading dashboard data...</div>;
    }

    return (
      <div className="space-y-6">
        {/* Header Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">YTD Avg Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {employeeData.ytdAvgScore}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Month Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {employeeData.lastMonthScore}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Accounts</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {employeeData.activeAccounts}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg ROAS (90d)</p>
                  <p className="text-2xl font-bold text-green-600">
                    {employeeData.avgRoas90d}x
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Performance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Performance History</CardTitle>
          <Dialog open={showEntryForm} onOpenChange={setShowEntryForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Previous Month Data
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Previous Month Performance Data</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client">Client</Label>
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name} ({client.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="month">Month</Label>
                    <Input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Scope & Deliverables</h3>
                  <div>
                    <Label htmlFor="scopeCompleted">Scope Completed</Label>
                    <Textarea
                      id="scopeCompleted"
                      placeholder="Describe deliverables: campaign creation, LP optimizations, A/B tests, etc."
                      value={formData.scopeCompleted || ''}
                      onChange={(e) => setFormData({...formData, scopeCompleted: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Performance Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>CVR Previous (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cvrPrev || ''}
                        onChange={(e) => setFormData({...formData, cvrPrev: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>CVR Current (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cvrCurr || ''}
                        onChange={(e) => setFormData({...formData, cvrCurr: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>CTR Previous (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.ctrPrev || ''}
                        onChange={(e) => setFormData({...formData, ctrPrev: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>CTR Current (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.ctrCurr || ''}
                        onChange={(e) => setFormData({...formData, ctrCurr: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Leads Previous</Label>
                      <Input
                        type="number"
                        value={formData.leadsPrev || ''}
                        onChange={(e) => setFormData({...formData, leadsPrev: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Leads Current</Label>
                      <Input
                        type="number"
                        value={formData.leadsCurr || ''}
                        onChange={(e) => setFormData({...formData, leadsCurr: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>CPC Previous (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cpcPrev || ''}
                        onChange={(e) => setFormData({...formData, cpcPrev: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>CPC Current (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cpcCurr || ''}
                        onChange={(e) => setFormData({...formData, cpcCurr: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>CPL Previous (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cplPrev || ''}
                        onChange={(e) => setFormData({...formData, cplPrev: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>CPL Current (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.cplCurr || ''}
                        onChange={(e) => setFormData({...formData, cplCurr: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>ROAS Previous</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.roasPrev || ''}
                        onChange={(e) => setFormData({...formData, roasPrev: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>ROAS Current</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.roasCurr || ''}
                        onChange={(e) => setFormData({...formData, roasCurr: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Structure & Spend</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Campaigns Running</Label>
                      <Input
                        type="number"
                        value={formData.campaignsRunning || ''}
                        onChange={(e) => setFormData({...formData, campaignsRunning: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Ads per Campaign</Label>
                      <Input
                        type="number"
                        value={formData.adsPerCampaign || ''}
                        onChange={(e) => setFormData({...formData, adsPerCampaign: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Total Ad Spend (₹)</Label>
                      <Input
                        type="number"
                        value={formData.totalAdSpend || ''}
                        onChange={(e) => setFormData({...formData, totalAdSpend: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Ad Spend Breakdown</Label>
                    <Textarea
                      placeholder="Describe spend allocation across campaigns, platforms, etc."
                      value={formData.adSpendBreakdown || ''}
                      onChange={(e) => setFormData({...formData, adSpendBreakdown: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Client Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Meetings with Client</Label>
                      <Input
                        type="number"
                        value={formData.meetingsWithClient || ''}
                        onChange={(e) => setFormData({...formData, meetingsWithClient: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>NPS Score (1-10)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.npsClient || ''}
                        onChange={(e) => setFormData({...formData, npsClient: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Mentor Score (1-10)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.mentorScore || ''}
                        onChange={(e) => setFormData({...formData, mentorScore: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Next Month Plan</h3>
                  <div>
                    <Label>Activities Next Month</Label>
                    <Textarea
                      placeholder="Testing roadmap, budget pacing, LP plan, etc."
                      value={formData.activitiesNextMonth || ''}
                      onChange={(e) => setFormData({...formData, activitiesNextMonth: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowEntryForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Submit for Review
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>CTR Δ%</TableHead>
                <TableHead>CVR Δ%</TableHead>
                <TableHead>CPL Δ%</TableHead>
                <TableHead>Leads Δ%</TableHead>
                <TableHead>ROAS Δ%</TableHead>
                <TableHead>Avg Pos</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Meetings</TableHead>
                <TableHead>NPS</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{row.client}</div>
                      <div className="text-sm text-gray-500">{row.clientType}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getGrowthIcon(row.ctrGrowth)}
                      <span className={row.ctrGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {row.ctrGrowth > 0 ? '+' : ''}{row.ctrGrowth}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getGrowthIcon(row.cvrGrowth)}
                      <span className={row.cvrGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {row.cvrGrowth > 0 ? '+' : ''}{row.cvrGrowth}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getGrowthIcon(-row.cplGrowth)}
                      <span className={row.cplGrowth < 0 ? 'text-green-600' : 'text-red-600'}>
                        {row.cplGrowth > 0 ? '+' : ''}{row.cplGrowth}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getGrowthIcon(row.leadsGrowth)}
                      <span className={row.leadsGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {row.leadsGrowth > 0 ? '+' : ''}{row.leadsGrowth}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getGrowthIcon(row.roasGrowth)}
                      <span className={row.roasGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                        {row.roasGrowth > 0 ? '+' : ''}{row.roasGrowth}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{row.avgPos}</TableCell>
                  <TableCell>{formatCurrency(row.spend)}</TableCell>
                  <TableCell>{row.meetings}</TableCell>
                  <TableCell>{row.nps}/10</TableCell>
                  <TableCell>{row.mentorScore}/10</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${getScoreColor(row.monthScore)}`}>
                        {row.monthScore}%
                      </span>
                      <Progress value={row.monthScore} className="w-16" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'approved' ? 'default' : 'secondary'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {row.status === 'draft' && (
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderLeadAdminView = () => (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Portfolio Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Platform</Label>
              <Select value={filters.platform} onValueChange={(value) => setFilters({...filters, platform: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Platforms</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="meta">Meta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Client Type</Label>
              <Select value={filters.clientType} onValueChange={(value) => setFilters({...filters, clientType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="Large">Large</SelectItem>
                  <SelectItem value="SMB">SMB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ROAS Range</Label>
              <Select value={filters.roasRange} onValueChange={(value) => setFilters({...filters, roasRange: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All ROAS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All ROAS</SelectItem>
                  <SelectItem value="high">≥5x</SelectItem>
                  <SelectItem value="medium">3-5x</SelectItem>
                  <SelectItem value="low">&lt;3x</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Spend Tier</Label>
              <Select value={filters.spendTier} onValueChange={(value) => setFilters({...filters, spendTier: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Spend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Spend</SelectItem>
                  <SelectItem value="high">≥₹2L</SelectItem>
                  <SelectItem value="medium">₹1-2L</SelectItem>
                  <SelectItem value="low">&lt;₹1L</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-blue-600">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg ROAS</p>
                <p className="text-2xl font-bold text-green-600">
                  {clients.length > 0 ? (clients.reduce((sum, client) => sum + client.roas, 0) / clients.length).toFixed(1) : '0'}x
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spend</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{clients.reduce((sum, client) => sum + client.spend, 0).toLocaleString()}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Performers</p>
                <p className="text-2xl font-bold text-green-600">
                  {clients.filter(client => client.roas >= 4).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Portfolio Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Current ROAS</TableHead>
                <TableHead>Monthly Spend</TableHead>
                <TableHead>Performance Band</TableHead>
                <TableHead>Risk Flags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <Badge variant={client.type === 'Large' ? 'default' : 'secondary'}>
                      {client.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {client.platforms.map(platform => (
                        <Badge key={platform} variant="outline">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={client.roas >= 4 ? 'text-green-600 font-bold' : client.roas >= 2 ? 'text-yellow-600' : 'text-red-600'}>
                      {client.roas}x
                    </span>
                  </TableCell>
                  <TableCell>₹{client.spend.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={client.roas >= 4 ? 'default' : client.roas >= 2 ? 'secondary' : 'destructive'}>
                      {client.roas >= 4 ? 'High' : client.roas >= 2 ? 'Medium' : 'Low'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.roas < 2 && (
                      <Badge variant="destructive">Low ROAS</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl text-white p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                📊
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Ads Executive Dashboard</h1>
                <p className="text-blue-100 font-medium text-lg">
                  {userRole === 'ads_executive' ? 'Track your performance and manage ad accounts' : 'Monitor team performance and portfolio overview'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 font-medium shadow-lg hover:scale-105">
                📈 Analytics
              </button>
              <button className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 font-medium shadow-lg hover:scale-105">
                ⚙️ Settings
              </button>
            </div>
          </div>
        </div>

        {userRole === 'ads_executive' ? renderEmployeeView() : renderLeadAdminView()}
      </div>
    </div>
  );
};

export default AdsExecutiveDashboard;