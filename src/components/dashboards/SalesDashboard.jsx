import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import DashboardLayout from '../layouts/DashboardLayout';
import { supabase } from '@/shared/lib/supabase';
import { exportReport, reportUtils } from '../../utils/reportGenerator';
import { useToast } from '@/shared/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Eye, 
  Filter, 
  Search, 
  Download, 
  Upload, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Activity, 
  Award, 
  Briefcase, 
  Building, 
  UserPlus, 
  PhoneCall, 
  MessageSquare, 
  FileText, 
  Handshake, 
  Star, 
  Zap, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Calculator, 
  CreditCard, 
  Wallet, 
  ShoppingCart, 
  Package, 
  Truck, 
  MapPin, 
  Globe, 
  Smartphone, 
  Laptop, 
  Monitor, 
  Database, 
  Settings, 
  Bell, 
  Flag
} from 'lucide-react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';

const SalesDashboard = () => {
  const { user } = useUnifiedAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [leads, setLeads] = useState([]);
  const [salesMetrics, setSalesMetrics] = useState(null);

  // Load sales data from Supabase
  useEffect(() => {
    const loadSalesData = async () => {
      try {
        setIsLoading(true);
        
        // Try to fetch employees data for leads simulation
        const { data: employees, error: employeesError } = await supabase
          .from('employees')
          .select('*')
          .limit(10);
        
        if (employees && !employeesError) {
          // Convert employees to leads format
          const leadsData = employees.map((emp, index) => ({
            id: `LED${String(index + 1).padStart(3, '0')}`,
            name: `${emp.name || 'Unknown'} Company`,
            contact: emp.name || 'Unknown Contact',
            email: emp.email || 'no-email@example.com',
            phone: emp.phone || '+91-9876543210',
            value: Math.floor(Math.random() * 150000) + 50000,
            stage: ['initial', 'qualified', 'proposal', 'negotiation', 'closed'][Math.floor(Math.random() * 5)],
            probability: Math.floor(Math.random() * 80) + 20,
            source: ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Trade Show'][Math.floor(Math.random() * 5)],
            lastContact: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            nextAction: ['Follow-up call', 'Send proposal', 'Schedule demo', 'Send contract', 'Qualification call'][Math.floor(Math.random() * 5)]
          }));
          
          setLeads(leadsData);
          
          // Calculate metrics from leads data
          const totalValue = leadsData.reduce((sum, lead) => sum + lead.value, 0);
          const qualifiedLeads = leadsData.filter(lead => ['qualified', 'proposal', 'negotiation'].includes(lead.stage));
          const closedLeads = leadsData.filter(lead => lead.stage === 'closed');
          
          const calculatedMetrics = {
            totalRevenue: totalValue,
            monthlyTarget: 3000000,
            achievementRate: ((totalValue / 3000000) * 100).toFixed(1),
            totalLeads: leadsData.length,
            qualifiedLeads: qualifiedLeads.length,
            convertedLeads: closedLeads.length,
            conversionRate: leadsData.length ? ((closedLeads.length / leadsData.length) * 100).toFixed(1) : 0,
            averageDealSize: closedLeads.length ? Math.floor(totalValue / closedLeads.length) : Math.floor(totalValue / leadsData.length),
            salesCycle: 28,
            activePipeline: Math.floor(totalValue * 0.65),
            closedDeals: closedLeads.length,
            lostDeals: Math.floor(leadsData.length * 0.2),
            winRate: closedLeads.length ? ((closedLeads.length / (closedLeads.length + Math.floor(leadsData.length * 0.2))) * 100).toFixed(1) : 80.0,
            monthlyGrowth: 18.5,
            quarterlyGrowth: 32.1,
            yearlyGrowth: 45.8
          };
          
          setSalesMetrics(calculatedMetrics);
        } else {
          // Fallback to mock data
          setLeads(mockLeads);
          setSalesMetrics(mockSalesMetrics);
        }
      } catch (error) {
        console.log('Using fallback mock data for sales dashboard');
        setLeads(mockLeads);
        setSalesMetrics(mockSalesMetrics);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSalesData();
  }, []);

  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');

  // Button handlers
  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      
      // Prepare sales report data
      const reportData = {
        summary: {
          totalRevenue: salesMetrics.totalRevenue,
          totalLeads: salesMetrics.totalLeads,
          conversionRate: salesMetrics.conversionRate,
          avgDealSize: salesMetrics.avgDealSize
        },
        leads: salesData.leads || [],
        deals: salesData.deals || [],
        performance: salesData.performance || [],
        generatedAt: new Date().toISOString(),
        reportPeriod: 'Current Month'
      };
      
      const filename = reportUtils.generateFilename('sales_report', exportFormat);
      
      const result = await exportReport(reportData, exportFormat, 'salesReport', filename);
      
      if (result.success) {
        toast({
          title: "Report Exported",
          description: `Sales report has been exported as ${exportFormat.toUpperCase()}.`,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Error exporting sales report:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export sales report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddLead = () => {
    setShowAddLeadModal(true);
    // Simulate add lead functionality
    setTimeout(() => {
      alert('New lead form opened!');
      setShowAddLeadModal(false);
    }, 1000);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'add_lead':
        alert('Opening Add New Lead form...');
        break;
      case 'schedule_call':
        alert('Opening Schedule Call dialog...');
        break;
      case 'create_proposal':
        alert('Opening Create Proposal form...');
        break;
      case 'send_followup':
        alert('Opening Send Follow-up email...');
        break;
      case 'view_reports':
        alert('Opening Sales Reports...');
        break;
      default:
        alert(`${action} functionality coming soon!`);
    }
  };

  const handleLeadAction = (leadId, action) => {
    const lead = leads.find(l => l.id === leadId);
    if (action === 'view') {
      setSelectedLead(lead);
      alert(`Viewing details for ${lead?.name}`);
    } else if (action === 'edit') {
      alert(`Editing ${lead?.name}`);
    }
  };

  // Calculate sales metrics (dynamic when data available, fallback to mock)
  const calculateSalesMetrics = () => {
    if (salesData && salesData.entries && salesData.entries.length > 0) {
      const currentMonth = salesData.entries.filter(entry => {
        const entryDate = new Date(entry.month);
        const currentDate = new Date();
        return entryDate.getMonth() === currentDate.getMonth() && 
               entryDate.getFullYear() === currentDate.getFullYear();
      });
      
      const totalRevenue = currentMonth.reduce((sum, entry) => sum + (entry.revenue_won || 0), 0);
      const totalLeads = currentMonth.reduce((sum, entry) => sum + (entry.new_leads || 0), 0);
      const convertedLeads = currentMonth.reduce((sum, entry) => sum + (entry.deals_won || 0), 0);
      const lostDeals = currentMonth.reduce((sum, entry) => sum + (entry.deals_lost || 0), 0);
      
      return {
        totalRevenue: totalRevenue || 2850000,
        monthlyTarget: 3000000,
        achievementRate: totalRevenue ? ((totalRevenue / 3000000) * 100).toFixed(1) : 95.0,
        totalLeads: totalLeads || 245,
        qualifiedLeads: Math.floor((totalLeads || 245) * 0.64),
        convertedLeads: convertedLeads || 48,
        conversionRate: totalLeads ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 19.6,
        averageDealSize: convertedLeads ? Math.floor(totalRevenue / convertedLeads) : 59375,
        salesCycle: 28,
        activePipeline: Math.floor((totalRevenue || 2850000) * 0.65),
        closedDeals: convertedLeads || 48,
        lostDeals: lostDeals || 12,
        winRate: (convertedLeads + lostDeals) ? (((convertedLeads || 48) / ((convertedLeads || 48) + (lostDeals || 12))) * 100).toFixed(1) : 80.0,
        monthlyGrowth: 18.5,
        quarterlyGrowth: 32.1,
        yearlyGrowth: 45.8
      };
    }
    
    // Fallback mock data
    return {
      totalRevenue: 2850000,
      monthlyTarget: 3000000,
      achievementRate: 95.0,
      totalLeads: 245,
      qualifiedLeads: 156,
      convertedLeads: 48,
      conversionRate: 19.6,
      averageDealSize: 59375,
      salesCycle: 28,
      activePipeline: 1850000,
      closedDeals: 48,
      lostDeals: 12,
      winRate: 80.0,
      monthlyGrowth: 18.5,
      quarterlyGrowth: 32.1,
      yearlyGrowth: 45.8
    };
  };
  
  const mockSalesMetrics = calculateSalesMetrics();

  const mockLeads = [
    { 
      id: 'LED001', 
      name: 'TechCorp Solutions', 
      contact: 'John Smith', 
      email: 'john@techcorp.com', 
      phone: '+91-9876543210', 
      value: 125000, 
      stage: 'proposal', 
      probability: 75, 
      source: 'Website', 
      lastContact: '2024-01-15',
      nextAction: 'Follow-up call'
    },
    { 
      id: 'LED002', 
      name: 'StartupXYZ', 
      contact: 'Sarah Johnson', 
      email: 'sarah@startupxyz.com', 
      phone: '+91-9876543211', 
      value: 85000, 
      stage: 'negotiation', 
      probability: 85, 
      source: 'Referral', 
      lastContact: '2024-01-14',
      nextAction: 'Send contract'
    },
    { 
      id: 'LED003', 
      name: 'Enterprise Inc', 
      contact: 'Michael Brown', 
      email: 'michael@enterprise.com', 
      phone: '+91-9876543212', 
      value: 195000, 
      stage: 'discovery', 
      probability: 45, 
      source: 'Cold Call', 
      lastContact: '2024-01-13',
      nextAction: 'Schedule demo'
    },
    { 
      id: 'LED004', 
      name: 'Digital Agency', 
      contact: 'Emily Davis', 
      email: 'emily@digitalagency.com', 
      phone: '+91-9876543213', 
      value: 75000, 
      stage: 'qualified', 
      probability: 60, 
      source: 'LinkedIn', 
      lastContact: '2024-01-12',
      nextAction: 'Send proposal'
    },
    { 
      id: 'LED005', 
      name: 'Local Business', 
      contact: 'David Wilson', 
      email: 'david@localbiz.com', 
      phone: '+91-9876543214', 
      value: 45000, 
      stage: 'initial', 
      probability: 25, 
      source: 'Trade Show', 
      lastContact: '2024-01-11',
      nextAction: 'Qualification call'
    }
  ];

  const salesActivities = [
    { type: 'call', description: 'Follow-up call with TechCorp Solutions', time: '10:30 AM', status: 'completed' },
    { type: 'email', description: 'Sent proposal to StartupXYZ', time: '11:45 AM', status: 'completed' },
    { type: 'meeting', description: 'Demo scheduled with Enterprise Inc', time: '2:00 PM', status: 'upcoming' },
    { type: 'call', description: 'Qualification call with Digital Agency', time: '3:30 PM', status: 'upcoming' },
    { type: 'email', description: 'Follow-up email to Local Business', time: '4:15 PM', status: 'pending' }
  ];

  const salesTargets = [
    { metric: 'Monthly Revenue', target: 3000000, achieved: 2850000, unit: 'INR' },
    { metric: 'New Leads', target: 50, achieved: 48, unit: 'leads' },
    { metric: 'Conversion Rate', target: 20, achieved: 19.6, unit: '%' },
    { metric: 'Deal Size', target: 60000, achieved: 59375, unit: 'INR' },
    { metric: 'Sales Calls', target: 100, achieved: 95, unit: 'calls' }
  ];

  // Calculate top performers (dynamic when data available, fallback to mock)
  const calculateTopPerformers = () => {
    if (salesData && salesData.users && salesData.entries && salesData.users.length > 0) {
      return salesData.users.slice(0, 4).map((user, index) => {
        const userEntries = salesData.entries.filter(entry => entry.employee_id === user.id);
        const totalRevenue = userEntries.reduce((sum, entry) => sum + (entry.revenue_won || 0), 0);
        const totalDeals = userEntries.reduce((sum, entry) => sum + (entry.deals_won || 0), 0);
        const totalLeads = userEntries.reduce((sum, entry) => sum + (entry.new_leads || 0), 0);
        
        return {
          name: user.name || `Sales Rep ${index + 1}`,
          revenue: totalRevenue || (450000 - index * 65000),
          deals: totalDeals || (12 - index * 1),
          conversion: totalLeads ? ((totalDeals / totalLeads) * 100).toFixed(1) : (22.5 - index * 1.7),
          growth: (28.3 - index * 2.6).toFixed(1)
        };
      });
    }
    
    // Fallback mock data
    return [
      { name: 'Alex Kumar', revenue: 450000, deals: 12, conversion: 22.5, growth: 28.3 },
      { name: 'Priya Sharma', revenue: 385000, deals: 10, conversion: 20.8, growth: 25.1 },
      { name: 'Rahul Patel', revenue: 320000, deals: 8, conversion: 18.9, growth: 22.7 },
      { name: 'Sneha Gupta', revenue: 295000, deals: 9, conversion: 19.2, growth: 20.4 }
    ];
  };
  
  const topPerformers = calculateTopPerformers();

  const getStageColor = (stage) => {
    switch (stage) {
      case 'initial': return 'bg-gray-100 text-gray-800';
      case 'qualified': return 'bg-blue-100 text-blue-800';
      case 'discovery': return 'bg-yellow-100 text-yellow-800';
      case 'proposal': return 'bg-orange-100 text-orange-800';
      case 'negotiation': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
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

  const getTargetProgress = (achieved, target) => {
    return Math.min((achieved / target) * 100, 100);
  };

  return (
    <DashboardLayout title="Sales Dashboard">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading sales data...</p>
          </div>
        </div>
      ) : (
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleExportReport}
            disabled={showExportModal}
          >
            <Download className="h-4 w-4" />
            {showExportModal ? 'Exporting...' : 'Export Report'}
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={handleAddLead}
            disabled={showAddLeadModal}
          >
            <Plus className="h-4 w-4" />
            {showAddLeadModal ? 'Opening...' : 'Add Lead'}
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(salesMetrics?.totalRevenue || 0)}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{salesMetrics?.monthlyGrowth || 0}% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Achievement</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{salesMetrics?.achievementRate || 0}%</div>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <Target className="h-3 w-3 mr-1" />
                {formatCurrency(salesMetrics?.monthlyTarget || 0)} target
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Percent className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{salesMetrics?.conversionRate || 0}%</div>
              <div className="flex items-center text-xs text-purple-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {salesMetrics?.convertedLeads || 0}/{salesMetrics?.totalLeads || 0} leads
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <Calculator className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(salesMetrics?.averageDealSize || 0)}</div>
              <div className="flex items-center text-xs text-orange-600 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {salesMetrics?.salesCycle || 0} days cycle
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pipeline Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Pipeline Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Active Pipeline</span>
                    <span className="font-bold text-blue-600">{formatCurrency(salesMetrics?.activePipeline || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Closed Deals</span>
                    <span className="font-bold text-green-600">{salesMetrics?.closedDeals || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Win Rate</span>
                    <span className="font-bold text-purple-600">{salesMetrics?.winRate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Lost Deals</span>
                    <span className="font-bold text-red-600">{salesMetrics?.lostDeals || 0}</span>
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
                    onClick={() => handleQuickAction('add_lead')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Lead
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('schedule_call')}
                  >
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Schedule Call
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('create_proposal')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Create Proposal
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('send_followup')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Follow-up
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => handleQuickAction('view_reports')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sales Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Next Action</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.contact}</div>
                            <div className="text-xs text-gray-500">{lead.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(lead.value)}</TableCell>
                        <TableCell>
                          <Badge className={getStageColor(lead.stage)}>
                            {lead.stage}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${lead.probability}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{lead.probability}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{lead.source}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{lead.nextAction}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleLeadAction(lead.id, 'view')}
                              title="View Lead Details"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleLeadAction(lead.id, 'edit')}
                              title="Edit Lead"
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

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          activity.status === 'completed' ? 'bg-green-100 text-green-600' :
                          activity.status === 'upcoming' ? 'bg-blue-100 text-blue-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <div className="font-medium">{activity.description}</div>
                          <div className="text-sm text-gray-500">{activity.time}</div>
                        </div>
                      </div>
                      <Badge className={`${
                        activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                        activity.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Targets Tab */}
          <TabsContent value="targets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Sales Targets & Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesTargets.map((target, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{target.metric}</span>
                        <span className="text-sm text-gray-500">
                          {target.unit === 'INR' ? formatCurrency(target.achieved) : `${target.achieved} ${target.unit}`} / 
                          {target.unit === 'INR' ? formatCurrency(target.target) : `${target.target} ${target.unit}`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            getTargetProgress(target.achieved, target.target) >= 90 ? 'bg-green-600' :
                            getTargetProgress(target.achieved, target.target) >= 70 ? 'bg-blue-600' :
                            getTargetProgress(target.achieved, target.target) >= 50 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${getTargetProgress(target.achieved, target.target)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">
                          {getTargetProgress(target.achieved, target.target).toFixed(1)}% achieved
                        </span>
                        <span className={`text-sm font-medium ${
                          getTargetProgress(target.achieved, target.target) >= 90 ? 'text-green-600' :
                          getTargetProgress(target.achieved, target.target) >= 70 ? 'text-blue-600' :
                          getTargetProgress(target.achieved, target.target) >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {getTargetProgress(target.achieved, target.target) >= 100 ? 'Target Exceeded!' :
                           getTargetProgress(target.achieved, target.target) >= 90 ? 'Almost There!' :
                           getTargetProgress(target.achieved, target.target) >= 70 ? 'Good Progress' :
                           'Needs Attention'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Deals Closed</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Growth</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPerformers.map((performer, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{performer.name}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(performer.revenue)}</TableCell>
                        <TableCell>{performer.deals}</TableCell>
                        <TableCell>{performer.conversion}%</TableCell>
                        <TableCell className="text-green-600 font-medium">+{performer.growth}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${
                                  i < Math.floor(performer.conversion / 5) 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      )}
    </DashboardLayout>
  );
};

export default SalesDashboard;