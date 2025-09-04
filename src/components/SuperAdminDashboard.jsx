/**
 * Super Admin Dashboard
 * Comprehensive oversight and control of all system modules including sales, HR, finance, and operations
 * Full access to all dashboards and administrative functions
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useDataSync } from './DataSyncContext';
import { useEmployeeSync } from '@/features/employees/context/EmployeeSyncContext';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { useCrossDashboardSync } from './CrossDashboardSync';
import { useRBAC } from './useRBAC';
import { useNotificationSystem } from './NotificationSystem';
import { useAuditLogging } from './AuditLogging';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { FadeTransition } from '@/shared/components/Transitions';
import { getCardClasses, getButtonClasses } from '@/shared/styles/designSystem';
import QuoteOfTheDay from './QuoteOfTheDay';
import LeaderboardView from './LeaderboardView';
import NotificationCenter from './NotificationSystem';
import ArcadeAdminPanel from './ArcadeAdminPanel';
import SalesCRMDashboard from './SalesCRMDashboard';
import SEOAppraisalSystem from './SEOAppraisalSystem';
import LoginHistoryComponent from '../features/auth/LoginHistoryComponent';
import personalizedDashboardService from '../shared/services/personalizedDashboardService';
import liveDataService from '../shared/services/liveDataService';
import { useAppNavigation } from '@/utils/navigation';
import { SIDEBAR_CONFIG } from '@/shared/config/uiConfig';
import DashboardHeader from './shared/DashboardHeader';

/**
 * Super Admin Dashboard
 * Provides complete oversight and control of all system modules
 * Includes sales, HR, finance, operations, and administrative functions
 */
export function SuperAdminDashboard({ onNavigateToDashboard }) {
  const supabase = useSupabase();
  const { submissions, clients, loading, refreshAllData } = useDataSync();
  const { employees } = useEmployeeSync();
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  const {
    crossDashboardData,
    performanceMetrics,
    dashboardActivity,
    notifications,
    unreadNotifications,
    activeDashboards,
    totalActiveUsers,
    updateDashboardActivity,
    markNotificationRead,
    clearNotifications
  } = useCrossDashboardSync();
  const { currentUser, hasFeatureAccess } = useRBAC();
  const { systemNotifications } = useNotificationSystem();
  const { auditLogs, logUserAction } = useAuditLogging();
  const { navigate } = useAppNavigation();
  
  const [personalizedCards, setPersonalizedCards] = useState([]);
  
  const [activeUsers, setActiveUsers] = useState({
    employees: 0,
    interns: 0,
    freelancers: 0,
    managers: 0,
    sales: 0,
    hr: 0,
    finance: 0,
    agency: 0
  });
  
  const [dynamicStats, setDynamicStats] = useState({
    sales: { value: "₹0", change: "+0%" },
    hr: { value: "0", change: "+0" },
    finance: { value: "₹0", change: "+0%" },
    intern: { value: "0", change: "+0" }
  });
  
  const [superAdminStats, setSuperAdminStats] = useState({
    totalEmployees: 0,
    activeProjects: 0,
    monthlyRevenue: "₹0",
    clientSatisfaction: 0
  });
  
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    sync: 'healthy',
    performance: 'good',
    security: 'secure'
  });
  
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [showReporting, setShowReporting] = useState(false);
  const [showAccessControl, setShowAccessControl] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);

  // Dashboard metrics state
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalSubmissions: 0,
    currentMonthSubmissions: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    totalClients: 0,
    activeClients: 0,
    pendingReviews: 0,
    averagePerformance: 8.5,
    dataSync: 'healthy'
  });
  
  // Load dashboard metrics
  useEffect(() => {
    const loadDashboardMetrics = async () => {
      let personalizedMetrics = {};
      
      // Try to get personalized metrics
      if (currentUser) {
        try {
          personalizedMetrics = await personalizedDashboardService.getPersonalizedDashboardMetrics(currentUser, 'superAdmin');
        } catch (error) {
          console.error('Error loading personalized metrics:', error);
        }
      }
      
      const totalSubmissions = personalizedMetrics.totalSubmissions || submissions?.length || 0;
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthSubmissions = personalizedMetrics.currentMonthSubmissions || submissions?.filter(sub => 
        sub.created_at?.startsWith(currentMonth)
      ).length || 0;
      
      const totalEmployees = personalizedMetrics.totalEmployees || employees?.length || 0;
      const activeEmployees = personalizedMetrics.activeEmployees || employees?.filter(emp => emp.status === 'active').length || 0;
      const totalClients = personalizedMetrics.totalClients || clients?.length || 0;
      const activeClients = personalizedMetrics.activeClients || clients?.filter(client => client.status === 'active').length || 0;
      
      const pendingReviews = personalizedMetrics.pendingReviews || submissions?.filter(sub => 
        sub.status === 'pending_review'
      ).length || 0;
      
      const averagePerformance = personalizedMetrics.averagePerformance || (submissions?.length > 0 
        ? submissions.reduce((acc, sub) => acc + (sub.performance_score || 0), 0) / submissions.length
        : 8.5);
      
      const dataSync = loading.submissions || loading.clients ? 'syncing' : 'healthy';
      
      setDashboardMetrics({
        totalSubmissions,
        currentMonthSubmissions,
        totalEmployees,
        activeEmployees,
        totalClients,
        activeClients,
        pendingReviews,
        averagePerformance,
        dataSync
      });
    };
    
    loadDashboardMetrics();
  }, [submissions, employees, clients, loading, currentUser]);

  // Fetch dynamic dashboard data using liveDataService
  const fetchDynamicStats = useCallback(async () => {
    try {
      // Fetch dynamic stats from liveDataService
      const [dynamicData, superAdminData] = await Promise.all([
        liveDataService.getDynamicStats(),
        liveDataService.getSuperAdminStats()
      ]);
      
      setDynamicStats(dynamicData);
      setSuperAdminStats(superAdminData);
    } catch (error) {
      console.error('Error fetching dynamic stats:', error);
      // Use fallback data on error
      setDynamicStats({
        sales: { value: "₹2.5M", change: "+12%" },
        hr: { value: "156", change: "+8" },
        finance: { value: "₹1.2M", change: "+5%" },
        intern: { value: "15", change: "+3" }
      });
      setSuperAdminStats({
        totalEmployees: 156,
        activeProjects: 45,
        monthlyRevenue: "₹2.5M",
        clientSatisfaction: 92
      });
    }
  }, []);

  // System health monitoring
  useEffect(() => {
    const checkSystemHealth = () => {
      const dbHealth = supabase ? 'healthy' : 'local';
      const syncHealth = loading.submissions || loading.clients ? 'syncing' : 'healthy';
      const perfHealth = dashboardMetrics.averagePerformance > 8 ? 'excellent' : 
                        dashboardMetrics.averagePerformance > 6 ? 'good' : 'needs-attention';
      const securityHealth = 'secure'; // Would integrate with actual security monitoring
      
      // Only update if values have changed to prevent infinite loop
      if (systemHealth.database !== dbHealth ||
          systemHealth.sync !== syncHealth ||
          systemHealth.performance !== perfHealth ||
          systemHealth.security !== securityHealth) {
        setSystemHealth({
           database: dbHealth,
           sync: syncHealth,
           performance: perfHealth,
           security: securityHealth
          });
      }
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [dashboardMetrics.averagePerformance, loading, supabase]);
  
  // Load personalized dashboard cards
  const loadPersonalizedCards = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const cards = await personalizedDashboardService.getPersonalizedDashboardCards(currentUser);
      setPersonalizedCards(cards);
    } catch (error) {
      console.error('Error loading personalized cards:', error);
      // Fallback to default cards
      setPersonalizedCards([]);
    }
  }, [currentUser]);

  // Fetch dynamic stats on component mount and data changes
  useEffect(() => {
    fetchDynamicStats();
    loadPersonalizedCards();
  }, [fetchDynamicStats, loadPersonalizedCards]);

  // Quick actions handler
  const handleQuickAction = useCallback(async (action, dashboard) => {
    try {
      switch (action) {
        case 'refresh':
          await refreshAllData();
          notify('Data refreshed successfully', 'success');
          logUserAction('data_refresh', { dashboard });
          break;
        case 'broadcast':
          openModal('broadcast', { dashboard });
          break;
        case 'backup':
          notify('Backup initiated', 'info');
          logUserAction('backup_initiated', { dashboard });
          break;
        case 'export':
          notify('Export started', 'info');
          logUserAction('data_export', { dashboard });
          break;
        case 'audit':
          setShowAuditLogs(true);
          break;
        default:
          console.warn('Unknown action:', action);
      }
    } catch (error) {
      console.error('Quick action failed:', error);
      notify('Action failed. Please try again.', 'error');
    }
  }, [refreshAllData, notify, openModal, logUserAction]);

  // Dashboard card component
  const DashboardCard = ({ title, icon, color, stats, onNavigate, onQuickAction, isNew = false }) => (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${isNew ? 'ring-2 ring-green-200' : ''}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center text-white text-2xl shadow-lg`}>
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {title}
                {isNew && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">NEW</span>}
              </h3>
              <p className="text-sm text-gray-500 font-medium">Full administrative access</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-xl">
              <div className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{stat.value}</div>
              <div className="text-xs text-gray-600 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onNavigate}
            className={`flex-1 bg-gradient-to-r ${color} hover:shadow-lg text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105`}
          >
            Open Dashboard
          </button>
          <button
            onClick={() => onQuickAction('refresh')}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:shadow-md transition-all duration-300"
            title="Refresh Data"
          >
            ↻
          </button>
        </div>
      </div>
    </div>
  );

  if (loading.submissions || loading.clients) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Role-based navigation component
  const RoleBasedSidebar = ({ userRole = 'superAdmin' }) => {
    const sidebarConfig = SIDEBAR_CONFIG[userRole] || SIDEBAR_CONFIG.superAdmin;
    
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-full">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{sidebarConfig.title}</h2>
          
          {sidebarConfig.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                {section.title}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => {
                      if (item.path.includes('#/')) {
                        navigate.navigateToHash(item.path.replace('#/', ''));
                      } else {
                        navigate.navigateToPath(item.path);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <span className="text-gray-400">{item.icon === 'LayoutDashboard' ? '📊' : 
                      item.icon === 'BarChart3' ? '📈' : 
                      item.icon === 'Users' ? '👥' : 
                      item.icon === 'Building' ? '🏢' : 
                      item.icon === 'Shield' ? '🛡️' : 
                      item.icon === 'Settings' ? '⚙️' : 
                      item.icon === 'FileText' ? '📄' : 
                      item.icon === 'Database' ? '💾' : '📋'}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <FadeTransition show={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex">
        {/* Role-based Navigation Sidebar */}
        <RoleBasedSidebar userRole={currentUser?.role?.toLowerCase() || 'superAdmin'} />
        
        {/* Main Content */}
        <div className="flex-1">
          <DashboardHeader
            title="Super Admin Dashboard"
            subtitle="Complete system oversight and control"
            icon="🔥"
            showNotifications={true}
            showProfile={true}
            customActions={[
              {
                label: 'Refresh All',
                onClick: () => handleQuickAction('refresh', 'all'),
                variant: 'default'
              },
              {
                label: 'Backup',
                onClick: () => handleQuickAction('backup', 'system'),
                variant: 'default'
              },
              {
                label: 'Settings',
                onClick: () => setShowSystemSettings(true),
                variant: 'default'
              }
            ]}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* System Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Users</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{dashboardMetrics.totalEmployees}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">👥</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Dashboards</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{activeDashboards?.length || 8}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">📊</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl shadow-lg border border-purple-200/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">System Performance</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{dashboardMetrics.averagePerformance?.toFixed(1) || '8.5'}/10</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">⚡</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl shadow-lg border border-red-200/50 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Security Status</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Secure</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">🔒</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Dashboards */}
          <div className="mb-8">
            <div className="flex items-center mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-4"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Core Dashboards</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Employee Dashboard */}
              <DashboardCard
                title="Employee Dashboard"
                icon="👥"
                color="from-blue-500 to-blue-600"
                stats={[
                  { label: 'Total Employees', value: dashboardMetrics.totalEmployees },
                  { label: 'Active This Month', value: dashboardMetrics.activeEmployees },
                  { label: 'Submissions', value: dashboardMetrics.currentMonthSubmissions }
                ]}
                onNavigate={() => onNavigateToDashboard('employee')}
                onQuickAction={(action) => handleQuickAction(action, 'employee')}
              />

              {/* Agency Dashboard */}
              <DashboardCard
                title="Agency Dashboard"
                icon="🚀"
                color="from-amber-500 to-amber-600"
                stats={[
                  { label: 'Active Users', value: activeUsers.agency },
                  { label: 'Total Clients', value: dashboardMetrics.totalClients },
                  { label: 'Active Clients', value: dashboardMetrics.activeClients }
                ]}
                onNavigate={() => onNavigateToDashboard('agency')}
                onQuickAction={(action) => handleQuickAction(action, 'agency')}
              />

              {/* Intern Dashboard */}
              <DashboardCard
                title="Intern Dashboard"
                icon="🎓"
                color="from-orange-500 to-orange-600"
                stats={[
                  { label: 'Active Interns', value: employees?.filter(e => e.employee_type === 'Intern' && e.status === 'active').length || 0 },
                  { label: 'Total Interns', value: dynamicStats.intern.value, change: dynamicStats.intern.change },
                  { label: 'Performance', value: '85%' }
                ]}
                onNavigate={() => onNavigateToDashboard('intern')}
                onQuickAction={(action) => handleQuickAction(action, 'intern')}
              />

              {/* Manager Dashboard */}
              <DashboardCard
                title="Manager Dashboard"
                icon="⚡"
                color="from-purple-500 to-purple-600"
                stats={[
                  { label: 'Pending Reviews', value: dashboardMetrics.pendingReviews },
                  { label: 'Team Performance', value: `${dashboardMetrics.averagePerformance?.toFixed(1) || '8.5'}/10` },
                  { label: 'Data Sync', value: dashboardMetrics.dataSync }
                ]}
                onNavigate={() => onNavigateToDashboard('manager')}
                onQuickAction={(action) => handleQuickAction(action, 'manager')}
              />
            </div>
          </div>

          {/* Administrative Dashboards */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Administrative Dashboards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sales Dashboard */}
              <DashboardCard
                title="Sales Dashboard"
                icon="💰"
                color="from-green-500 to-green-600"
                stats={[
                  { label: 'Revenue', value: dynamicStats.sales.value, change: dynamicStats.sales.change },
                  { label: 'Active Projects', value: superAdminStats.activeProjects },
                  { label: 'Client Satisfaction', value: `${superAdminStats.clientSatisfaction}%` }
                ]}
                onNavigate={() => onNavigateToDashboard('sales')}
                onQuickAction={(action) => handleQuickAction(action, 'sales')}
              />

              {/* HR Dashboard */}
              <DashboardCard
                title="HR Dashboard"
                icon="👤"
                color="from-pink-500 to-pink-600"
                stats={[
                  { label: 'Total Employees', value: dynamicStats.hr.value, change: dynamicStats.hr.change },
                  { label: 'Active Employees', value: superAdminStats.totalEmployees },
                  { label: 'Pending Reviews', value: dashboardMetrics.pendingReviews }
                ]}
                onNavigate={() => onNavigateToDashboard('hr')}
                onQuickAction={(action) => handleQuickAction(action, 'hr')}
              />

              {/* Finance Dashboard */}
              <DashboardCard
                title="Finance Dashboard"
                icon="📊"
                color="from-indigo-500 to-indigo-600"
                stats={[
                  { label: 'Monthly Revenue', value: dynamicStats.finance.value, change: dynamicStats.finance.change },
                  { label: 'Total Revenue', value: superAdminStats.monthlyRevenue },
                  { label: 'Profit Margin', value: '47%' }
                ]}
                onNavigate={() => onNavigateToDashboard('finance')}
                onQuickAction={(action) => handleQuickAction(action, 'finance')}
              />
            </div>
          </div>

          {/* Quick Actions */}
          {/* Monthly Reports Quick Access */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg text-white p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">📊 Monthly Analytics & Reports</h3>
                <p className="text-indigo-100 text-sm">
                  Access comprehensive system-wide monthly reports and analytics
                </p>
              </div>
              <button
                onClick={() => onNavigateToDashboard('monthly-reports')}
                className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
              >
                View Reports →
              </button>
            </div>
          </div>

          {/* Form Tracking Quick Access */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg text-white p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">📋 Form Tracking System</h3>
                <p className="text-emerald-100 text-sm">
                  Monitor onboarding forms, submission status, and administrative oversight
                </p>
              </div>
              <button
                onClick={() => onNavigateToDashboard('form-tracking')}
                className="px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
              >
                Track Forms →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleQuickAction('refresh', 'all')}
                className="flex items-center justify-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                🔄 Refresh Data
              </button>
              <button
                onClick={() => handleQuickAction('broadcast', 'system')}
                className="flex items-center justify-center gap-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                📢 Broadcast Message
              </button>
              <button
                onClick={() => handleQuickAction('backup', 'system')}
                className="flex items-center justify-center gap-2 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
              >
                💾 Backup Data
              </button>
              <button
                onClick={() => setShowSystemSettings(true)}
                className="flex items-center justify-center gap-2 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                🔧 System Maintenance
              </button>
            </div>
          </div>

          {/* Integrated Features */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Quote of the Day */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <QuoteOfTheDay isManager={true} />
            </div>
            
            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Leaderboard</h3>
              <LeaderboardView compact={true} />
            </div>
            
            {/* Notification Center */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔔 Notifications</h3>
              <NotificationCenter compact={true} />
            </div>
          </div>

          {/* Specialized Modules */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Specialized Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Arcade Admin Panel */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎮 Arcade Management</h3>
                <ArcadeAdminPanel compact={true} />
              </div>
              
              {/* Sales CRM */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💼 Sales CRM</h3>
                <SalesCRMDashboard compact={true} />
              </div>
              
              {/* SEO Appraisal */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 SEO Appraisal</h3>
                <SEOAppraisalSystem compact={true} />
              </div>
            </div>
          </div>

          {/* System Administration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Controls */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Controls</h3>
              <div className="space-y-3">
                {/* Login History Access */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">🔐 Login History & Security</h4>
                  <LoginHistoryComponent />
                </div>
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-blue-600">👥</span>
                    <span className="font-medium">User Management</span>
                  </span>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button
                  onClick={() => setShowAccessControl(true)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-green-600">🔐</span>
                    <span className="font-medium">Access Control</span>
                  </span>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button
                  onClick={() => setShowAuditLogs(true)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-purple-600">📋</span>
                    <span className="font-medium">Audit Logs</span>
                  </span>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button
                  onClick={() => setShowSystemSettings(true)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-gray-600">⚙️</span>
                    <span className="font-medium">System Settings</span>
                  </span>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Activity</h3>
              <div className="space-y-3">
                {auditLogs?.slice(0, 5).map((log, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-600">{log.timestamp}</p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeTransition>
  );
}

export default SuperAdminDashboard;