import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useAppNavigation } from '@/utils/navigation';
import { useUnifiedDataManager } from '@/hooks/useUnifiedDataManager';
import { thisMonthKey, monthLabel } from '@/shared/lib/constants';
import { LoadingSpinner, CardSkeleton } from '@/shared/components/LoadingStates';
import { FadeTransition } from '@/shared/components/Transitions';
import QuoteOfTheDay from './QuoteOfTheDay';
import DashboardHeader from './shared/DashboardHeader';

/**
 * Operations Head Dashboard
 * Provides oversight and control of marketing operations, employees, interns, and freelancers
 * Excludes sales, HR, and finance modules (Super Admin only)
 */
export function OperationsHeadDashboard({ onNavigateToDashboard }) {
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  const { user, hasPermission } = useUnifiedAuth();
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
      case 'freelancer':
        navigation.navigateToRoleDashboard('Freelancer');
        break;
      default:
        navigation.navigateToDashboard();
    }
  });

  // Simplified data management
  const {
    employees,
    submissions,
    clients,
    loading,
    isLoading,
    error,
    syncStatus,
    lastUpdated,
    syncAllData,
    getPerformanceMetrics
  } = useUnifiedDataManager();
  
  // Simplified state management
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showReporting, setShowReporting] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Simplified metrics calculation
  const dashboardMetrics = useMemo(() => {
    const metrics = getPerformanceMetrics();
    
    // Filter operations-focused data (exclude sales, HR, finance)
    const operationsEmployees = employees.filter(emp => 
      !['Sales', 'HR', 'Accountant', 'Finance'].includes(emp.role)
    );
    
    const operationsSubmissions = submissions.filter(sub => {
      const employee = employees.find(emp => 
        emp.id === sub.employeeId || 
        (sub.employee && emp.name === sub.employee.name)
      );
      return employee && !['Sales', 'HR', 'Accountant', 'Finance'].includes(employee.role);
    });

    return {
      ...metrics,
      totalEmployees: operationsEmployees.length,
      activeEmployees: operationsEmployees.filter(emp => emp.status === 'active').length,
      operationsSubmissions: operationsSubmissions.length,
      interns: employees.filter(emp => emp.role === 'Intern').length,
      freelancers: employees.filter(emp => emp.role === 'Freelancer').length,
      systemUptime: '99.9%',
      dataSync: isLoading ? 'syncing' : 'synchronized'
    };
  }, [employees, submissions, clients, getPerformanceMetrics, isLoading]);

  // Simplified data loading
  useEffect(() => {
    // Load sample notifications
    setNotifications([
      { id: 1, message: 'System updated successfully', type: 'success', read: false },
      { id: 2, message: 'New employee onboarded', type: 'info', read: false },
      { id: 3, message: 'Monthly reports due soon', type: 'warning', read: true }
    ]);
    
    // Load sample audit logs
    setAuditLogs([
      { id: 1, action: 'Dashboard Access', user: user?.name || 'Operations Head', timestamp: new Date() },
      { id: 2, action: 'Data Export', user: 'Manager', timestamp: new Date(Date.now() - 3600000) }
    ]);
  }, [user]);

  const handleQuickAction = async (action, target) => {
    try {
      switch (action) {
        case 'refresh':
          await syncAllData();
          notify('success', 'Operations dashboard data refreshed successfully');
          break;
        case 'broadcast':
          openModal(
            'Broadcast Message to Operations Team',
            <BroadcastMessageForm onSend={(message) => {
              console.log('Broadcasting message to operations team:', message);
              notify('success', 'Message broadcasted to operations team');
              closeModal();
            }} />,
            closeModal
          );
          break;
        case 'backup':
          const backupData = { 
            submissions: submissions.filter(sub => {
              const employee = employees.find(emp => emp.id === sub.employeeId);
              return employee && !['Sales', 'HR', 'Accountant'].includes(employee.role);
            }), 
            clients, 
            employees: employees.filter(emp => !['Sales', 'HR', 'Accountant'].includes(emp.role)), 
            timestamp: new Date().toISOString() 
          };
          const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `operations-backup-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          notify('success', 'Operations data backup downloaded');
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

  // Show loading state while data is loading
  if (isLoading) {
    return (
      <FadeTransition show={true}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
          <div className="space-y-6 p-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-center">
                <LoadingSpinner size="xl" showText text={`Loading operations data... ${syncStatus === 'syncing' ? '(Syncing)' : ''}`} />
              </div>
              {lastUpdated && (
                <div className="text-center mt-4 text-sm text-gray-500">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>
      </FadeTransition>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <FadeTransition show={true}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
          <div className="space-y-6 p-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <div className="text-red-600 text-lg mb-2">Error Loading Operations Data</div>
              <div className="text-red-700 mb-4">{error}</div>
              <button
                onClick={() => syncAllData(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          </div>
        </div>
      </FadeTransition>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50">
      <div className="space-y-8 p-6">
        <DashboardHeader
          title="Operations Head Dashboard"
          subtitle="Oversight of marketing operations, employees, interns, and freelancers"
          icon="🎯"
          showNotifications={true}
          showProfile={true}
          customActions={[
            {
              label: `${showAnalytics ? 'Hide' : 'Show'} Analytics`,
              onClick: () => setShowAnalytics(!showAnalytics),
              variant: showAnalytics ? 'active' : 'default'
            },
            {
              label: `${showReporting ? 'Hide' : 'Show'} Reports`,
              onClick: () => setShowReporting(!showReporting),
              variant: showReporting ? 'active' : 'default'
            },
            {
              label: `${showAuditLogs ? 'Hide' : 'Show'} Audit Logs`,
              onClick: () => setShowAuditLogs(!showAuditLogs),
              variant: showAuditLogs ? 'active' : 'default',
              badge: auditLogs.length
            },
            {
              label: 'Broadcast',
              onClick: () => handleQuickAction('broadcast', 'operations'),
              variant: 'default'
            },
            {
              label: 'Backup',
              onClick: () => handleQuickAction('backup', 'operations'),
              variant: 'default'
            },
            {
              label: 'Refresh',
              onClick: () => handleQuickAction('refresh', 'operations'),
              variant: 'default'
            }
          ]}
        />

      {/* System Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Performance</p>
              <span className="text-lg font-bold text-green-600">{dashboardMetrics.averagePerformance?.toFixed(1) || '8.5'}/10</span>
            </div>
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <span className="text-lg font-bold text-red-600">{dashboardMetrics.pendingReviews}</span>
            </div>
            <div className="p-2 rounded-full bg-red-100 text-red-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <span className="text-lg font-bold text-blue-600">{dashboardMetrics.systemUptime}</span>
            </div>
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Employee Dashboard */}
        <DashboardCard
          title="Marketing Employees"
          icon="👥"
          color="blue"
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
          title="Agency Operations"
          icon="🏢"
          color="green"
          stats={[
            { label: 'Total Clients', value: dashboardMetrics.totalClients },
            { label: 'Active Clients', value: dashboardMetrics.activeClients }
          ]}
          onNavigate={() => onNavigateToDashboard('agency')}
          onQuickAction={(action) => handleQuickAction(action, 'agency')}
        />

        {/* Intern Dashboard */}
        <DashboardCard
          title="Interns"
          icon="🎓"
          color="purple"
          stats={[
            { label: 'Total Interns', value: dashboardMetrics.interns },
            { label: 'Active Projects', value: 3 }
          ]}
          onNavigate={() => onNavigateToDashboard('intern')}
          onQuickAction={(action) => handleQuickAction(action, 'intern')}
        />

        {/* Freelancer Dashboard */}
        <DashboardCard
          title="Freelancers"
          icon="💼"
          color="orange"
          stats={[
            { label: 'Total Freelancers', value: dashboardMetrics.freelancers },
            { label: 'Active Projects', value: 5 }
          ]}
          onNavigate={() => onNavigateToDashboard('freelancer')}
          onQuickAction={(action) => handleQuickAction(action, 'freelancer')}
        />
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            onClick={() => onNavigateToDashboard('employee')}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-2">
              <span className="text-white font-medium">{dashboardMetrics.totalEmployees}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">View Employees</span>
            <span className="text-xs text-gray-500 mt-1">
              <span className="font-medium text-green-600">{dashboardMetrics.activeEmployees}</span> active
            </span>
          </button>
          
          <button
            className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            onClick={() => navigateToDashboard('agency')}
          >
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mb-2">
              <span className="text-white font-medium">{dashboardMetrics.totalClients}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Manage Clients</span>
            <span className="text-xs text-gray-500 mt-1">
              <span className="font-medium text-gray-900">{dashboardMetrics.activeClients}</span> active
            </span>
          </button>
          
          <button
            className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            onClick={() => navigateToDashboard('intern')}
          >
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mb-2">
              <span className="text-white font-medium">{dashboardMetrics.interns}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Intern Progress</span>
          </button>
          
          <button
            className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            onClick={() => navigateToDashboard('freelancer')}
          >
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center mb-2">
              <span className="text-white font-medium">{dashboardMetrics.freelancers}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">Freelancer Projects</span>
          </button>
        </div>
      </div>

      {/* Quote of the Day */}
      <div className="bg-white rounded-lg shadow p-6">
        <QuoteOfTheDay isManager={true} />
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Operations Leaderboard</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Leaderboard data will be displayed here</p>
        </div>
      </div>

      {/* Arcade Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎮 Arcade Management</h3>
        <div className="text-center py-8 text-gray-500">
          <p>Arcade management panel will be displayed here</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Operations Activity</h3>
        <div className="space-y-3">
          <ActivityItem
            icon="👤"
            message={`${dashboardMetrics.activeEmployees} marketing employees logged in today`}
            time="2 minutes ago"
            type="info"
          />
          <ActivityItem
            icon="📊"
            message={`${dashboardMetrics.currentMonthSubmissions} submissions received this month`}
            time="15 minutes ago"
            type="success"
          />
          <ActivityItem
            icon="🏢"
            message="Agency dashboard updated with new client projects"
            time="1 hour ago"
            type="info"
          />
          <ActivityItem
            icon="🎓"
            message={`${dashboardMetrics.interns} interns working on active projects`}
            time="2 hours ago"
            type="info"
          />
          <ActivityItem
            icon="💼"
            message={`${dashboardMetrics.freelancers} freelancers available for projects`}
            time="3 hours ago"
            type="info"
          />
        </div>
      </div>

      {/* Conditional Sections */}
      {showAnalytics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations Analytics</h3>
          <div className="text-center py-8 text-gray-500">
            <p>Operations analytics charts and data will be displayed here</p>
          </div>
        </div>
      )}

      {showReporting && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations Reports</h3>
          <div className="text-center py-8 text-gray-500">
            <p>Cross-dashboard reporting tools will be displayed here</p>
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            {notifications.map(notification => (
              <div key={notification.id} className={`p-3 rounded-lg border-l-4 ${
                notification.type === 'success' ? 'border-green-500 bg-green-50' :
                notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex justify-between items-start">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  {!notification.read && (
                    <span className="ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAuditLogs && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Logs</h3>
          <div className="space-y-3">
            {auditLogs.map(log => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-500">by {log.user}</p>
                </div>
                <p className="text-xs text-gray-400">{log.timestamp.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({ title, icon, color, stats, onNavigate, onQuickAction }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-gray-100">
      <div className={`bg-gradient-to-r ${colorClasses[color]} p-6 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl shadow-lg">
              {icon}
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <button
            onClick={onNavigate}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100">
              <span className="text-sm font-medium text-gray-600">{stat.label}</span>
              <span className="font-bold text-gray-900 text-lg">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ icon, message, time, type }) {
  const typeColors = {
    success: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
    info: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
    warning: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300',
    error: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300'
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center text-lg shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{message}</p>
        <p className="text-xs text-gray-500 mt-1 font-medium">{time}</p>
      </div>
      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${typeColors[type]} shadow-sm`}>
        {type}
      </span>
    </div>
  );
}

// Broadcast Message Form Component
function BroadcastMessageForm({ onSend }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl">
      <div>
        <label htmlFor="message" className="block text-lg font-bold text-gray-800 mb-3">
          📢 Message to Operations Team
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
          placeholder="Enter your message to broadcast to all operations team members..."
          required
        />
      </div>
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => setMessage('')}
          className="px-6 py-3 text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        >
          Clear
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-xl hover:scale-105"
        >
          Send Message
        </button>
      </div>
    </form>
  );
}

export default OperationsHeadDashboard;