import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';

/**
 * Navigation utility hook that provides programmatic navigation
 * Replaces the hash-based navigation system
 */
export function useAppNavigation() {
  const navigate = useNavigate();
  const { authState } = useUnifiedAuth();
  const { isLoggedIn, role, userCategory, user } = authState;

  // Navigate to role-based dashboard
  const navigateToRoleDashboard = (userRole = role) => {
    console.log('🚀 navigateToRoleDashboard called with role:', userRole);
    console.log('🚀 Current user:', user);
    
    switch (userRole) {
      case 'Super Admin':
        navigate('/super-admin');
        break;
      case 'Operations Head':
        navigate('/operations-head');
        break;
      case 'HR':
        navigate('/hr');
        break;
      case 'Manager':
        navigate('/manager');
        break;
      case 'Intern':
        navigate('/intern');
        break;
      case 'SEO':
      case 'Ads':
      case 'Social Media':
      case 'YouTube SEO':
      case 'Web Developer':
      case 'Graphic Designer':
        navigate('/employee');
        break;
      case 'Freelancer':
        navigate('/freelancer');
        break;
      default:
        navigate('/profile');
    }
  };

  // Navigate to specific routes
  const navigateToForm = () => navigate('/form');
  const navigateToMonthlyForm = () => navigate('/monthly-form');
  const navigateToTools = () => navigate('/master-tools');
  const navigateToProfile = () => navigate('/profile');
  const navigateToProfileSettings = () => navigate('/profile-settings');
  const navigateToEmployeeDirectory = () => navigate('/employee-directory');
  const navigateToClientDirectory = () => navigate('/client-directory');
  const navigateToDirectory = () => navigate('/directory');
  const navigateToOrganizationChart = () => navigate('/organization-chart');
  const navigateToReports = () => navigate('/monthly-reports');
  const navigateToHome = () => navigate('/');
  const navigateToDashboard = () => {
    if (isLoggedIn && role) {
      navigateToRoleDashboard(role);
    } else {
      navigate('/');
    }
  };

  // Arcade navigation
  const navigateToArcade = () => navigate('/arcade');
  const navigateToArcadeEarn = () => navigate('/arcade-earn');
  const navigateToArcadeRedeem = () => navigate('/arcade-redeem');
  const navigateToArcadeHistory = () => navigate('/arcade-history');
  const navigateToArcadeAdmin = () => navigate('/arcade-admin');

  // Incentive navigation
  const navigateToEmployeeIncentives = () => navigate('/employee-incentives');
  const navigateToHRIncentiveApproval = () => navigate('/hr-incentive-approval');
  const navigateToManagerIncentiveReporting = () => navigate('/manager-incentive-reporting');

  // Performance navigation
  const navigateToPerformanceConcerns = () => navigate('/performance-concerns');
  const navigateToPerformanceScoring = () => navigate('/performance-scoring');

  // Onboarding navigation
  const navigateToEmployeeOnboarding = () => navigate('/employee-onboarding');
  const navigateToClientOnboarding = () => navigate('/client-onboarding');
  
  // Forms navigation
  const navigateToInteractiveForms = () => navigate('/interactive-forms');
  const navigateToFormTracking = () => navigate('/form-tracking');
  const navigateToLeaveForm = () => navigate('/leave-form');
  
  // Client management navigation
  const navigateToAddClient = () => navigate('/add-client');
  
  // Auth navigation
  const navigateToLogin = () => navigate('/login');
  
  // Policies navigation
  const navigateToPolicies = () => navigate('/policies');

  return {
    navigate,
    navigateToRoleDashboard,
    navigateToForm,
    navigateToMonthlyForm,
    navigateToTools,
    navigateToProfile,
    navigateToProfileSettings,
    navigateToEmployeeDirectory,
    navigateToClientDirectory,
    navigateToDirectory,
    navigateToOrganizationChart,
    navigateToReports,
    navigateToHome,
    navigateToDashboard,
    navigateToArcade,
    navigateToArcadeEarn,
    navigateToArcadeRedeem,
    navigateToArcadeHistory,
    navigateToArcadeAdmin,
    navigateToEmployeeIncentives,
    navigateToHRIncentiveApproval,
    navigateToManagerIncentiveReporting,
    navigateToPerformanceConcerns,
    navigateToPerformanceScoring,
    navigateToEmployeeOnboarding,
    navigateToClientOnboarding,
    navigateToInteractiveForms,
    navigateToFormTracking,
    navigateToLeaveForm,
    navigateToAddClient,
    navigateToLogin,
    navigateToPolicies
  };
}

/**
 * Legacy navigation handlers for backward compatibility
 * These can be gradually replaced with the new navigation system
 */
export class NavigationHandlers {
  constructor(navigate) {
    this.navigate = navigate;
  }

  navigateToForm = () => {
    this.navigate('/form');
  };

  navigateToTools = () => {
    this.navigate('/master-tools');
  };

  navigateToDashboard = () => {
    this.navigate('/dashboard');
  };
}

/**
 * Utility function to get current route without hash
 */
export function getCurrentRoute() {
  return window.location.pathname;
}

/**
 * Utility function to check if current route matches
 */
export function isCurrentRoute(route) {
  return window.location.pathname === route;
}

/**
 * Replace hash-based navigation events with proper navigation
 */
export function setupNavigationEvents(navigate) {
  // Handle custom navigation events that were previously using hash routing
  const handleNavigateToForm = () => navigate('/form');
  const handleNavigateToDashboard = () => navigate('/dashboard');
  const handleNavigateToTools = () => navigate('/master-tools');
  
  window.addEventListener('navigate-to-form', handleNavigateToForm);
  window.addEventListener('navigate-to-dashboard', handleNavigateToDashboard);
  window.addEventListener('navigate-to-tools', handleNavigateToTools);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('navigate-to-form', handleNavigateToForm);
    window.removeEventListener('navigate-to-dashboard', handleNavigateToDashboard);
    window.removeEventListener('navigate-to-tools', handleNavigateToTools);
  };
}

// Export alias for backward compatibility
export const useNavigationUtils = useAppNavigation;