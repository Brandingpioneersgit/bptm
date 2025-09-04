import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Users, Target, TrendingUp, Phone, Mail, Video, MessageSquare, FileText, Plus, Filter, Download, Eye, Edit, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

const SalesCRMDashboard = () => {
  const [userRole, setUserRole] = useState('sales_executive'); // admin, sales_lead, sales_executive, reviewer_mentor
  const [selectedMonth, setSelectedMonth] = useState('2024-01');
  const [activeTab, setActiveTab] = useState('leads');
  const [viewMode, setViewMode] = useState('kanban'); // kanban, table
  const [showCreateLead, setShowCreateLead] = useState(false);
  const [filters, setFilters] = useState({
    stage: 'all',
    source: 'all',
    priority: 'all',
    ageing: 'all'
  });

  // Mock data - replace with actual API calls
  const currentUser = {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@company.com',
    role: userRole
  };

  const monthlyMetrics = {
    newLeads: 15,
    meetings: 12,
    proposals: 5,
    wonAmount: 150000,
    pipelineAmount: 450000,
    winRate: 40,
    avgFollowupSLA: 18
  };

  const teamMetrics = {
    totalRevenue: 850000,
    revenueTarget: 1000000,
    forecastRisk: 15,
    staleLeads: 23,
    avgWinRate: 35
  };

  const leads = [
    {
      id: '1',
      leadName: 'Tech Solutions Inc',
      company: 'Tech Solutions Inc',
      contactName: 'Alice Johnson',
      email: 'alice@techsolutions.com',
      phone: '+91-9876543210',
      stage: 'qualified',
      source: 'website',
      estAmount: 75000,
      probability: 60,
      estCloseDate: '2024-02-15',
      lastContacted: '2024-01-20',
      nextAction: '2024-01-25',
      ageing: 5,
      owner: 'John Smith',
      priority: 'high',
      serviceInterest: ['seo', 'web']
    },
    {
      id: '2',
      leadName: 'Digital Marketing Co',
      company: 'Digital Marketing Co',
      contactName: 'Bob Wilson',
      email: 'bob@digitalmarketing.com',
      phone: '+91-9876543211',
      stage: 'proposal_sent',
      source: 'google_ads',
      estAmount: 120000,
      probability: 75,
      estCloseDate: '2024-02-28',
      lastContacted: '2024-01-22',
      nextAction: '2024-01-26',
      ageing: 3,
      owner: 'John Smith',
      priority: 'high',
      serviceInterest: ['ads', 'social']
    },
    {
      id: '3',
      leadName: 'E-commerce Startup',
      company: 'E-commerce Startup',
      contactName: 'Carol Davis',
      email: 'carol@ecommerce.com',
      phone: '+91-9876543212',
      stage: 'discovery',
      source: 'reference',
      estAmount: 50000,
      probability: 40,
      estCloseDate: '2024-03-10',
      lastContacted: '2024-01-19',
      nextAction: '2024-01-24',
      ageing: 6,
      owner: 'John Smith',
      priority: 'medium',
      serviceInterest: ['web', 'seo']
    }
  ];

  const activities = [
    {
      id: '1',
      leadId: '1',
      type: 'call',
      summary: 'Discussed project requirements and timeline',
      activityTime: '2024-01-20T10:30:00Z',
      duration: 30,
      outcome: 'meeting_booked',
      nextAction: 'Send proposal draft'
    },
    {
      id: '2',
      leadId: '2',
      type: 'email',
      summary: 'Sent proposal with pricing details',
      activityTime: '2024-01-22T14:15:00Z',
      outcome: 'connected',
      nextAction: 'Follow up on proposal feedback'
    }
  ];

  const performanceData = {
    revenueTargetScore: 20, // out of 25
    pipelineCoverageScore: 8, // out of 10
    leadToMeetingScore: 7, // out of 8
    meetingToProposalScore: 6, // out of 8
    proposalToWinScore: 7, // out of 9
    followupSLAScore: 8, // out of 8
    staleControlScore: 4, // out of 6
    activitiesThroughputScore: 5, // out of 6
    proposalDisciplineScore: 4, // out of 4
    dataCompletenessScore: 3, // out of 4
    mentorScore: 8, // out of 10
    csDeliveryNPS: 8, // out of 10
    totalScore: 88
  };

  const stages = [
    { key: 'new', label: 'New', color: 'bg-gray-100' },
    { key: 'qualified', label: 'Qualified', color: 'bg-blue-100' },
    { key: 'discovery', label: 'Discovery', color: 'bg-yellow-100' },
    { key: 'proposal_sent', label: 'Proposal Sent', color: 'bg-orange-100' },
    { key: 'negotiation', label: 'Negotiation', color: 'bg-purple-100' },
    { key: 'won', label: 'Won', color: 'bg-green-100' },
    { key: 'lost', label: 'Lost', color: 'bg-red-100' }
  ];

  const sources = [
    { key: 'fb_ads', label: 'Facebook Ads' },
    { key: 'website', label: 'Website' },
    { key: 'seo', label: 'SEO' },
    { key: 'google_ads', label: 'Google Ads' },
    { key: 'reference', label: 'Reference' },
    { key: 'other', label: 'Other' }
  ];

  const getStageColor = (stage) => {
    const stageObj = stages.find(s => s.key === stage);
    return stageObj ? stageObj.color : 'bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getAgeingColor = (days) => {
    if (days <= 3) return 'text-green-600';
    if (days <= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredLeads = leads.filter(lead => {
    if (filters.stage !== 'all' && lead.stage !== filters.stage) return false;
    if (filters.source !== 'all' && lead.source !== filters.source) return false;
    if (filters.priority !== 'all' && lead.priority !== filters.priority) return false;
    return true;
  });

  const renderMetricCards = () => {
    if (userRole === 'sales_executive') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New Leads</p>
                  <p className="text-2xl font-bold">{monthlyMetrics.newLeads}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Meetings</p>
                  <p className="text-2xl font-bold">{monthlyMetrics.meetings}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Proposals</p>
                  <p className="text-2xl font-bold">{monthlyMetrics.proposals}</p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Won Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(monthlyMetrics.wonAmount)}</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pipeline</p>
                  <p className="text-xl font-bold">{formatCurrency(monthlyMetrics.pipelineAmount)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold">{monthlyMetrics.winRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg SLA</p>
                  <p className="text-2xl font-bold">{monthlyMetrics.avgFollowupSLA}h</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } else {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenue vs Target</p>
                  <p className="text-xl font-bold">{formatCurrency(teamMetrics.totalRevenue)}</p>
                  <p className="text-sm text-gray-500">of {formatCurrency(teamMetrics.revenueTarget)}</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Forecast Risk</p>
                  <p className="text-2xl font-bold text-orange-600">{teamMetrics.forecastRisk}%</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stale Leads</p>
                  <p className="text-2xl font-bold text-red-600">{teamMetrics.staleLeads}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Win Rate</p>
                  <p className="text-2xl font-bold">{teamMetrics.avgWinRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Button size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  };

  const renderKanbanView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {stages.map(stage => {
          const stageLeads = filteredLeads.filter(lead => lead.stage === stage.key);
          return (
            <div key={stage.key} className={`${stage.color} p-4 rounded-lg`}>
              <h3 className="font-semibold mb-3">{stage.label} ({stageLeads.length})</h3>
              <div className="space-y-3">
                {stageLeads.map(lead => (
                  <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{lead.leadName}</h4>
                        <Badge className={getPriorityColor(lead.priority)}>
                          {lead.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{lead.contactName}</p>
                      <p className="text-sm font-semibold text-green-600 mb-2">
                        {formatCurrency(lead.estAmount)} ({lead.probability}%)
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Due: {formatDate(lead.estCloseDate)}</span>
                        <span className={getAgeingColor(lead.ageing)}>
                          {lead.ageing}d
                        </span>
                      </div>
                      <div className="flex justify-between mt-2">
                        <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTableView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left">Stage</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Lead</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Company</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Source</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Est. Amount</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Prob%</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Est. Close</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Last Contact</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Next Action</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Ageing</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map(lead => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">
                  <Badge className={getStageColor(lead.stage)}>
                    {stages.find(s => s.key === lead.stage)?.label}
                  </Badge>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <div>
                    <p className="font-medium">{lead.leadName}</p>
                    <p className="text-sm text-gray-600">{lead.contactName}</p>
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2">{lead.company}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <Badge variant="outline">
                    {sources.find(s => s.key === lead.source)?.label}
                  </Badge>
                </td>
                <td className="border border-gray-300 px-4 py-2 font-semibold text-green-600">
                  {formatCurrency(lead.estAmount)}
                </td>
                <td className="border border-gray-300 px-4 py-2">{lead.probability}%</td>
                <td className="border border-gray-300 px-4 py-2">{formatDate(lead.estCloseDate)}</td>
                <td className="border border-gray-300 px-4 py-2">{formatDate(lead.lastContacted)}</td>
                <td className="border border-gray-300 px-4 py-2">{formatDate(lead.nextAction)}</td>
                <td className="border border-gray-300 px-4 py-2">
                  <span className={getAgeingColor(lead.ageing)}>
                    {lead.ageing} days
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Mail className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPerformanceTab = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue & Target (35 pts)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Revenue Target:</span>
                  <span className="font-semibold">{performanceData.revenueTargetScore}/25</span>
                </div>
                <div className="flex justify-between">
                  <span>Pipeline Coverage:</span>
                  <span className="font-semibold">{performanceData.pipelineCoverageScore}/10</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Subtotal:</span>
                    <span>{performanceData.revenueTargetScore + performanceData.pipelineCoverageScore}/35</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion (25 pts)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Lead→Meeting:</span>
                  <span className="font-semibold">{performanceData.leadToMeetingScore}/8</span>
                </div>
                <div className="flex justify-between">
                  <span>Meeting→Proposal:</span>
                  <span className="font-semibold">{performanceData.meetingToProposalScore}/8</span>
                </div>
                <div className="flex justify-between">
                  <span>Proposal→Win:</span>
                  <span className="font-semibold">{performanceData.proposalToWinScore}/9</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Subtotal:</span>
                    <span>{performanceData.leadToMeetingScore + performanceData.meetingToProposalScore + performanceData.proposalToWinScore}/25</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Velocity & Discipline (20 pts)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Follow-up SLA:</span>
                  <span className="font-semibold">{performanceData.followupSLAScore}/8</span>
                </div>
                <div className="flex justify-between">
                  <span>Stale Control:</span>
                  <span className="font-semibold">{performanceData.staleControlScore}/6</span>
                </div>
                <div className="flex justify-between">
                  <span>Activities:</span>
                  <span className="font-semibold">{performanceData.activitiesThroughputScore}/6</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Subtotal:</span>
                    <span>{performanceData.followupSLAScore + performanceData.staleControlScore + performanceData.activitiesThroughputScore}/20</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hygiene & Relationship (20 pts)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Proposal Discipline:</span>
                  <span className="font-semibold">{performanceData.proposalDisciplineScore}/4</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Completeness:</span>
                  <span className="font-semibold">{performanceData.dataCompletenessScore}/4</span>
                </div>
                <div className="flex justify-between">
                  <span>Mentor Score:</span>
                  <span className="font-semibold">{(performanceData.mentorScore / 10 * 2).toFixed(1)}/2</span>
                </div>
                <div className="flex justify-between">
                  <span>CS/Delivery NPS:</span>
                  <span className="font-semibold">{(performanceData.csDeliveryNPS / 10 * 6).toFixed(1)}/6</span>
                </div>
                <div className="flex justify-between">
                  <span>Handoff Quality:</span>
                  <span className="font-semibold">4/4</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Subtotal:</span>
                    <span>{(performanceData.proposalDisciplineScore + performanceData.dataCompletenessScore + (performanceData.mentorScore / 10 * 2) + (performanceData.csDeliveryNPS / 10 * 6) + 4).toFixed(1)}/20</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Overall Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-green-600 mb-2">
                  {performanceData.totalScore}
                </div>
                <div className="text-xl text-gray-600">out of 100 points</div>
                <div className="mt-4">
                  <Badge className={`text-lg px-4 py-2 ${
                    performanceData.totalScore >= 90 ? 'bg-green-100 text-green-800' :
                    performanceData.totalScore >= 75 ? 'bg-blue-100 text-blue-800' :
                    performanceData.totalScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {performanceData.totalScore >= 90 ? 'Excellent' :
                     performanceData.totalScore >= 75 ? 'Good' :
                     performanceData.totalScore >= 60 ? 'Average' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales CRM Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser.name}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-01">Jan 2024</SelectItem>
              <SelectItem value="2023-12">Dec 2023</SelectItem>
              <SelectItem value="2023-11">Nov 2023</SelectItem>
            </SelectContent>
          </Select>
          <Select value={userRole} onValueChange={setUserRole}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales_executive">Sales Executive</SelectItem>
              <SelectItem value="sales_lead">Sales Lead</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="reviewer_mentor">Reviewer/Mentor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderMetricCards()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="leads">My Leads</TabsTrigger>
          <TabsTrigger value="calendar">Calendar & Tasks</TabsTrigger>
          <TabsTrigger value="performance">Monthly Review</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowCreateLead(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Lead
              </Button>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  onClick={() => setViewMode('kanban')}
                  size="sm"
                >
                  Kanban
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  onClick={() => setViewMode('table')}
                  size="sm"
                >
                  Table
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filters.stage} onValueChange={(value) => setFilters({...filters, stage: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {stages.map(stage => (
                    <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map(source => (
                    <SelectItem key={source.key} value={source.key}>{source.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {viewMode === 'kanban' ? renderKanbanView() : renderTableView()}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar & Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Calendar integration and task management features will be implemented here.</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <div>
                    <p className="font-medium">Follow up with Tech Solutions Inc</p>
                    <p className="text-sm text-gray-600">Due: Jan 25, 2024</p>
                  </div>
                  <Button size="sm">Mark Done</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                  <div>
                    <p className="font-medium">Send proposal to Digital Marketing Co</p>
                    <p className="text-sm text-gray-600">Due: Jan 26, 2024</p>
                  </div>
                  <Button size="sm">Mark Done</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          {renderPerformanceTab()}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded">
                    <div className="flex-shrink-0">
                      {activity.type === 'call' && <Phone className="h-5 w-5 text-blue-500" />}
                      {activity.type === 'email' && <Mail className="h-5 w-5 text-green-500" />}
                      {activity.type === 'meeting' && <Video className="h-5 w-5 text-purple-500" />}
                      {activity.type === 'whatsapp' && <MessageSquare className="h-5 w-5 text-green-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(activity.activityTime).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{activity.summary}</p>
                      {activity.duration && (
                        <p className="text-sm text-gray-500 mt-1">Duration: {activity.duration} minutes</p>
                      )}
                      {activity.outcome && (
                        <Badge className="mt-2" variant="outline">
                          {activity.outcome.replace('_', ' ')}
                        </Badge>
                      )}
                      {activity.nextAction && (
                        <p className="text-sm text-blue-600 mt-2">Next: {activity.nextAction}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesCRMDashboard;