import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { FadeTransition } from '@/shared/components/Transitions';
import configService from '../shared/services/configService';
import RoleBasedDashboardFeatures from './RoleBasedDashboardFeatures';
import ProjectWorkspaceSystem from './ProjectWorkspaceSystem';
import { useRealTimeDashboard, useRealTimeNotifications } from '../hooks/useRealTimeUpdates';
import realTimeDataService from '../services/realTimeDataService';

/**
 * PersonalizedProfileDashboard - Department-specific profile sections
 * Shows only personal profile sections based on user's department:
 * - Testimonials
 * - Appreciation
 * - Monthly Work Progress
 * - Performance Progress
 * - Learning Goals
 * - Client Relationships
 * - Discipline & Attendance
 */

const PersonalizedProfileDashboard = ({ onBack }) => {
  const { authState } = useUnifiedAuth();
  const supabase = useSupabase();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('testimonials');
  const [profileData, setProfileData] = useState(null);
  const [sectionData, setSectionData] = useState({});
  
  const userRole = authState.currentUser?.role || authState.role;
  const userDepartment = authState.currentUser?.department || getDepartmentFromRole(userRole);
  const userId = authState.currentUser?.id || authState.userId;
  
  // Real-time updates
  const { isConnected: dashboardConnected, updateCount: dashboardUpdates, refresh: refreshDashboard } = useRealTimeDashboard(userId);
  const { isConnected: notificationsConnected, updateCount: notificationUpdates, refresh: refreshNotifications } = useRealTimeNotifications(userId);

  // Get configuration
  const [personalizedConfig, setPersonalizedConfig] = useState(null);
  
  useEffect(() => {
    const loadUIConfig = async () => {
      try {
        const uiConfig = await configService.getUIConfig();
        setPersonalizedConfig(uiConfig.personalizedDashboard);
      } catch (error) {
        console.error('Error loading UI config:', error);
        // Fallback to default values if config fails to load
        setPersonalizedConfig({
          roleThemes: {
            default: { primary: 'blue', secondary: 'gray' }
          },
          roleToDepartment: {},
          baseSidebarSections: [],
          departmentSections: {},
          sections: {
            testimonials: {
              title: 'Client Testimonials',
              emptyMessage: 'No testimonials available',
              defaultClientName: 'Client',
              defaultProjectName: 'Project'
            },
            appreciation: {
              title: 'Appreciation Records',
              emptyMessage: 'No appreciation records available'
            }
          }
        });
      }
    };
    
    loadUIConfig();
  }, []);
  
  // Show loading state while config is loading
  if (!personalizedConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Role-based theme function
  const getRoleTheme = (role) => {
    return personalizedConfig.roleThemes[role] || personalizedConfig.roleThemes.default;
  };

  const roleTheme = getRoleTheme(userRole);

  // Map roles to departments for unique variables
  function getDepartmentFromRole(role) {
    return personalizedConfig.roleToDepartment[role] || 'general';
  }

  // Department-specific sidebar sections
  const getDepartmentSections = (department) => {
    const baseSections = personalizedConfig.baseSidebarSections;

    // Get department-specific sections
    const departmentSpecific = personalizedConfig.departmentSections[department] || [];
    
    return [...baseSections, ...departmentSpecific];
  };

  const sections = getDepartmentSections(userDepartment);

  // Initialize real-time service
  useEffect(() => {
    if (supabase && !realTimeDataService.isInitialized) {
      realTimeDataService.initialize(supabase);
    }
  }, [supabase]);

  // Fetch user profile and section data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!authState.user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch employee profile
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', authState.user.id)
          .single();
          
        if (employeeError && employeeError.code !== 'PGRST116') {
          console.error('Error fetching employee data:', employeeError);
        }
        
        setProfileData(employeeData || {
          user_id: authState.user.id,
          name: authState.user.name,
          email: authState.user.email,
          phone: authState.user.phone,
          role: authState.user.role,
          department: userDepartment,
          status: 'active'
        });
        
        // Fetch section-specific data
        await fetchSectionData();
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        notify({ type: 'error', title: 'Profile Load Error', message: 'Failed to load profile data' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [authState.user?.id, supabase, notify]);

  // Refresh data when real-time updates occur
  useEffect(() => {
    if (dashboardUpdates > 0 || notificationUpdates > 0) {
      const refreshData = async () => {
        try {
          // Reload profile data
          if (authState.user?.id) {
            const { data: employeeData, error: employeeError } = await supabase
              .from('employees')
              .select('*')
              .eq('user_id', authState.user.id)
              .single();
            
            if (!employeeError) {
              setProfileData(employeeData);
            }
          }
          
          // Refresh section data
          await fetchSectionData();
          
          console.log('👤 Profile data refreshed due to real-time updates');
        } catch (error) {
          console.error('Error refreshing profile data:', error);
        }
      };
      
      refreshData();
    }
  }, [dashboardUpdates, notificationUpdates, authState.user?.id, supabase]);

  // Fetch data for all sections
  const fetchSectionData = async () => {
    try {
      const data = {};
      
      // Fetch testimonials
      const { data: testimonials } = await supabase
        .from('employee_testimonials')
        .select('*')
        .eq('employee_id', authState.user.id)
        .order('created_at', { ascending: false });
      data.testimonials = testimonials || [];
      
      // Fetch appreciation records
      const { data: appreciation } = await supabase
        .from('employee_appreciation')
        .select('*')
        .eq('employee_id', authState.user.id)
        .order('created_at', { ascending: false });
      data.appreciation = appreciation || [];
      
      // Fetch monthly work submissions
      const { data: monthlyWork } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', authState.user.id)
        .order('created_at', { ascending: false })
        .limit(12);
      data.monthly_work = monthlyWork || [];
      
      // Fetch performance data
      const { data: performance } = await supabase
        .from('employee_performance')
        .select('*')
        .eq('employee_id', authState.user.id)
        .order('evaluation_date', { ascending: false });
      data.performance = performance || [];
      
      // Fetch learning goals
      const { data: learningGoals } = await supabase
        .from('employee_learning_goals')
        .select('*')
        .eq('employee_id', authState.user.id)
        .order('created_at', { ascending: false });
      data.learning_goals = learningGoals || [];
      
      // Fetch client relationships
      const { data: clientRelations } = await supabase
        .from('employee_client_relationships')
        .select('*')
        .eq('employee_id', authState.user.id)
        .order('created_at', { ascending: false });
      data.client_relationships = clientRelations || [];
      
      // Fetch attendance and discipline records
      const { data: attendance } = await supabase
        .from('employee_attendance')
        .select('*')
        .eq('employee_id', authState.user.id)
        .order('date', { ascending: false })
        .limit(30);
      data.discipline_attendance = attendance || [];
      
      setSectionData(data);
    } catch (error) {
      console.error('Error fetching section data:', error);
    }
  };

  // Render section content based on active section
  const renderSectionContent = () => {
    const data = sectionData[activeSection] || [];
    
    switch (activeSection) {
      case 'testimonials':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">{personalizedConfig.sections.testimonials.title}</h3>
            {data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{personalizedConfig.sections.testimonials.emptyMessage}</p>
              </div>
            ) : (
              data.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">{testimonial.client_name?.charAt(0) || 'C'}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{testimonial.client_name || personalizedConfig.sections.testimonials.defaultClientName}</h4>
                      <p className="text-sm text-gray-600 mb-2">{testimonial.project_name || personalizedConfig.sections.testimonials.defaultProjectName}</p>
                      <p className="text-gray-700">{testimonial.testimonial_text}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < (testimonial.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(testimonial.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );
        
      case 'appreciation':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">{personalizedConfig.sections.appreciation.title}</h3>
            {data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{personalizedConfig.sections.appreciation.emptyMessage}</p>
              </div>
            ) : (
              data.map((item, index) => (
                <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">{personalizedConfig.sections.appreciation.icon}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{item.title || personalizedConfig.sections.appreciation.defaultTitle}</h4>
                      <p className="text-sm text-gray-600 mb-2">From: {item.given_by || personalizedConfig.sections.appreciation.defaultGivenBy}</p>
                      <p className="text-gray-700">{item.description}</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                        {item.category || personalizedConfig.sections.appreciation.defaultCategory}
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );
        
      case 'monthly_work':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">{personalizedConfig.sections.monthly_work.title}</h3>
            {data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{personalizedConfig.sections.monthly_work.emptyMessage}</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {data.map((submission, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-900">
                        {new Date(submission.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                        submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {personalizedConfig.sections.monthly_work.statusLabels[submission.status] || personalizedConfig.sections.monthly_work.statusLabels.submitted}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p><strong>{personalizedConfig.sections.monthly_work.fields.projectsCompleted}</strong> {submission.projects_completed || personalizedConfig.sections.monthly_work.defaultValues.projectsCompleted}</p>
                      <p><strong>{personalizedConfig.sections.monthly_work.fields.goalsAchieved}</strong> {submission.goals_achieved || personalizedConfig.sections.monthly_work.defaultValues.goalsAchieved}</p>
                      <p><strong>{personalizedConfig.sections.monthly_work.fields.challenges}</strong> {submission.challenges || personalizedConfig.sections.monthly_work.defaultValues.challenges}</p>
                      <p><strong>{personalizedConfig.sections.monthly_work.fields.nextMonthGoals}</strong> {submission.next_month_goals || personalizedConfig.sections.monthly_work.defaultValues.nextMonthGoals}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      case 'performance':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">{personalizedConfig.sections.performance.title}</h3>
            {data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{personalizedConfig.sections.performance.emptyMessage}</p>
              </div>
            ) : (
              data.map((evaluation, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-gray-900">
                      {personalizedConfig.sections.performance.reviewTitle} - {new Date(evaluation.evaluation_date).toLocaleDateString()}
                    </h4>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{evaluation.overall_score || personalizedConfig.sections.performance.defaultScore}</div>
                      <div className="text-sm text-gray-500">{personalizedConfig.sections.performance.overallScoreLabel}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{personalizedConfig.sections.performance.metrics.qualityOfWork}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(evaluation.quality_score || 0) * 10}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{personalizedConfig.sections.performance.metrics.teamCollaboration}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(evaluation.collaboration_score || 0) * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  {evaluation.feedback && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">{personalizedConfig.sections.performance.feedbackLabel}</p>
                      <p className="text-gray-600">{evaluation.feedback}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        );
        
      case 'learning_goals':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">{personalizedConfig.sections.learning_goals.title}</h3>
            {data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{personalizedConfig.sections.learning_goals.emptyMessage}</p>
              </div>
            ) : (
              data.map((goal, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-gray-900">{goal.goal_title}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                      goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {personalizedConfig.sections.learning_goals.statusLabels[goal.status] || personalizedConfig.sections.learning_goals.statusLabels.not_started}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{goal.description}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">{personalizedConfig.sections.learning_goals.labels.targetDate} {new Date(goal.target_date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-500">{personalizedConfig.sections.learning_goals.labels.category} {goal.category || personalizedConfig.sections.learning_goals.defaultCategory}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">{goal.progress || 0}%</div>
                      <div className="text-sm text-gray-500">{personalizedConfig.sections.learning_goals.labels.progress}</div>
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${goal.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        );
        
      case 'client_relationships':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">{personalizedConfig.sections.client_relationships.title}</h3>
            {data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{personalizedConfig.sections.client_relationships.emptyMessage}</p>
              </div>
            ) : (
              data.map((relationship, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{relationship.client_name}</h4>
                      <p className="text-sm text-gray-600">{relationship.project_name || personalizedConfig.sections.client_relationships.defaultProjectName}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < (relationship.satisfaction_rating || 5) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">{personalizedConfig.sections.client_relationships.satisfactionLabel}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{relationship.relationship_notes}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{personalizedConfig.sections.client_relationships.labels.started} {new Date(relationship.start_date).toLocaleDateString()}</span>
                    <span>{personalizedConfig.sections.client_relationships.labels.status} {relationship.status || personalizedConfig.sections.client_relationships.defaultStatus}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        );
        
      case 'discipline_attendance':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">{personalizedConfig.sections.discipline_attendance.title}</h3>
            {data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{personalizedConfig.sections.discipline_attendance.emptyMessage}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {data.filter(d => d.status === 'present').length}
                    </div>
                    <div className="text-sm text-gray-600">{personalizedConfig.sections.discipline_attendance.stats.daysPresent}</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {data.filter(d => d.status === 'late').length}
                    </div>
                    <div className="text-sm text-gray-600">{personalizedConfig.sections.discipline_attendance.stats.lateArrivals}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {data.filter(d => d.status === 'absent').length}
                    </div>
                    <div className="text-sm text-gray-600">{personalizedConfig.sections.discipline_attendance.stats.absences}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b">
                    <h4 className="font-semibold text-gray-900">{personalizedConfig.sections.discipline_attendance.recentAttendanceTitle}</h4>
                  </div>
                  <div className="divide-y">
                    {data.slice(0, 10).map((record, index) => (
                      <div key={index} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {record.check_in_time && `${personalizedConfig.sections.discipline_attendance.timeLabels.in} ${record.check_in_time}`}
                            {record.check_out_time && ` | ${personalizedConfig.sections.discipline_attendance.timeLabels.out} ${record.check_out_time}`}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {personalizedConfig.sections.discipline_attendance.statusLabels[record.status] || personalizedConfig.sections.discipline_attendance.statusLabels.unknown}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>{personalizedConfig.general.defaultMessage}</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="xl" showText text={personalizedConfig.general.loadingText} />
      </div>
    );
  }

  return (
    <FadeTransition show={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className={`bg-gradient-to-r ${roleTheme.primary} shadow-sm border-b`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onBack}
                  className="flex items-center text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  {personalizedConfig.general.backButton}
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {profileData?.name || authState.user?.name || personalizedConfig.general.defaultTitle}
                  </h1>
                  <p className="text-sm text-white/80">
                    {userRole} • {userDepartment.replace('_', ' ').toUpperCase()} Department
                  </p>
                  {/* Real-time status indicator */}
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      dashboardConnected && notificationsConnected 
                        ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' 
                        : 'bg-gray-400 shadow-md'
                    }`}></div>
                    <span className={`text-xs transition-colors duration-200 ${
                      dashboardConnected && notificationsConnected ? 'text-green-200' : 'text-white/60'
                    }`}>
                      {dashboardConnected && notificationsConnected ? 'Live updates active' : 'Offline mode'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h2 className="font-semibold text-gray-900 mb-4">{personalizedConfig.general.sidebarTitle}</h2>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? `${roleTheme.secondary} ${roleTheme.text} border ${roleTheme.border}`
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{section.icon}</span>
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Role-Based Dashboard Features */}
              <div className="mb-6">
                <RoleBasedDashboardFeatures />
              </div>
              
              {/* Project Workspace System */}
              <div className="mb-6">
                <ProjectWorkspaceSystem />
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                {renderSectionContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeTransition>
  );
};

export default PersonalizedProfileDashboard;