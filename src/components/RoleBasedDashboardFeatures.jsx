import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Zap, TrendingUp, Users, Calendar, FileText, Settings, Plus } from 'lucide-react';
import { configService } from '@/shared/services/configService';
import { useAppNavigation } from '@/utils/navigation';

/**
 * RoleBasedDashboardFeatures Component
 * Provides personalized dashboard features based on user role including:
 * - Quick Actions specific to role
 * - Role-specific notifications
 * - Customized widgets and KPI displays
 * - Personalized dashboard layout
 */
const RoleBasedDashboardFeatures = ({ className = '' }) => {
  const { authState } = useUnifiedAuth();
  const navigation = useAppNavigation();
  const [roleFeatures, setRoleFeatures] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentRole = authState.currentUser?.role || authState.user?.role || authState.role;

  useEffect(() => {
    const loadRoleFeatures = async () => {
      try {
        const uiConfig = await configService.getUIConfig();
        const features = uiConfig.personalizedDashboard?.roleSpecificFeatures?.[currentRole];
        
        if (features) {
          setRoleFeatures(features);
          // Simulate loading notifications (in real app, fetch from API)
          setNotifications(generateMockNotifications(features.notifications));
        }
      } catch (error) {
        console.error('Error loading role features:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentRole) {
      loadRoleFeatures();
    }
  }, [currentRole]);

  const generateMockNotifications = (notificationTypes) => {
    const mockData = {
      'Ranking Updates': [
        { id: 1, message: 'Client ABC ranking improved for "digital marketing"', time: '2 hours ago', priority: 'high' },
        { id: 2, message: 'Weekly ranking report ready for review', time: '1 day ago', priority: 'medium' }
      ],
      'Budget Alerts': [
        { id: 3, message: 'Campaign XYZ approaching budget limit (85% spent)', time: '30 minutes ago', priority: 'high' },
        { id: 4, message: 'Monthly budget review scheduled for tomorrow', time: '3 hours ago', priority: 'low' }
      ],
      'Post Performance': [
        { id: 5, message: 'Instagram post reached 10K+ impressions', time: '1 hour ago', priority: 'medium' },
        { id: 6, message: 'Content calendar needs approval for next week', time: '4 hours ago', priority: 'medium' }
      ],
      'Video Performance': [
        { id: 7, message: 'Latest video gained 1K+ views in 24 hours', time: '2 hours ago', priority: 'high' },
        { id: 8, message: 'Thumbnail A/B test results available', time: '6 hours ago', priority: 'medium' }
      ],
      'Build Status': [
        { id: 9, message: 'Production deployment completed successfully', time: '1 hour ago', priority: 'high' },
        { id: 10, message: 'Code review pending for feature branch', time: '3 hours ago', priority: 'medium' }
      ],
      'Design Approvals': [
        { id: 11, message: 'Client approved logo design v3', time: '2 hours ago', priority: 'high' },
        { id: 12, message: 'Brand guidelines update required', time: '1 day ago', priority: 'low' }
      ],
      'Project Invitations': [
        { id: 13, message: 'New project invitation: E-commerce Website', time: '30 minutes ago', priority: 'high' },
        { id: 14, message: 'Client feedback received on proposal', time: '2 hours ago', priority: 'medium' }
      ],
      'Learning Milestones': [
        { id: 15, message: 'Completed React Fundamentals course', time: '1 hour ago', priority: 'medium' },
        { id: 16, message: 'New learning module assigned: Advanced JavaScript', time: '4 hours ago', priority: 'low' }
      ],
      'New Hires': [
        { id: 17, message: 'John Doe starts onboarding tomorrow', time: '2 hours ago', priority: 'high' },
        { id: 18, message: '3 candidates scheduled for final interviews', time: '1 day ago', priority: 'medium' }
      ],
      'Team Performance': [
        { id: 19, message: 'Q1 team productivity increased by 15%', time: '3 hours ago', priority: 'high' },
        { id: 20, message: 'Weekly team sync scheduled for Friday', time: '1 day ago', priority: 'low' }
      ],
      'System Alerts': [
        { id: 21, message: 'Database backup completed successfully', time: '1 hour ago', priority: 'medium' },
        { id: 22, message: 'Security scan detected no vulnerabilities', time: '6 hours ago', priority: 'low' }
      ]
    };

    const notifications = [];
    notificationTypes.forEach(type => {
      if (mockData[type]) {
        notifications.push(...mockData[type]);
      }
    });

    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }).slice(0, 5); // Show top 5 notifications
  };

  const handleQuickAction = (action) => {
    console.log(`Executing quick action: ${action}`);
    
    // Handle Quick Access navigation
    switch (action) {
      case 'Organization Chart':
      case 'Org Chart':
        navigation.navigateToOrganizationChart();
        break;
      case 'Employee Directory':
      case 'Directory':
        navigation.navigateToDirectory();
        break;
      case 'Performance Scoring':
      case 'Performance Review':
        navigation.navigateToPerformanceScoring();
        break;
      case 'Client Directory':
        navigation.navigateToClientDirectory();
        break;
      case 'Interactive Forms':
        navigation.navigateToInteractiveForms();
        break;
      case 'Monthly Reports':
        navigation.navigateToReports();
        break;
      default:
        // For other role-specific actions, you can add more navigation logic here
        console.log(`No navigation defined for action: ${action}`);
        break;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionIcon = (action) => {
    const iconMap = {
      'Keyword Research': '🔍',
      'SERP Analysis': '📊',
      'Content Optimization': '✏️',
      'GMB Management': '📍',
      'Campaign Setup': '🚀',
      'Budget Optimization': '💰',
      'A/B Testing': '🧪',
      'Performance Review': '📈',
      'Content Scheduling': '📅',
      'Engagement Analysis': '💬',
      'Hashtag Research': '#️⃣',
      'Story Creation': '📱',
      'Video Optimization': '🎥',
      'Thumbnail Design': '🖼️',
      'Analytics Review': '📊',
      'Keyword Tags': '🏷️',
      'Code Review': '👨‍💻',
      'Performance Testing': '⚡',
      'Bug Fixes': '🐛',
      'Feature Development': '⚙️',
      'Design Review': '🎨',
      'Asset Creation': '📁',
      'Brand Guidelines': '📋',
      'Client Feedback': '💭',
      'Project Bidding': '💼',
      'Time Tracking': '⏰',
      'Invoice Generation': '🧾',
      'Client Communication': '📞',
      'Learning Modules': '📚',
      'Task Submission': '✅',
      'Mentor Meeting': '👥',
      'Progress Review': '📊',
      'Employee Onboarding': '🎯',
      'Performance Reviews': '📝',
      'Policy Updates': '📄',
      'Recruitment': '👤',
      'Team Management': '👥',
      'Process Optimization': '⚙️',
      'Resource Allocation': '📊',
      'Strategic Planning': '🎯',
      'System Monitoring': '🖥️',
      'User Management': '👥',
      'Security Review': '🔒',
      'Data Analytics': '📊',
      // Quick Access Features
      'Employee Directory': '👥',
      'Directory': '👥',
      'Organization Chart': '🏢',
      'Org Chart': '🏢',
      'Performance Scoring': '📊',
      'Client Directory': '🏢',
      'Interactive Forms': '📝',
      'Monthly Reports': '📈'
    };
    return iconMap[action] || '⚡';
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!roleFeatures) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No personalized features available for this role.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Actions Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleFeatures.quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
              onClick={() => handleQuickAction(action)}
            >
              <span className="text-2xl">{getActionIcon(action)}</span>
              <span className="text-sm font-medium text-center">{action}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-600" />
          Recent Notifications
        </h3>
        <Card>
          <CardContent className="p-0">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 mb-1">{notification.message}</p>
                        <p className="text-xs text-gray-500">{notification.time}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                      >
                        {notification.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications at the moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KPI Priority Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Priority KPIs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleFeatures.kpiPriority.map((kpi, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="text-center">
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">
                    {kpi.replace(/_/g, ' ')}
                  </h4>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {/* In a real app, these would be actual KPI values */}
                    {Math.floor(Math.random() * 100)}%
                  </div>
                  <p className="text-xs text-gray-500">This month</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Widgets Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600" />
          Role-Specific Widgets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roleFeatures.widgets.map((widget, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">
                  {widget.replace(/_/g, ' ')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <p className="text-sm text-gray-600">Widget Content</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleBasedDashboardFeatures;