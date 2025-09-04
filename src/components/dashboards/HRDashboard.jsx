import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  TrendingUp, 
  ArrowUpRight, 
  BarChart3, 
  Calendar, 
  Clock, 
  AlertTriangle,
  AlertCircle, 
  Star, 
  Heart, 
  Download, 
  FileText,
  Zap, 
  GraduationCap, 
  Award, 
  CheckCircle, 
  XCircle, 
  Eye,
  Edit
} from 'lucide-react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/hooks/use-toast';
import { exportReport, reportUtils } from '../../utils/reportGenerator';
import DashboardLayout from '../layouts/DashboardLayout';
import AdvancedFilters from '../shared/AdvancedFilters';
import { applyFilters, createFilterOptions, exportToCSV } from '@/utils/filterUtils';

// Simple Modal Components for HR Actions
const AddEmployeeModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([
          {
            name: formData.name,
            position: formData.position,
            department: formData.department,
            email: formData.email,
            phone: formData.phone,
            status: 'active'
          }
        ])
        .select();

      if (error) {
        console.error('Error adding employee:', error);
        alert('Error adding employee. Please try again.');
      } else {
        onSuccess(data[0]);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Error adding employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <Input 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Position</label>
        <Input 
          value={formData.position} 
          onChange={(e) => setFormData({...formData, position: e.target.value})}
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Department</label>
        <Input 
          value={formData.department} 
          onChange={(e) => setFormData({...formData, department: e.target.value})}
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input 
          type="email"
          value={formData.email} 
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <Input 
          value={formData.phone} 
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required 
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Employee'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>Cancel</Button>
      </div>
    </form>
  );
};

const ScheduleInterviewModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    candidateName: '',
    position: '',
    date: '',
    time: '',
    interviewer: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Candidate Name</label>
        <Input 
          value={formData.candidateName} 
          onChange={(e) => setFormData({...formData, candidateName: e.target.value})}
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Position</label>
        <Input 
          value={formData.position} 
          onChange={(e) => setFormData({...formData, position: e.target.value})}
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <Input 
          type="date"
          value={formData.date} 
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Time</label>
        <Input 
          type="time"
          value={formData.time} 
          onChange={(e) => setFormData({...formData, time: e.target.value})}
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Interviewer</label>
        <Input 
          value={formData.interviewer} 
          onChange={(e) => setFormData({...formData, interviewer: e.target.value})}
          required 
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">Schedule Interview</Button>
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
      </div>
    </form>
  );
};

const GenerateReportModal = ({ employees, onClose, onSuccess }) => {
  const [reportType, setReportType] = useState('employee_summary');

  const handleGenerate = () => {
    // Simulate report generation
    const reportData = {
      type: reportType,
      generatedAt: new Date().toISOString(),
      totalEmployees: employees.length
    };
    onSuccess(reportData);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Report Type</label>
        <select 
          value={reportType} 
          onChange={(e) => setReportType(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="employee_summary">Employee Summary</option>
          <option value="attendance_report">Attendance Report</option>
          <option value="performance_review">Performance Review</option>
          <option value="salary_report">Salary Report</option>
        </select>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Report Preview</h4>
        <p className="text-sm text-gray-600">
          This report will include data for {employees.length} employees.
        </p>
      </div>
      <div className="flex gap-2 pt-4">
        <Button onClick={handleGenerate} className="flex-1">Generate Report</Button>
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
      </div>
    </div>
  );
};

const HRDashboard = () => {
  const { user } = useUnifiedAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [hrMetrics, setHrMetrics] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [error, setError] = useState(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filters, setFilters] = useState({});

  // Load HR data using HR Reporting Service
  useEffect(() => {
    loadHRData();
  }, []);

  const loadHRData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const hrData = await hrReportingService.getHRMetrics();
      
      setHrMetrics(hrData.metrics);
      setEmployees(hrData.employees);
      setLeaveRequests(hrData.leaveRequests);
      setDepartmentBreakdown(hrData.departmentBreakdown);
      setPerformanceMetrics(hrData.performanceMetrics);
      
      toast({
        title: "HR Data Loaded",
        description: "Successfully loaded HR metrics and employee data.",
      });
    } catch (error) {
      console.error('Error loading HR data:', error);
      setError('Failed to load HR data. Please try again.');
      
      // Use fallback data
      setEmployees(mockEmployees);
      setHrMetrics(mockHrMetrics);
      setLeaveRequests(mockLeaveRequests);
      setDepartmentBreakdown([]);
      setPerformanceMetrics([]);
      
      toast({
        title: "Error Loading Data",
        description: "Using fallback data. Some features may be limited.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter options for AdvancedFilters component
  const filterOptions = useMemo(() => {
    if (!employees.length) return {};
    
    return createFilterOptions(employees, {
      departments: 'department',
      roles: 'role',
      status: 'status',
      locations: 'location'
    });
  }, [employees]);

  // Apply filters to employee data
  const filteredEmployees = useMemo(() => {
    return applyFilters(employees, filters, {
      searchFields: ['name', 'email', 'department', 'role'],
      dateFields: ['hire_date', 'last_review_date']
    });
  }, [employees, filters]);

  // Apply filters to leave requests
  const filteredLeaveRequests = useMemo(() => {
    return applyFilters(leaveRequests, filters, {
      searchFields: ['employee_name', 'type', 'status'],
      dateFields: ['start_date', 'end_date', 'submitted_date']
    });
  }, [leaveRequests, filters]);

  // Quick Action Handlers
  const handleAddEmployee = () => {
    setShowAddEmployeeModal(true);
  };

  const handleScheduleInterview = () => {
    setShowScheduleModal(true);
  };

  const handleGenerateReport = () => {
    setShowReportModal(true);
  };

  const [exportFormat, setExportFormat] = useState('excel');

  const handleExportReport = async () => {
    try {
      setIsExporting(true);
      
      // Prepare HR report data
      const reportData = {
        summary: {
          totalEmployees: employees.length,
          activeEmployees: employees.filter(e => e.status === 'active').length,
          pendingReviews: employees.filter(e => e.reviewStatus === 'pending').length,
          avgPerformance: employees.reduce((sum, e) => sum + (e.performance || 0), 0) / employees.length
        },
        employees: employees || [],
        departments: [...new Set(employees.map(e => e.department))],
        performanceMetrics: employees.map(e => ({
          name: e.name,
          department: e.department,
          performance: e.performance,
          reviewStatus: e.reviewStatus
        })),
        generatedAt: new Date().toISOString(),
        reportPeriod: 'Current Period'
      };
      
      const filename = reportUtils.generateFilename('hr_report', exportFormat);
      
      const result = await exportReport(reportData, exportFormat, 'hrReport', filename);
      
      if (result.success) {
        toast({
          title: "Report Exported",
          description: `HR report has been exported as ${exportFormat.toUpperCase()}.`,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export HR report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateTraining = () => {
    alert('Training creation feature will be available soon!');
  };

  const handleEmployeeSuccess = async (newEmployee) => {
    try {
      const addedEmployee = await hrReportingService.addEmployee(newEmployee);
      console.log('New employee added:', addedEmployee);
      setShowAddEmployeeModal(false);
      
      toast({
        title: "Employee Added",
        description: `${newEmployee.name} has been added successfully.`,
      });
      
      // Refresh the HR data to show the new employee
      loadHRData();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error Adding Employee",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInterviewSuccess = (interview) => {
    console.log('Interview scheduled:', interview);
    setShowScheduleModal(false);
    alert('Interview scheduled successfully!');
  };

  const handleReportSuccess = (report) => {
    console.log('Report generated:', report);
    setShowReportModal(false);
    alert('Report generated successfully!');
  };

  // Mock data for fallback
  const mockHrMetrics = {
    totalEmployees: 156,
    newHires: 12,
    departures: 3,
    activeRecruitment: 8,
    employeeSatisfaction: 4.2,
    retentionRate: 94.5,
    averageTenure: 2.8,
    trainingCompletion: 87.3,
    performanceRating: 4.1,
    attendanceRate: 96.2,
    leaveRequests: 15,
    pendingApprovals: 7,
    upcomingReviews: 23,
    complianceScore: 98.5,
    diversityIndex: 72.8,
    engagementScore: 78.5
  };

  const mockEmployees = [
    { 
      id: 'EMP001', 
      name: 'Arjun Sharma', 
      position: 'Software Developer', 
      department: 'Engineering', 
      joinDate: '2024-01-15', 
      status: 'onboarding', 
      manager: 'Priya Patel',
      location: 'Bangalore'
    },
    { 
      id: 'EMP002', 
      name: 'Sneha Gupta', 
      position: 'Marketing Specialist', 
      department: 'Marketing', 
      joinDate: '2024-01-12', 
      status: 'active', 
      manager: 'Rahul Kumar',
      location: 'Mumbai'
    },
    { 
      id: 'EMP003', 
      name: 'Vikram Singh', 
      position: 'Sales Executive', 
      department: 'Sales', 
      joinDate: '2024-01-10', 
      status: 'onboarding', 
      manager: 'Anita Desai',
      location: 'Delhi'
    },
    { 
      id: 'EMP004', 
      name: 'Kavya Reddy', 
      position: 'UI/UX Designer', 
      department: 'Design', 
      joinDate: '2024-01-08', 
      status: 'active', 
      manager: 'Suresh Nair',
      location: 'Hyderabad'
    },
    { 
      id: 'EMP005', 
      name: 'Rohit Joshi', 
      position: 'Data Analyst', 
      department: 'Analytics', 
      joinDate: '2024-01-05', 
      status: 'onboarding', 
      manager: 'Meera Shah',
      location: 'Pune'
    }
  ];

  const mockLeaveRequests = [
    { 
      id: 'LR001', 
      employee: 'Amit Kumar', 
      type: 'Annual Leave', 
      startDate: '2024-01-20', 
      endDate: '2024-01-25', 
      days: 5, 
      status: 'pending', 
      reason: 'Family vacation',
      appliedDate: '2024-01-15'
    },
    { 
      id: 'LR002', 
      employee: 'Priya Sharma', 
      type: 'Sick Leave', 
      startDate: '2024-01-18', 
      endDate: '2024-01-19', 
      days: 2, 
      status: 'approved', 
      reason: 'Medical appointment',
      appliedDate: '2024-01-17'
    },
    { 
      id: 'LR003', 
      employee: 'Rajesh Patel', 
      type: 'Personal Leave', 
      startDate: '2024-01-22', 
      endDate: '2024-01-22', 
      days: 1, 
      status: 'pending', 
      reason: 'Personal work',
      appliedDate: '2024-01-16'
    },
    { 
      id: 'LR004', 
      employee: 'Sunita Gupta', 
      type: 'Maternity Leave', 
      startDate: '2024-02-01', 
      endDate: '2024-07-31', 
      days: 180, 
      status: 'approved', 
      reason: 'Maternity leave',
      appliedDate: '2024-01-10'
    },
    { 
      id: 'LR005', 
      employee: 'Kiran Reddy', 
      type: 'Casual Leave', 
      startDate: '2024-01-19', 
      endDate: '2024-01-19', 
      days: 1, 
      status: 'rejected', 
      reason: 'Personal emergency',
      appliedDate: '2024-01-18'
    }
  ];

  const upcomingReviews = [
    { employee: 'Alex Kumar', position: 'Senior Developer', reviewDate: '2024-01-25', type: 'Annual Review', manager: 'Priya Patel' },
    { employee: 'Sarah Johnson', position: 'Marketing Manager', reviewDate: '2024-01-28', type: 'Quarterly Review', manager: 'Rahul Kumar' },
    { employee: 'Michael Brown', position: 'Sales Lead', reviewDate: '2024-01-30', type: 'Performance Review', manager: 'Anita Desai' },
    { employee: 'Emily Davis', position: 'Product Designer', reviewDate: '2024-02-02', type: 'Annual Review', manager: 'Suresh Nair' },
    { employee: 'David Wilson', position: 'Data Scientist', reviewDate: '2024-02-05', type: 'Probation Review', manager: 'Meera Shah' }
  ];

  const trainingPrograms = [
    { name: 'Leadership Development', participants: 25, completion: 92, duration: '3 months', status: 'ongoing' },
    { name: 'Technical Skills Bootcamp', participants: 40, completion: 78, duration: '6 weeks', status: 'ongoing' },
    { name: 'Communication Skills', participants: 35, completion: 95, duration: '2 weeks', status: 'completed' },
    { name: 'Project Management', participants: 20, completion: 85, duration: '4 weeks', status: 'ongoing' },
    { name: 'Digital Marketing', participants: 15, completion: 88, duration: '3 weeks', status: 'ongoing' }
  ];

  const departmentStats = [
    { name: 'Engineering', employees: 45, satisfaction: 4.3, retention: 96.2, avgSalary: 850000 },
    { name: 'Marketing', employees: 25, satisfaction: 4.1, retention: 92.8, avgSalary: 650000 },
    { name: 'Sales', employees: 30, satisfaction: 4.0, retention: 89.5, avgSalary: 720000 },
    { name: 'Design', employees: 18, satisfaction: 4.4, retention: 94.1, avgSalary: 680000 },
    { name: 'Operations', employees: 22, satisfaction: 3.9, retention: 91.3, avgSalary: 580000 },
    { name: 'Finance', employees: 16, satisfaction: 4.2, retention: 97.5, avgSalary: 750000 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'onboarding': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReviewTypeColor = (type) => {
    switch (type) {
      case 'Annual Review': return 'bg-purple-100 text-purple-800';
      case 'Quarterly Review': return 'bg-blue-100 text-blue-800';
      case 'Performance Review': return 'bg-orange-100 text-orange-800';
      case 'Probation Review': return 'bg-yellow-100 text-yellow-800';
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="HR Dashboard">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading HR data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="HR Dashboard">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">HR Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'HR Manager'}</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={handleExportReport}
              disabled={isLoading || isExporting}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
            <Button 
              className="flex items-center gap-2" 
              onClick={handleAddEmployee}
              disabled={isLoading}
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading HR data...</span>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{hrMetrics?.totalEmployees || 0}</div>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{hrMetrics?.newHires || 0} new hires this month
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{hrMetrics?.retentionRate || 0}%</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2.3% from last quarter
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employee Satisfaction</CardTitle>
              <Heart className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{hrMetrics?.employeeSatisfaction || 0}/5.0</div>
              <div className="flex items-center text-xs text-purple-600 mt-1">
                <Star className="h-3 w-3 mr-1" />
                {hrMetrics?.engagementScore || 0}% engagement
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{hrMetrics?.pendingApprovals || 0}</div>
              <div className="flex items-center text-xs text-orange-600 mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {hrMetrics?.leaveRequests || 0} leave requests
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="leaves">Leaves</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* HR Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    HR Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Active Recruitment</span>
                    <span className="font-bold text-blue-600">{hrMetrics?.activeRecruitment || 0} positions</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Average Tenure</span>
                    <span className="font-bold text-green-600">{hrMetrics?.averageTenure || 0} years</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Training Completion</span>
                    <span className="font-bold text-purple-600">{hrMetrics?.trainingCompletion || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Attendance Rate</span>
                    <span className="font-bold text-orange-600">{hrMetrics?.attendanceRate || 0}%</span>
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
                    onClick={handleAddEmployee}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Employee
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleScheduleInterview}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleGenerateReport}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleCreateTraining}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Create Training
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Award className="h-4 w-4 mr-2" />
                    Performance Review
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-6">
            {/* Advanced Filters */}
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              filterOptions={filterOptions}
              onExport={() => exportToCSV(filteredEmployees, 'hr-employees')}
              showExport={true}
              customFilters={[
                {
                  key: 'status',
                  label: 'Employment Status',
                  type: 'select',
                  options: filterOptions.status || []
                },
                {
                  key: 'location',
                  label: 'Location',
                  type: 'select',
                  options: filterOptions.locations || []
                }
              ]}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employees ({filteredEmployees.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((hire) => (
                      <TableRow key={hire.id}>
                        <TableCell className="font-medium">{hire.name}</TableCell>
                        <TableCell>{hire.position}</TableCell>
                        <TableCell>{hire.department}</TableCell>
                        <TableCell>{formatDate(hire.joinDate)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(hire.status)}>
                            {hire.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{hire.manager}</TableCell>
                        <TableCell>{hire.location}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
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

          {/* Leaves Tab */}
          <TabsContent value="leaves" className="space-y-6">
            {/* Advanced Filters for Leave Requests */}
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              filterOptions={{
                ...filterOptions,
                types: createFilterOptions(leaveRequests, { types: 'type' }).types || [],
                status: createFilterOptions(leaveRequests, { status: 'status' }).status || []
              }}
              onExport={() => exportToCSV(filteredLeaveRequests, 'hr-leave-requests')}
              showExport={true}
              customFilters={[
                {
                  key: 'type',
                  label: 'Leave Type',
                  type: 'select',
                  options: createFilterOptions(leaveRequests, { types: 'type' }).types || []
                },
                {
                  key: 'status',
                  label: 'Request Status',
                  type: 'select',
                  options: createFilterOptions(leaveRequests, { status: 'status' }).status || []
                }
              ]}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Leave Requests ({filteredLeaveRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.employee}</TableCell>
                        <TableCell>{request.type}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(request.startDate)}</div>
                            <div className="text-gray-500">to {formatDate(request.endDate)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{request.days}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-32 truncate">{request.reason}</TableCell>
                        <TableCell>{formatDate(request.appliedDate)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {request.status === 'pending' && (
                              <>
                                <Button size="sm" variant="outline" className="text-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600">
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
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

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Upcoming Performance Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Review Date</TableHead>
                      <TableHead>Review Type</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingReviews.map((review, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{review.employee}</TableCell>
                        <TableCell>{review.position}</TableCell>
                        <TableCell>{formatDate(review.reviewDate)}</TableCell>
                        <TableCell>
                          <Badge className={getReviewTypeColor(review.type)}>
                            {review.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{review.manager}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Calendar className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="h-3 w-3" />
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

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Training Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program Name</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingPrograms.map((program, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{program.name}</TableCell>
                        <TableCell>{program.participants}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${program.completion}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{program.completion}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{program.duration}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(program.status)}>
                            {program.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Department Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Satisfaction</TableHead>
                      <TableHead>Retention</TableHead>
                      <TableHead>Avg Salary</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentStats.map((dept, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell>{dept.employees}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{dept.satisfaction}/5.0</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3 w-3 ${
                                    i < Math.floor(dept.satisfaction) 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">{dept.retention}%</TableCell>
                        <TableCell className="font-medium">{formatCurrency(dept.avgSalary)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  dept.satisfaction >= 4.0 ? 'bg-green-600' :
                                  dept.satisfaction >= 3.5 ? 'bg-yellow-600' :
                                  'bg-red-600'
                                }`}
                                style={{ width: `${(dept.satisfaction / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-medium ${
                              dept.satisfaction >= 4.0 ? 'text-green-600' :
                              dept.satisfaction >= 3.5 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {dept.satisfaction >= 4.0 ? 'Excellent' :
                               dept.satisfaction >= 3.5 ? 'Good' :
                               'Needs Improvement'}
                            </span>
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

        {/* Modals */}
        {showAddEmployeeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">👤 Add New Employee</h3>
              <AddEmployeeModal 
                onClose={() => setShowAddEmployeeModal(false)}
                onSuccess={handleEmployeeSuccess}
              />
            </div>
          </div>
        )}

        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">📅 Schedule Interview</h3>
              <ScheduleInterviewModal 
                onClose={() => setShowScheduleModal(false)}
                onSuccess={handleInterviewSuccess}
              />
            </div>
          </div>
        )}

        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">📊 Generate HR Report</h3>
              <GenerateReportModal 
                employees={employees}
                onClose={() => setShowReportModal(false)}
                onSuccess={handleReportSuccess}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;