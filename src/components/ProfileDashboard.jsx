import React, { useState, useEffect, useMemo } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Role-specific profile components
import SuperAdminProfile from './profiles/SuperAdminProfile';
import HRProfile from './profiles/HRProfile';
import OperationsHeadProfile from './profiles/OperationsHeadProfile';
import ManagerProfile from './profiles/ManagerProfile';
import EmployeeProfile from './profiles/EmployeeProfile';
import InternProfile from './profiles/InternProfile';
import FreelancerProfile from './profiles/FreelancerProfile';
import GrowthReportGenerator from './GrowthReportGenerator';

/**
 * Dynamic ProfileDashboard - Enhanced role-based profile management system
 * Features:
 * - Dynamic KPI-focused analytics based on user role
 * - Real-time performance tracking and insights
 * - Role-specific dashboard customization
 * - Comprehensive monthly tracking with KPI integration
 * - Role-based color themes for visual distinction
 */
const localizer = momentLocalizer(moment);

// Role-based color themes
const getRoleTheme = (role) => {
  const themes = {
    'SEO': {
      primary: 'from-blue-500 to-blue-600',
      secondary: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-500'
    },
    'Ads': {
      primary: 'from-green-500 to-green-600',
      secondary: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-500'
    },
    'Social Media': {
      primary: 'from-pink-500 to-pink-600',
      secondary: 'bg-pink-50',
      text: 'text-pink-600',
      border: 'border-pink-500'
    },
    'YouTube SEO': {
      primary: 'from-red-500 to-red-600',
      secondary: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-500'
    },
    'Web Developer': {
      primary: 'from-purple-500 to-purple-600',
      secondary: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-500'
    },
    'Graphic Designer': {
      primary: 'from-orange-500 to-orange-600',
      secondary: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-500'
    },
    'Freelancer': {
      primary: 'from-teal-500 to-teal-600',
      secondary: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-500'
    },
    'Intern': {
      primary: 'from-indigo-500 to-indigo-600',
      secondary: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-500'
    },

    'Operations Head': {
      primary: 'from-gray-500 to-gray-600',
      secondary: 'bg-gray-50',
      text: 'text-gray-600',
      border: 'border-gray-500'
    },
    'HR': {
      primary: 'from-rose-500 to-rose-600',
      secondary: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-500'
    },
    'Super Admin': {
      primary: 'from-black to-gray-800',
      secondary: 'bg-gray-50',
      text: 'text-gray-800',
      border: 'border-gray-800'
    }
  };
  return themes[role] || {
    primary: 'from-blue-500 to-blue-600',
    secondary: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-500'
  };
};

export function ProfileDashboard({ onBack }) {
  const { authState } = useUnifiedAuth();
  const supabase = useSupabase();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [activeView, setActiveView] = useState('profile'); // 'profile', 'calendar', 'analytics', 'kpis', 'reports'
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'))

  // Get current user role and determine profile component
  const userRole = authState.currentUser?.role || authState.role;
  const userId = authState.currentUser?.id || authState.userId;

  // Fetch comprehensive profile and KPI data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!authState.user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch employee profile from employees table
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', authState.user.id)
          .single();
          
        if (employeeError && employeeError.code !== 'PGRST116') {
          console.error('Error fetching employee data:', employeeError);
        }
        
        // Fetch monthly submissions for performance tracking
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', authState.user.id)
          .order('created_at', { ascending: false })
          .limit(12); // Last 12 months
          
        if (submissionsError) {
          console.error('Error fetching submissions:', submissionsError);
        }
        
        // Fetch role-specific KPI data
        await fetchRoleSpecificKPIs(authState.user.role, authState.user.id);
        
        setProfileData(employeeData || {
          user_id: authState.user.id,
          name: authState.user.name,
          email: authState.user.email,
          phone: authState.user.phone,
          role: authState.user.role,
          department: authState.user.department,
          status: 'active'
        });
        
        setMonthlyData(submissionsData || []);
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        notify({ type: 'error', title: 'Profile Load Error', message: 'Failed to load profile data' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [authState.user?.id, supabase, notify]);

  // Fetch role-specific KPI data
  const fetchRoleSpecificKPIs = async (role, userId) => {
    try {
      let kpiTable = '';
      
      switch (role) {
        case 'Super Admin':
          kpiTable = 'superadmin_kpis';
          break;
        case 'HR':
          kpiTable = 'hr_kpis';
          break;
        case 'Operations Head':
          kpiTable = 'operations_head_kpis';
          break;

        case 'Intern':
          kpiTable = 'intern_kpis';
          break;
        case 'Freelancer':
          kpiTable = 'freelancer_kpis';
          break;
        default:
          kpiTable = 'employee_kpis';
      }
      
      const { data: kpiData, error: kpiError } = await supabase
        .from(kpiTable)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (kpiError) {
        console.error('Error fetching KPI data:', kpiError);
      }
      
      setKpiData(kpiData?.[0] || null);
      
      // Calculate performance metrics
      if (kpiData?.[0]) {
        calculatePerformanceMetrics(kpiData[0], role);
      }
      
    } catch (error) {
      console.error('Error fetching role-specific KPIs:', error);
    }
  };

  // Calculate performance metrics based on role and KPI data
  const calculatePerformanceMetrics = (kpiData, role) => {
    let metrics = {};
    
    switch (role) {
      case 'Intern':
        metrics = {
          overallScore: Math.round((
            (kpiData.skill_development || 0) +
            (kpiData.learning_hours || 0) +
            (kpiData.goal_completion || 0) +
            (kpiData.mentor_rating || 0) +
            (kpiData.project_quality || 0) +
            (kpiData.technical_growth || 0) +
            (kpiData.soft_skills || 0) +
            (kpiData.initiative_score || 0)
          ) / 8),
          topMetric: 'Learning Growth',
          improvement: 'Technical Skills',
          trend: 'upward'
        };
        break;
      case 'Freelancer':
        metrics = {
          overallScore: Math.round((
            (kpiData.client_satisfaction || 0) +
            (kpiData.project_delivery || 0) +
            (kpiData.quality_score || 0) +
            (kpiData.communication_rating || 0) +
            (kpiData.deadline_adherence || 0) +
            (kpiData.technical_skills || 0) +
            (kpiData.creativity_score || 0) +
            (kpiData.earnings_growth || 0)
          ) / 8),
          topMetric: 'Client Satisfaction',
          improvement: 'Project Delivery',
          trend: 'upward'
        };
        break;
      default:
        metrics = {
          overallScore: Math.round((
            (kpiData.client_satisfaction || 0) +
            (kpiData.attendance || 0) +
            (kpiData.punctuality_score || 0) +
            (kpiData.team_collaboration || 0) +
            (kpiData.initiative_score || 0) +
            (kpiData.productivity_score || 0)
          ) / 6),
          topMetric: 'Team Collaboration',
          improvement: 'Productivity',
          trend: 'stable'
        };
    }
    
    setPerformanceMetrics(metrics);
  };

  // Handle profile updates
  const handleProfileUpdate = async (updates) => {
    try {
      const { error } = await supabase
        .from('employees')
        .upsert({
          user_id: authState.user.id,
          ...profileData,
          ...updates,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      setProfileData(prev => ({ ...prev, ...updates }));
      notify({ type: 'success', title: 'Profile Updated', message: 'Your profile has been saved successfully.' });
      
    } catch (error) {
      console.error('Error updating profile:', error);
      notify({ type: 'error', title: 'Update Failed', message: error.message });
    }
  };

  // Generate calendar events from monthly data
  const calendarEvents = useMemo(() => {
    return monthlyData.map(submission => ({
      id: submission.id,
      title: `${submission.submission_type || 'Submission'} - Score: ${submission.performance_score || 'N/A'}`,
      start: new Date(submission.created_at),
      end: new Date(submission.created_at),
      resource: submission
    }));
  }, [monthlyData]);

  // Calculate profile completion percentage
  const profileCompletion = useMemo(() => {
    if (!profileData) return 0;
    
    const requiredFields = [
      'name', 'email', 'phone', 'role', 'department',
      'joining_date', 'employee_id', 'work_location'
    ];
    
    const completedFields = requiredFields.filter(field => 
      profileData[field] && profileData[field] !== ''
    ).length;
    
    return Math.round((completedFields / requiredFields.length) * 100);
  }, [profileData]);

  // Render role-specific profile component
  const renderRoleSpecificProfile = () => {
    const commonProps = {
      profileData,
      monthlyData,
      onProfileUpdate: handleProfileUpdate,
      profileCompletion,
      calendarEvents,
      selectedMonth,
      onMonthChange: setSelectedMonth
    };

    // Use consistent role access pattern
    const currentRole = authState.currentUser?.role || authState.user?.role || authState.role;
    
    switch (currentRole) {
      case 'Super Admin':
        return <SuperAdminProfile {...commonProps} />;
      case 'HR':
        return <HRProfile {...commonProps} />;
      case 'Operations Head':
        return <OperationsHeadProfile {...commonProps} />;

      case 'Freelancer':
        return <FreelancerProfile {...commonProps} />;
      case 'Intern':
        return <InternProfile {...commonProps} />;
      default:
        // For all employee roles (SEO, Ads, Social Media, etc.)
        return <EmployeeProfile {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get role-based theme
  const roleTheme = getRoleTheme(userRole);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Header with Completion */}
      <div className={`bg-gradient-to-r ${roleTheme.primary} rounded-xl shadow-lg p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm">
                {profileData?.name?.charAt(0) || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                <div className={`w-4 h-4 rounded-full ${
                  profileCompletion >= 80 ? 'bg-green-500' : 
                  profileCompletion >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{profileData?.name}</h1>
              <p className="text-lg text-white text-opacity-90">{userRole}</p>
              <p className="text-sm text-white text-opacity-75">{profileData?.department} Department</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-32 bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      profileCompletion >= 80 ? 'bg-green-400' : 
                      profileCompletion >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                <span className="text-sm text-white text-opacity-90">{profileCompletion}% complete</span>
              </div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 text-white border border-white border-opacity-30 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors backdrop-blur-sm"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Dynamic View Toggle Tabs */}
        <div className="border-b border-white border-opacity-20">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'kpis', label: 'KPI Dashboard', icon: '🎯' },
              { id: 'reports', label: 'Growth Reports', icon: '📈' },
              { id: 'calendar', label: 'Calendar', icon: '📅' },
              { id: 'analytics', label: 'Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  activeView === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white text-opacity-70 hover:text-white hover:border-white hover:border-opacity-50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* View Content */}
      <div className="bg-white rounded-xl shadow-sm border">
        {activeView === 'profile' && (
          <div className="p-6">
            {renderRoleSpecificProfile()}
          </div>
        )}
        
        {activeView === 'kpis' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">KPI Dashboard</h2>
              <p className="text-gray-600">Real-time performance insights and key metrics</p>
            </div>
            
            {/* KPI Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className={`bg-gradient-to-br ${roleTheme.primary} rounded-lg p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-opacity-80 text-sm font-medium">Overall Score</p>
                    <p className="text-3xl font-bold">{performanceMetrics?.overallScore || 0}%</p>
                  </div>
                  <div className="text-white text-opacity-70 text-3xl">🎯</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Top Metric</p>
                    <p className="text-lg font-semibold">{performanceMetrics?.topMetric || 'N/A'}</p>
                  </div>
                  <div className="text-green-200 text-3xl">🏆</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Focus Area</p>
                    <p className="text-lg font-semibold">{performanceMetrics?.improvement || 'N/A'}</p>
                  </div>
                  <div className="text-amber-200 text-3xl">🎯</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-100 text-sm font-medium">Trend</p>
                    <p className="text-lg font-semibold capitalize">{performanceMetrics?.trend || 'Stable'}</p>
                  </div>
                  <div className="text-slate-200 text-3xl">
                    {performanceMetrics?.trend === 'upward' ? '📈' : 
                     performanceMetrics?.trend === 'downward' ? '📉' : '📊'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Role-specific KPI Details */}
            {kpiData && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed KPI Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(kpiData)
                    .filter(([key]) => !['id', 'user_id', 'created_at', 'updated_at'].includes(key))
                    .map(([key, value]) => {
                      const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      const numericValue = typeof value === 'number' ? value : 0;
                      
                      return (
                        <div key={key} className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{displayName}</span>
                            <span className={`text-lg font-bold ${
                              numericValue >= 80 ? 'text-green-600' :
                              numericValue >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {numericValue}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                numericValue >= 80 ? 'bg-green-500' :
                                numericValue >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${numericValue}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeView === 'calendar' && (
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Performance Calendar</h2>
              <p className="text-gray-600">Track your submissions and performance over time</p>
            </div>
            <div className="h-96">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day']}
                defaultView="month"
                popup
                onSelectEvent={(event) => {
                  notify({
                    type: 'info',
                    title: 'Submission Details',
                    message: `${event.title} on ${moment(event.start).format('MMM DD, YYYY')}`
                  });
                }}
              />
            </div>
          </div>
        )}
        
        {activeView === 'reports' && (
          <div className="p-6">
            <GrowthReportGenerator />
          </div>
        )}
        
        {activeView === 'analytics' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Performance Analytics</h2>
              <p className="text-gray-600">Insights into your performance trends and metrics</p>
            </div>
            
            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Submissions</p>
                    <p className="text-2xl font-bold text-blue-900">{monthlyData.length}</p>
                  </div>
                  <div className="text-blue-500 text-2xl">📝</div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Avg Performance</p>
                    <p className="text-2xl font-bold text-green-900">
                      {monthlyData.length > 0 
                        ? Math.round(monthlyData.reduce((acc, item) => acc + (item.performance_score || 0), 0) / monthlyData.length)
                        : 0}%
                    </p>
                  </div>
                  <div className="text-green-500 text-2xl">📈</div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">This Month</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {monthlyData.filter(item => 
                        moment(item.created_at).format('YYYY-MM') === selectedMonth
                      ).length}
                    </p>
                  </div>
                  <div className="text-purple-500 text-2xl">🗓️</div>
                </div>
              </div>
            </div>
            
            {/* Recent Submissions Table */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Submissions</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyData.slice(0, 10).map((submission, index) => (
                      <tr key={submission.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {moment(submission.created_at).format('MMM DD, YYYY')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.submission_type || 'General'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (submission.performance_score || 0) >= 80 ? 'bg-green-100 text-green-800' :
                            (submission.performance_score || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {submission.performance_score || 0}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {submission.status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileDashboard;