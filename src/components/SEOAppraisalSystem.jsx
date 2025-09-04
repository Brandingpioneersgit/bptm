/**
 * SEO Appraisal System
 * Handles period scoring, rating bands, and increment eligibility
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Award, 
  TrendingUp, 
  Users, 
  Calendar, 
  FileText, 
  Plus, 
  Edit, 
  Eye,
  Star,
  AlertCircle
} from 'lucide-react';
import seoApi from '@/api/seoApi';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { SEOManagerGuard } from './SEORoleBasedAccess';
import { toast } from 'react-hot-toast';

const SEOAppraisalSystem = () => {
  return (
    <SEOManagerGuard>
      <SEOAppraisalContent />
    </SEOManagerGuard>
  );
};

const SEOAppraisalContent = () => {
  const { user, role } = useUnifiedAuth();
  const [appraisals, setAppraisals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [showAppraisalForm, setShowAppraisalForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appraisalData, setAppraisalData] = useState({
    employee_id: '',
    period_start: '',
    period_end: '',
    notes: ''
  });

  useEffect(() => {
    loadAppraisalData();
  }, []);

  const loadAppraisalData = async () => {
    try {
      setLoading(true);
      const [appraisalsRes, employeesRes] = await Promise.all([
        seoApi.getAppraisals(),
        seoApi.getEmployees({ department: 'SEO' })
      ]);
      
      setAppraisals(appraisalsRes);
      setEmployees(employeesRes);
    } catch (error) {
      console.error('Failed to load appraisal data:', error);
      toast.error('Failed to load appraisal data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAppraisal = async (employeeId, periodStart, periodEnd) => {
    try {
      const result = await seoApi.calculateAppraisal({
        employee_id: employeeId,
        period_start: periodStart,
        period_end: periodEnd
      });
      return result;
    } catch (error) {
      console.error('Failed to calculate appraisal:', error);
      throw error;
    }
  };

  const handleCreateAppraisal = async () => {
    try {
      // First calculate the appraisal scores
      const calculatedData = await calculateAppraisal(
        appraisalData.employee_id,
        appraisalData.period_start,
        appraisalData.period_end
      );
      
      // Create the appraisal record
      await seoApi.createAppraisal({
        ...appraisalData,
        ...calculatedData
      });
      
      toast.success('Appraisal created successfully');
      setShowAppraisalForm(false);
      setAppraisalData({ employee_id: '', period_start: '', period_end: '', notes: '' });
      loadAppraisalData();
    } catch (error) {
      console.error('Failed to create appraisal:', error);
      toast.error('Failed to create appraisal');
    }
  };

  const getRatingBadge = (rating) => {
    const variants = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800', 
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[rating] || 'bg-gray-100 text-gray-800'}>
        {rating}
      </Badge>
    );
  };

  const getIncrementText = (rating, incrementPct) => {
    const descriptions = {
      'A': 'Full increment bracket',
      'B': 'Standard increment',
      'C': 'Limited increment', 
      'D': 'PIP/No increment'
    };
    
    return (
      <div className="text-sm">
        <div className="font-medium">{descriptions[rating]}</div>
        {incrementPct && <div className="text-muted-foreground">{incrementPct}%</div>}
      </div>
    );
  };

  const AppraisalForm = () => (
    <Dialog open={showAppraisalForm} onOpenChange={setShowAppraisalForm}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Appraisal</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="employee_id">Employee</Label>
            <Select 
              value={appraisalData.employee_id} 
              onValueChange={(value) => setAppraisalData(prev => ({ ...prev, employee_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period_start">Period Start</Label>
              <Input
                id="period_start"
                type="date"
                value={appraisalData.period_start}
                onChange={(e) => setAppraisalData(prev => ({ ...prev, period_start: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="period_end">Period End</Label>
              <Input
                id="period_end"
                type="date"
                value={appraisalData.period_end}
                onChange={(e) => setAppraisalData(prev => ({ ...prev, period_end: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={appraisalData.notes}
              onChange={(e) => setAppraisalData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes for this appraisal period..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAppraisalForm(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAppraisal}
              disabled={!appraisalData.employee_id || !appraisalData.period_start || !appraisalData.period_end}
            >
              Create Appraisal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const AppraisalDetails = ({ appraisal }) => (
    <Dialog open={!!selectedAppraisal} onOpenChange={() => setSelectedAppraisal(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Appraisal Details - {appraisal?.employee_name}</DialogTitle>
        </DialogHeader>
        
        {appraisal && (
          <div className="space-y-6">
            {/* Period Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Appraisal Period</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Period Start</Label>
                    <p className="font-medium">{new Date(appraisal.period_start).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Period End</Label>
                    <p className="font-medium">{new Date(appraisal.period_end).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {appraisal.avg_month_score?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Average Score</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {getRatingBadge(appraisal.final_rating_band)}
                    </div>
                    <div className="text-sm text-muted-foreground">Rating Band</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {appraisal.eligible_increment_pct || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Increment</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Monthly Breakdown */}
            {appraisal.monthly_scores && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Clients</TableHead>
                        <TableHead>Avg Score</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appraisal.monthly_scores.map((month, index) => (
                        <TableRow key={index}>
                          <TableCell>{month.month}</TableCell>
                          <TableCell>{month.client_count}</TableCell>
                          <TableCell>
                            <span className={month.score >= 75 ? 'text-green-600' : month.score >= 65 ? 'text-yellow-600' : 'text-red-600'}>
                              {month.score?.toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={month.all_approved ? 'default' : 'secondary'}>
                              {month.all_approved ? 'Complete' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            
            {/* Notes */}
            {appraisal.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{appraisal.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading appraisal data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SEO Appraisal System</h1>
          <p className="text-muted-foreground">Manage performance appraisals and increment eligibility</p>
        </div>
        {authState.user?.role === 'admin' && (
          <Button onClick={() => setShowAppraisalForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Appraisal
          </Button>
        )}
      </div>

      {/* Rating Bands Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rating Bands & Increment Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600 mb-2">A</div>
              <div className="text-sm font-medium">≥85 Score</div>
              <div className="text-xs text-muted-foreground">Full increment bracket</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600 mb-2">B</div>
              <div className="text-sm font-medium">75-84.9 Score</div>
              <div className="text-xs text-muted-foreground">Standard increment</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-600 mb-2">C</div>
              <div className="text-sm font-medium">65-74.9 Score</div>
              <div className="text-xs text-muted-foreground">Limited increment</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600 mb-2">D</div>
              <div className="text-sm font-medium">&lt;65 Score</div>
              <div className="text-xs text-muted-foreground">PIP/No increment</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appraisals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Appraisals</CardTitle>
        </CardHeader>
        <CardContent>
          {appraisals.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No appraisals yet</p>
              <p className="text-muted-foreground">Create your first appraisal to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Avg Score</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Increment</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appraisals.map((appraisal) => (
                  <TableRow key={appraisal.id}>
                    <TableCell className="font-medium">
                      {appraisal.employee_name}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(appraisal.period_start).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          to {new Date(appraisal.period_end).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={appraisal.avg_month_score >= 75 ? 'text-green-600' : appraisal.avg_month_score >= 65 ? 'text-yellow-600' : 'text-red-600'}>
                        {appraisal.avg_month_score?.toFixed(1) || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getRatingBadge(appraisal.final_rating_band)}
                    </TableCell>
                    <TableCell>
                      {getIncrementText(appraisal.final_rating_band, appraisal.eligible_increment_pct)}
                    </TableCell>
                    <TableCell>
                      {new Date(appraisal.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAppraisal(appraisal)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Forms and Modals */}
      <AppraisalForm />
      {selectedAppraisal && <AppraisalDetails appraisal={selectedAppraisal} />}
    </div>
  );
};

export default SEOAppraisalSystem;
export { SEOAppraisalContent };