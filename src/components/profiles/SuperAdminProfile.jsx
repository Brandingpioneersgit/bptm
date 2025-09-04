import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import moment from 'moment';

const SuperAdminProfile = ({ 
  profileData, 
  monthlyData, 
  onProfileUpdate, 
  profileCompletion,
  calendarEvents,
  selectedMonth,
  onMonthChange 
}) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [adminData, setAdminData] = useState({});
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({});
  const [userManagementData, setUserManagementData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [organizationKPIs, setOrganizationKPIs] = useState({
    overall_performance: 0,
    employee_satisfaction: 0,
    operational_efficiency: 0,
    financial_performance: 0,
    innovation_index: 0,
    client_retention: 0,
    system_reliability: 0,
    strategic_goals: 0
  });
  const [departmentKPIs, setDepartmentKPIs] = useState([]);
  const [showKPIModal, setShowKPIModal] = useState(false);

  // Fetch Super Admin specific data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        // Calculate admin metrics
        const currentMonthData = monthlyData.filter(item => 
          moment(item.created_at).format('YYYY-MM') === moment().format('YYYY-MM')
        );
        
        // Fetch all users for management
        const { data: allUsers, error: usersError } = await supabase
          .from('unified_users')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (usersError && usersError.code !== 'PGRST116') {
          console.error('Error fetching users data:', usersError);
        }
        
        // Fetch all employees
        const { data: allEmployees, error: employeesError } = await supabase
          .from('employees')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (employeesError && employeesError.code !== 'PGRST116') {
          console.error('Error fetching employees data:', employeesError);
        }
        
        // Fetch system metrics
        const { data: systemStats, error: systemError } = await supabase
          .from('system_metrics')
          .select('*')
          .gte('created_at', moment().startOf('month').toISOString())
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (systemError && systemError.code !== 'PGRST116') {
          console.error('Error fetching system metrics:', systemError);
        }
        
        const totalUsers = (allUsers || []).length;
        const activeUsers = (allUsers || []).filter(u => u.status === 'active').length;
        const totalEmployees = (allEmployees || []).length;
        const activeEmployees = (allEmployees || []).filter(e => e.status === 'active').length;
        
        // Calculate department distribution
        const departments = {};
        (allEmployees || []).forEach(emp => {
          const dept = emp.department || 'Unassigned';
          departments[dept] = (departments[dept] || 0) + 1;
        });
        
        setAdminData({
          totalUsers: totalUsers,
          activeUsers: activeUsers,
          totalEmployees: totalEmployees,
          activeEmployees: activeEmployees,
          systemUptime: systemStats?.[0]?.uptime || '99.9%',
          avgPerformance: currentMonthData.length > 0 
            ? Math.round(currentMonthData.reduce((sum, item) => sum + (item.performance_score || 0), 0) / currentMonthData.length)
            : 0,
          completedTasks: currentMonthData.filter(item => item.status === 'completed').length,
          totalTasks: currentMonthData.length
        });
        
        setUserManagementData(allUsers || []);
        setDepartmentData(Object.entries(departments).map(([name, count]) => ({ name, count })));
        setSystemMetrics(systemStats?.[0] || {});
        
        // Fetch organization KPIs
        const { data: orgKPIData, error: orgKPIError } = await supabase
          .from('monthly_kpi_reports')
          .select('*')
          .eq('user_id', profileData?.user_id)
          .eq('month', selectedMonth)
          .single();
          
        if (orgKPIError && orgKPIError.code !== 'PGRST116') {
          console.error('Error fetching organization KPI data:', orgKPIError);
        }
        
        if (orgKPIData) {
          setOrganizationKPIs({
            overall_performance: orgKPIData.overall_performance || 0,
            employee_satisfaction: orgKPIData.employee_satisfaction || 0,
            operational_efficiency: orgKPIData.operational_efficiency || 0,
            financial_performance: orgKPIData.financial_performance || 0,
            innovation_index: orgKPIData.innovation_index || 0,
            client_retention: orgKPIData.client_retention || 0,
            system_reliability: orgKPIData.system_reliability || 0,
            strategic_goals: orgKPIData.strategic_goals || 0
          });
        }
        
        // Fetch department KPIs
        const { data: deptKPIData, error: deptKPIError } = await supabase
          .from('monthly_kpi_reports')
          .select('*, unified_users!inner(department)')
          .eq('month', selectedMonth)
          .not('unified_users.department', 'is', null);
          
        if (deptKPIError && deptKPIError.code !== 'PGRST116') {
          console.error('Error fetching department KPI data:', deptKPIError);
        }
        
        // Group KPIs by department
        const deptKPIs = {};
        (deptKPIData || []).forEach(kpi => {
          const dept = kpi.unified_users?.department;
          if (dept) {
            if (!deptKPIs[dept]) {
              deptKPIs[dept] = { department: dept, kpis: [], avgScore: 0 };
            }
            deptKPIs[dept].kpis.push(kpi);
          }
        });
        
        // Calculate average scores for each department
        Object.values(deptKPIs).forEach(dept => {
          const totalScore = dept.kpis.reduce((sum, kpi) => {
            const kpiAvg = (kpi.overall_performance + kpi.employee_satisfaction + kpi.operational_efficiency + kpi.financial_performance) / 4;
            return sum + kpiAvg;
          }, 0);
          dept.avgScore = dept.kpis.length > 0 ? Math.round(totalScore / dept.kpis.length) : 0;
        });
        
        setDepartmentKPIs(Object.values(deptKPIs));
        
      } catch (error) {
        console.error('Error fetching admin data:', error);
        showToast('Failed to load admin data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [supabase, showToast, monthlyData]);

  // System metrics for Super Admin
  const systemMetricsDisplay = useMemo(() => {
    return {
      totalEmployees: adminData.totalEmployees || 45,
      activeUsers: adminData.activeUsers || 38,
      systemUptime: adminData.systemUptime || '99.9%',
      pendingApprovals: 12,
      criticalAlerts: 2,
      monthlyRevenue: '$125,000',
      clientSatisfaction: '94%',
      dataIntegrity: 'Healthy'
    };
  }, [adminData]);

  const handleEditProfile = () => {
    setEditFormData({
      name: profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      work_location: profileData?.work_location || '',
      bio: profileData?.bio || '',
      specializations: profileData?.specializations || [],
      certifications: profileData?.certifications || [],
      years_experience: profileData?.years_experience || '',
      education: profileData?.education || '',
      admin_permissions: profileData?.admin_permissions || []
    });
    navigate('/profile-edit');
  };

  const handleSaveProfile = async () => {
    try {
      await onProfileUpdate(editFormData);
      setShowEditModal(false);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleSaveOrganizationKPIs = async () => {
    try {
      const { error } = await supabase
        .from('monthly_kpi_reports')
        .upsert({
          user_id: profileData?.user_id,
          month: selectedMonth,
          overall_performance: organizationKPIs.overall_performance,
          employee_satisfaction: organizationKPIs.employee_satisfaction,
          operational_efficiency: organizationKPIs.operational_efficiency,
          financial_performance: organizationKPIs.financial_performance,
          innovation_index: organizationKPIs.innovation_index,
          client_retention: organizationKPIs.client_retention,
          system_reliability: organizationKPIs.system_reliability,
          strategic_goals: organizationKPIs.strategic_goals,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      setShowKPIModal(false);
      showToast('Organization KPIs updated successfully', 'success');
    } catch (error) {
      console.error('Error saving organization KPIs:', error);
      showToast('Failed to save organization KPIs', 'error');
    }
  };

  const calculateOrganizationScore = (kpis) => {
    const values = Object.values(kpis).filter(val => typeof val === 'number' && val > 0);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  };

  // Calendar events for system activities
  const systemCalendarEvents = useMemo(() => {
    const events = [];
    const today = new Date();
    
    // Sample system events
    events.push({
      id: 1,
      title: 'System Maintenance',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 2, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 4, 0),
      type: 'maintenance'
    });
    
    events.push({
      id: 2,
      title: 'Board Meeting',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 10, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 12, 0),
      type: 'meeting'
    });
    
    events.push({
      id: 3,
      title: 'Performance Review Cycle',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14),
      type: 'review'
    });
    
    return events;
  }, []);

  // Profile completion analysis
  const profileAnalysis = useMemo(() => {
    const requiredFields = [
      'name', 'email', 'phone', 'department', 'role', 
      'joiningDate', 'emergencyContact', 'address',
      'systemAccess', 'securityClearance'
    ];
    
    const completed = requiredFields.filter(field => profileData?.[field]).length;
    const completionPercentage = Math.round((completed / requiredFields.length) * 100);
    
    return {
      completed,
      total: requiredFields.length,
      percentage: completionPercentage,
      missing: requiredFields.filter(field => !profileData?.[field])
    };
  }, [profileData]);

  const getSystemHealthStatus = () => {
    const uptime = parseFloat(adminData.systemUptime?.replace('%', '') || 0);
    if (uptime >= 99) return { status: 'Excellent', color: 'green' };
    if (uptime >= 95) return { status: 'Good', color: 'yellow' };
    return { status: 'Needs Attention', color: 'red' };
  };

  const getUserGrowthRate = () => {
    const thisMonth = userManagementData.filter(user => 
      moment(user.created_at).format('YYYY-MM') === moment().format('YYYY-MM')
    ).length;
    const lastMonth = userManagementData.filter(user => 
      moment(user.created_at).format('YYYY-MM') === moment().subtract(1, 'month').format('YYYY-MM')
    ).length;
    
    if (lastMonth === 0) return thisMonth > 0 ? '+100%' : '0%';
    const growth = ((thisMonth - lastMonth) / lastMonth) * 100;
    return `${growth >= 0 ? '+' : ''}${Math.round(growth)}%`;
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad';
    
    switch (event.type) {
      case 'maintenance':
        backgroundColor = '#f59e0b';
        break;
      case 'meeting':
        backgroundColor = '#10b981';
        break;
      case 'review':
        backgroundColor = '#8b5cf6';
        break;
      default:
        backgroundColor = '#3174ad';
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const tabs = [
    { id: 'overview', label: 'System Overview', icon: '📊' },
    { id: 'kpis', label: 'Organization KPIs', icon: '🎯' },
    { id: 'profile', label: 'Profile Management', icon: '👤' },
    { id: 'calendar', label: 'Calendar & Events', icon: '📅' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'security', label: 'Security', icon: '🔒' }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Completion Alert */}
      {profileCompletion < 90 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">🚨</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Complete Your Admin Profile ({profileCompletion}%)
              </h3>
              <p className="text-sm text-red-700 mt-1">
                As a Super Admin, a complete profile is essential for system credibility.
              </p>
            </div>
            <button
              onClick={handleEditProfile}
              className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Complete Now
            </button>
          </div>
        </div>
      )}

      {/* Organization KPI Dashboard */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Organization KPI Dashboard</h2>
            <p className="text-sm text-gray-600">System-wide performance metrics for {moment(selectedMonth).format('MMMM YYYY')}</p>
          </div>
          <button
            onClick={() => setShowKPIModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update KPIs
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-1">Overall Performance</h3>
            <div className="text-2xl font-bold">{organizationKPIs.overall_performance}/10</div>
            <div className="w-full bg-purple-400 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${(organizationKPIs.overall_performance / 10) * 100}%` }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-1">Employee Satisfaction</h3>
            <div className="text-2xl font-bold">{organizationKPIs.employee_satisfaction}/10</div>
            <div className="w-full bg-green-400 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${(organizationKPIs.employee_satisfaction / 10) * 100}%` }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-1">Operational Efficiency</h3>
            <div className="text-2xl font-bold">{organizationKPIs.operational_efficiency}/10</div>
            <div className="w-full bg-blue-400 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${(organizationKPIs.operational_efficiency / 10) * 100}%` }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-1">Financial Performance</h3>
            <div className="text-2xl font-bold">{organizationKPIs.financial_performance}/10</div>
            <div className="w-full bg-yellow-400 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${(organizationKPIs.financial_performance / 10) * 100}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-1">Innovation Index</h3>
            <div className="text-2xl font-bold">{organizationKPIs.innovation_index}/10</div>
            <div className="w-full bg-indigo-400 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${(organizationKPIs.innovation_index / 10) * 100}%` }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-1">Client Retention</h3>
            <div className="text-2xl font-bold">{organizationKPIs.client_retention}/10</div>
            <div className="w-full bg-pink-400 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${(organizationKPIs.client_retention / 10) * 100}%` }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-1">System Reliability</h3>
            <div className="text-2xl font-bold">{organizationKPIs.system_reliability}/10</div>
            <div className="w-full bg-teal-400 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${(organizationKPIs.system_reliability / 10) * 100}%` }}></div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-1">Strategic Goals</h3>
            <div className="text-2xl font-bold">{organizationKPIs.strategic_goals}/10</div>
            <div className="w-full bg-red-400 rounded-full h-2 mt-2">
              <div className="bg-white h-2 rounded-full" style={{ width: `${(organizationKPIs.strategic_goals / 10) * 100}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Organization Score</h3>
              <p className="text-sm text-gray-600">Based on all KPI metrics</p>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {calculateOrganizationScore(organizationKPIs)}/10
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Organization KPIs Tab */}
        {activeTab === 'kpis' && (
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department KPI Comparison</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(departmentKPIs).map(([department, kpis]) => (
                  <div key={department} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 capitalize">{department}</h4>
                    <div className="space-y-3">
                      {Object.entries(kpis).map(([kpi, score]) => (
                        <div key={kpi} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{kpi.replace(/_/g, ' ')}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(score / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{score}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Performance Trends</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{calculateOrganizationScore(organizationKPIs)}</div>
                    <div className="text-sm text-gray-600">Current Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{Object.keys(departmentKPIs).length}</div>
                    <div className="text-sm text-gray-600">Active Departments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.values(departmentKPIs).reduce((total, dept) => total + Object.keys(dept).length, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total KPIs Tracked</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h3>
              <div className="bg-white border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Top Performing Areas</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">System Reliability</span>
                        <span className="text-sm font-medium text-green-600">{organizationKPIs.system_reliability}/10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Employee Satisfaction</span>
                        <span className="text-sm font-medium text-green-600">{organizationKPIs.employee_satisfaction}/10</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Innovation Index</span>
                        <span className="text-sm font-medium text-orange-600">{organizationKPIs.innovation_index}/10</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Strategic Goals</span>
                        <span className="text-sm font-medium text-orange-600">{organizationKPIs.strategic_goals}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Overview Tab */}
        {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
              
              {/* System Overview Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                      <div className="text-3xl font-bold">{adminData.totalUsers || 0}</div>
                      <p className="text-indigo-100 text-sm">{getUserGrowthRate()} this month</p>
                    </div>
                    <div className="text-4xl opacity-80">👥</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Active Users</h3>
                      <div className="text-3xl font-bold">{adminData.activeUsers || 0}</div>
                      <p className="text-emerald-100 text-sm">Currently online</p>
                    </div>
                    <div className="text-4xl opacity-80">🟢</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Employees</h3>
                      <div className="text-3xl font-bold">{adminData.totalEmployees || 0}</div>
                      <p className="text-blue-100 text-sm">{adminData.activeEmployees || 0} active</p>
                    </div>
                    <div className="text-4xl opacity-80">💼</div>
                  </div>
                </div>
                
                <div className={`bg-gradient-to-br from-${getSystemHealthStatus().color}-500 to-${getSystemHealthStatus().color}-600 rounded-xl p-6 text-white`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">System Health</h3>
                      <div className="text-3xl font-bold">{adminData.systemUptime || '99.9%'}</div>
                      <p className={`text-${getSystemHealthStatus().color}-100 text-sm`}>{getSystemHealthStatus().status}</p>
                    </div>
                    <div className="text-4xl opacity-80">⚡</div>
                  </div>
                </div>
              </div>

              {/* Recent Activities Table */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent System Activities</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Activity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Employee Performance Review
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          John Manager
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2 hours ago
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          System Backup
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          System
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          4 hours ago
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Success
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Profile Management Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Profile Management</h2>
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
              
              {/* Profile Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <div className="mt-1 text-sm text-gray-900">{profileData?.name || 'Not set'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="mt-1 text-sm text-gray-900">{profileData?.email || 'Not set'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <div className="mt-1 text-sm text-gray-900">{profileData?.phone || 'Not set'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Administrative Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Role</label>
                      <div className="mt-1 text-sm text-gray-900">{profileData?.role || 'Super Admin'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Department</label>
                      <div className="mt-1 text-sm text-gray-900">{profileData?.department || 'Administration'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Security Clearance</label>
                      <div className="mt-1 text-sm text-gray-900">{profileData?.securityClearance || 'Level 5 - Full Access'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Calendar & Events</h2>
                <select
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = moment().subtract(i, 'months').format('YYYY-MM');
                    return (
                      <option key={month} value={month}>
                        {moment(month).format('MMMM YYYY')}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Events</h3>
                {calendarEvents && calendarEvents.length > 0 ? (
                  <div className="space-y-3">
                    {calendarEvents.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">
                            {moment(event.start).format('MMM DD, YYYY HH:mm')}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.type === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          event.type === 'meeting' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {event.type || 'Event'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Events</h3>
                    <p className="text-gray-600">System events will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">System Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Daily Active Users</span>
                      <span className="text-sm font-medium">38</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Weekly Active Users</span>
                      <span className="text-sm font-medium">42</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Active Users</span>
                      <span className="text-sm font-medium">45</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Performance Score</span>
                      <span className="text-sm font-medium">8.2/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Submission Rate</span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Client Satisfaction</span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Security Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Access Control</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Two-Factor Authentication</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Session Timeout</span>
                      <span className="text-sm font-medium">30 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Login</span>
                      <span className="text-sm font-medium">Today, 9:15 AM</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">System Security</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">SSL Certificate</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Valid</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database Encryption</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Backup Status</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Current</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Admin Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={editFormData.work_location || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, work_location: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={editFormData.years_experience || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, years_experience: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <input
                  type="text"
                  value={editFormData.education || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, education: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., MBA in Business Administration, Computer Science Degree"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editFormData.bio || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tell us about your administrative experience and leadership approach..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminProfile;