import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { Section } from '@/shared/components/ui';
import { exportReport, reportUtils } from '../utils/reportGenerator';
import { 
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  MapPinIcon,
  ClockIcon,
  ComputerDesktopIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChartBarIcon,
  UsersIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Login Session Card Component
const LoginSessionCard = ({ session }) => {
  const getDeviceIcon = (userAgent) => {
    if (userAgent?.includes('Mobile') || userAgent?.includes('Android') || userAgent?.includes('iPhone')) {
      return <DevicePhoneMobileIcon className="h-4 w-4 text-blue-600" />;
    }
    return <ComputerDesktopIcon className="h-4 w-4 text-gray-600" />;
  };
  
  const getBrowserInfo = (userAgent) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };
  
  const getLocationString = (location) => {
    if (!location) return 'Unknown Location';
    const { city, region, country } = location;
    return [city, region, country].filter(Boolean).join(', ');
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {session.employee_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{session.employee_name}</div>
            <div className="text-sm text-gray-600">{session.department}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getDeviceIcon(session.user_agent)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            session.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {session.is_active ? 'Active' : 'Ended'}
          </span>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-4 w-4" />
          <span>Login: {new Date(session.login_time).toLocaleString()}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <MapPinIcon className="h-4 w-4" />
          <span>{getLocationString(session.location)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <GlobeAltIcon className="h-4 w-4" />
          <span>IP: {session.ip_address}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <ComputerDesktopIcon className="h-4 w-4" />
          <span>{getBrowserInfo(session.user_agent)}</span>
        </div>
        
        {session.logout_time && (
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4" />
            <span>Logout: {new Date(session.logout_time).toLocaleString()}</span>
          </div>
        )}
        
        {session.session_duration && (
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4" />
            <span>Duration: {Math.round(session.session_duration / 60)} minutes</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Employee Report Card Component
const EmployeeReportCard = ({ employee, onViewReport, onDownloadPDF }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {employee.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{employee.name}</div>
            <div className="text-sm text-gray-600">{employee.department} • {employee.role}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            employee.overall_score >= 85 ? 'bg-green-100 text-green-800' :
            employee.overall_score >= 70 ? 'bg-blue-100 text-blue-800' :
            employee.overall_score >= 55 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Score: {employee.overall_score?.toFixed(1) || 'N/A'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Last Login:</span>
          <div className="font-medium">
            {employee.last_login ? new Date(employee.last_login).toLocaleDateString() : 'Never'}
          </div>
        </div>
        <div>
          <span className="text-gray-600">Reports Submitted:</span>
          <div className="font-medium">{employee.reports_count || 0}</div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={() => onViewReport(employee)}
          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-sm"
        >
          <EyeIcon className="h-4 w-4" />
          <span>View Report</span>
        </button>
        
        <button
          onClick={() => onDownloadPDF(employee)}
          className="bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
          title="Download PDF"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// Analytics Dashboard Component
const AnalyticsDashboard = ({ data }) => {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Performance Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.performanceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Department Performance */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Averages</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.departmentAverages} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="department" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="average" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Monthly Trends */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="average" stroke="#3B82F6" strokeWidth={3} />
              <Line type="monotone" dataKey="median" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Login Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Activity (Last 7 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.loginActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="logins" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Filters Component
const FiltersPanel = ({ filters, onFiltersChange }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <FunnelIcon className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            value={filters.department}
            onChange={(e) => onFiltersChange({ ...filters, department: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="HR">HR</option>
            <option value="Operations">Operations</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={filters.role}
            onChange={(e) => onFiltersChange({ ...filters, role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Roles</option>
            <option value="Manager">Manager</option>
            <option value="Senior">Senior</option>
            <option value="Junior">Junior</option>
            <option value="Intern">Intern</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <input
            type="month"
            value={filters.month}
            onChange={(e) => onFiltersChange({ ...filters, month: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              placeholder="Search employees..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Superadmin Controls Component
export const SuperadminControls = ({ currentUser }) => {
  const supabase = useSupabase();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    department: '',
    role: '',
    month: new Date().toISOString().slice(0, 7),
    search: ''
  });
  const [data, setData] = useState({
    employees: [],
    loginSessions: [],
    analytics: {
      performanceDistribution: [],
      departmentAverages: [],
      monthlyTrends: [],
      loginActivity: []
    },
    stats: {
      totalEmployees: 0,
      activeUsers: 0,
      avgPerformance: 0,
      totalLogins: 0
    }
  });
  
  // Check if user is superadmin
  const isSuperadmin = currentUser?.role === 'superadmin' || currentUser?.is_admin;
  
  useEffect(() => {
    if (isSuperadmin) {
      loadSuperadminData();
    }
  }, [isSuperadmin, filters]);
  
  const loadSuperadminData = async () => {
    setLoading(true);
    try {
      // Load employees with performance data
      let employeeQuery = supabase
        .from('employees')
        .select(`
          *,
          employee_performance!inner(
            overall_score,
            month
          )
        `)
        .eq('employee_performance.month', filters.month);
      
      if (filters.department) {
        employeeQuery = employeeQuery.eq('department', filters.department);
      }
      
      if (filters.role) {
        employeeQuery = employeeQuery.eq('role', filters.role);
      }
      
      if (filters.search) {
        employeeQuery = employeeQuery.ilike('name', `%${filters.search}%`);
      }
      
      const { data: employees, error: empError } = await employeeQuery;
      if (empError) throw empError;
      
      // Load login sessions
      const { data: sessions, error: sessError } = await supabase
        .from('login_sessions')
        .select(`
          *,
          employees(name, department)
        `)
        .order('login_time', { ascending: false })
        .limit(50);
      
      if (sessError) throw sessError;
      
      // Generate analytics data
      const analytics = generateAnalyticsData(employees);
      
      // Calculate stats
      const stats = {
        totalEmployees: employees?.length || 0,
        activeUsers: sessions?.filter(s => s.is_active)?.length || 0,
        avgPerformance: employees?.length > 0 ? 
          employees.reduce((sum, emp) => sum + (emp.employee_performance?.[0]?.overall_score || 0), 0) / employees.length : 0,
        totalLogins: sessions?.length || 0
      };
      
      setData({
        employees: employees || [],
        loginSessions: sessions?.map(session => ({
          ...session,
          employee_name: session.employees?.name,
          department: session.employees?.department
        })) || [],
        analytics,
        stats
      });
      
    } catch (error) {
      console.error('Error loading superadmin data:', error);
      notify('Failed to load superadmin data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const generateAnalyticsData = (employees) => {
    // Performance distribution
    const performanceRanges = [
      { range: '0-25', count: 0 },
      { range: '26-50', count: 0 },
      { range: '51-75', count: 0 },
      { range: '76-100', count: 0 }
    ];
    
    employees.forEach(emp => {
      const score = emp.employee_performance?.[0]?.overall_score || 0;
      if (score <= 25) performanceRanges[0].count++;
      else if (score <= 50) performanceRanges[1].count++;
      else if (score <= 75) performanceRanges[2].count++;
      else performanceRanges[3].count++;
    });
    
    // Department averages
    const deptGroups = employees.reduce((acc, emp) => {
      const dept = emp.department || 'Unknown';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(emp.employee_performance?.[0]?.overall_score || 0);
      return acc;
    }, {});
    
    const departmentAverages = Object.entries(deptGroups).map(([dept, scores]) => ({
      department: dept,
      average: scores.reduce((sum, score) => sum + score, 0) / scores.length
    }));
    
    // Mock monthly trends (would come from historical data)
    const monthlyTrends = [
      { month: 'Jan', average: 72, median: 75 },
      { month: 'Feb', average: 74, median: 76 },
      { month: 'Mar', average: 76, median: 78 },
      { month: 'Apr', average: 78, median: 80 },
      { month: 'May', average: 75, median: 77 },
      { month: 'Jun', average: 77, median: 79 }
    ];
    
    // Mock login activity (would come from login_sessions)
    const loginActivity = [
      { date: 'Mon', logins: 45 },
      { date: 'Tue', logins: 52 },
      { date: 'Wed', logins: 48 },
      { date: 'Thu', logins: 61 },
      { date: 'Fri', logins: 55 },
      { date: 'Sat', logins: 23 },
      { date: 'Sun', logins: 18 }
    ];
    
    return {
      performanceDistribution: performanceRanges,
      departmentAverages,
      monthlyTrends,
      loginActivity
    };
  };
  
  const handleViewReport = (employee) => {
    // Navigate to employee's detailed report
    notify(`Viewing report for ${employee.name}`, 'info');
    // Implementation would open a detailed view or navigate to employee dashboard
  };
  
  const handleDownloadPDF = async (employee) => {
    try {
      notify('Generating PDF report...', 'info');
      
      const reportData = {
        employeeName: employee.name,
        department: employee.department,
        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        metrics: {
          'Performance Score': `${employee.overall_score || 85}%`,
          'Projects Completed': employee.reports_count || 12,
          'Last Login': employee.last_login ? new Date(employee.last_login).toLocaleDateString() : 'Never',
          'Department': employee.department || 'N/A'
        },
        summary: `Performance summary for ${employee.name} in ${employee.department} department. Overall performance score: ${employee.overall_score || 85}%.`
      };
      
      const filename = reportUtils.generateFilename(`employee-report-${employee.name.replace(/\s+/g, '-')}`);
      const result = await exportReport(reportData, 'pdf', 'employeePerformance', filename);
      
      if (result.success) {
        notify(result.message, 'success');
      } else {
        notify(result.message, 'error');
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      notify('Failed to generate PDF report', 'error');
    }
  };
  
  const handleDownloadOrgReport = async () => {
    try {
      notify('Generating organization-wide report...', 'info');
      
      const orgReportData = {
        month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        generatedBy: 'Super Admin',
        metrics: {
          'Total Employees': data.stats.totalEmployees,
          'Active Users': data.stats.activeUsers,
          'Average Performance': `${data.stats.avgPerformance.toFixed(1)}%`,
          'Total Logins': data.stats.totalLogins,
          'Department Count': [...new Set(data.employees.map(emp => emp.department))].length
        },
        departmentBreakdown: [...new Set(data.employees.map(emp => emp.department))].map(dept => ({
          department: dept,
          employeeCount: data.employees.filter(emp => emp.department === dept).length,
          avgPerformance: Math.round(data.employees.filter(emp => emp.department === dept)
            .reduce((sum, emp) => sum + (emp.employee_performance?.[0]?.overall_score || 0), 0) / 
            data.employees.filter(emp => emp.department === dept).length)
        }))
      };
      
      const filename = reportUtils.generateFilename('organization-report');
      const result = await exportReport(orgReportData, 'excel', 'monthlyReport', filename);
      
      if (result.success) {
        notify(result.message, 'success');
      } else {
        notify(result.message, 'error');
      }
      
    } catch (error) {
      console.error('Error generating org report:', error);
      notify('Failed to generate organization report', 'error');
    }
  };
  
  if (!isSuperadmin) {
    return (
      <Section className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access superadmin controls.</p>
      </Section>
    );
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <Section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Superadmin Controls</h2>
          <p className="text-gray-600">System administration and organization-wide analytics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleDownloadOrgReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Download Org Report</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <ShieldCheckIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-600">Superadmin Access</span>
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{data.stats.totalEmployees}</div>
          <div className="text-sm text-gray-600">Total Employees</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{data.stats.activeUsers}</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <ChartBarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{data.stats.avgPerformance.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Avg Performance</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <GlobeAltIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{data.stats.totalLogins}</div>
          <div className="text-sm text-gray-600">Total Logins</div>
        </div>
      </div>
      
      {/* Filters */}
      <FiltersPanel filters={filters} onFiltersChange={setFilters} />
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'employees', name: 'Employee Reports', icon: '👥' },
            { id: 'sessions', name: 'Login Sessions', icon: '🔐' },
            { id: 'analytics', name: 'Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <AnalyticsDashboard data={data.analytics} />
        )}
        
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Employee Reports ({data.employees.length})
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.employees.map((employee) => (
                <EmployeeReportCard
                  key={employee.id}
                  employee={{
                    ...employee,
                    overall_score: employee.employee_performance?.[0]?.overall_score
                  }}
                  onViewReport={handleViewReport}
                  onDownloadPDF={handleDownloadPDF}
                />
              ))}
            </div>
            
            {data.employees.length === 0 && (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No employees found with current filters</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Login Sessions ({data.loginSessions.length})
              </h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.loginSessions.map((session) => (
                <LoginSessionCard key={session.id} session={session} />
              ))}
            </div>
            
            {data.loginSessions.length === 0 && (
              <div className="text-center py-12">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No login sessions found</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsDashboard data={data.analytics} />
        )}
      </div>
      
      {/* Info Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-2">Superadmin Features:</p>
            <ul className="space-y-1 text-yellow-700">
              <li>• <strong>Employee Reports:</strong> View and download individual performance reports</li>
              <li>• <strong>Login Tracking:</strong> Monitor user sessions with IP and location data</li>
              <li>• <strong>Organization Analytics:</strong> Company-wide performance insights</li>
              <li>• <strong>PDF Generation:</strong> Export detailed reports for compliance and review</li>
              <li>• <strong>Advanced Filtering:</strong> Filter by department, role, time period, and more</li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default SuperadminControls;