import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import AgencyDashboard from './AgencyDashboard';
import { Navigate } from 'react-router-dom';

/**
 * Homepage Component
 * Integrates the agency dashboard as the main homepage for authenticated users
 * Redirects unauthenticated users to login with proper state management to prevent loops
 */
const Homepage = () => {
  const { authState } = useUnifiedAuth();
  const { user, isLoading } = authState;
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  // Track redirect attempts to prevent loops
  useEffect(() => {
    if (!isLoading && !user && !redirectAttempted) {
      setRedirectAttempted(true);
    }
  }, [isLoading, user, redirectAttempted]);

  // Memoize authentication status
  const isAuthenticated = useMemo(() => !!user, [user]);
  const shouldRedirect = useMemo(() => !user && redirectAttempted, [user, redirectAttempted]);
  const isWaitingForAuth = useMemo(() => !user && !redirectAttempted, [user, redirectAttempted]);

  // Optimize profile navigation handler
  const handleNavigateToProfile = useCallback(() => {
    console.log('Navigate to profile');
  }, []);

  // Show loading spinner while authentication state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-8 p-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 max-w-md mx-4">
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <LoadingSpinner size="lg" className="text-white" />
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full animate-ping opacity-20"></div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Loading Application</h2>
            <p className="text-slate-600 font-medium">Please wait while we prepare your workspace...</p>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Always render the agency dashboard - it's designed to be publicly accessible
  // The AgencyDashboard component handles both authenticated and unauthenticated states internally
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <AgencyDashboard 
        userType={user?.role} 
        currentUser={user} 
        onNavigateToProfile={handleNavigateToProfile}
      />
    </div>
  );
};

export default React.memo(Homepage);