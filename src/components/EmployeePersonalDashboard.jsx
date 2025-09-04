import React, { useMemo, useState, useEffect } from "react";
import { useFetchSubmissions } from "./useFetchSubmissions.js";
import { useEnhancedDataSync } from '../utils/dataSyncFix.js';
import { useModal } from "@/shared/components/ModalContext";
import { thisMonthKey, monthLabel } from "@/shared/lib/constants";
import { calculateScopeCompletion, getServiceWeight } from "@/shared/lib/scoring";
import { ClientReportsView } from "@/features/clients/components/ClientReportsView";
import { ProfileEditModal } from "./ProfileEditModal";
import { useSupabase } from "./SupabaseProvider";
import { DataCard, MetricRow, SmartDataDisplay } from "./DataDisplay";
import { useToast } from "@/shared/components/Toast";
import { ProfileImage } from "@/shared/components/ImageDisplay";
import { ClientAdditionForm } from "@/features/clients/components/ClientAdditionForm";
import { KPIEditor } from "./KPIEditor";
import KPIDashboard from "./KPIDashboard";
import { LoadingSpinner, CardSkeleton } from "@/shared/components/LoadingStates";
import { FadeTransition } from "@/shared/components/Transitions";
import { useMobileResponsive } from '../hooks/useMobileResponsive';
import personalizedDashboardService from '../shared/services/personalizedDashboardService';
import { useAppNavigation } from '@/utils/navigation';
import RoleBasedDashboardFeatures from './RoleBasedDashboardFeatures';
import ProjectWorkspaceSystem from './ProjectWorkspaceSystem';
import { useRealTimeDashboard, useRealTimeKPIs } from '../hooks/useRealTimeUpdates';
import realTimeDataService from '../services/realTimeDataService';
import { exportReport, reportUtils } from '../utils/reportGenerator';

// Quick Action Button Component
const QuickActionButton = ({ title, description, icon, onClick, gradient }) => {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl bg-gradient-to-r ${gradient} text-white hover:opacity-90 transition-all transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <h4 className="font-semibold text-left">{title}</h4>
      </div>
      <p className="text-sm text-white/90 text-left">{description}</p>
    </button>
  );
};

export function EmployeePersonalDashboard({ employee: initialEmployee, onBack }) {
  const [employee, setEmployee] = useState(initialEmployee);
  const { allSubmissions, loading } = useFetchSubmissions();
  const [personalizedMetrics, setPersonalizedMetrics] = useState({});
  const { navigateToInteractiveForms, navigateToReports } = useAppNavigation();
  
  // Real-time updates
  const { isConnected: dashboardConnected, updateCount: dashboardUpdates, refresh: refreshDashboard } = useRealTimeDashboard(employee?.id);
  const { isConnected: kpiConnected, updateCount: kpiUpdates, refresh: refreshKPIs } = useRealTimeKPIs(employee?.id);
  
  // Mobile responsiveness
  const { isMobile, gridConfig, spacing, text, mobileUtils } = useMobileResponsive();

  // Role-based theme function
  const getRoleTheme = (role) => {
    const themes = {
      'SEO': { primary: 'from-green-500 to-green-600', secondary: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      'Ads': { primary: 'from-purple-500 to-purple-600', secondary: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      'Social Media': { primary: 'from-pink-500 to-pink-600', secondary: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
      'YouTube SEO': { primary: 'from-red-500 to-red-600', secondary: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      'Web Developer': { primary: 'from-indigo-500 to-indigo-600', secondary: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
      'Graphic Designer': { primary: 'from-orange-500 to-orange-600', secondary: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
      'Freelancer': { primary: 'from-teal-500 to-teal-600', secondary: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
      'Intern': { primary: 'from-cyan-500 to-cyan-600', secondary: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },

      'HR': { primary: 'from-rose-500 to-rose-600', secondary: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
      'Operations Head': { primary: 'from-amber-500 to-amber-600', secondary: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      'Super Admin': { primary: 'from-slate-500 to-slate-600', secondary: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
    };
    return themes[role] || { primary: 'from-blue-500 to-blue-600', secondary: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  };

  const roleTheme = getRoleTheme(employee?.role);
  const { openModal, closeModal } = useModal();
  
  // Enhanced data sync for real-time personal dashboard updates
  const { enhancedSubmissions, isEnhancedSyncActive } = useEnhancedDataSync({
    fallbackData: allSubmissions || [],
    refreshInterval: 20000, // 20 seconds for personal dashboard
    employeeFilter: initialEmployee ? {
      name: initialEmployee.name,
      phone: initialEmployee.phone
    } : null,
    onSyncError: (error) => {
      console.warn('Personal dashboard sync error:', error);
    }
  });
  
  // Use enhanced submissions if available, fallback to fetch hook
  const workingSubmissions = isEnhancedSyncActive && enhancedSubmissions.length > 0 
    ? enhancedSubmissions 
    : (allSubmissions || []);
  const supabase = useSupabase();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const { notify } = useToast();

  const profileCompleteness = useMemo(() => {
    if (!employee) return { missing: [], criticalMissing: [], completionPercentage: 0, isComplete: false, needsCriticalInfo: true, isFirstTime: true };
    
    const requiredFields = [
      { key: 'photoUrl', label: 'Profile Photo', critical: true },
      { key: 'joiningDate', label: 'Joining Date', critical: true },
      { key: 'dob', label: 'Date of Birth', critical: false },
      { key: 'education', label: 'Education', critical: true },
      { key: 'certifications', label: 'Certifications', critical: false },
      { key: 'skills', label: 'Skills & Tools', critical: true },
      { key: 'department', label: 'Department', critical: true },
      { key: 'role', label: 'Role', critical: true },
      { key: 'directManager', label: 'Direct Manager', critical: true },
      // Emergency contact is critical for safety
      { key: 'emergencyContact', label: 'Emergency Contact', critical: true },
      { key: 'address', label: 'Home Address', critical: true },
      // Device Management
      { key: 'deviceType', label: 'Device Type', critical: false },
      { key: 'macAddress', label: 'MAC Address', critical: false },
      { key: 'serialNumber', label: 'Serial Number', critical: false },
      // SIM & Communication
      { key: 'simCardProvided', label: 'SIM Card Status', critical: false },
      { key: 'whatsappNumber', label: 'WhatsApp Number', critical: false },
      { key: 'rechargeDate', label: 'Last Recharge Date', critical: false },
      // Company Property
      { key: 'companyAssets', label: 'Company Assets', critical: false },
    ];
    
    const missing = requiredFields.filter(field => {
      const value = employee[field.key];
      
      // Special validation logic for different field types
      switch (field.key) {
        case 'role':
          return !value || (Array.isArray(value) && value.length === 0);
        case 'emergencyContact':
          return !value || !value.name || !value.phone || !value.relationship;
        case 'companyAssets':
          // This field is optional and should be handled differently
          return false; // Don't mark as missing since it's managed by admin
        case 'skills':
          return !value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '');
        case 'certifications':
          // Optional field, only count as missing if explicitly requested
          return false;
        case 'simCardProvided':
          return !value || (value !== 'yes' && value !== 'no');
        default:
          // Standard validation for strings, numbers, dates
          if (value === null || value === undefined) return true;
          if (typeof value === 'string') return value.trim() === '';
          if (typeof value === 'number') return isNaN(value);
          if (value instanceof Date) return isNaN(value.getTime());
          return false;
      }
    });
    
    const criticalMissing = missing.filter(f => f.critical);
    const totalFields = requiredFields.filter(f => f.key !== 'companyAssets' && f.key !== 'certifications'); // Exclude admin-managed fields
    const completionPercentage = Math.round(((totalFields.length - missing.length) / totalFields.length) * 100);
    
    return {
      missing,
      criticalMissing,
      completionPercentage,
      isComplete: missing.length === 0,
      needsCriticalInfo: criticalMissing.length > 0,
      isFirstTime: criticalMissing.length >= 4 // At least 4 critical fields missing suggests first time
    };
  }, [employee]);

  const [hasShownFirstTimeModal, setHasShownFirstTimeModal] = useState(false);
  
  // Initialize real-time service
  useEffect(() => {
    if (supabase && !realTimeDataService.isInitialized) {
      realTimeDataService.initialize(supabase);
    }
  }, [supabase]);
  
  // Load personalized metrics
  useEffect(() => {
    const loadPersonalizedMetrics = async () => {
      if (!employee) return;
      
      try {
        const metrics = await personalizedDashboardService.getPersonalizedDashboardMetrics(employee, 'employee');
        setPersonalizedMetrics(metrics);
      } catch (error) {
        console.error('Error loading personalized metrics:', error);
      }
    };
    
    loadPersonalizedMetrics();
  }, [employee]);
  
  // Refresh data when real-time updates occur
  useEffect(() => {
    if (dashboardUpdates > 0 || kpiUpdates > 0) {
      const refreshData = async () => {
        try {
          // Reload personalized metrics
          if (employee) {
            const metrics = await personalizedDashboardService.getPersonalizedDashboardMetrics(employee, 'employee');
            setPersonalizedMetrics(metrics);
          }
          
          console.log('📊 Dashboard data refreshed due to real-time updates');
        } catch (error) {
          console.error('Error refreshing dashboard data:', error);
        }
      };
      
      refreshData();
    }
  }, [dashboardUpdates, kpiUpdates, employee]);

  // Auto-show profile modal for first-time users
  useEffect(() => {
    if (profileCompleteness.isFirstTime && !hasShownFirstTimeModal && !loading) {
      setShowProfileModal(true);
      setHasShownFirstTimeModal(true);
    }
  }, [profileCompleteness.isFirstTime, hasShownFirstTimeModal, loading]);

  const handleSaveProfile = async (data) => {
    if (!supabase) return;
    const updated = { ...employee, ...data };
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ employee: updated })
        .eq('employee->>name', employee.name)
        .eq('employee->>phone', employee.phone);
      if (error) throw error;
      setEmployee(updated);
      setShowProfileModal(false);
      notify({ type: 'success', title: 'Profile updated', message: 'Your profile has been saved.' });
      openModal('Success', 'Profile updated successfully!', closeModal);
    } catch (err) {
      notify({ type: 'error', title: 'Profile update failed', message: err.message });
      openModal('Error', `Failed to update profile: ${err.message}`, closeModal);
    }
  };

  const employeeSubmissions = useMemo(() => {
    return workingSubmissions.filter(s => 
      s.employee?.name === employee.name && 
      s.employee?.phone === employee.phone
    ).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [workingSubmissions, employee]);

  const currentMonthSubmission = useMemo(() => {
    const currentMonth = thisMonthKey();
    return employeeSubmissions.find(s => s.monthKey === currentMonth);
  }, [employeeSubmissions]);

  const overallStats = useMemo(() => {
    // Use personalized metrics if available, fallback to submissions data
    if (personalizedMetrics && Object.keys(personalizedMetrics).length > 0) {
      return {
        avgOverallScore: (personalizedMetrics.performanceScore || 0).toFixed(1),
        avgKpiScore: (personalizedMetrics.performanceScore || 0).toFixed(1),
        avgLearningScore: personalizedMetrics.learningHours ? ((personalizedMetrics.learningHours / 40) * 10).toFixed(1) : '0.0',
        avgRelationshipScore: personalizedMetrics.projectsCompleted ? Math.min(personalizedMetrics.projectsCompleted, 10).toFixed(1) : '0.0',
        totalSubmissions: personalizedMetrics.totalSubmissions || employeeSubmissions.length,
        totalLearningHours: (personalizedMetrics.learningHours || 0).toFixed(1),
        improvementTrend: (personalizedMetrics.improvementTrend || 0).toFixed(1)
      };
    }
    
    if (employeeSubmissions.length === 0) return null;
    
    const avgOverallScore = employeeSubmissions.reduce((sum, s) => sum + (s.scores?.overall || 0), 0) / employeeSubmissions.length;
    const avgKpiScore = employeeSubmissions.reduce((sum, s) => sum + (s.scores?.kpiScore || 0), 0) / employeeSubmissions.length;
    const avgLearningScore = employeeSubmissions.reduce((sum, s) => sum + (s.scores?.learningScore || 0), 0) / employeeSubmissions.length;
    const avgRelationshipScore = employeeSubmissions.reduce((sum, s) => sum + (s.scores?.relationshipScore || 0), 0) / employeeSubmissions.length;
    
    const totalLearningHours = employeeSubmissions.reduce((sum, s) => {
      return sum + (s.learning || []).reduce((learningSum, l) => learningSum + (l.durationMins || 0), 0);
    }, 0) / 60;
    
    return {
      avgOverallScore: avgOverallScore.toFixed(1),
      avgKpiScore: avgKpiScore.toFixed(1),
      avgLearningScore: avgLearningScore.toFixed(1),
      avgRelationshipScore: avgRelationshipScore.toFixed(1),
      totalSubmissions: employeeSubmissions.length,
      totalLearningHours: totalLearningHours.toFixed(1),
      improvementTrend: employeeSubmissions.length >= 2 ? 
        ((employeeSubmissions[0].scores?.overall || 0) - (employeeSubmissions[1].scores?.overall || 0)).toFixed(1) : '0'
    };
  }, [employeeSubmissions, personalizedMetrics]);

  const generateAndDownloadPDF = async (submission, employeeName) => {
    try {
      notify({ 
        type: 'info', 
        title: 'Generating PDF', 
        message: 'Creating your performance report...' 
      });
      
      const reportData = {
        employeeName: employeeName,
        department: employee?.department || 'N/A',
        period: monthLabel(submission.monthKey),
        metrics: {
          'Overall Score': `${submission.scores?.overall?.toFixed(1) || 'N/A'}/10`,
          'KPI Score': `${submission.scores?.kpiScore?.toFixed(1) || 'N/A'}/10`,
          'Learning Score': `${submission.scores?.learningScore?.toFixed(1) || 'N/A'}/10`,
          'Client Relations': `${submission.scores?.relationshipScore?.toFixed(1) || 'N/A'}/10`
        },
        summary: submission.manager_remarks || 'No manager feedback available for this period.',
        performanceData: [{
          month: submission.monthKey,
          overallScore: submission.scores?.overall || 0,
          kpiScore: submission.scores?.kpiScore || 0,
          learningScore: submission.scores?.learningScore || 0,
          relationshipScore: submission.scores?.relationshipScore || 0
        }],
        kpiDetails: submission.kpis || []
      };
      
      const filename = reportUtils.generateFilename(`${employeeName.replace(/\s+/g, '_')}_${submission.monthKey}_Report`);
      const result = await exportReport(reportData, 'pdf', 'employeePerformance', filename);
      
      if (result.success) {
        notify({ 
          type: 'success', 
          title: 'PDF Generated', 
          message: result.message 
        });
      } else {
        notify({ 
          type: 'error', 
          title: 'PDF Generation Failed', 
          message: result.message 
        });
      }
      
    } catch (error) {
      console.error('PDF generation error:', error);
      notify({ 
        type: 'error', 
        title: 'PDF Generation Failed', 
        message: 'Failed to generate PDF report' 
      });
    }
  };

  const getSubmissionSummary = (submission) => {
    const svcLines = [];
    (submission.clients||[]).forEach(c => {
      (c.services||[]).forEach(s => {
        const name = typeof s === 'string' ? s : s.service;
        const pct = calculateScopeCompletion(c, name, { monthKey: submission.monthKey }) || 0;
        const w = getServiceWeight(name);
        svcLines.push(`• ${c.name} — ${name} (w ${w}): ${pct}%`);
      });
    });
    return `PERFORMANCE SUMMARY - ${monthLabel(submission.monthKey)}\n\nOverall Score: ${submission.scores?.overall?.toFixed(1) || 'N/A'}/10\n\nKPI Performance: ${submission.scores?.kpiScore?.toFixed(1) || 'N/A'}/10\nLearning Activities: ${submission.scores?.learningScore?.toFixed(1) || 'N/A'}/10\nClient Relations: ${submission.scores?.relationshipScore?.toFixed(1) || 'N/A'}/10\n\n${submission.flags?.missingLearningHours ? 'Action needed: Complete learning hours requirement\n' : ''}
${submission.flags?.hasEscalations ? 'Action needed: Address client escalations\n' : ''}
${submission.discipline?.penalty > 0 ? `Late submission penalty: -${submission.discipline.penalty} (late by ${submission.discipline.lateDays} day(s))\n` : ''}
${submission.flags?.missingReports ? 'Action needed: Submit missing client reports\n' : ''}
${svcLines.length ? '\nService Progress:\n' + svcLines.slice(0,10).join('\n') : ''}
${submission.manager_remarks ? `\nManager Feedback:\n${submission.manager_remarks}` : '\nNo manager feedback yet'}`;
  };

  if (loading) {
    return (
      <FadeTransition show={true}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="xl" showText text="Loading your dashboard..." />
            </div>
          </div>
          <div className={`${gridConfig.dashboardCards} ${spacing.gap}`}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <CardSkeleton />
          </div>
        </div>
      </FadeTransition>
    );
  }

  return (
    <>
      <div className={`max-w-6xl mx-auto ${spacing.container} px-4 sm:px-6`}>
        {currentMonthSubmission?.manager?.testimonialUrl && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm text-purple-800">
              🎥 A testimonial was added to your latest submission.
            </div>
            <a
              className="text-purple-700 underline text-sm"
              href={currentMonthSubmission.manager.testimonialUrl}
              target="_blank"
              rel="noreferrer"
            >
              View Testimonial
            </a>
          </div>
        )}
        {/* Enhanced Profile Completeness Prompt */}
        {!profileCompleteness.isComplete && (
          <div className={`rounded-xl p-4 flex items-start ${isMobile ? 'gap-2' : 'gap-4'} ${
            profileCompleteness.needsCriticalInfo 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className={`text-2xl ${
              profileCompleteness.needsCriticalInfo ? 'text-red-500' : 'text-blue-500'
            }`}>
              {profileCompleteness.needsCriticalInfo ? '🚨' : '📝'}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-semibold ${
                  profileCompleteness.needsCriticalInfo ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {profileCompleteness.isFirstTime 
                    ? '🎉 Welcome! Complete Your Profile to Get Started' 
                    : `Profile ${profileCompleteness.completionPercentage}% Complete`
                  }
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`${isMobile ? 'w-12' : 'w-16 sm:w-20'} h-2 bg-gray-200 rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full transition-all duration-500 ${
                        profileCompleteness.completionPercentage >= 80 ? 'bg-gray-600' :
                        profileCompleteness.completionPercentage >= 50 ? 'bg-gray-500' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${profileCompleteness.completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {profileCompleteness.completionPercentage}%
                  </span>
                </div>
              </div>
              
              {profileCompleteness.criticalMissing.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-red-700 mb-2">
                    🔴 <strong>Critical Info Needed:</strong>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {profileCompleteness.criticalMissing.slice(0, 4).map(field => (
                      <span key={field.key} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {field.label}
                      </span>
                    ))}
                    {profileCompleteness.criticalMissing.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{profileCompleteness.criticalMissing.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <p className={`text-xs mb-3 ${
                profileCompleteness.needsCriticalInfo ? 'text-red-700' : 'text-blue-700'
              }`}>
                {profileCompleteness.isFirstTime 
                  ? 'Complete your profile to unlock performance tracking, personalized insights, and better reporting features.'
                  : profileCompleteness.needsCriticalInfo
                  ? 'Some critical information is missing. This may affect your performance tracking and reporting accuracy.'
                  : 'A few optional details are missing. Complete them for a richer dashboard experience.'
                }
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-colors bg-gradient-to-r ${roleTheme.primary} hover:opacity-90`}
                >
                  {profileCompleteness.isFirstTime ? 'Get Started' : 'Complete Profile'}
                </button>
                {!profileCompleteness.needsCriticalInfo && (
                  <button
                    onClick={() => {/* dismiss for session */}}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Maybe Later
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <ProfileImage
                src={employee.photoUrl}
                name={employee.name}
                size="lg"
                className="flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{employee.name}</h1>
                <p className="text-sm sm:text-base text-gray-600">{employee.department} Department</p>
                <p className="text-xs sm:text-sm text-gray-500">Phone: {employee.phone}</p>
                {/* Real-time status indicator */}
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    dashboardConnected && kpiConnected ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-xs text-gray-500">
                    {dashboardConnected && kpiConnected ? 'Live updates active' : 'Offline mode'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation self-start sm:self-auto"
            >
              <span className="sm:hidden">← Form</span>
              <span className="hidden sm:inline">← Back to Form</span>
            </button>
          </div>
        </div>

        {/* Quick Navigation Section */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-blue-600">🚀</span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickActionButton
               title="Interactive Forms"
               description="Submit KPIs, feedback & reviews"
               icon="📝"
               onClick={navigateToInteractiveForms}
               gradient="from-blue-500 to-blue-600"
             />
             <QuickActionButton
               title="Monthly Reports"
               description="View performance analytics"
               icon="📊"
               onClick={navigateToReports}
               gradient="from-green-500 to-green-600"
             />
            <QuickActionButton
              title="Profile Settings"
              description="Update your information"
              icon="⚙️"
              onClick={() => setShowProfileModal(true)}
              gradient="from-purple-500 to-purple-600"
            />
          </div>
        </div>

        {/* Role-Based Dashboard Features */}
        <RoleBasedDashboardFeatures />

        {/* Project Workspace System */}
        <ProjectWorkspaceSystem employee={employee} />

        {/* Client Addition Section */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                C
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Client Management</h3>
                <p className="text-xs sm:text-sm text-gray-600">Add new clients to your portfolio</p>
              </div>
            </div>
            <button
              onClick={() => setShowClientForm(!showClientForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {showClientForm ? 'Cancel' : '+ Add Client'}
            </button>
          </div>
          
          {showClientForm && (
            <div className="mt-4 border-t pt-4">
              <ClientAdditionForm 
                employee={employee}
                onSuccess={() => {
                  setShowClientForm(false);
                  notify('Client added successfully!', 'success');
                }}
                onCancel={() => setShowClientForm(false)}
              />
            </div>
          )}
        </div>

        {/* Performance Overview Cards */}
        {overallStats && (
          <div className={`${gridConfig.metrics} gap-4`}>
            <DataCard
              title="Overall Score"
              value={overallStats.avgOverallScore}
              unit="/10"
              icon="⭐"
              className="bg-gray-50"
            />
            <DataCard
              title="KPI Performance"
              value={overallStats.avgKpiScore}
              unit="/10"
              icon="📋"
              className="bg-gray-50"
            />
            <DataCard
              title="Learning Hours"
              value={overallStats.totalLearningHours}
              unit=" hrs"
              icon="📖"
              className="bg-gray-50"
            />
            <DataCard
              title="Total Reports"
              value={overallStats.totalSubmissions}
              unit=""
              icon="📊"
              className="bg-gray-50"
            />
          </div>
        )}

        {currentMonthSubmission && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                ✓
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Current Month Submitted</h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {monthLabel(currentMonthSubmission.monthKey)} report submitted with {currentMonthSubmission.scores?.overall?.toFixed(1) || 'N/A'}/10 overall score
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Month Performance Details */}
        {currentMonthSubmission && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4">
            {monthLabel(currentMonthSubmission.monthKey)} Performance Breakdown
          </h3>
            <div className="space-y-3">
              <MetricRow
                label="Overall Score"
                currentValue={currentMonthSubmission.scores?.overall}
                previousValue={employeeSubmissions[1]?.scores?.overall}
                unit="/10"
                target="7.0"
              />
              <MetricRow
                label="KPI Performance"
                currentValue={currentMonthSubmission.scores?.kpiScore}
                previousValue={employeeSubmissions[1]?.scores?.kpiScore}
                unit="/10"
                target="8.0"
              />
              <MetricRow
                label="Learning Activities"
                currentValue={currentMonthSubmission.scores?.learningScore}
                previousValue={employeeSubmissions[1]?.scores?.learningScore}
                unit="/10"
                target="7.0"
              />
              <MetricRow
                label="Client Relations"
                currentValue={currentMonthSubmission.scores?.relationshipScore}
                previousValue={employeeSubmissions[1]?.scores?.relationshipScore}
                unit="/10"
                target="8.0"
              />
            </div>
          </div>
        )}

        {/* Interactive KPI Dashboard Section */}
        <KPIDashboard 
          employeeId={employee?.id}
          showForm={true}
          viewMode="dashboard"
        />
        
        {/* Legacy KPI Editor Section - Keep for backward compatibility */}
        {employeeSubmissions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  📊
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Legacy KPI Editor</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Update your KPI values for submitted reports</p>
                </div>
              </div>
            </div>
            
            <KPIEditor 
              submissions={employeeSubmissions}
              onKPIUpdate={(submissionId, updatedKPIs) => {
                notify('KPIs updated successfully!', 'success');
                // The enhanced data sync will automatically refresh the data
              }}
              employeeView={true}
            />
          </div>
        )}

        <ClientReportsView employee={employee} employeeSubmissions={employeeSubmissions} />

        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Submission History & Reports</h3>
          {employeeSubmissions.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📋</div>
              <p className="text-sm sm:text-base text-gray-600 px-4">No submissions yet. Submit your first monthly report to see your progress here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {employeeSubmissions.map((submission, index) => (
                <div key={submission.id || index} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base ${
                        submission.isDraft ? 'bg-gray-500' : 'bg-blue-500'
                      }`}>
                        {submission.isDraft ? 'D' : '✓'}
                      </div>
                      <div>
                        <div className="font-medium text-sm sm:text-base">{monthLabel(submission.monthKey)}</div>
                        <div className="text-xs sm:text-sm text-gray-600">
                          {submission.isDraft ? 'Draft' : 'Submitted'} • Score: {submission.scores?.overall?.toFixed(1) || 'N/A'}/10
                        </div>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      <span className="hidden sm:inline">{new Date(submission.created_at || submission.updated_at).toLocaleDateString()}</span>
                      <span className="sm:hidden">{new Date(submission.created_at || submission.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {!submission.isDraft && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => generateAndDownloadPDF(submission, employee.name)}
                        className={`flex-1 px-3 py-2 text-xs sm:text-sm bg-gradient-to-r ${roleTheme.primary} text-white rounded-lg hover:opacity-90 active:opacity-80 transition-all touch-manipulation`}
                      >
                        Download Report
                      </button>
                      <button
                        onClick={() => openModal('Submission Details', getSubmissionSummary(submission), closeModal)}
                        className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                      >
                        View Summary
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Device Allocation Section */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
            Device Allocation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Device Type</label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {employee.deviceType || 'Not specified'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">MAC Address</label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg font-mono">
                {employee.macAddress || 'Not provided'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg font-mono">
                {employee.serialNumber || 'Not provided'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                employee.deviceType ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.deviceType ? 'Allocated' : 'Pending'}
              </div>
            </div>
          </div>
        </div>

        {/* SIM Card Management Section */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
            SIM Card & Communication
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SIM Card Provided</label>
              <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                employee.simCardProvided === 'yes' ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.simCardProvided === 'yes' ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {employee.whatsappNumber || 'Not provided'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Recharge Date</label>
              <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                {employee.rechargeDate ? new Date(employee.rechargeDate).toLocaleDateString() : 'Not recorded'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Communication Status</label>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                employee.whatsappNumber ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.whatsappNumber ? 'Active' : 'Setup Pending'}
              </div>
            </div>
          </div>
        </div>

        {/* Company Property Tracking Section */}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
            Company Property & Assets
          </h3>
          <div className="space-y-4">
            {employee.companyAssets && employee.companyAssets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.companyAssets.map((asset, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-gray-900">{asset.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{asset.description}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Serial: {asset.serialNumber || 'N/A'} • 
                      Status: <span className={`font-medium ${asset.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {asset.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">📦</div>
                <p className="text-gray-600">No company assets assigned yet</p>
                <p className="text-sm text-gray-500 mt-1">Assets will appear here once allocated by management</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {showProfileModal && (
        <ProfileEditModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          employee={employee}
          onSave={handleSaveProfile}
          isFirstTime={profileCompleteness.isFirstTime}
        />
      )}
    </>
  );
}
