import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFetchSubmissions } from './useFetchSubmissions';
import { useSupabase } from './SupabaseProvider';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useAppNavigation } from '@/utils/navigation';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner, CardSkeleton, TableSkeleton } from '@/shared/components/LoadingStates';
import MonthlyFormPrompt from './MonthlyFormPrompt';
import QuoteOfTheDay from './QuoteOfTheDay';
import { ClientAdditionForm } from '@/features/clients/components/ClientAdditionForm';

import LeaveApplicationForm from './LeaveApplicationForm';
import DepartmentTargetBar from './DepartmentTargetBar';
import { getCardClasses, getButtonClasses } from '@/shared/styles/designSystem';
import configService from '@/shared/services/configService';
import agencyDashboardService from '@/shared/services/agencyDashboardService';
import workspaceService from '@/shared/services/workspaceService';
import liveDataService from '@/shared/services/liveDataService';
import { PermissionGuard, RoleGuard } from './PermissionGuard';
import DashboardHeader from './shared/DashboardHeader';
import ClientPaymentStatus from './ClientPaymentStatus';
import ClientProjects from './ClientProjects';



const NewsTicker = ({ news, isManager, onUpdateNews }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNews, setEditedNews] = useState(news);

  const handleSave = () => {
    onUpdateNews(editedNews);
      setIsEditing(false);
   };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Company News</h3>
        {isManager && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editedNews}
            onChange={(e) => setEditedNews(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            rows={3}
          />
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          <div className="animate-pulse">
            {news || 'No company news available.'}
          </div>
        </div>
      )}
    </div>
  );
};

const DynamicWorkspaceGrid = ({ workspaces, isLoading, onWorkspaceClick }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
        {[...Array(6)].map((_, index) => (
          <CardSkeleton key={index} className="h-20" />
        ))}
      </div>
    );
  }

  const workspaceEntries = Object.entries(workspaces);

  if (workspaceEntries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🚀</div>
        <p>No workspaces available for your role.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {workspaceEntries.map(([key, workspace]) => {
        const isExternal = workspace.type === 'external';
        const handleClick = () => {
          if (onWorkspaceClick) {
            onWorkspaceClick(workspace.title, workspace.type);
          }
          
          if (isExternal && workspace.url) {
            window.open(workspace.url, '_blank', 'noopener,noreferrer');
          } else if (workspace.path) {
            navigation.navigate(workspace.path);
          }
        };

        return (
          <button
            key={key}
            onClick={handleClick}
            className="group px-3 py-2 sm:px-4 sm:py-3 bg-white/70 backdrop-blur-sm border border-orange-200 text-gray-700 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 text-left transform hover:-translate-y-0.5"
          >
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg group-hover:scale-110 transition-transform">
                {workspace.icon || '🔗'}
              </span>
              <span className="font-medium text-sm">{workspace.title}</span>
              {isExternal && (
                <span className="text-xs text-gray-400">↗</span>
              )}
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">
              {workspace.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};

const DynamicPerformanceLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await agencyDashboardService.getPerformanceLeaderboard();
        setLeaderboardData(data);
      } catch (error) {
        console.error('Error fetching performance leaderboard:', error);
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
          <CardSkeleton key={index} className="h-16" />
        ))}
      </div>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📊</div>
        <p>No performance data available yet.</p>
      </div>
    );
  }

  const handleLeaderboardClick = (employee) => {
    // Navigate to employee profile or performance details
    navigation.navigateToProfile(employee.id || employee.name);
  };

  return (
    <div className="space-y-3">
      {leaderboardData.map((employee, index) => {
        const isTopThree = index < 3;
        const medals = ['🥇', '🥈', '🥉'];
        
        return (
          <button
            key={`${index}-${employee.name}-${employee.id || employee.submissionCount}`}
            onClick={() => handleLeaderboardClick(employee)}
            className={`w-full flex items-center justify-between p-3 rounded-lg cursor-pointer hover:scale-105 transform transition-all duration-200 ${
              isTopThree ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-lg font-bold text-gray-600 w-8">
                {isTopThree ? medals[index] : `#${index + 1}`}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">{employee.name}</div>
                <div className="text-xs text-gray-500">
                  {employee.submissionCount} submission{employee.submissionCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg text-gray-900">{employee.score || employee.totalScore}</div>
              <div className="text-xs text-gray-500">{employee.department || 'points'}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const ConsolidatedEventsUpdates = ({ isManager, events, updates, onUpdateEvents, onUpdateUpdates, onSubmitFeedback }) => {
  const [activeTab, setActiveTab] = useState('events');
  const [isEditingEvents, setIsEditingEvents] = useState(false);
  const [isEditingUpdates, setIsEditingUpdates] = useState(false);
  const [editedEvents, setEditedEvents] = useState(events);
  const [editedUpdates, setEditedUpdates] = useState(updates);
  const [feedback, setFeedback] = useState('');

  const handleSaveEvents = () => {
    onUpdateEvents(editedEvents);
    setIsEditingEvents(false);
  };

  const handleSaveUpdates = () => {
    onUpdateUpdates(editedUpdates);
    setIsEditingUpdates(false);
  };

  const handleSubmitFeedback = () => {
    if (feedback.trim()) {
      onSubmitFeedback(feedback);
      setFeedback('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Updates & Events</h3>
      </div>
      
      <div className="flex space-x-1 mb-4">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            activeTab === 'events'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Events
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            activeTab === 'updates'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Updates
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            activeTab === 'feedback'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Feedback
        </button>
      </div>

      {activeTab === 'events' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Upcoming Events</h4>
            {isManager && (
              <button
                onClick={() => setIsEditingEvents(!isEditingEvents)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isEditingEvents ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>
          {isEditingEvents ? (
            <div className="space-y-3">
              <textarea
                value={editedEvents}
                onChange={(e) => setEditedEvents(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={4}
                placeholder="Enter upcoming events..."
              />
              <button
                onClick={handleSaveEvents}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Save Events
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {events || 'No upcoming events.'}
            </div>
          )}
        </div>
      )}

      {activeTab === 'updates' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Company Updates</h4>
            {isManager && (
              <button
                onClick={() => setIsEditingUpdates(!isEditingUpdates)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {isEditingUpdates ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>
          {isEditingUpdates ? (
            <div className="space-y-3">
              <textarea
                value={editedUpdates}
                onChange={(e) => setEditedUpdates(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                rows={4}
                placeholder="Enter company updates..."
              />
              <button
                onClick={handleSaveUpdates}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Save Updates
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {updates || 'No recent updates.'}
            </div>
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Submit Feedback</h4>
          <div className="space-y-3">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={4}
              placeholder="Share your feedback, suggestions, or concerns..."
            />
            <button
              onClick={handleSubmitFeedback}
              disabled={!feedback.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AgencyDashboard = ({ userType, currentUser, onNavigateToProfile }) => {
  const { supabase } = useSupabase();
  const { authState, user, isLoading: loading } = useUnifiedAuth();
  const { submissions: allSubmissions, loading: submissionsLoading } = useFetchSubmissions();
  const navigation = useAppNavigation();
  const { notify } = useToast();
  
  // Determine manager status from authenticated user
  const isManager = useMemo(() => {
    return user?.role === 'Operations Head' || user?.role === 'Manager' || user?.role === 'Super Admin' || userType === 'manager';
  }, [user?.role, userType]);
     
  // Debug logging for authentication state
  useEffect(() => {
    console.log('🏢 AgencyDashboard - Auth State:', {
      user,
      loading
    });
  }, [user, loading]);
  
  const [dashboardData, setDashboardData] = useState({
    news: 'Welcome to our agency dashboard! Stay updated with the latest company news and announcements.',
    tools: [],
    events: 'Team meeting every Monday at 10 AM. Monthly all-hands on the first Friday of each month.',
    updates: 'New project management system launched. Please update your profiles in the employee directory.'
  });
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  
  const [dynamicStats, setDynamicStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [workspaces, setWorkspaces] = useState({});
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [workspacesError, setWorkspacesError] = useState(null);
  const [contentError, setContentError] = useState(null);
  
  // Get UI configuration
  const [agencyDashboard, setAgencyDashboard] = useState(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  
  useEffect(() => {
    const loadUIConfig = async () => {
      try {
        const uiConfig = await configService.getUIConfig();
        setAgencyDashboard(uiConfig.agencyDashboard);
      } catch (error) {
        console.error('Error loading UI config:', error);
        // Fallback to default values if config fails to load
        setAgencyDashboard({
          title: 'Agency Dashboard',
          welcomeMessage: 'Welcome',
          myProfile: 'My Profile',
          navigation: {
            monthlyForm: 'Monthly Form',
            reports: 'Reports',
            tools: 'Tools',
            leaveWfh: 'Leave/WFH',
            addClient: 'Add Client'
          },
          sections: {
            addNewClient: 'Add New Client',
            dailyInspiration: 'Daily Inspiration',
            performanceLeaderboard: 'Performance Leaderboard',
            performanceDescription: 'Top performers this month',
            live: 'LIVE',
            quickStats: 'Quick Stats',
            projectWorkspaces: 'Project Workspaces',
            onboardingForms: 'Onboarding Forms',
            onboardingDescription: 'Quick access to onboarding forms',
            quickAccess: 'Quick Access'
          },
          stats: {
            q4Targets: { value: '0', label: 'Q4 Targets' },
            newClients: { value: '0', label: 'New Clients' }
          },
          onboarding: {
            employee: {
              title: 'Employee Onboarding',
              description: 'Add new team members',
              openForm: 'Open Form',
              copyLink: 'Copy Link',
              shareLabel: 'Share Link'
            },
            client: {
              title: 'Client Onboarding',
              description: 'Add new clients',
              openForm: 'Open Form',
              copyLink: 'Copy Link',
              shareLabel: 'Share Link'
            }
          },
          quickAccess: {
            organizationChart: 'Organization Chart',
            employeeDirectory: 'Employee Directory',
            clientDirectory: 'Client Directory',
            performanceScoring: 'Performance Scoring',
            performanceConcerns: 'Performance Concerns',
            arcade: 'Arcade',
            policies: 'Policies',
            arcadeProgram: 'Arcade Program',
            companyGuidebook: 'Company Guidebook'
          },
          alerts: {
            leaveSuccess: 'Leave application submitted successfully!',
            leaveError: 'Error submitting leave application. Please try again.',
            urlCopied: 'URL copied to clipboard!'
          }
        });
      }
    };
    
    loadUIConfig();
  }, []);
  
  // Load dynamic stats
  useEffect(() => {
    const loadDynamicStats = async () => {
      try {
        setIsLoadingStats(true);
        setStatsError(null);
        const stats = await agencyDashboardService.getAgencyStats();
        setDynamicStats(stats);
      } catch (error) {
        console.error('Error loading dynamic stats:', error);
        setStatsError('Failed to load dashboard statistics');
        notify({
          title: 'Loading Error',
          message: 'Unable to load dashboard statistics. Using default values.',
          type: 'warning'
        });
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadDynamicStats();
  }, [notify]);

  // Load dashboard content
  useEffect(() => {
    const loadDashboardContent = async () => {
      try {
        setIsLoadingContent(true);
        setContentError(null);
        const content = await liveDataService.getDashboardContent();
        setDashboardData(content);
      } catch (error) {
        console.error('Error loading dashboard content:', error);
        setContentError('Failed to load dashboard content');
        notify({
          title: 'Loading Error',
          message: 'Unable to load live dashboard content. Showing default content.',
          type: 'warning'
        });
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadDashboardContent();
  }, [notify]);

  // Load workspace configuration - only for authenticated users
  useEffect(() => {
    const loadWorkspaces = async () => {
      if (!user || !user.role) {
        // For public access, show empty workspaces without error
        setWorkspaces({});
        setIsLoadingWorkspaces(false);
        return;
      }

      try {
        setIsLoadingWorkspaces(true);
        setWorkspacesError(null);
        const workspaceConfig = await workspaceService.getWorkspaceConfig(user.role, user.id);
        setWorkspaces(workspaceConfig);
      } catch (error) {
        console.error('Error loading workspace config:', error);
        setWorkspacesError('Failed to load workspace configuration');
        setWorkspaces({});
        notify({
          title: 'Loading Error',
          message: 'Unable to load workspace configuration. Some features may be limited.',
          type: 'warning'
        });
      } finally {
        setIsLoadingWorkspaces(false);
      }
    };

    loadWorkspaces();
   }, [user, notify]);
  
  const handleUpdateNews = useCallback(async (newNews) => {
    try {
      await liveDataService.updateNews(newNews);
      setDashboardData(prev => ({ ...prev, news: newNews }));
    } catch (error) {
      console.error('Failed to update news:', error);
    }
  }, []);
  
  const handleUpdateEvents = useCallback(async (newEvents) => {
    try {
      await liveDataService.updateEvents(newEvents);
      setDashboardData(prev => ({ ...prev, events: newEvents }));
    } catch (error) {
      console.error('Failed to update events:', error);
    }
  }, []);
  
  const handleUpdateUpdates = useCallback(async (newUpdates) => {
    try {
      await liveDataService.updateUpdates(newUpdates);
      setDashboardData(prev => ({ ...prev, updates: newUpdates }));
    } catch (error) {
      console.error('Failed to update updates:', error);
    }
  }, []);
  
  const handleSubmitFeedback = useCallback(async (feedback) => {
    try {
      const { error } = await supabase
        .from('company_feedback')
        .insert([{
          employee_id: currentUser?.id,
          feedback: feedback,
          created_at: new Date().toISOString()
        }]);
      if (error) throw error;
      notify({
        title: 'Feedback Submitted',
        message: 'Your feedback has been recorded successfully.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      notify({
        title: 'Submission Failed',
        message: 'Failed to submit feedback. Please try again.',
        type: 'error'
      });
    }
  }, [supabase, currentUser?.id, notify]);

  const handleWorkspaceClick = useCallback(async (workspaceName, workspaceType) => {
    if (user?.id) {
      try {
        await workspaceService.trackWorkspaceAccess(user.id, workspaceName, workspaceType);
      } catch (error) {
        console.error('Error tracking workspace access:', error);
      }
    }
  }, [user?.id]);
  
  // Navigation using the app navigation hook
  const handleDirectNavigation = useCallback((path) => {
    if (path === '/form') {
      navigation.navigateToForm();
    } else if (path === '/reports-dashboard') {
      navigation.navigateToReports();
    } else if (path === '/master-tools') {
      navigation.navigateToTools();
    } else if (path === '/employee-onboarding') {
      navigation.navigateToEmployeeOnboarding();
    } else if (path === '/client-onboarding') {
      navigation.navigateToClientOnboarding();
    } else if (path === '/organization-chart') {
      navigation.navigateToOrganizationChart();
    } else if (path === '/employee-directory') {
      navigation.navigateToEmployeeDirectory();
    } else if (path === '/client-directory') {
      navigation.navigateToClientDirectory();
    } else if (path === '/performance-scoring') {
      navigation.navigateToPerformanceScoring();
    } else if (path === '/performance-concerns') {
      navigation.navigateToPerformanceConcerns();
    } else if (path === '/arcade') {
      navigation.navigateToArcade();
    } else if (path === '/policies') {
      // For policies, navigate to a generic path since there's no specific function
      navigation.navigate('/policies');
    } else {
      // Fallback for unknown paths
      navigation.navigate(path);
    }
  }, [navigation]);
  
  const handleLeaveApplicationSubmit = useCallback(async (formData) => {
    try {
      const { data, error } = await supabase
        .from('leave_applications')
        .insert([{
          employee_name: currentUser?.name || 'Unknown',
          employee_email: currentUser?.email || '',
          leave_type: formData.leaveType,
          start_date: formData.startDate,
          end_date: formData.endDate,
          reason: formData.reason,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      setShowLeaveForm(false);
      alert(agencyDashboard?.alerts?.leaveSuccess || 'Leave application submitted successfully!');
    } catch (error) {
      console.error('Error submitting leave application:', error);
      alert(agencyDashboard?.alerts?.leaveError || 'Error submitting leave application. Please try again.');
    }
  }, [supabase, currentUser?.name, currentUser?.email, agencyDashboard?.alerts]);
  
  // All dashboard features are now public - no authentication required
  
  // Copy URL to clipboard helper
  const copyToClipboard = useCallback((fullUrl, label) => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      notify({
        title: `${label} Link Copied!`,
        message: `Link copied to clipboard. Share this URL to allow direct access to the ${label.toLowerCase()} form.`,
        type: 'success'
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      notify({
        title: `${label} Link Copied!`,
        message: `Link copied to clipboard. Share this URL to allow direct access to the ${label.toLowerCase()} form.`,
        type: 'success'
      });
    });
  }, [notify]);
  
  // Define custom actions for header - must be before any conditional returns
  const customActions = useMemo(() => {
    const actions = [
      // Public actions - always visible
      {
        label: "About Us",
        icon: "ℹ️",
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          navigation.navigateToAbout();
        },
        variant: "secondary",
        tooltip: "Learn about our agency"
      },
      {
        label: "Services",
        icon: "🎯",
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          navigation.navigateToServices();
        },
        variant: "secondary",
        tooltip: "View our services"
      }
    ];

    if (user) {
      // Authenticated user actions
      actions.push(
        {
          label: agencyDashboard?.navigation?.monthlyForm || "Monthly Form",
          icon: "📋",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigation.navigateToForm();
          },
          variant: "primary",
          tooltip: "Submit Monthly Form"
        },
        {
          label: agencyDashboard?.navigation?.reports || "Reports",
          icon: "📊",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigation.navigateToReports();
          },
          variant: "secondary",
          tooltip: "View Reports"
        },
        {
          label: agencyDashboard?.navigation?.tools || "Tools",
          icon: "🛠️",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigation.navigateToTools();
          },
          variant: "secondary",
          tooltip: "Access Tools"
        },
        {
          label: agencyDashboard?.navigation?.leaveWfh || "Leave/WFH",
          icon: "🏖️",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowLeaveForm(true);
          },
          variant: "secondary",
          tooltip: "Apply for Leave or Work from Home"
        },
        {
          label: agencyDashboard?.navigation?.addClient || "Add Client",
          icon: "👥",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowClientForm(!showClientForm);
          },
          variant: "secondary",
          tooltip: "Add New Client"
        }
      );
    }
    // Removed duplicate login button - primary login is handled by AppShell component

    return actions;
  }, [user, agencyDashboard, navigation, showClientForm]);
  
  // Show loading state while config is loading
  if (!agencyDashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" showText text="Loading dashboard..." />
        </div>
      </div>
    );
  }
  
  // Login prompts removed - all features are now public

  // Agency dashboard should load immediately without waiting for submissions
  // Only show loading for specific features that require data

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <DashboardHeader
        title={agencyDashboard?.title || "Agency Dashboard"}
        subtitle={user ? agencyDashboard?.welcomeMessage : "Welcome to our agency dashboard - explore our services and capabilities"}
        icon="🏢"
        showNotifications={!!user}
        showProfile={!!user}
        customActions={customActions}
      />



      {/* Client Addition Form - Protected Feature */}
      {showClientForm && (
        <PermissionGuard 
          requiredPermissions={['clients']} 
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <p className="text-gray-600">Please log in to add new clients.</p>
                <button
                  onClick={() => setShowClientForm(false)}
                  className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          }
          showError={false}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{agencyDashboard?.sections?.addNewClient || "Add New Client"}</h3>
                <button
                  onClick={() => setShowClientForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <ClientAdditionForm 
                compact={false} 
                onClientAdded={() => {
                  setShowClientForm(false);
                  notify({
                    type: 'success',
                    title: 'Client Added',
                    message: 'New client has been successfully added to the system'
                  });
                }}
                onCancel={() => setShowClientForm(false)}
              />
            </div>
          </div>
        </PermissionGuard>
      )}

      {/* Monthly Form Prompt - shows in dashboard if user needs to submit */}
      <MonthlyFormPrompt showInDashboard={true} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Department Target Bar */}
        <DepartmentTargetBar />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Performance & Stats */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Quote of the Day */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg border border-purple-200/50 p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💭</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{agencyDashboard?.sections?.dailyInspiration || 'Daily Inspiration'}</h3>
              </div>
              <QuoteOfTheDay isManager={userType === 'manager'} />
            </div>

            {/* Performance Leaderboard */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200/50 p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🏆</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{agencyDashboard?.sections?.performanceLeaderboard || 'Performance Leaderboard'}</h3>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium ml-auto">{agencyDashboard?.sections?.live || 'LIVE'}</span>
              </div>
              <p className="text-sm text-gray-600 mb-6">{agencyDashboard?.sections?.performanceDescription || 'Top performers this month'}</p>
              <div className="min-h-[20rem] overflow-auto">
                <DynamicPerformanceLeaderboard />
              </div>
            </div>

            {/* Client Projects */}
            <ClientProjects />

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200/50 p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{agencyDashboard?.sections?.quickStats || 'Quick Stats'}</h3>
              </div>
              {isLoadingStats ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {[...Array(4)].map((_, index) => (
                    <CardSkeleton key={index} className="h-24" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    onClick={() => navigation.navigateToReports()}
                    className="bg-white/70 backdrop-blur-sm p-4 rounded-xl text-center shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 transform"
                  >
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {dynamicStats?.q4Targets?.value || agencyDashboard?.stats?.q4Targets?.value || '0'}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {dynamicStats?.q4Targets?.label || agencyDashboard?.stats?.q4Targets?.label || 'Q4 Targets'}
                    </div>
                    {dynamicStats?.q4Targets?.progress && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-green-600 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(dynamicStats.q4Targets.progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {dynamicStats.q4Targets.current}/{dynamicStats.q4Targets.target}
                        </div>
                      </div>
                    )}
                  </button>
                  <button 
                    onClick={() => navigation.navigateToReports()}
                    className="bg-white/70 backdrop-blur-sm p-4 rounded-xl text-center shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 transform"
                  >
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {dynamicStats?.newClients?.value || agencyDashboard?.stats?.newClients?.value || '0'}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {dynamicStats?.newClients?.label || agencyDashboard?.stats?.newClients?.label || 'New Clients'}
                    </div>
                    {dynamicStats?.newClients?.thisMonth !== undefined && (
                      <div className="text-xs text-gray-500 mt-1">
                        This month: {dynamicStats.newClients.thisMonth}
                      </div>
                    )}
                  </button>
                  <button 
                    onClick={() => navigation.navigateToDirectory()}
                    className="bg-white/70 backdrop-blur-sm p-4 rounded-xl text-center shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 transform"
                  >
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                      {dynamicStats?.totalEmployees || '125'}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      Total Employees
                    </div>
                  </button>
                  <button 
                    onClick={() => navigation.navigateToDirectory()}
                    className="bg-white/70 backdrop-blur-sm p-4 rounded-xl text-center shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-105 transform"
                  >
                    <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      {dynamicStats?.activeDepartments || '8'}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      Active Departments
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Project Workspaces */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-lg border border-orange-200/50 p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🚀</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{agencyDashboard?.sections?.projectWorkspaces || 'Project Workspaces'}</h3>
              </div>
              <DynamicWorkspaceGrid 
                workspaces={workspaces}
                isLoading={isLoadingWorkspaces}
                onWorkspaceClick={handleWorkspaceClick}
              />
            </div>

            {/* Onboarding Section */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border border-emerald-200/50 p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📋</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{agencyDashboard?.sections?.onboardingForms || 'Onboarding Forms'}</h3>
                    <p className="text-xs text-gray-600 mt-1">{agencyDashboard?.sections?.onboardingDescription || 'Quick access to onboarding forms'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                    <div className="flex flex-col items-center space-y-3">
                      <span className="text-2xl">👨‍💼</span>
                      <div className="text-center">
                        <span className="font-semibold text-gray-800 block">{agencyDashboard?.onboarding?.employee?.title || 'Employee Onboarding'}</span>
                        <span className="text-xs text-gray-500">{agencyDashboard?.onboarding?.employee?.description || 'Add new employees'}</span>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigation.navigateToEmployeeOnboarding();
                          }}
                          className="flex-1 px-3 py-2 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          {agencyDashboard?.onboarding?.employee?.openForm || 'Open Form'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyToClipboard(`${window.location.origin}/employee-onboarding`, 'Employee Onboarding');
                          }}
                          className="px-3 py-2 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                          title="Copy shareable link"
                        >
                          📋 {agencyDashboard?.onboarding?.employee?.copyLink || 'Copy Link'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 text-center">
                        <strong>{agencyDashboard?.onboarding?.employee?.shareLabel || 'Share Link'}:</strong> {window.location.origin}/employee-onboarding
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
                    <div className="flex flex-col items-center space-y-3">
                      <span className="text-2xl">🤝</span>
                      <div className="text-center">
                        <span className="font-semibold text-gray-800 block">{agencyDashboard?.onboarding?.client?.title || 'Client Onboarding'}</span>
                        <span className="text-xs text-gray-500">{agencyDashboard?.onboarding?.client?.description || 'Add new clients'}</span>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigation.navigateToClientOnboarding();
                          }}
                          className="flex-1 px-3 py-2 bg-cyan-600 text-white text-xs rounded-lg hover:bg-cyan-700 transition-colors"
                        >
                          {agencyDashboard?.onboarding?.client?.openForm || 'Open Form'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            copyToClipboard(`${window.location.origin}/client-onboarding`, 'Client Onboarding');
                          }}
                          className="px-3 py-2 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                          title="Copy shareable link"
                        >
                          📋 {agencyDashboard?.onboarding?.client?.copyLink || 'Copy Link'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-600 text-center">
                        <strong>{agencyDashboard?.onboarding?.client?.shareLabel || 'Share Link'}:</strong> {window.location.origin}/client-onboarding
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 sm:space-y-8 order-first lg:order-last">
            {/* Navigation Links */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⚡</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{agencyDashboard?.sections?.quickAccess || 'Quick Access'}</h3>
                    <p className="text-xs text-gray-600 mt-1">{agencyDashboard?.sections?.quickAccessDescription || 'Frequently used tools and features'}</p>
                  </div>
                </div>
              <div className="space-y-3">
                {/* Public navigation - always visible */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigation.navigateToArcade();
                  }}
                  className="group w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 rounded-xl transition-all duration-200 hover:shadow-sm transform hover:translate-x-1"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">🎮</span>
                  <span className="font-medium">{agencyDashboard?.quickAccess?.arcadeProgram || 'Arcade Program'}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigation.navigateToPolicies();
                  }}
                  className="group w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 rounded-xl transition-all duration-200 hover:shadow-sm transform hover:translate-x-1"
                >
                  <span className="text-base group-hover:scale-110 transition-transform">📚</span>
                  <span className="font-medium">{agencyDashboard?.quickAccess?.companyGuidebook || 'Company Guidebook'}</span>
                </button>
                
                {/* Protected navigation - requires authentication */}
                <PermissionGuard 
                  requiredPermission="employees" 
                  fallback={
                    <div className="group w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-400 bg-gray-50 rounded-xl cursor-not-allowed">
                      <span className="text-base">🔒</span>
                      <span className="font-medium">Login to access employee features</span>
                    </div>
                  }
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigation.navigateToOrganizationChart();
                    }}
                    className="group w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl transition-all duration-200 hover:shadow-sm transform hover:translate-x-1"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">🏢</span>
                    <span className="font-medium">{agencyDashboard?.quickAccess?.organizationChart || 'Organization Chart'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigation.navigateToEmployeeDirectory();
                    }}
                    className="group w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-200 hover:shadow-sm transform hover:translate-x-1"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">👥</span>
                    <span className="font-medium">{agencyDashboard?.quickAccess?.employeeDirectory || 'Employee Directory'}</span>
                  </button>
                </PermissionGuard>
                
                <PermissionGuard 
                  requiredPermission="clients" 
                  fallback={
                    <div className="group w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-400 bg-gray-50 rounded-xl cursor-not-allowed">
                      <span className="text-base">🔒</span>
                      <span className="font-medium">Login to access client features</span>
                    </div>
                  }
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigation.navigateToClientDirectory();
                    }}
                    className="group w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 rounded-xl transition-all duration-200 hover:shadow-sm transform hover:translate-x-1"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">🤝</span>
                    <span className="font-medium">{agencyDashboard?.quickAccess?.clientDirectory || 'Client Directory'}</span>
                  </button>
                </PermissionGuard>
                
                <PermissionGuard 
                  requiredPermission="performance" 
                  fallback={
                    <div className="group w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-400 bg-gray-50 rounded-xl cursor-not-allowed">
                      <span className="text-base">🔒</span>
                      <span className="font-medium">Login to access performance features</span>
                    </div>
                  }
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigation.navigateToPerformanceScoring();
                    }}
                    className="group w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 rounded-xl transition-all duration-200 hover:shadow-sm transform hover:translate-x-1"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">📈</span>
                    <span className="font-medium">{agencyDashboard?.quickAccess?.performanceScoring || 'Performance Scoring'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigation.navigateToPerformanceConcerns();
                    }}
                    className="group w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-200 hover:shadow-sm transform hover:translate-x-1"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">⚠️</span>
                    <span className="font-medium">{agencyDashboard?.quickAccess?.performanceConcerns || 'Performance Concerns'}</span>
                  </button>
                </PermissionGuard>
              </div>
            </div>

            {/* Company News */}
            <NewsTicker
              news={dashboardData.news}
              isManager={isManager}
              onUpdateNews={handleUpdateNews}
            />

            {/* Events & Updates */}
            <ConsolidatedEventsUpdates
              isManager={isManager}
              events={dashboardData.events}
              updates={dashboardData.updates}
              onUpdateEvents={handleUpdateEvents}
              onUpdateUpdates={handleUpdateUpdates}
              onSubmitFeedback={handleSubmitFeedback}
            />
            
            {/* Client Payment Status */}
            <ClientPaymentStatus />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <PermissionGuard 
              requiredPermissions={['hr_employees']} 
              fallback={
                <div className="p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Required</h3>
                  <p className="text-gray-600 mb-4">Please log in to submit leave applications.</p>
                  <button
                    onClick={() => setShowLeaveForm(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              }
              showError={false}
            >
              <LeaveApplicationForm
                onSubmit={handleLeaveApplicationSubmit}
                onCancel={() => setShowLeaveForm(false)}
              />
            </PermissionGuard>
          </div>
        </div>
      )}


    </div>
  );
};

export default React.memo(AgencyDashboard);