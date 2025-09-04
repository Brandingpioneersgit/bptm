import React, { useState, useEffect, useMemo } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useDataSync } from './DataSyncContext';
import { useCrossDashboardSync } from './CrossDashboardSync';
import { useRBAC } from './useRBAC';
import { useNotificationSystem } from './NotificationSystem';
import { useEmployeeSync } from '@/features/employees/context/EmployeeSyncContext';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { thisMonthKey, monthLabel } from '@/shared/lib/constants';
import { calculateScopeCompletion } from '@/shared/lib/scoring';
import { DashboardAnalytics } from './DashboardAnalytics';
import { ConfigurationManager } from './ConfigurationManager';
import { CrossDashboardReporting } from './CrossDashboardReporting';
import RoleBasedAccessControl from './RoleBasedAccessControl';
import NotificationCenter from './NotificationSystem';
import { useAuditLogging, AuditLoggingDashboard } from './AuditLogging';
import personalizedDashboardService from '../shared/services/personalizedDashboardService';
import { useAppNavigation } from '@/utils/navigation';

/**
 * Centralized Manager Control Panel
 * Provides comprehensive oversight and control of all connected dashboards
 */
export function ManagerControlPanel({ onNavigateToDashboard }) {
  const supabase = useSupabase();
  const { submissions, clients, loading, refreshAllData } = useDataSync();
  const { employees } = useEmployeeSync();
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  const navigation = useAppNavigation();
  
  // Use prop navigation if provided, otherwise use hook navigation
  const navigateToDashboard = onNavigateToDashboard || ((dashboardType) => {
    switch (dashboardType) {
      case 'employee':
        navigation.navigateToEmployeeDirectory();
        break;
      case 'agency':
        navigation.navigateToClientDirectory();
        break;
      case 'intern':
        navigation.navigateToRoleDashboard('Intern');
        break;
      case 'manager':
        navigation.navigateToRoleDashboard('Manager');
        break;
      case 'freelancer':
        navigation.navigateToRoleDashboard('Freelancer');
        break;
      default:
        navigation.navigateToDashboard();
    }
  });
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
  
  const [activeUsers, setActiveUsers] = useState({
    employees: 0,
    interns: 0,
    managers: 0,
    agency: 0
  });
  
  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    sync: 'healthy',
    performance: 'good'
  });
  
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [showReporting, setShowReporting] = useState(false);
  const [showAccessControl, setShowAccessControl] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [personalizedCards, setPersonalizedCards] = useState([]);
  
  const [dashboardStats, setDashboardStats] = useState({
    employee: { active: 0, submissions: 0, lastActivity: null },
    agency: { active: 0, updates: 0, lastActivity: null },
    intern: { active: 0, projects: 0, lastActivity: null },
    manager: { active: 1, actions: 0, lastActivity: new Date().toISOString() }
  });

  // Calculate real-time dashboard metrics with personalization
  const dashboardMetrics = useMemo(() => {
    const currentMonth = thisMonthKey();
    const currentMonthSubmissions = submissions.filter(sub => sub.monthKey === currentMonth);
    
    const baseMetrics = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(emp => emp.status === 'active').length,
      currentMonthSubmissions: currentMonthSubmissions.length,
      pendingReviews: currentMonthSubmissions.filter(sub => !sub.manager?.reviewed).length,
      totalClients: clients.length,
      activeClients: clients.filter(client => client.status === 'active').length,
      averagePerformance: currentMonthSubmissions.length > 0 
        ? currentMonthSubmissions.reduce((acc, sub) => acc + (sub.overallScore || 0), 0) / currentMonthSubmissions.length
        : 0,
      systemUptime: '99.9%',
      dataSync: loading.submissions || loading.clients ? 'syncing' : 'synchronized'
    };
    
    // Apply personalized metrics if available
    if (personalizedCards.length > 0) {
      const personalizedMetrics = personalizedCards.find(card => card.type === 'metrics');
      if (personalizedMetrics) {
        return { ...baseMetrics, ...personalizedMetrics.data };
      }
    }
    
    return baseMetrics;
  }, [submissions, employees, clients, loading, personalizedCards]);

  // Load personalized dashboard data
  useEffect(() => {
    const loadPersonalizedData = async () => {
      if (!currentUser) return;
      
      try {
        const cards = await personalizedDashboardService.getPersonalizedDashboardCards(currentUser);
        setPersonalizedCards(cards);
      } catch (error) {
        console.error('Error loading personalized dashboard data:', error);
      }
    };
    
    loadPersonalizedData();
  }, [currentUser]);

  // Update manager dashboard activity
  useEffect(() => {
    updateDashboardActivity('manager', {
      activeUsers: 1,
      currentView: 'controlPanel'
    });
  }, [updateDashboardActivity]);

  // Update active users from cross-dashboard data
  useEffect(() => {
    setActiveUsers({
      employees: dashboardActivity.employee?.activeUsers || 0,
      interns: dashboardActivity.intern?.activeUsers || 0,
      managers: dashboardActivity.manager?.activeUsers || 1,
      agency: dashboardActivity.agency?.activeUsers || 0
    });
  }, [dashboardActivity]);

  // Monitor system health
  useEffect(() => {
    const checkSystemHealth = () => {
      const dbHealth = supabase ? 'healthy' : 'local';
      const syncHealth = loading.submissions || loading.clients ? 'syncing' : 'healthy';
      const perfHealth = dashboardMetrics.averagePerformance > 7 ? 'excellent' : 
                        dashboardMetrics.averagePerformance > 5 ? 'good' : 'needs-attention';
      
      setSystemHealth({
        database: dbHealth,
        sync: syncHealth,
        performance: perfHealth
      });
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 10000);
    return () => clearInterval(interval);
  }, [supabase, loading, dashboardMetrics.averagePerformance]);

  const handleQuickAction = async (action, target) => {
    try {
      switch (action) {
        case 'refresh':
          await refreshAllData();
          notify('success', 'All dashboard data refreshed successfully');
          break;
        case 'broadcast':
          openModal(
            'Broadcast Message',
            <BroadcastMessageForm onSend={(message) => {
              console.log('Broadcasting message:', message);
              notify('success', 'Message broadcasted to all dashboards');
              closeModal();
            }} />,
            closeModal
          );
          break;
        case 'backup':
          const backupData = { submissions, clients, employees, timestamp: new Date().toISOString() };
          const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          notify('success', 'Dashboard data backup downloaded');
          break;
        default:
          notify('info', `${action} action triggered for ${target}`);
      }
    } catch (error) {
      notify('error', `Failed to execute ${action}: ${error.message}`);
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': case 'syncing': return 'text-yellow-600 bg-yellow-100';
      case 'local': return 'text-blue-600 bg-blue-100';
      case 'needs-attention': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg text-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎛️ Manager Control Panel</h1>
            <p className="text-blue-100">Centralized oversight and control of all connected dashboards</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
               onClick={() => setShowAnalytics(!showAnalytics)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                 showAnalytics 
                   ? 'bg-white/30 hover:bg-white/40' 
                   : 'bg-white/20 hover:bg-white/30'
               }`}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
               {showAnalytics ? 'Hide' : 'Show'} Analytics
             </button>
             <button
               onClick={() => setShowConfiguration(!showConfiguration)}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                 showConfiguration 
                   ? 'bg-white/30 hover:bg-white/40' 
                   : 'bg-white/20 hover:bg-white/30'
               }`}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               {showConfiguration ? 'Hide' : 'Show'} Configuration
              </button>
              <button
                onClick={() => setShowReporting(!showReporting)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showReporting 
                    ? 'bg-white/30 hover:bg-white/40' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {showReporting ? 'Hide' : 'Show'} Reports
              </button>
              
              {hasFeatureAccess('userManagement') && (
                <button
                  onClick={() => setShowAccessControl(!showAccessControl)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    showAccessControl 
                      ? 'bg-white/30 hover:bg-white/40' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {showAccessControl ? 'Hide' : 'Show'} Access Control
                </button>
              )}
              
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showNotifications 
                    ? 'bg-white/30 hover:bg-white/40' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718A10.001 10.001 0 0119.718 4.868M4.868 19.718L19.718 4.868" />
                </svg>
                {showNotifications ? 'Hide' : 'Show'} Notifications
                {systemNotifications && systemNotifications.filter(n => !n.read).length > 0 && (
                  <span className="ml-1 px-2 py-1 bg-red-500 text-white rounded-full text-xs">
                    {systemNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowAuditLogs(!showAuditLogs);
                  logUserAction('view', 'audit_logs', { dashboard: 'manager' });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showAuditLogs 
                    ? 'bg-white/30 hover:bg-white/40' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {showAuditLogs ? 'Hide' : 'Show'} Audit Logs
                <span className="ml-1 px-2 py-1 bg-blue-500 text-white rounded-full text-xs">
                  {auditLogs.length}
                </span>
              </button>
            <button
              onClick={() => handleQuickAction('refresh', 'all')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh All
            </button>
            <button
              onClick={() => handleQuickAction('broadcast', 'all')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Broadcast
            </button>
            <button
              onClick={() => handleQuickAction('backup', 'all')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Backup
            </button>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏥 System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(systemHealth.database)}`}>
                {systemHealth.database}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Data Sync</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(systemHealth.sync)}`}>
                {systemHealth.sync}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Performance</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(systemHealth.performance)}`}>
                {systemHealth.performance}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Active Users</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Employees</span>
              <span className="text-lg font-bold text-blue-600">{activeUsers.employees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Interns</span>
              <span className="text-lg font-bold text-orange-600">{activeUsers.interns}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Agency Team</span>
              <span className="text-lg font-bold text-amber-600">{activeUsers.agency}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Performance</span>
              <span className="text-lg font-bold text-green-600">{dashboardMetrics.averagePerformance.toFixed(1)}/10</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Reviews</span>
              <span className="text-lg font-bold text-red-600">{dashboardMetrics.pendingReviews}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">System Uptime</span>
              <span className="text-lg font-bold text-blue-600">{dashboardMetrics.systemUptime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Employee Dashboard */}
        <DashboardCard
          title="Employee Dashboard"
          icon="👥"
          color="blue"
          stats={[
            { label: 'Total Employees', value: dashboardMetrics.totalEmployees },
            { label: 'Active This Month', value: dashboardMetrics.activeEmployees },
            { label: 'Submissions', value: dashboardMetrics.currentMonthSubmissions }
          ]}
          onNavigate={() => navigateToDashboard('employee')}
          onQuickAction={(action) => handleQuickAction(action, 'employee')}
        />

        {/* Agency Dashboard */}
        <DashboardCard
          title="Agency Dashboard"
          icon="🚀"
          color="amber"
          stats={[
            { label: 'Active Users', value: activeUsers.agency },
            { label: 'Total Clients', value: dashboardMetrics.totalClients },
            { label: 'Active Clients', value: dashboardMetrics.activeClients }
          ]}
          onNavigate={() => navigateToDashboard('agency')}
          onQuickAction={(action) => handleQuickAction(action, 'agency')}
        />

        {/* Intern Dashboard */}
        <DashboardCard
          title="Intern Dashboard"
          icon="🎓"
          color="orange"
          stats={[
            { label: 'Active Interns', value: activeUsers.interns },
            { label: 'Projects', value: 12 },
            { label: 'Completion Rate', value: '85%' }
          ]}
          onNavigate={() => navigateToDashboard('intern')}
          onQuickAction={(action) => handleQuickAction(action, 'intern')}
        />

        {/* Manager Dashboard */}
        <DashboardCard
          title="Manager Dashboard"
          icon="⚡"
          color="purple"
          stats={[
            { label: 'Pending Reviews', value: dashboardMetrics.pendingReviews },
            { label: 'Team Performance', value: `${dashboardMetrics.averagePerformance.toFixed(1)}/10` },
            { label: 'Data Sync', value: dashboardMetrics.dataSync }
          ]}
          onNavigate={() => navigateToDashboard('manager')}
          onQuickAction={(action) => handleQuickAction(action, 'manager')}
        />
      </div>

      {/* Organization & Management Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Organization Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg">
                🏢
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Organization Chart</h3>
                <p className="text-sm text-gray-600">View department hierarchies</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Employees</span>
              <span className="font-medium">{dashboardMetrics.totalEmployees}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Active Employees</span>
              <span className="font-medium text-green-600">{dashboardMetrics.activeEmployees}</span>
            </div>
          </div>
          <button
            onClick={() => navigation.navigateToOrganizationChart()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            View Organization Chart
          </button>
        </div>

        {/* Employee Directory */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-lg">
                📞
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Employee Directory</h3>
                <p className="text-sm text-gray-600">Contact information & WhatsApp</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">With Phone Numbers</span>
              <span className="font-medium">{employees.filter(emp => emp.phone).length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">WhatsApp Ready</span>
              <span className="font-medium text-gray-900">{employees.filter(emp => emp.phone && emp.phone.length > 8).length}</span>
            </div>
          </div>
          <button
            onClick={() => navigation.navigateToEmployeeDirectory()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            View Employee Directory
          </button>
        </div>

        {/* Client Management */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-lg">
                📊
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Client Management</h3>
                <p className="text-sm text-gray-600">Projects & satisfaction tracking</p>
              </div>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Clients</span>
              <span className="font-medium">{dashboardMetrics.totalClients}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Active Projects</span>
              <span className="font-medium text-gray-900">{dashboardMetrics.activeClients}</span>
            </div>
          </div>
          <button
            onClick={() => navigation.navigateToClientDirectory()}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-medium"
          >
            View Client Management
          </button>
        </div>
      </div>

      {/* Real-time Notifications */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🔔 Real-time Notifications
            {unreadNotifications > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadNotifications}
              </span>
            )}
          </h3>
          <button
            onClick={clearNotifications}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear All
          </button>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No notifications
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-l-4 ${
                  notification.read
                    ? 'bg-gray-50 border-gray-300'
                    : notification.type === 'error'
                    ? 'bg-red-50 border-red-400'
                    : notification.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
                onClick={() => markNotificationRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{notification.message}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Recent Activity</h3>
        <div className="space-y-3">
          <ActivityItem
            icon="📝"
            message="New employee submission received"
            time="2 minutes ago"
            type="submission"
          />
          <ActivityItem
            icon="👥"
            message="3 employees logged into their dashboards"
            time="5 minutes ago"
            type="login"
          />
          <ActivityItem
            icon="🎓"
            message="Intern completed project milestone"
            time="12 minutes ago"
            type="achievement"
          />
          <ActivityItem
            icon="🚀"
            message="Agency dashboard updated with new announcements"
            time="18 minutes ago"
            type="update"
          />
          <ActivityItem
            icon="⚡"
            message="Manager reviewed 2 employee submissions"
            time="25 minutes ago"
            type="review"
          />
        </div>
      </div>
      
      {/* Analytics Section */}
       {showAnalytics && (
         <div className="mt-6">
           <DashboardAnalytics />
         </div>
       )}
       
       {/* Configuration Section */}
        {showConfiguration && (
          <div className="mt-6">
            <ConfigurationManager />
          </div>
        )}
        
        {/* Reporting Section */}
        {showReporting && (
          <div className="mt-6">
            <CrossDashboardReporting />
          </div>
        )}
        
        {/* Access Control Section */}
        {showAccessControl && hasFeatureAccess('userManagement') && (
          <div className="mt-6">
            <RoleBasedAccessControl />
          </div>
        )}
        
        {/* Notification Center Section */}
        {showNotifications && (
          <div className="mt-6">
            <NotificationCenter />
          </div>
        )}
        
        {/* Audit Logs Section */}
        {showAuditLogs && (
          <div className="mt-6">
            <AuditLoggingDashboard />
          </div>
        )}
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({ title, icon, color, stats, onNavigate, onQuickAction }) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50'
  };

  const buttonColors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border-2 ${colorClasses[color]} p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{stat.label}</span>
            <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onNavigate}
          className={`flex-1 px-3 py-2 ${buttonColors[color]} text-white rounded-lg text-sm font-medium transition-colors`}
        >
          Open
        </button>
        <button
          onClick={() => onQuickAction('monitor')}
          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          Monitor
        </button>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ icon, message, time, type }) {
  const typeColors = {
    submission: 'text-blue-600',
    login: 'text-green-600',
    achievement: 'text-orange-600',
    update: 'text-amber-600',
    review: 'text-purple-600'
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{message}</p>
        <p className={`text-xs ${typeColors[type]}`}>{time}</p>
      </div>
    </div>
  );
}

// Broadcast Message Form Component
function BroadcastMessageForm({ onSend }) {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');
  const [targets, setTargets] = useState(['all']);

  const handleSend = () => {
    if (message.trim()) {
      onSend({ message, priority, targets, timestamp: new Date().toISOString() });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="Enter your message to broadcast to all dashboards..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      
      <div className="flex justify-end gap-3">
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Send Broadcast
        </button>
      </div>
    </div>
  );
}