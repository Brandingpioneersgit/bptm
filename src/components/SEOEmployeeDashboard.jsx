/**
 * SEO Employee Dashboard
 * Main dashboard for SEO executives with performance metrics and data entry
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye, Edit, Send, Star, TrendingUp, TrendingDown, Users, ThumbsUp } from 'lucide-react';
import seoApi from '@/api/seoApi';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import SEODataEntryForm from './SEODataEntryForm';
import { toast } from 'react-hot-toast';
import DashboardLayout from './layouts/DashboardLayout';

const SEOEmployeeDashboard = () => {
  const { user } = useUnifiedAuth();
  const [dashboardData, setDashboardData] = useState({
    ytdAvgScore: 0,
    lastMonthScore: 0,
    activeClientsCount: 0,
    avgNPS: 0
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    client: 'all',
    month: 'all'
  });

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      loadEntries();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      // Since SEO tables don't exist yet, use mock data based on available clients
      const clientsResponse = await fetch('https://igwgryykglsetfvomhdj.supabase.co/rest/v1/clients?select=*&team=eq.Marketing', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA'
        }
      });
      
      const clients = await clientsResponse.json();
      const activeClientsCount = clients?.length || 0;
      
      // Mock performance data based on active clients
      setDashboardData({
        ytdAvgScore: activeClientsCount > 0 ? 78.5 : 0,
        lastMonthScore: activeClientsCount > 0 ? 82.3 : 0,
        activeClientsCount: activeClientsCount,
        avgNPS: activeClientsCount > 0 ? 8.7 : 0
      });
      
      if (activeClientsCount === 0) {
        toast.info('No SEO clients found. Please add some clients to see your dashboard metrics.');
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set fallback data when database is empty or has issues
      setDashboardData({
        ytdAvgScore: 0,
        lastMonthScore: 0,
        activeClientsCount: 0,
        avgNPS: 0
      });
      toast.error('Dashboard data unavailable. Please add some performance entries to see metrics.');
    }
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      
      // Since SEO tables don't exist yet, create mock entries based on available clients
      const clientsResponse = await fetch('https://igwgryykglsetfvomhdj.supabase.co/rest/v1/clients?select=*&team=eq.Marketing', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA'
        }
      });
      
      const clients = await clientsResponse.json();
      
      // Create mock entries for the last 3 months
      const mockEntries = [];
      const months = ['2024-11', '2024-10', '2024-09'];
      
      clients?.forEach((client, clientIndex) => {
        months.forEach((month, monthIndex) => {
          const baseScore = 75 + (clientIndex * 5) + (monthIndex * 2);
          mockEntries.push({
            id: `mock-${client.id}-${month}`,
            employee_id: user.id,
            client_id: client.id,
            clients: { name: client.name, type: client.type || 'Small' },
            month: month,
            organic_growth_pct: 10 + clientIndex * 2 + (Math.random() * 10 - 5),
            traffic_growth_pct: 12 + clientIndex * 1.5 + (Math.random() * 8 - 4),
            serp_top3_count: 8 + clientIndex * 2,
            serp_top10_count: 15 + clientIndex * 3,
            gmb_top3_count: 3 + clientIndex,
            technical_health_score: baseScore + 5,
            month_score: baseScore + 6,
            nps_client: 8 + (clientIndex * 0.3),
            mentor_score: baseScore - 5,
            status: monthIndex === 0 ? 'draft' : 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        });
      });
      
      setEntries(mockEntries || []);
      
      if (mockEntries.length === 0 && clients?.length > 0) {
        toast.info('No entries match your current filters. Try adjusting the filters.');
      } else if (clients?.length === 0) {
        toast.info('No SEO clients found. Please add some clients first.');
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
      setEntries([]);
      toast.error('Unable to load performance entries. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEntry = async (entryId) => {
    try {
      await seoApi.submitEntry(entryId);
      toast.success('Entry submitted successfully');
      loadEntries();
      loadDashboardData();
    } catch (error) {
      console.error('Failed to submit entry:', error);
      toast.error(error.message || 'Failed to submit entry');
    }
  };

  const handleAddPreviousMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStr = lastMonth.toISOString().slice(0, 7);
    
    // Create a mock entry for the form
    const mockEntry = {
      id: `new-entry-${Date.now()}`,
      employee_id: user.id,
      client_id: '',
      month: monthStr,
      organic_growth_pct: 0,
      traffic_growth_pct: 0,
      serp_top3_count: 0,
      serp_top10_count: 0,
      gmb_top3_count: 0,
      technical_health_score: 0,
      month_score: 0,
      nps_client: 0,
      mentor_score: 0,
      status: 'draft'
    };
    
    setSelectedEntry(mockEntry);
    setShowEntryForm(true);
    toast.info('Note: Currently using mock data until SEO tables are created.');
  };

  const handleEditEntry = (entry) => {
    setSelectedEntry(entry);
    setShowEntryForm(true);
  };

  const handleFormClose = () => {
    setShowEntryForm(false);
    setSelectedEntry(null);
    loadEntries();
    loadDashboardData();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: 'secondary', label: 'Draft' },
      submitted: { variant: 'default', label: 'Submitted' },
      approved: { variant: 'success', label: 'Approved' },
      returned: { variant: 'destructive', label: 'Returned' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 65) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const filteredEntries = entries.filter(entry => {
    if (filters.status !== 'all' && entry.status !== filters.status) return false;
    if (filters.client !== 'all' && entry.client_id !== filters.client) return false;
    if (filters.month !== 'all' && entry.month !== filters.month) return false;
    return true;
  });

  const uniqueClients = [...new Set(entries.map(e => ({ id: e.client_id, name: e.clients?.name })))];
  const uniqueMonths = [...new Set(entries.map(e => e.month))].sort().reverse();

  if (loading) {
    return (
      <DashboardLayout title="SEO Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="SEO Dashboard">
      <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YTD Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(dashboardData.ytdAvgScore)}`}>
              {dashboardData.ytdAvgScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Month Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(dashboardData.lastMonthScore)}`}>
              {dashboardData.lastMonthScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Previous month performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium"># Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeClientsCount}</div>
            <p className="text-xs text-muted-foreground">Currently managing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg NPS (90d)</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.avgNPS.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Client satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Performance History</CardTitle>
            <Button onClick={handleAddPreviousMonth} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Previous Month Data
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="returned">Returned</option>
            </select>
            
            <select 
              value={filters.client} 
              onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Clients</option>
              {uniqueClients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
            
            <select 
              value={filters.month} 
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Months</option>
              {uniqueMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Organic Growth %</TableHead>
                  <TableHead>Total Traffic %</TableHead>
                  <TableHead>SERP Top 3/10</TableHead>
                  <TableHead>GMB Top 3</TableHead>
                  <TableHead>Tech Health</TableHead>
                  <TableHead>NPS</TableHead>
                  <TableHead>Mentor Score</TableHead>
                  <TableHead>Month Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.month}</TableCell>
                    <TableCell>{entry.clients?.name}</TableCell>
                    <TableCell>
                      <Badge variant={entry.clients?.type === 'Large' ? 'default' : 'secondary'}>
                        {entry.clients?.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${
                        entry.organic_growth_pct >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.organic_growth_pct >= 0 ? 
                          <TrendingUp className="h-3 w-3" /> : 
                          <TrendingDown className="h-3 w-3" />
                        }
                        {formatPercentage(entry.organic_growth_pct)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${
                        entry.traffic_growth_pct >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.traffic_growth_pct >= 0 ? 
                          <TrendingUp className="h-3 w-3" /> : 
                          <TrendingDown className="h-3 w-3" />
                        }
                        {formatPercentage(entry.traffic_growth_pct)}
                      </div>
                    </TableCell>
                    <TableCell>{entry.serp_top3_count}/{entry.serp_top10_count}</TableCell>
                    <TableCell>{entry.gmb_top3_count}</TableCell>
                    <TableCell>
                      <span className={getScoreColor(entry.technical_health_score)}>
                        {entry.technical_health_score?.toFixed(1) || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{entry.nps_client || '-'}</TableCell>
                    <TableCell>{entry.mentor_score || '-'}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${getScoreColor(entry.month_score)}`}>
                        {entry.month_score?.toFixed(1) || '-'}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditEntry(entry)}
                          disabled={entry.status === 'approved'}
                        >
                          {entry.status === 'approved' ? <Eye className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
                        </Button>
                        {entry.status === 'draft' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSubmitEntry(entry.id)}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredEntries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No entries found. Click "Add Previous Month Data" to get started.
                <p className="text-xs mt-1 text-blue-600">Note: Currently showing mock data until SEO tables are created.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Entry Form Modal */}
      {showEntryForm && (
        <SEODataEntryForm
          entry={selectedEntry}
          onClose={handleFormClose}
          onSave={handleFormClose}
        />
      )}
      </div>
    </DashboardLayout>
  );
};

export default SEOEmployeeDashboard;