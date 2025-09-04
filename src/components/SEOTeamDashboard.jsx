/**
 * SEO Team Dashboard
 * Dashboard for Team Leads and Admins to manage team performance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download,
  Eye,
  ThumbsUp,
  MessageSquare,
  Star
} from 'lucide-react';
import seoApi from '@/api/seoApi';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { toast } from 'react-hot-toast';
import SEODataEntryForm from './SEODataEntryForm';

const SEOTeamDashboard = () => {
  const { user } = useUnifiedAuth();
  const [teamData, setTeamData] = useState(null);
  const [pendingEntries, setPendingEntries] = useState([]);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [lowPerformers, setLowPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [filters, setFilters] = useState({
    month: '',
    employee: '',
    status: 'all'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [teamDataRes, pendingRes, performanceRes] = await Promise.all([
        seoApi.getTeamDashboard(),
        seoApi.getPendingEntries(),
        seoApi.getTeamPerformance()
      ]);
      
      setTeamData(teamDataRes);
      setPendingEntries(pendingRes);
      setTeamPerformance(performanceRes);
      
      // Identify low performers (score < 65 for last 2 months)
      const lowPerformersData = performanceRes.filter(emp => 
        emp.recent_avg_score < 65 && emp.entries_count >= 2
      );
      setLowPerformers(lowPerformersData);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEntry = async (entryId) => {
    try {
      await seoApi.approveEntry(entryId, {
        reviewer_id: user?.id,
        review_comment: 'Approved'
      });
      toast.success('Entry approved successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to approve entry:', error);
      toast.error('Failed to approve entry');
    }
  };

  const handleReturnEntry = async (entryId, comment) => {
    try {
      await seoApi.returnEntry(entryId, {
        reviewer_id: user?.id,
        review_comment: comment || 'Returned for revision'
      });
      toast.success('Entry returned for revision');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to return entry:', error);
      toast.error('Failed to return entry');
    }
  };

  const handleAddMentorScore = async (entryId, score) => {
    try {
      await seoApi.addMentorScore(entryId, {
        mentor_score: score,
        mentor_id: user?.id
      });
      toast.success('Mentor score added successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Failed to add mentor score:', error);
      toast.error('Failed to add mentor score');
    }
  };

  const exportData = async () => {
    try {
      const data = await seoApi.exportTeamData(filters);
      // Create and download CSV
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-team-performance-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">A</Badge>;
    if (score >= 75) return <Badge className="bg-blue-100 text-blue-800">B</Badge>;
    if (score >= 65) return <Badge className="bg-yellow-100 text-yellow-800">C</Badge>;
    return <Badge className="bg-red-100 text-red-800">D</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading team dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SEO Team Dashboard</h1>
          <p className="text-muted-foreground">Manage team performance and review submissions</p>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      {teamData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold">{teamData.total_employees}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Team Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(teamData.avg_team_score)}`}>
                    {teamData.avg_team_score?.toFixed(1) || 'N/A'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Reviews</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingEntries.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Performers</p>
                  <p className="text-2xl font-bold text-red-600">{lowPerformers.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Reviews ({pendingEntries.length})</TabsTrigger>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
          <TabsTrigger value="low-performers">Low Performers ({lowPerformers.length})</TabsTrigger>
        </TabsList>

        {/* Pending Reviews Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entries Awaiting Review</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingEntries.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-muted-foreground">No entries pending review</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.employee_name}
                        </TableCell>
                        <TableCell>{entry.client_name}</TableCell>
                        <TableCell>{entry.month}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={getScoreColor(entry.month_score)}>
                              {entry.month_score?.toFixed(1) || 'N/A'}
                            </span>
                            {getScoreBadge(entry.month_score)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(entry.submitted_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEntry(entry);
                                setShowEntryForm(true);
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveEntry(entry.id)}
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const comment = prompt('Return reason:');
                                if (comment) handleReturnEntry(entry.id, comment);
                              }}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Return
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Team Performance Overview</CardTitle>
                <div className="flex gap-2">
                  <Select value={filters.month} onValueChange={(value) => setFilters(prev => ({ ...prev, month: value }))}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Months</SelectItem>
                      <SelectItem value="2024-01">January 2024</SelectItem>
                      <SelectItem value="2024-02">February 2024</SelectItem>
                      <SelectItem value="2024-03">March 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Active Clients</TableHead>
                    <TableHead>Entries This Month</TableHead>
                    <TableHead>Avg Score (3M)</TableHead>
                    <TableHead>Last Score</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamPerformance.map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell className="font-medium">
                        {employee.employee_name}
                      </TableCell>
                      <TableCell>{employee.active_clients}</TableCell>
                      <TableCell>{employee.entries_this_month}</TableCell>
                      <TableCell>
                        <span className={getScoreColor(employee.avg_score_3m)}>
                          {employee.avg_score_3m?.toFixed(1) || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={getScoreColor(employee.last_score)}>
                          {employee.last_score?.toFixed(1) || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {employee.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {employee.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                        {employee.trend === 'stable' && <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {getScoreBadge(employee.avg_score_3m)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Performers Tab */}
        <TabsContent value="low-performers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Employees Requiring Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowPerformers.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium">Great team performance!</p>
                  <p className="text-muted-foreground">No employees currently underperforming</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Recent Avg Score</TableHead>
                      <TableHead>Entries Count</TableHead>
                      <TableHead>Main Issues</TableHead>
                      <TableHead>Action Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowPerformers.map((employee) => (
                      <TableRow key={employee.employee_id}>
                        <TableCell className="font-medium">
                          {employee.employee_name}
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">
                            {employee.recent_avg_score?.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>{employee.entries_count}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {employee.low_traffic_growth && (
                              <Badge variant="destructive" className="text-xs">Low Traffic</Badge>
                            )}
                            {employee.poor_deliveries && (
                              <Badge variant="destructive" className="text-xs">Poor Deliveries</Badge>
                            )}
                            {employee.technical_issues && (
                              <Badge variant="destructive" className="text-xs">Technical Issues</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-orange-600">
                            PIP Consideration
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <SEODataEntryForm
          entry={selectedEntry}
          onClose={() => {
            setShowEntryForm(false);
            setSelectedEntry(null);
          }}
          onSave={() => {
            setShowEntryForm(false);
            setSelectedEntry(null);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
};

export default SEOTeamDashboard;