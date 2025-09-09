import React, { useEffect, useMemo, useState, useCallback, Fragment, Suspense, lazy } from "react";
import { Modal } from "@/shared/components/Modal";
import { useSupabase } from "./SupabaseProvider";
import UnifiedLoginModal from "@/features/auth/UnifiedLoginModal";
import { useUnifiedAuth as useAuth } from "@/features/auth/UnifiedAuthContext";
import { LoginPage } from "@/features/auth/LoginPage";
import MonthlyFormPrompt from "./MonthlyFormPrompt";
import { useAppNavigation } from '@/utils/navigation';
// import { EMPTY_SUBMISSION, ADMIN_TOKEN } from "@/shared/lib/constants"; // Currently unused
import { HeaderBrand } from "@/shared/components/HeaderBrand";
// import { useFetchSubmissions } from "./useFetchSubmissions"; // Currently unused
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { ToastProvider } from "@/shared/components/Toast";
import { LoadingSpinner, CardSkeleton } from "@/shared/components/LoadingStates";
import { FadeTransition } from "@/shared/components/Transitions";
import { NavigationHandlers } from "@/shared/utils/handlerUtils";
import ThemeToggle from "@/shared/components/ThemeToggle";
import HelpButton from "@/shared/components/HelpButton";
import { DashboardGuard } from "./PermissionGuard";
import { logger } from "@/shared/utils/logger";

// Lazy load large dashboard components for code splitting
const TacticalForm = lazy(() => import("./TacticalForm/TacticalForm").then(module => ({ default: module.default })));
const NewEmployeeForm = lazy(() => import("./EmployeeForm/NewEmployeeForm").then(module => ({ default: module.NewEmployeeForm })));
const ManagerDashboard = lazy(() => import("./ManagerDashboard").then(module => ({ default: module.ManagerDashboard })));
const NewReportDashboard = lazy(() => import("./NewReportDashboard").then(module => ({ default: module.NewReportDashboard })));
const ManagerEditEmployee = lazy(() => import("./ManagerEditEmployee").then(module => ({ default: module.ManagerEditEmployee })));
const EmployeePersonalDashboard = lazy(() => import("./EmployeePersonalDashboard").then(module => ({ default: module.EmployeePersonalDashboard })));
const InternDashboard = lazy(() => import("./InternDashboard").then(module => ({ default: module.InternDashboard })));
// const FreelancersDashboard = lazy(() => import("./FreelancersDashboard").then(module => ({ default: module.default })));
const AgencyDashboard = lazy(() => import("./AgencyDashboard").then(module => ({ default: module.AgencyDashboard })));
// const ManagerControlPanel = lazy(() => import("./ManagerControlPanel").then(module => ({ default: module.ManagerControlPanel })));
const OperationsHeadDashboard = lazy(() => import("./OperationsHeadDashboard").then(module => ({ default: module.OperationsHeadDashboard })));
const SuperAdminDashboard = lazy(() => import("./SuperAdminDashboard").then(module => ({ default: module.SuperAdminDashboard })));
const HRDashboard = lazy(() => import("./HRDashboard").then(module => ({ default: module.HRDashboard })));
const MonthlyReportDashboard = lazy(() => import("./MonthlyReportDashboard").then(module => ({ default: module.MonthlyReportDashboard })));
const MasterToolsPage = lazy(() => import("./MasterToolsPage"));
const OrganizationChart = lazy(() => import("./OrganizationChart"));
const EmployeeDirectory = lazy(() => import("./EmployeeDirectory"));
const ClientDirectory = lazy(() => import("./ClientDirectory"));
const ClientOnboardingForm = lazy(() => import("./ClientOnboardingForm"));
const EmployeeOnboardingForm = lazy(() => import('./EmployeeOnboardingForm'));
const EmployeeIncentiveForm = lazy(() => import('./EmployeeIncentiveForm'));
const HRIncentiveApproval = lazy(() => import('../features/employees/components/HRIncentiveApproval'));
const ManagerIncentiveReporting = lazy(() => import('../features/employees/components/ManagerIncentiveReporting'));
const PerformanceConcerns = lazy(() => import('./PerformanceConcerns'));
const PerformanceScoring = lazy(() => import('./PerformanceScoring'));
const ArcadeDashboard = lazy(() => import('./ArcadeDashboard'));
const ArcadeEarnPoints = lazy(() => import('./ArcadeEarnPoints'));
const ArcadeRedeemPoints = lazy(() => import('./ArcadeRedeemPoints'));
const ArcadeHistory = lazy(() => import('./ArcadeHistory'));
const ArcadeAdminPanel = lazy(() => import('./ArcadeAdminPanel'));
const ArcadePermissionTest = lazy(() => import('./ArcadePermissionTest'));
const TestDataManager = lazy(() => import('./TestDataManager'));
const DatabaseErrorHandler = lazy(() => import('./DatabaseErrorHandler'));

// Role-specific dashboards for employee category
const SEOEmployeeDashboard = lazy(() => import('./SEOEmployeeDashboard'));
const AdsDashboard = lazy(() => import('./dashboards/AdsDashboard'));
const SocialMediaDashboard = lazy(() => import('./dashboards/SocialMediaDashboard'));
const WebDashboard = lazy(() => import('./dashboards/WebDashboard'));
const YouTubeSEODashboard = lazy(() => import('./dashboards/YouTubeSEODashboard'));
const ProfileDashboard = lazy(() => import('./ProfileDashboard'));
const PersonalizedProfileDashboard = lazy(() => import('./PersonalizedProfileDashboard'));
const ProfileSettingsManager = lazy(() => import('./settings/ProfileSettingsManager'));

// Enhanced loading component for Suspense fallback
const EnhancedLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <FadeTransition show={true}>
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" showText text="Loading dashboard..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 w-full max-w-4xl">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </FadeTransition>
  </div>
);

function useHash() {
  const initial = typeof window === 'undefined' ? '' : (window.location.hash || '');
  const [hash, setHash] = useState(initial);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

import { ModalContext } from "@/shared/components/ModalContext";


export function AppContent() {
  const hash = useHash();
  // const { allSubmissions, loading, error } = useFetchSubmissions(); // Currently unused
  const { isLoggedIn, isLoading, user, role, userCategory, logout, hasDashboardAccess, loginError } = useAuth();
  const navigation = useAppNavigation();
  const [view, setView] = useState('agencyDashboard');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  // Login modal state removed - using navigation instead
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, inputLabel: '', inputValue: '', onClose: () => setModalState(s => ({ ...s, isOpen: false })) });
  const openModal = (title, message, onConfirm = null, onCancel = null, inputLabel = '', inputValue = '') => {
    setModalState({ isOpen: true, title, message, onConfirm, onCancel, inputLabel, inputValue, onClose: () => setModalState(s => ({ ...s, isOpen: false })) });
  };
  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  // Define public routes that don't require authentication
  const publicRoutes = [
    '#/employee-onboarding',
    '#/client-onboarding',
    '#/test-data',
    '#/database-setup',
    '#/policies'
  ];

  const isPublicRoute = publicRoutes.includes(hash);

  // Role-based dashboard navigation - defined early to avoid hoisting issues
  const navigateToRoleDashboard = useCallback((userRole) => {
    console.log('🚀 navigateToRoleDashboard called with role:', userRole);
    console.log('🚀 Current user:', user);
    
    switch (userRole) {
      case 'Super Admin':
        setView('superAdminDashboard');
        navigation.navigateToHash('super-admin');
        break;
      case 'Operations Head':
        setView('operationsHeadDashboard');
        navigation.navigateToHash('operations-head');
        break;
      case 'HR':
        setView('hrDashboard'); 
        navigation.navigateToHash('hr');
        break;
      case 'Manager':
        setView('managerDashboard');
        navigation.navigateToHash('manager');
        break;
      case 'Intern':
        setView('internDashboard');
        navigation.navigateToHash('intern');
        break;
      case 'SEO':
      case 'Ads':
      case 'Social Media':
      case 'YouTube SEO':
      case 'Web Developer':
      case 'Graphic Designer':
        // For employees, show personal dashboard with role context
        setSelectedEmployee({ role: userRole, name: user?.name });
        setView('employeePersonalDashboard');
        navigation.navigateToHash('employee');
        break;
      case 'Freelancer':
        setView('freelancersDashboard');
        navigation.navigateToHash('freelancer');
        break;
      default:
        // Fallback to personalized profile dashboard
        setView('personalizedProfileDashboard');
        navigation.navigateToHash('profile');
    }
  }, [user]);

  useEffect(() => {
    if (hash === '#/manager') {
      if (isLoggedIn && (userCategory === 'management' || role === 'Operations Head')) {
        navigateToRoleDashboard(role);
      } else if (!isLoggedIn) {
        // Navigate to login page for protected manager route
        navigation.navigate('/login-page');
      } else {
        // User is logged in but doesn't have manager access
        setView('agencyDashboard');
      }
    } else if (hash === '#/employee') {
      if (isLoggedIn && userCategory === 'employee') {
        navigateToRoleDashboard(role);
      } else if (!isLoggedIn) {
        // Navigate to login page for protected employee route
        navigation.navigate('/login-page');
      } else {
        // User is logged in but doesn't have employee access
        setView('agencyDashboard');
      }
    } else if (hash === '#/intern') {
      if (isLoggedIn && userCategory === 'intern') {
        navigateToRoleDashboard(role);
      } else if (!isLoggedIn) {
        // Navigate to login page for protected intern route
        navigation.navigate('/login-page');
      } else {
        // User is logged in but doesn't have intern access
        setView('agencyDashboard');
      }
    } else if (hash === '#/dashboard') {
      if (isLoggedIn) {
        navigateToRoleDashboard(role);
      } else {
        // Navigate to login page for protected dashboard route
        navigation.navigate('/login-page');
      }
    } else if (hash === '#/intern-dashboard' && isLoggedIn && userCategory === 'intern') {
      navigateToRoleDashboard(role);
    } else if (hash === '' || hash === '#/') {
      // Homepage is now public - show Agency Dashboard
      setView('agencyDashboard');
    } else if (hash === '#/login') {
      // Dedicated login page
      if (isLoggedIn) {
        // For logged-in users, redirect to their appropriate dashboard
        console.log('User already logged in with role:', role, '- redirecting to role dashboard');
        navigateToRoleDashboard(role);
      } else {
        console.log('Navigating to login page');
        navigation.navigate('/login-page');
      }
    }
    
    // Public route handling
    if (isPublicRoute) {
      // No need to close login modal as we're using navigation now
    } else if (hash === '#/form') {
      setView('form');
    } else if (hash === '#/monthly-form') {
      setView('form');
    } else if (hash === '#/reports-dashboard') {
      setView('managerDashboard');
    } else if (hash === '#/monthly-reports') {
      setView('monthlyReports');
    } else if (hash === '#/master-tools') {
      if (isLoggedIn) {
        setView('masterTools');
      } else {
        navigation.navigate('/login-page');
      }
    } else if (hash === '#/organization-chart') {
      if (isLoggedIn) {
        setView('organizationChart');
      } else {
        navigation.navigate('/login-page');
      }
    } else if (hash === '#/employee-directory') {
      if (isLoggedIn) {
        setView('employeeDirectory');
      } else {
        navigation.navigate('/login-page');
      }
    } else if (hash === '#/client-directory') {
      if (isLoggedIn) {
        setView('clientDirectory');
      } else {
        navigation.navigate('/login-page');
      }
    } else if (hash === '#/client-onboarding') {
      setView('clientOnboarding');
      // Public route - no authentication required
    } else if (hash === '#/employee-onboarding') {
      setView('employeeOnboarding');
      // Public route - no authentication required
    } else if (hash === '#/employee-incentives') {
      setView('employeeIncentives');
    } else if (hash === '#/hr-incentive-approval') {
      setView('hrIncentiveApproval');
    } else if (hash === '#/manager-incentive-reporting') {
      setView('managerIncentiveReporting');
    } else if (hash === '#/performance-concerns') {
      setView('performanceConcerns');
    } else if (hash === '#/performance-scoring') {
      setView('performanceScoring');
    } else if (hash === '#/arcade') {
      setView('arcade');
    } else if (hash === '#/arcade-earn') {
      setView('arcadeEarn');
    } else if (hash === '#/arcade-redeem') {
      setView('arcadeRedeem');
    } else if (hash === '#/arcade-history') {
      setView('arcadeHistory');
    } else if (hash === '#/arcade-admin') {
      if (!isLoggedIn) {
        navigation.navigate('/login-page');
      } else if (isLoggedIn && (role === 'Super Admin' || role === 'Operations Head')) {
        setView('arcadeAdmin');
      }
    } else if (hash === '#/arcade-test') {
      setView('arcadeTest');
    } else if (hash === '#/test-data') {
      setView('testDataManager');
    } else if (hash === '#/database-setup') {
      setView('databaseSetup');
    } else if (hash === '#/policies') {
      setView('policies');
    } else if (hash === '#/profile') {
      if (isLoggedIn) {
        setView('personalizedProfileDashboard');
      } else {
        navigation.navigate('/login-page');
      }
    } else if (hash === '#/profile-settings') {
      if (isLoggedIn) {
        setView('profileSettings');
      } else {
        navigation.navigate('/login-page');
      }
    } else if (hash === '#admin') {
      if (!isLoggedIn) {
        navigation.navigate('/login-page');
      } else if (isLoggedIn && role === 'Super Admin') {
        navigateToRoleDashboard(role);
      }
    } else if (hash === '#operations-head') {
      if (!isLoggedIn) {
        navigation.navigate('/login-page');
      } else if (isLoggedIn && role === 'Operations Head') {
        navigateToRoleDashboard(role);
      }
    } else if (hash === '#super-admin') {
      if (!isLoggedIn) {
        navigation.navigate('/login-page');
      } else if (isLoggedIn && role === 'Super Admin') {
        navigateToRoleDashboard(role);
      }
    }
  }, [hash, isLoggedIn, role, userCategory, isPublicRoute, navigateToRoleDashboard]);

  // Initialize navigation handlers
  const navigationHandlers = useMemo(() => new NavigationHandlers(setView), [setView]);

  // Handle custom navigation events
  useEffect(() => {
    const handleNavigateToForm = navigationHandlers.navigateToForm;
    const handleNavigateToDashboard = () => {
      if (isLoggedIn && role) {
        navigateToRoleDashboard(role);
      } else {
        navigation.navigate('/login-page');
      }
    };
    const handleNavigateToTools = navigationHandlers.navigateToTools;
    const handleShowLoginModal = () => navigation.navigate('/login-page');

    window.addEventListener('navigate-to-form', handleNavigateToForm);
    window.addEventListener('navigate-to-dashboard', handleNavigateToDashboard);
    window.addEventListener('navigate-to-tools', handleNavigateToTools);
    window.addEventListener('show-login-modal', handleShowLoginModal);

    return () => {
      window.removeEventListener('navigate-to-form', handleNavigateToForm);
      window.removeEventListener('navigate-to-dashboard', handleNavigateToDashboard);
      window.removeEventListener('navigate-to-tools', handleNavigateToTools);
      window.removeEventListener('show-login-modal', handleShowLoginModal);
    };
  }, [isLoggedIn, role, navigateToRoleDashboard, navigationHandlers]);



  // Handle automatic redirect after successful login
  useEffect(() => {
    if (isLoggedIn) {
      // Use our role-based navigation instead of the generic handler
      setTimeout(() => {
        navigateToRoleDashboard(role);
      }, 100);
    }
  }, [isLoggedIn, role, navigateToRoleDashboard]);

  // Handle navigation to master tools page
  useEffect(() => {
    const handleNavigateToTools = navigationHandlers.navigateToTools;

    window.addEventListener('navigate-to-tools', handleNavigateToTools);
    
    return () => {
      window.removeEventListener('navigate-to-tools', handleNavigateToTools);
    };
  }, [navigationHandlers]);

  const handleViewEmployeeReport = useCallback((employeeName, employeePhone) => {
    setSelectedEmployee({ name: employeeName, phone: employeePhone });
    setView('employeeReport');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    if (!isLoggedIn) {
      setView('agencyDashboard');
      navigation.navigateToHash('');
      return;
    }

    navigateToRoleDashboard(role);
    setSelectedEmployee(null);
    setSelectedSubmission(null);
  }, [isLoggedIn, role, navigateToRoleDashboard, navigation]);

  const handleEditEmployee = useCallback((employeeName, employeePhone) => {
    setSelectedEmployee({ name: employeeName, phone: employeePhone });
    setView('editEmployee');
  }, []);

  const handleEditReport = useCallback((employeeName, employeePhone, submission = null) => {
    setSelectedEmployee({ name: employeeName, phone: employeePhone });
    setSelectedSubmission(submission);
    setView('editReport');
  }, []);

  const renderCurrentView = () => {
    const content = (() => {
      switch (view) {
        case 'agencyDashboard':
          return (
            <AgencyDashboard 
              userType={role}
              currentUser={user}
              onNavigateToProfile={(userRole) => {
                // Navigate to ProfileDashboard for profile viewing/editing
                if (isLoggedIn) {
                  setView('profileDashboard');
                } else {
                  navigation.navigate('/login-page');
                }
              }}
            />
          );

        case 'superAdminDashboard':
          return (
            <DashboardGuard requiredDashboard="admin">
              <div className="max-w-6xl mx-auto p-8">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Super Admin Dashboard</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">System Overview</h3>
                      <p className="text-gray-600">Monitor system health and performance</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        onClick={() => {
                          // Navigate to system overview/dashboard
                          navigation.navigateToHash('master-tools');
                        }}
                      >
                        View Details
                      </button>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
                      <p className="text-gray-600">Manage users, roles, and permissions</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        onClick={() => {
                          // Navigate to user/employee management
                          navigation.navigateToHash('employee-directory');
                        }}
                      >
                        Manage Users
                      </button>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
                      <p className="text-gray-600">View comprehensive reports and analytics</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        onClick={() => {
                          // Navigate to reports dashboard
                          navigation.navigateToHash('reports-dashboard');
                        }}
                      >
                        View Reports
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={handleBackToDashboard}
                    className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Back to Main Dashboard
                  </button>
                </div>
              </div>
            </DashboardGuard>
          );
        case 'hrDashboard':
          return (
            <DashboardGuard requiredDashboard="hrDashboard">
              <EmployeePersonalDashboard 
                employee={user}
                onBack={handleBackToDashboard}
              />
            </DashboardGuard>
          );
        case 'freelancerDashboard':
          return (
            <DashboardGuard requiredDashboard="freelancerDashboard">
              <EmployeePersonalDashboard 
                employee={user}
                onBack={handleBackToDashboard}
              />
            </DashboardGuard>
          );
        case 'managerDashboard':
          return (
            <DashboardGuard requiredDashboard="manager">
              <ManagerDashboard 
                onViewReport={handleViewEmployeeReport || (() => console.log('View report clicked'))}
                onEditEmployee={handleEditEmployee || (() => console.log('Edit employee clicked'))}
                onEditReport={handleEditReport || (() => console.log('Edit report clicked'))}
              />
            </DashboardGuard>
          );

        case 'operationsHeadDashboard':
          return (
            <DashboardGuard requiredDashboard="manager">
              <div className="max-w-6xl mx-auto p-8">
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Operations Head Dashboard</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Operations Overview</h3>
                      <p className="text-gray-600">Monitor daily operations and workflows</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                        onClick={() => {
                          // Navigate to operations view
                          navigation.navigateToHash('operations');
                        }}
                      >
                        View Operations
                      </button>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Management</h3>
                      <p className="text-gray-600">Manage team performance and assignments</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        onClick={() => {
                          // Navigate to team management
                          navigation.navigateToHash('employee-directory');
                        }}
                      >
                        Manage Team
                      </button>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Metrics</h3>
                      <p className="text-gray-600">Track KPIs and operational metrics</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        onClick={() => {
                          // Navigate to performance metrics
                          navigation.navigateToHash('performance-scoring');
                        }}
                      >
                        View Metrics
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={handleBackToDashboard}
                    className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Back to Main Dashboard
                  </button>
                </div>
              </div>
            </DashboardGuard>
          );
        case 'employeeReport':
          if (!selectedEmployee) return (
            <div className="max-w-xl mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-4">Missing employee context. Returning to dashboard…</div>
          );
          return (
            <NewReportDashboard 
              employeeName={selectedEmployee.name} 
              employeePhone={selectedEmployee.phone} 
              onBack={handleBackToDashboard} 
            />
          );
        case 'editEmployee':
          if (!selectedEmployee) return (
            <div className="max-w-xl mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-4">Missing employee context. Returning to dashboard…</div>
          );
          return (
            <ManagerEditEmployee 
              employee={selectedEmployee}
              onBack={handleBackToDashboard}
            />
          );
        case 'editReport':
          if (!selectedEmployee) return (
            <div className="max-w-xl mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-4">Missing employee context. Returning to dashboard…</div>
          );
          return (
            <ManagerGuard>
              <NewEmployeeForm 
                currentUser={selectedEmployee}
                existingSubmission={selectedSubmission}
                isManagerEdit={true}
                onBack={handleBackToDashboard}
              />
            </ManagerGuard>
          );
        // Role-specific employee dashboards
        case 'seoDashboard':
          return (
            <DashboardGuard requiredDashboard="seo_dashboard">
              <SEOEmployeeDashboard />
            </DashboardGuard>
          );
        case 'adsDashboard':
          return (
            <DashboardGuard requiredDashboard="ads_dashboard">
              <AdsDashboard />
            </DashboardGuard>
          );
        case 'socialMediaDashboard':
          return (
            <DashboardGuard requiredDashboard="social_dashboard">
              <SocialMediaDashboard />
            </DashboardGuard>
          );
        case 'webDashboard':
          return (
            <DashboardGuard requiredDashboard="dev_dashboard">
              <WebDashboard />
            </DashboardGuard>
          );
        case 'youtubeSEODashboard':
          return (
            <DashboardGuard requiredDashboard="youtube_dashboard">
              <YouTubeSEODashboard />
            </DashboardGuard>
          );
        case 'employeeDashboard':
        case 'employeePersonalDashboard':
          return (
            <DashboardGuard requiredDashboard="employee">
              <EmployeePersonalDashboard 
                employee={user}
                onBack={handleBackToDashboard}
              />
            </DashboardGuard>
          );
        case 'internDashboard':
          return (
            <DashboardGuard requiredDashboard="intern">
              <InternDashboard 
                intern={user}
                onBack={handleBackToDashboard}
              />
            </DashboardGuard>
          );
        case 'masterTools':
          return (
            <MasterToolsPage 
              userType={role}
              currentUser={user}
            />
          );
        case 'organizationChart':
          return (
            <OrganizationChart 
              onBack={handleBackToDashboard}
            />
          );
        case 'employeeDirectory':
          return (
            <EmployeeDirectory 
              onBack={handleBackToDashboard}
            />
          );
        case 'clientDirectory':
          return (
            <ClientDirectory 
              onBack={handleBackToDashboard}
            />
          );
        case 'clientOnboarding':
          return (
            <ClientOnboardingForm 
              onBack={handleBackToDashboard}
            />
          );
        case 'employeeOnboarding':
          return (
            <EmployeeOnboardingForm 
              onBack={handleBackToDashboard}
            />
          );
        case 'employeeIncentives':
          return (
            <EmployeeIncentiveForm 
              onBack={handleBackToDashboard}
            />
          );
        case 'hrIncentiveApproval':
          return (
            <HRIncentiveApproval 
              onBack={handleBackToDashboard}
            />
          );
        case 'managerIncentiveReporting':
          return (
            <ManagerIncentiveReporting 
              onBack={handleBackToDashboard}
            />
          );
        case 'performanceConcerns':
          return (
            <PerformanceConcerns 
              onBack={handleBackToDashboard}
            />
          );
        case 'performanceScoring':
          return (
            <PerformanceScoring 
              onBack={handleBackToDashboard}
            />
          );
        case 'arcade':
          return (
            <ArcadeDashboard 
              currentUser={user}
              onNavigate={(route) => {
                if (route === 'earn') navigation.navigateToHash('arcade-earn');
                else if (route === 'redeem') navigation.navigateToHash('arcade-redeem');
                else if (route === 'history') navigation.navigateToHash('arcade-history');
                else if (route === 'admin') navigation.navigateToHash('arcade-admin');
                else navigation.navigateToDashboard();
              }}
            />
          );
        case 'arcadeEarn':
          return (
            <ArcadeEarnPoints 
              currentUser={user}
              onNavigate={(route) => {
                if (route === 'arcade') navigation.navigateToHash('arcade');
                else navigation.navigateToDashboard();
              }}
            />
          );
        case 'arcadeRedeem':
          return (
            <ArcadeRedeemPoints 
              currentUser={user}
              onNavigate={(route) => {
                if (route === 'arcade') navigation.navigateToHash('arcade');
                else navigation.navigateToDashboard();
              }}
            />
          );
        case 'arcadeHistory':
          return (
            <ArcadeHistory 
              currentUser={user}
              onNavigate={(route) => {
                if (route === 'arcade') navigation.navigateToHash('arcade');
                else navigation.navigateToDashboard();
              }}
            />
          );
        case 'arcadeAdmin':
          return (
            <AdminGuard>
              <ArcadeAdminPanel 
                currentUser={user}
                onNavigate={(route) => {
                  if (route === 'arcade') navigation.navigateToHash('arcade');
                  else navigation.navigateToDashboard();
                }}
              />
            </AdminGuard>
          );
        case 'arcadeTest':
          return <ArcadePermissionTest />;
        case 'testDataManager':
          return (
            <TestDataManager 
              onBack={() => {
                navigation.navigateToHash('');
                setView('agencyDashboard');
              }}
            />
          );
        case 'databaseSetup':
          return (
            <DatabaseErrorHandler 
              onBack={handleBackToDashboard}
            />
          );
        case 'monthlyReports':
          return (
            <MonthlyReportDashboard 
              onBack={handleBackToDashboard}
            />
          );
        case 'form':
          return <TacticalForm onBack={handleBackToDashboard} />;
        case 'policies':
          // Redirect to Company Guidebook since they contain the same content
          window.open('https://aitable.ai/workbench/dst6t04qlzyDWE9jP2/viw8gmHykjihF?spaceId=spc6qUGZ1bw43', '_blank');
          // Navigate back to dashboard after opening the guidebook
          setTimeout(() => {
            handleBackToDashboard();
          }, 100);
          return (
            <div className="max-w-4xl mx-auto p-8">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-3xl font-bold text-gray-900">Company Policies & Guidebook</h1>
                  <button
                    onClick={handleBackToDashboard}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
                <div className="prose max-w-none">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-3">
                      <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-green-800">Opening Company Guidebook...</h3>
                    </div>
                    <p className="text-green-700 mb-4">
                      The Company Policies and Guidebook have been opened in a new tab. This document contains all company policies, guidelines, and procedures.
                    </p>
                    <p className="text-sm text-green-600">
                      If the document didn't open automatically, 
                      <a 
                        href="https://aitable.ai/workbench/dst6t04qlzyDWE9jP2/viw8gmHykjihF?spaceId=spc6qUGZ1bw43" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline font-medium hover:text-green-800"
                      >
                        click here to access it manually
                      </a>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        case 'profileDashboard':
          return (
            <DashboardGuard requiredDashboard="profile">
              <ProfileDashboard 
                onBack={handleBackToDashboard}
              />
            </DashboardGuard>
          );
        case 'personalizedProfileDashboard':
          return (
            <DashboardGuard requiredDashboard="profile">
              <PersonalizedProfileDashboard 
                onBack={handleBackToDashboard}
              />
            </DashboardGuard>
          );
        case 'profileSettings':
          return (
            <DashboardGuard requiredDashboard="profile">
              <ProfileSettingsManager 
                onBack={handleBackToDashboard}
              />
            </DashboardGuard>
          );
        default:
          // No default fallback to agency dashboard - show appropriate message
          return (
            <div className="max-w-4xl mx-auto p-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-yellow-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Not Available</h2>
                <p className="text-gray-600 mb-6">
                  {isLoggedIn 
                    ? `No dashboard configured for role: ${role || 'Unknown'}` 
                    : 'Please log in to access your dashboard'
                  }
                </p>
                {!isLoggedIn && (
                  <button
                    onClick={() => navigation.navigateToLogin()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          );
      }
    })();

    return (
      <Suspense fallback={<EnhancedLoadingSpinner />}>
        {content}
      </Suspense>
    );
  };



  // Show loading screen while session is being restored
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300">Restoring your session...</p>
        </div>
      </div>
    );
  }

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
        <Modal {...modalState} />
        <header className="sticky top-0 bg-white/95 dark:bg-dark-800/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-dark-600/50 shadow-lg shadow-blue-100/20 dark:shadow-dark-900/20 z-20 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <HeaderBrand />
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Help Button */}
                <HelpButton />
                {/* Theme Toggle */}
                <ThemeToggle size="sm" showLabel={false} className="" />
                
                {isLoggedIn ? (
                  <>
                    <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      {(userCategory === 'management' || role === 'Operations Head' || role === 'Super Admin') && 'Manager Dashboard'}
                      {userCategory === 'employee' && `Welcome, ${user?.name}`}

                      {userCategory === 'intern' && `Intern: ${user?.name}`}
                    </div>
                    
                    <div className="lg:hidden flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="truncate max-w-20">
                        {(userCategory === 'management' || role === 'Operations Head' || role === 'Super Admin') && 'Manager'}
                        {userCategory === 'employee' && user?.name?.split(' ')[0]}

                        {userCategory === 'intern' && `Intern: ${user?.name?.split(' ')[0]}`}
                      </span>
                    </div>
                    
                    {userCategory === 'employee' && view !== 'employeeDashboard' && (
                      <button
                        onClick={handleBackToDashboard}
                        className="text-xs sm:text-sm px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md touch-manipulation"
                      >
                        <span className="hidden sm:inline">My Dashboard</span>
                        <span className="sm:hidden">Dashboard</span>
                      </button>
                    )}
                    
                    {userCategory === 'intern' && view !== 'internDashboard' && (
                      <button
                        onClick={handleBackToDashboard}
                        className="text-xs sm:text-sm px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md touch-manipulation"
                      >
                        <span className="hidden sm:inline">My Dashboard</span>
                        <span className="sm:hidden">Dashboard</span>
                      </button>
                    )}
                    
                    {view !== 'form' && (
                      <button
                        onClick={() => {
                          setView('form');
                          navigation.navigateToHash('form');
                        }}
                        className="text-xs sm:text-sm px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md touch-manipulation"
                      >
                        <span className="hidden sm:inline">Submit Report</span>
                        <span className="sm:hidden">Form</span>
                      </button>
                    )}
                    
                    <button
                      onClick={logout}
                      className="text-xs sm:text-sm px-2 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm hover:shadow-md touch-manipulation"
                    >
                      <span className="hidden sm:inline">Log Out</span>
                      <span className="sm:hidden">Exit</span>
                    </button>
                  </>
                ) : (
                  <div className="text-xs sm:text-sm text-gray-600">
                    Have an account? Check footer to login
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <ErrorBoundary>
            {renderCurrentView()}
          </ErrorBoundary>
        </main>
        <footer className="bg-white/90 backdrop-blur-lg border-t border-gray-200 mt-auto py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
                <span>Created for Branding Pioneers Agency</span>
                <span className="hidden sm:inline text-gray-400">•</span>
                <span>Employee Performance Management System</span>
                <span className="hidden sm:inline text-gray-400">•</span>
                <span>v12 (Form-First)</span>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">
                    Loading authentication state...
                  </p>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </div>
              ) : !isLoggedIn ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">
                    Access your dashboard with role-based authentication
                  </p>
                  <div className="flex flex-col gap-4 items-center">
                    {/* Primary Login Button */}
                    <button
                      id="primary-login-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Primary login button clicked, navigating to login page');
                        navigation.navigateToLogin();
                      }}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation font-semibold text-base flex items-center gap-3 transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      🔐 Login to Dashboard
                    </button>
                    
                    {/* Divider */}
                    <div className="flex items-center w-full max-w-xs">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="px-3 text-xs text-gray-500 bg-white">or browse public content</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                    
                    {/* Public Access Links - Non-privileged content only */}
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-3 font-medium">Public Access (No Login Required):</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => {
                            setView('employeeDirectory');
                            navigation.navigateToHash('employee-directory');
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm border border-gray-300"
                        >
                          👥 Employee Directory
                        </button>
                        <button
                          onClick={() => {
                            setView('organizationChart');
                            navigation.navigateToHash('organization-chart');
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm border border-gray-300"
                        >
                          📊 Organization Chart
                        </button>
                        <button
                          onClick={() => {
                            setView('clientDirectory');
                            navigation.navigateToHash('client-directory');
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm border border-gray-300"
                        >
                          🤝 Client Directory
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    <p>Available roles: <strong>SEO</strong> • <strong>Ads</strong> • <strong>HR</strong> • <strong>Sales</strong> • <strong>Accountant</strong> • <strong>Super Admin</strong> • <strong>and more...</strong></p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">
                    Welcome back, {user?.name || role}!
                  </p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => {
                        logger.debug('Logout button clicked');
                        logout();
                      }}
                      className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium"
                    >
                      Logout
                    </button>
                    <button
                      onClick={() => {
                        logger.debug('Navigating to login page');
                        navigation.navigate('/login-page');
                      }}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                    >
                      Switch User
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </footer>
        
        {/* Debug: Auth State */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-black/80 text-white p-3 rounded text-xs z-50 max-w-xs">
            <div>Auth: {isLoggedIn ? 'Logged In' : 'Not Logged In'}</div>
            <div>User: {role || 'None'}</div>
            <div>Category: {userCategory || 'None'}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            {loginError && <div className="text-red-300">Error: {loginError}</div>}
            <div className="flex gap-1 mt-2">
              <button 
                onClick={() => {
                  console.log('Debug: Navigating to login page');
                  navigation.navigate('/login-page');
                }}
                className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Force Modal
              </button>
              <button 
                onClick={() => {
                  console.log('Debug: Navigate to login page');
                  navigation.navigate('/login-page');
                }}
                className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
              >
                Login Page
              </button>
            </div>
            {/* Login page navigation debug message removed */}
          </div>
        )}
        
        {/* Login modal replaced with navigation to login page */}
        
        {/* Monthly Form Prompt - shows after login if user needs to submit */}
        <MonthlyFormPrompt />
      </div>
      </ToastProvider>
    </ModalContext.Provider>
  );
}